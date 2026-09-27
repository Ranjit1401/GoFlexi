"""
GoFlexi — Nugen Travel Intelligence Schema

Defines the internal structured output contract for Nugen's aligned model.
The Nugen model's sole responsibility is:

    USER LANGUAGE → TRAVEL INTENT → STRUCTURED CONSTRAINTS

These schemas are consumed by GoFlexi's existing pipeline (SerpAPI, Groq, Neon)
and are NEVER exposed directly to the frontend.
"""

from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class NugenTravelIntent(str, Enum):
    """
    The 10-intent taxonomy used during Nugen domain alignment (Phase N2).
    These are the intents the aligned Nugen model has been trained to classify.
    """
    TRIP_PLANNING = "TRIP_PLANNING"
    DESTINATION_DISCOVERY = "DESTINATION_DISCOVERY"
    ADD_PLACE = "ADD_PLACE"
    REMOVE_PLACE = "REMOVE_PLACE"
    MODIFY_ITINERARY = "MODIFY_ITINERARY"
    UPDATE_BUDGET = "UPDATE_BUDGET"
    UPDATE_PREFERENCES = "UPDATE_PREFERENCES"
    OPTIMIZE_TRIP = "OPTIMIZE_TRIP"
    HANDLE_DISRUPTION = "HANDLE_DISRUPTION"
    GENERAL_TRAVEL_QUERY = "GENERAL_TRAVEL_QUERY"


class TravelIntentResult(BaseModel):
    """
    Internal Pydantic schema for Nugen's expected travel-intelligence output.

    Most fields are optional because a user message may only provide partial
    information. For example, "I want to visit Cochin" only yields
    intent + destination; it does NOT yield budget or duration.

    This schema is the single, authoritative boundary between the Nugen model
    and the rest of GoFlexi's pipeline.
    """

    # --- Core classification ---
    intent: NugenTravelIntent = Field(
        ...,
        description="Classified travel intent from the 10-intent GoFlexi taxonomy."
    )
    confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=100.0,
        description="Nugen's domain alignment confidence score (0.0 to 100.0)."
    )

    # --- Destination & origin ---
    destination: Optional[str] = Field(
        default=None,
        description="Target destination mentioned by the user (e.g. 'Kochi', 'Goa')."
    )
    origin: Optional[str] = Field(
        default=None,
        description="Origin city/airport if mentioned (e.g. 'Mumbai', 'Delhi')."
    )

    # --- Trip parameters ---
    duration_days: Optional[int] = Field(
        default=None,
        ge=1,
        le=30,
        description="Trip duration in days."
    )
    budget: Optional[float] = Field(
        default=None,
        ge=0,
        description="Maximum budget amount (numeric, in local currency)."
    )
    currency: Optional[str] = Field(
        default=None,
        description="Budget currency code (e.g. 'INR', 'USD')."
    )

    # --- Traveler profile ---
    companion: Optional[str] = Field(
        default=None,
        description="Travel companion type (e.g. 'solo', 'couple', 'family', 'friends')."
    )
    interests: Optional[List[str]] = Field(
        default=None,
        description="List of travel interests (e.g. ['beaches', 'culture', 'adventure'])."
    )
    travel_style: Optional[str] = Field(
        default=None,
        description="Travel style preference (e.g. 'Relaxed', 'Adventure', 'Cultural')."
    )
    transport: Optional[str] = Field(
        default=None,
        description="Preferred transport mode (e.g. 'flight', 'train', 'road')."
    )
    itinerary_pace: Optional[str] = Field(
        default=None,
        description="Itinerary pace preference (e.g. 'relaxed', 'balanced', 'packed')."
    )
    travel_date: Optional[str] = Field(
        default=None,
        description="Desired travel date or date range as free-text."
    )

    # --- Place-level operations ---
    place_name: Optional[str] = Field(
        default=None,
        description="Specific place name for ADD_PLACE / REMOVE_PLACE intents."
    )
    day_number: Optional[int] = Field(
        default=None,
        ge=1,
        description="Day number for MODIFY_ITINERARY operations."
    )

    # --- Modification details ---
    modification: Optional[str] = Field(
        default=None,
        description="Free-text description of the requested modification."
    )
    disruption_type: Optional[str] = Field(
        default=None,
        description="Type of disruption for HANDLE_DISRUPTION (e.g. 'weather', 'flight_cancelled')."
    )
    optimization_goal: Optional[str] = Field(
        default=None,
        description="Goal for OPTIMIZE_TRIP (e.g. 'minimize_cost', 'reduce_travel_time')."
    )
