"""
GoFlexi — Nugen Service Unit Tests

Tests the NugenService adapter without making live Nugen API calls.
All HTTP interactions are mocked.

Test coverage:
1. Nugen disabled → no HTTP request
2. Nugen enabled but model ID missing → clear configuration error
3. Valid Nugen response → correctly parsed TravelIntentResult
4. Malformed Nugen response → controlled error
5. Nugen HTTP 500 → controlled error
6. Nugen timeout → controlled error
7. API key never appears in logs/errors
8. Intent mapping correctness
"""

import os
import json
import pytest
from unittest.mock import patch, AsyncMock, MagicMock

from app.services.nugen_service import (
    NugenService,
    NugenDisabledError,
    NugenConfigurationError,
    NugenInferenceError,
    NUGEN_TO_COPILOT_INTENT,
    map_nugen_intent_to_copilot,
)
from app.schemas.nugen import TravelIntentResult, NugenTravelIntent


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_service(**env_overrides) -> NugenService:
    """Creates a fresh NugenService with specified env vars."""
    defaults = {
        "NUGEN_ENABLED": "false",
        "NUGEN_API_KEY": "",
        "NUGEN_MODEL_ID": "",
        "NUGEN_BASE_URL": "https://api.nugen.in",
    }
    defaults.update(env_overrides)
    with patch.dict(os.environ, defaults, clear=False):
        svc = NugenService()
        # Force re-read from env by clearing cached values
        svc._enabled = None
        svc._api_key = None
        svc._model_id = None
        svc._base_url = None
    return svc


def _valid_nugen_response(intent="TRIP_PLANNING", destination="Kochi", confidence=94.28):
    """Returns a mock Nugen chat completion response dict."""
    content = json.dumps({
        "intent": intent,
        "destination": destination,
        "duration_days": 4,
        "companion": "couple",
        "pace": "relaxed",
    })
    return {
        "id": "nugen-comp-test123",
        "object": "chat.completion",
        "model": "model_test_aligned",
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": "stop",
            }
        ],
        "usage": {"prompt_tokens": 42, "completion_tokens": 36, "total_tokens": 78},
        "confidence_score": confidence,
    }


# ---------------------------------------------------------------------------
# Test 1: Nugen Disabled → No HTTP Request
# ---------------------------------------------------------------------------

class TestNugenDisabled:
    """When NUGEN_ENABLED=false, NugenService must not make any HTTP request."""

    @pytest.mark.asyncio
    async def test_disabled_raises_error(self):
        env = {
            "NUGEN_ENABLED": "false",
            "NUGEN_API_KEY": "test-key",
            "NUGEN_MODEL_ID": "model_test",
        }
        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with pytest.raises(NugenDisabledError):
                await svc.extract_travel_intent("Plan a trip to Goa")

    @pytest.mark.asyncio
    async def test_disabled_makes_no_http_call(self):
        env = {
            "NUGEN_ENABLED": "false",
            "NUGEN_API_KEY": "test-key",
            "NUGEN_MODEL_ID": "model_test",
        }
        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with patch("httpx.AsyncClient") as mock_client:
                with pytest.raises(NugenDisabledError):
                    await svc.extract_travel_intent("Visit Mumbai")
                mock_client.assert_not_called()


# ---------------------------------------------------------------------------
# Test 2: Nugen Enabled But Model ID Missing → Configuration Error
# ---------------------------------------------------------------------------

class TestNugenMissingConfig:

    @pytest.mark.asyncio
    async def test_missing_model_id(self):
        env = {
            "NUGEN_ENABLED": "true",
            "NUGEN_API_KEY": "test-key",
            "NUGEN_MODEL_ID": "",
        }
        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with pytest.raises(NugenConfigurationError, match="NUGEN_MODEL_ID"):
                await svc.extract_travel_intent("Plan a trip")

    @pytest.mark.asyncio
    async def test_missing_api_key(self):
        env = {
            "NUGEN_ENABLED": "true",
            "NUGEN_API_KEY": "",
            "NUGEN_MODEL_ID": "model_test",
        }
        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with pytest.raises(NugenConfigurationError, match="NUGEN_API_KEY"):
                await svc.extract_travel_intent("Plan a trip")


# ---------------------------------------------------------------------------
# Test 3: Valid Nugen Response → Correctly Parsed TravelIntentResult
# ---------------------------------------------------------------------------

class TestNugenValidResponse:

    @pytest.mark.asyncio
    async def test_valid_response_parsed(self):
        env = {
            "NUGEN_ENABLED": "true",
            "NUGEN_API_KEY": "test-key-secret",
            "NUGEN_MODEL_ID": "model_test_aligned",
        }
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = _valid_nugen_response()
        mock_resp.text = json.dumps(_valid_nugen_response())

        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with patch("httpx.AsyncClient") as MockClient:
                mock_instance = AsyncMock()
                mock_instance.post.return_value = mock_resp
                mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
                mock_instance.__aexit__ = AsyncMock(return_value=False)
                MockClient.return_value = mock_instance

                result = await svc.extract_travel_intent(
                    "I want a relaxed 4 day trip to Kochi with my girlfriend"
                )

                assert isinstance(result, TravelIntentResult)
                assert result.intent == NugenTravelIntent.TRIP_PLANNING
                assert result.destination == "Kochi"
                assert result.duration_days == 4
                assert result.companion == "couple"
                assert result.confidence == 94.28

    @pytest.mark.asyncio
    async def test_valid_response_with_context(self):
        env = {
            "NUGEN_ENABLED": "true",
            "NUGEN_API_KEY": "test-key-secret",
            "NUGEN_MODEL_ID": "model_test_aligned",
        }
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = _valid_nugen_response(
            intent="ADD_PLACE", destination="Kochi"
        )

        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with patch("httpx.AsyncClient") as MockClient:
                mock_instance = AsyncMock()
                mock_instance.post.return_value = mock_resp
                mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
                mock_instance.__aexit__ = AsyncMock(return_value=False)
                MockClient.return_value = mock_instance

                result = await svc.extract_travel_intent(
                    "Add Fort Kochi to my trip",
                    conversation_context={"destination": "Kochi", "duration_days": 4}
                )

                assert result.intent == NugenTravelIntent.ADD_PLACE


# ---------------------------------------------------------------------------
# Test 4: Malformed Nugen Response → Controlled Error
# ---------------------------------------------------------------------------

class TestNugenMalformedResponse:

    @pytest.mark.asyncio
    async def test_non_json_content(self):
        env = {
            "NUGEN_ENABLED": "true",
            "NUGEN_API_KEY": "test-key",
            "NUGEN_MODEL_ID": "model_test",
        }
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": "This is not JSON at all"}}]
        }

        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with patch("httpx.AsyncClient") as MockClient:
                mock_instance = AsyncMock()
                mock_instance.post.return_value = mock_resp
                mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
                mock_instance.__aexit__ = AsyncMock(return_value=False)
                MockClient.return_value = mock_instance

                with pytest.raises(NugenInferenceError, match="not valid JSON"):
                    await svc.extract_travel_intent("Test message")

    @pytest.mark.asyncio
    async def test_missing_choices_field(self):
        env = {
            "NUGEN_ENABLED": "true",
            "NUGEN_API_KEY": "test-key",
            "NUGEN_MODEL_ID": "model_test",
        }
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"unexpected": "structure"}

        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with patch("httpx.AsyncClient") as MockClient:
                mock_instance = AsyncMock()
                mock_instance.post.return_value = mock_resp
                mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
                mock_instance.__aexit__ = AsyncMock(return_value=False)
                MockClient.return_value = mock_instance

                with pytest.raises(NugenInferenceError, match="missing expected"):
                    await svc.extract_travel_intent("Test message")

    @pytest.mark.asyncio
    async def test_non_json_api_response(self):
        """API returns 200 but the top-level response body is not JSON."""
        import json as json_mod
        env = {
            "NUGEN_ENABLED": "true",
            "NUGEN_API_KEY": "test-key",
            "NUGEN_MODEL_ID": "model_test",
        }
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.side_effect = json_mod.JSONDecodeError("", "", 0)

        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with patch("httpx.AsyncClient") as MockClient:
                mock_instance = AsyncMock()
                mock_instance.post.return_value = mock_resp
                mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
                mock_instance.__aexit__ = AsyncMock(return_value=False)
                MockClient.return_value = mock_instance

                with pytest.raises(NugenInferenceError, match="non-JSON"):
                    await svc.extract_travel_intent("Test")


# ---------------------------------------------------------------------------
# Test 5: Nugen HTTP 500 → Controlled Error
# ---------------------------------------------------------------------------

class TestNugenHttpErrors:

    @pytest.mark.asyncio
    async def test_http_500(self):
        env = {
            "NUGEN_ENABLED": "true",
            "NUGEN_API_KEY": "test-key",
            "NUGEN_MODEL_ID": "model_test",
        }
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.text = "Internal Server Error"

        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with patch("httpx.AsyncClient") as MockClient:
                mock_instance = AsyncMock()
                mock_instance.post.return_value = mock_resp
                mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
                mock_instance.__aexit__ = AsyncMock(return_value=False)
                MockClient.return_value = mock_instance

                with pytest.raises(NugenInferenceError, match="HTTP 500"):
                    await svc.extract_travel_intent("Test")

    @pytest.mark.asyncio
    async def test_http_401(self):
        env = {
            "NUGEN_ENABLED": "true",
            "NUGEN_API_KEY": "bad-key",
            "NUGEN_MODEL_ID": "model_test",
        }
        mock_resp = MagicMock()
        mock_resp.status_code = 401
        mock_resp.text = "Unauthorized"

        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with patch("httpx.AsyncClient") as MockClient:
                mock_instance = AsyncMock()
                mock_instance.post.return_value = mock_resp
                mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
                mock_instance.__aexit__ = AsyncMock(return_value=False)
                MockClient.return_value = mock_instance

                with pytest.raises(NugenInferenceError, match="HTTP 401"):
                    await svc.extract_travel_intent("Test")


# ---------------------------------------------------------------------------
# Test 6: Nugen Timeout → Controlled Error
# ---------------------------------------------------------------------------

class TestNugenTimeout:

    @pytest.mark.asyncio
    async def test_timeout(self):
        env = {
            "NUGEN_ENABLED": "true",
            "NUGEN_API_KEY": "test-key",
            "NUGEN_MODEL_ID": "model_test",
        }
        import httpx as httpx_mod

        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with patch("httpx.AsyncClient") as MockClient:
                mock_instance = AsyncMock()
                mock_instance.post.side_effect = httpx_mod.TimeoutException("timed out")
                mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
                mock_instance.__aexit__ = AsyncMock(return_value=False)
                MockClient.return_value = mock_instance

                with pytest.raises(NugenInferenceError, match="timed out"):
                    await svc.extract_travel_intent("Test")

    @pytest.mark.asyncio
    async def test_connection_error(self):
        env = {
            "NUGEN_ENABLED": "true",
            "NUGEN_API_KEY": "test-key",
            "NUGEN_MODEL_ID": "model_test",
        }
        import httpx as httpx_mod

        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with patch("httpx.AsyncClient") as MockClient:
                mock_instance = AsyncMock()
                mock_instance.post.side_effect = httpx_mod.ConnectError("connection refused")
                mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
                mock_instance.__aexit__ = AsyncMock(return_value=False)
                MockClient.return_value = mock_instance

                with pytest.raises(NugenInferenceError, match="request failed"):
                    await svc.extract_travel_intent("Test")


# ---------------------------------------------------------------------------
# Test 7: API Key Never Appears in Errors
# ---------------------------------------------------------------------------

class TestNugenSecurityNoKeyLeak:

    @pytest.mark.asyncio
    async def test_api_key_not_in_error_message(self):
        secret_key = "nugen_live_super_secret_12345_key"
        env = {
            "NUGEN_ENABLED": "true",
            "NUGEN_API_KEY": secret_key,
            "NUGEN_MODEL_ID": "model_test",
        }
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.text = "server error"

        with patch.dict(os.environ, env, clear=False):
            svc = NugenService()
            svc._enabled = None
            svc._api_key = None
            svc._model_id = None

            with patch("httpx.AsyncClient") as MockClient:
                mock_instance = AsyncMock()
                mock_instance.post.return_value = mock_resp
                mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
                mock_instance.__aexit__ = AsyncMock(return_value=False)
                MockClient.return_value = mock_instance

                try:
                    await svc.extract_travel_intent("Test")
                except NugenInferenceError as exc:
                    assert secret_key not in str(exc)
                else:
                    pytest.fail("Expected NugenInferenceError")


# ---------------------------------------------------------------------------
# Test 8: Intent Mapping
# ---------------------------------------------------------------------------

class TestIntentMapping:

    def test_all_nugen_intents_are_mapped(self):
        """Every NugenTravelIntent value must have a mapping entry."""
        for intent in NugenTravelIntent:
            assert intent.value in NUGEN_TO_COPILOT_INTENT, (
                f"Nugen intent {intent.value} is missing from NUGEN_TO_COPILOT_INTENT"
            )

    def test_specific_mappings(self):
        assert map_nugen_intent_to_copilot("DESTINATION_DISCOVERY") == "DESTINATION_DISCOVERY"
        assert map_nugen_intent_to_copilot("ADD_PLACE") == "ADD_PLACE"
        assert map_nugen_intent_to_copilot("REMOVE_PLACE") == "REMOVE_PLACE"
        assert map_nugen_intent_to_copilot("TRIP_PLANNING") == "ITINERARY_REQUEST"
        assert map_nugen_intent_to_copilot("MODIFY_ITINERARY") == "ITINERARY_MODIFICATION"
        assert map_nugen_intent_to_copilot("UPDATE_BUDGET") == "ITINERARY_MODIFICATION"
        assert map_nugen_intent_to_copilot("UPDATE_PREFERENCES") == "ITINERARY_MODIFICATION"
        assert map_nugen_intent_to_copilot("OPTIMIZE_TRIP") == "ITINERARY_MODIFICATION"
        assert map_nugen_intent_to_copilot("HANDLE_DISRUPTION") == "ITINERARY_MODIFICATION"
        assert map_nugen_intent_to_copilot("GENERAL_TRAVEL_QUERY") == "CASUAL_CHAT"

    def test_unknown_intent_defaults_to_casual_chat(self):
        assert map_nugen_intent_to_copilot("UNKNOWN_INTENT") == "CASUAL_CHAT"
        assert map_nugen_intent_to_copilot("") == "CASUAL_CHAT"


# ---------------------------------------------------------------------------
# Test 9: _parse_model_output unit tests
# ---------------------------------------------------------------------------

class TestParseModelOutput:

    def test_parse_plain_json(self):
        content = '{"intent": "TRIP_PLANNING", "destination": "Goa", "duration_days": 3}'
        result = NugenService._parse_model_output(content)
        assert result.intent == NugenTravelIntent.TRIP_PLANNING
        assert result.destination == "Goa"

    def test_parse_with_code_fences(self):
        content = '```json\n{"intent": "ADD_PLACE", "place_name": "Fort Kochi"}\n```'
        result = NugenService._parse_model_output(content)
        assert result.intent == NugenTravelIntent.ADD_PLACE
        assert result.place_name == "Fort Kochi"

    def test_parse_unrecognized_intent_defaults(self):
        content = '{"intent": "MADE_UP_INTENT", "destination": "Mars"}'
        result = NugenService._parse_model_output(content)
        assert result.intent == NugenTravelIntent.GENERAL_TRAVEL_QUERY

    def test_parse_injects_confidence(self):
        content = '{"intent": "TRIP_PLANNING", "destination": "Delhi"}'
        result = NugenService._parse_model_output(content, nugen_confidence=87.5)
        assert result.confidence == 87.5

    def test_parse_does_not_override_existing_confidence(self):
        content = '{"intent": "TRIP_PLANNING", "confidence": 92.0}'
        result = NugenService._parse_model_output(content, nugen_confidence=87.5)
        assert result.confidence == 92.0
