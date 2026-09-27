"""
GoFlexi — Nugen Service

Server-side adapter for the Nugen Domain-Aligned Inference API.
Responsible ONLY for communicating with the Nugen inference endpoint
and parsing the response into a TravelIntentResult.

This service does NOT:
- Search for places (SerpAPI's job)
- Query the database (Neon's job)
- Generate conversational responses or itineraries (Groq's job)
- Serve UI (frontend's job)

Feature flag: NUGEN_ENABLED (default: false)
When disabled, this service raises NugenDisabledError and makes zero HTTP calls.
"""

import os
import json
import logging
from typing import Optional, Dict, Any

import httpx

from app.schemas.nugen import TravelIntentResult, NugenTravelIntent

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class NugenDisabledError(Exception):
    """Raised when Nugen is called but NUGEN_ENABLED is not true."""
    pass


class NugenConfigurationError(Exception):
    """Raised when required Nugen configuration is missing."""
    pass


class NugenInferenceError(Exception):
    """Raised when the Nugen API returns an error or unparseable response."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        self.status_code = status_code
        super().__init__(message)


# ---------------------------------------------------------------------------
# Intent Mapping: Nugen taxonomy → existing GoFlexi Co-Pilot intents
# ---------------------------------------------------------------------------

# The Nugen model classifies into 10 intents (Phase N2 taxonomy).
# The existing Co-Pilot uses a different set of intent constants.
# This mapping bridges the two deterministically.

NUGEN_TO_COPILOT_INTENT: Dict[str, str] = {
    "TRIP_PLANNING":        "ITINERARY_REQUEST",
    "DESTINATION_DISCOVERY": "DESTINATION_DISCOVERY",
    "ADD_PLACE":            "ADD_PLACE",
    "REMOVE_PLACE":         "REMOVE_PLACE",
    "MODIFY_ITINERARY":     "ITINERARY_MODIFICATION",
    "UPDATE_BUDGET":        "ITINERARY_MODIFICATION",
    "UPDATE_PREFERENCES":   "ITINERARY_MODIFICATION",
    "OPTIMIZE_TRIP":        "ITINERARY_MODIFICATION",
    "HANDLE_DISRUPTION":    "ITINERARY_MODIFICATION",
    "GENERAL_TRAVEL_QUERY": "CASUAL_CHAT",
}


def map_nugen_intent_to_copilot(nugen_intent: str) -> str:
    """
    Maps a Nugen taxonomy intent to the existing GoFlexi Co-Pilot intent constant.
    Falls back to CASUAL_CHAT for unrecognized intents.
    """
    return NUGEN_TO_COPILOT_INTENT.get(nugen_intent, "CASUAL_CHAT")


# ---------------------------------------------------------------------------
# Nugen Service
# ---------------------------------------------------------------------------

class NugenService:
    """
    Clean abstraction over the Nugen Domain-Aligned Inference API.

    Configuration is read from environment variables:
    - NUGEN_ENABLED:   "true" to activate (default: "false")
    - NUGEN_API_KEY:   Bearer token for Nugen API (required when enabled)
    - NUGEN_MODEL_ID:  The deployed aligned model ID (required when enabled)
    - NUGEN_BASE_URL:  Nugen API server (default: "https://api.nugen.in")
    """

    def __init__(self):
        self._enabled: Optional[bool] = None
        self._api_key: Optional[str] = None
        self._model_id: Optional[str] = None
        self._base_url: Optional[str] = None

    # --- Configuration (lazy-loaded from env) ---

    @property
    def enabled(self) -> bool:
        if self._enabled is None:
            raw = os.environ.get("NUGEN_ENABLED", "false").strip().lower()
            self._enabled = raw in ("true", "1", "yes")
        return self._enabled

    @property
    def api_key(self) -> str:
        if self._api_key is None:
            self._api_key = os.environ.get("NUGEN_API_KEY", "").strip()
        return self._api_key

    @property
    def model_id(self) -> str:
        if self._model_id is None:
            self._model_id = os.environ.get("NUGEN_MODEL_ID", "").strip()
        return self._model_id

    @property
    def base_url(self) -> str:
        if self._base_url is None:
            self._base_url = os.environ.get(
                "NUGEN_BASE_URL", "https://api.nugen.in"
            ).strip().rstrip("/")
        return self._base_url

    # --- Validation ---

    def _validate_config(self) -> None:
        """Raises NugenConfigurationError if required settings are missing."""
        if not self.api_key:
            raise NugenConfigurationError(
                "NUGEN_API_KEY is required when NUGEN_ENABLED=true. "
                "Set it in backend/.env."
            )
        if not self.model_id:
            raise NugenConfigurationError(
                "NUGEN_MODEL_ID is required when NUGEN_ENABLED=true. "
                "Set it to the deployed aligned model ID in backend/.env."
            )

    # --- Core inference ---

    async def extract_travel_intent(
        self,
        user_message: str,
        conversation_context: Optional[Dict[str, Any]] = None,
    ) -> TravelIntentResult:
        """
        Sends a user message to the Nugen aligned model and returns
        a structured TravelIntentResult.

        Raises:
            NugenDisabledError: if NUGEN_ENABLED is not true
            NugenConfigurationError: if NUGEN_MODEL_ID or NUGEN_API_KEY is missing
            NugenInferenceError: if the API call fails or response is unparseable
        """
        if not self.enabled:
            raise NugenDisabledError(
                "Nugen is disabled (NUGEN_ENABLED is not true). "
                "The existing GoFlexi pipeline will handle this request."
            )

        self._validate_config()

        # Build the chat completions payload per Nugen's official API contract
        # (POST /api/v3/inference/chat/completions)
        system_prompt = (
            "You are the GoFlexi Travel Intent Engine. "
            "Analyze the user's travel-related message. "
            "Extract the travel intent and structured constraints as a JSON object. "
            "The JSON must contain an 'intent' field with one of these values: "
            "TRIP_PLANNING, DESTINATION_DISCOVERY, ADD_PLACE, REMOVE_PLACE, "
            "MODIFY_ITINERARY, UPDATE_BUDGET, UPDATE_PREFERENCES, OPTIMIZE_TRIP, "
            "HANDLE_DISRUPTION, GENERAL_TRAVEL_QUERY. "
            "Include optional fields: destination, origin, duration_days, budget, "
            "currency, companion, interests, travel_style, transport, itinerary_pace, "
            "travel_date, place_name, day_number, modification, disruption_type, "
            "optimization_goal. "
            "Omit fields that the user did not mention. "
            "Return ONLY the JSON object, no markdown, no commentary."
        )

        messages = [{"role": "system", "content": system_prompt}]

        # Include conversation context if provided
        if conversation_context:
            context_summary = json.dumps(conversation_context, default=str)
            messages.append({
                "role": "system",
                "content": f"Current trip context: {context_summary}"
            })

        messages.append({"role": "user", "content": user_message})

        url = f"{self.base_url}/api/v3/inference/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model_id,
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 300,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, headers=headers, json=payload)
        except httpx.TimeoutException:
            logger.error("Nugen inference timed out after 15s.")
            raise NugenInferenceError("Nugen inference request timed out.", status_code=None)
        except httpx.RequestError as exc:
            logger.error(f"Nugen request failed: {exc}")
            raise NugenInferenceError(f"Nugen request failed: {exc}", status_code=None)

        if response.status_code != 200:
            # Log error details without exposing API key
            logger.error(
                f"Nugen API returned HTTP {response.status_code}: "
                f"{response.text[:500]}"
            )
            raise NugenInferenceError(
                f"Nugen API returned HTTP {response.status_code}.",
                status_code=response.status_code,
            )

        # Parse the response
        try:
            resp_json = response.json()
        except (json.JSONDecodeError, ValueError) as exc:
            logger.error(f"Nugen returned non-JSON response: {exc}")
            raise NugenInferenceError("Nugen returned a non-JSON response.")

        # Extract the assistant's content from the chat completion
        try:
            content = resp_json["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            logger.error(f"Nugen response has unexpected structure: {exc}")
            raise NugenInferenceError(
                "Nugen response is missing expected 'choices[0].message.content' field."
            )

        # Extract confidence_score if Nugen provides it at the top level
        nugen_confidence = resp_json.get("confidence_score")

        # Parse the JSON content from the model's output
        parsed = self._parse_model_output(content, nugen_confidence)
        return parsed

    # --- Response parsing ---

    @staticmethod
    def _parse_model_output(
        content: str,
        nugen_confidence: Optional[float] = None,
    ) -> TravelIntentResult:
        """
        Parses the raw model output string into a validated TravelIntentResult.
        Handles markdown code fences and extra whitespace gracefully.
        """
        # Strip markdown code fences if present
        clean = content.strip()
        if clean.startswith("```"):
            lines = clean.split("\n")
            # Remove first and last lines (code fence markers)
            lines = [l for l in lines if not l.strip().startswith("```")]
            clean = "\n".join(lines).strip()

        try:
            data = json.loads(clean)
        except json.JSONDecodeError as exc:
            logger.error(f"Failed to parse Nugen model output as JSON: {exc}")
            raise NugenInferenceError(
                f"Nugen model output is not valid JSON: {exc}"
            )

        if not isinstance(data, dict):
            raise NugenInferenceError(
                "Nugen model output is not a JSON object."
            )

        # Validate intent field
        raw_intent = data.get("intent", "").upper().strip()
        try:
            intent = NugenTravelIntent(raw_intent)
        except ValueError:
            logger.warning(
                f"Nugen returned unrecognized intent '{raw_intent}'; "
                f"defaulting to GENERAL_TRAVEL_QUERY."
            )
            intent = NugenTravelIntent.GENERAL_TRAVEL_QUERY

        # Inject Nugen's top-level confidence_score if the model didn't include one
        if nugen_confidence is not None and "confidence" not in data:
            data["confidence"] = nugen_confidence

        data["intent"] = intent.value

        try:
            result = TravelIntentResult(**data)
        except Exception as exc:
            logger.error(f"Failed to validate Nugen output into TravelIntentResult: {exc}")
            raise NugenInferenceError(
                f"Nugen output failed schema validation: {exc}"
            )

        return result


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

nugen_service = NugenService()
