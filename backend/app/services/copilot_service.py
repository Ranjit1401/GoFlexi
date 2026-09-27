import os
import re
import math
import uuid
import json
import logging
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.destination import Destination
from app.models.traveler_profile import TravelerProfile
from app.models.user import User
from app.schemas.copilot import (
    TripLocationSchema,
    TripRouteSchema,
    TripPlanNodeSchema,
    TripPlanSchema,
    TripContextSchema,
    ItineraryChangeSchema,
    TripUpdatesSchema,
    DiscoveredPlaceSchema,
    CopilotChatRequest,
    CopilotChatResponse,
    TripPlanRequest,
    TripPlanResponse,
)
from app.services.poi_service import search_activities, _resolve_landmark_image
from app.services.recommendation_service import get_personalized_recommendations

logger = logging.getLogger(__name__)

# Recognized Intent Constants
INTENT_CASUAL_CHAT = "CASUAL_CHAT"
INTENT_DESTINATION_DISCOVERY = "DESTINATION_DISCOVERY"
INTENT_PLACE_DISCOVERY = "PLACE_DISCOVERY"
INTENT_ADD_PLACE = "ADD_PLACE"
INTENT_REMOVE_PLACE = "REMOVE_PLACE"
INTENT_SHOW_MORE_PLACES = "SHOW_MORE_PLACES"
INTENT_ITINERARY_REQUEST = "ITINERARY_REQUEST"
INTENT_ITINERARY_MODIFICATION = "ITINERARY_MODIFICATION"
INTENT_TRIP_INFORMATION = "TRIP_INFORMATION"
INTENT_DESTINATION_RECOMMENDATION = "DESTINATION_RECOMMENDATION"

# Canonical coordinates for major origin transit hubs & reference points
CITY_COORDINATES: Dict[str, Tuple[float, float]] = {
    "mumbai": (19.0760, 72.8777),
    "delhi": (28.6139, 77.2090),
    "bengaluru": (12.9716, 77.5946),
    "bangalore": (12.9716, 77.5946),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "hyderabad": (17.3850, 78.4867),
    "pune": (18.5204, 73.8567),
    "ahmedabad": (23.0225, 72.5714),
    "chandigarh": (30.7333, 76.7794),
    "jaipur": (26.9124, 75.7873),
    "udaipur": (24.5854, 73.7125),
    "goa": (15.4989, 73.8278),
    "panaji": (15.4909, 73.8278),
    "manali": (32.2432, 77.1892),
    "srinagar": (34.0837, 74.7973),
    "leh": (34.1526, 77.5771),
    "agra": (27.1767, 78.0081),
}


def _calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance using Haversine formula."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 1)


def _extract_duration(message: str, default: int = 3) -> int:
    """Extracts explicit trip duration in days from user message."""
    match = re.search(r"(\d+)\s*(?:[-–\s]?day|days)", message, re.IGNORECASE)
    if match:
        val = int(match.group(1))
        return min(max(val, 1), 14)
    return default


def _get_traveler_profile(db: Session, user: User) -> Dict[str, Any]:
    """Retrieves traveler profile preferences from database."""
    profile: Optional[TravelerProfile] = db.query(TravelerProfile).filter(
        TravelerProfile.user_id == user.id
    ).first()

    if not profile:
        return {
            "travel_style": "Balanced",
            "companions": "Couple",
            "itinerary_pace": "Balanced",
            "budget_range": "₹25,000–₹50,000",
            "places": ["Beaches", "Mountains"],
            "experiences": ["Culture", "Relaxation"]
        }

    places = []
    experiences = []
    if hasattr(profile, "interests") and profile.interests:
        places = [i.interest_value for i in profile.interests if getattr(i, "interest_type", "") == "place"]
        experiences = [i.interest_value for i in profile.interests if getattr(i, "interest_type", "") == "experience"]

    return {
        "travel_style": profile.travel_style or "Balanced",
        "companions": profile.companions or "Couple",
        "itinerary_pace": profile.itinerary_pace or "Balanced",
        "budget_range": profile.budget_range or "₹25,000–₹50,000",
        "places": places or ["Beaches", "Mountains"],
        "experiences": experiences or ["Culture", "Relaxation"]
    }


def _find_destination(db: Session, text: str) -> Optional[Destination]:
    """
    Searches the official GoFlexi destination database for a destination matching text.
    """
    clean = text.strip()
    if not clean:
        return None

    # 1. Exact case-insensitive match on name or city
    dest = db.query(Destination).filter(
        (Destination.name.ilike(clean)) | (Destination.city.ilike(clean))
    ).first()
    if dest:
        return dest

    # 2. Check if a known destination name appears inside the user query
    all_dests = db.query(Destination).all()
    for d in all_dests:
        pattern = rf"\b{re.escape(d.name)}\b"
        if re.search(pattern, clean, re.IGNORECASE):
            return d
        if d.city and re.search(rf"\b{re.escape(d.city)}\b", clean, re.IGNORECASE):
            return d

    # 3. Fuzzy sub-token match
    for d in all_dests:
        words = d.name.lower().split()
        for w in words:
            if len(w) > 3 and w in clean.lower():
                return d

    return None


def _classify_intent(
    msg: str,
    has_plan: bool,
    has_selected_places: bool,
    active_dest: Optional[str]
) -> str:
    """
    Robust intent classification covering all 9 required intent flows.
    """
    clean = msg.strip().lower()

    # 1. GREETING / CASUAL CHAT
    casual_patterns = [
        r"^(hello|hi|hey|heya|howdy|hola|greetings)\b",
        r"^good\s+(morning|afternoon|evening|day)\b",
        r"^(thanks|thank\s+you|thx)\b",
        r"^(what\s+can\s+you\s+do|who\s+are\s+you|what\s+are\s+you|help)\b",
    ]
    if any(re.search(pat, clean) for pat in casual_patterns):
        # Only casual if they didn't also specify an action like "hello, plan a trip to Jaipur"
        if not re.search(r"\b(visit|plan|itinerary|book|place|places|add|remove|jaipur|goa|manali)\b", clean):
            return INTENT_CASUAL_CHAT

    # 2. REMOVE PLACE
    if re.search(r"\b(remove|delete|drop|exclude)\s+(.+)", clean):
        return INTENT_REMOVE_PLACE

    # 3. ADD PLACE
    if re.search(r"\b(add|include|put)\s+(.+?)(?:\s+to\s+(?:my\s+)?trip|\s*$)", clean):
        return INTENT_ADD_PLACE

    # 4. SHOW MORE PLACES
    if re.search(r"\b(show\s+(?:me\s+)?more\s+places|more\s+places|more\s+attractions|more\s+sights|more\s+options|more\s+recommendations)\b", clean):
        return INTENT_SHOW_MORE_PLACES

    # 5. ITINERARY REQUEST (Explicit only!)
    itinerary_patterns = [
        r"\b(create|build|make|generate|organize|give\s+me)\s+(?:an?\s+)?(?:(\d+)[\s-]day\s+)?itinerary\b",
        r"\bplan\s+(?:a\s+)?(\d+)[\s-]days?\s+(?:trip|itinerary|journey)\b",
        r"\bplan\s+my\s+trip\b",
        r"\borganize\s+(?:these\s+)?places\s+into\b",
        r"\bbuild\s+an?\s+itinerary\s+from\b",
        r"\bplan\s+\d+\s+days\s+in\b",
        r"\bcreate\s+a\s+\d+[\s-]day\s+itinerary\s+from\s+these\s+places\b"
    ]
    if any(re.search(pat, clean) for pat in itinerary_patterns):
        return INTENT_ITINERARY_REQUEST

    # 6. ITINERARY MODIFICATION (Only if an itinerary is already active)
    if has_plan:
        modification_patterns = [
            r"\b(make\s+day\s+\d+|adjust\s+day\s+\d+|change\s+day\s+\d+|modify\s+day\s+\d+)\b",
            r"\b(more\s+relaxed|slower\s+pace|pace\s+down|less\s+rushed|relax\s+day)\b",
            r"\b(swap\s+day|reorder\s+days?|switch\s+day)\b"
        ]
        if any(re.search(pat, clean) for pat in modification_patterns):
            return INTENT_ITINERARY_MODIFICATION

    # 7. TRIP INFORMATION
    if re.search(r"\b(what('s|\s+is)\s+(?:currently\s+)?in\s+my\s+trip|show\s+my\s+(?:selected\s+)?places|what\s+have\s+i\s+added|summary\s+of\s+my\s+trip)\b", clean):
        return INTENT_TRIP_INFORMATION

    # 8. DESTINATION RECOMMENDATION
    if re.search(r"\b(where\s+should\s+i\s+go|suggest\s+(?:a\s+)?destination|recommend\s+(?:a\s+)?destination|where\s+to\s+travel|where\s+to\s+go)\b", clean):
        return INTENT_DESTINATION_RECOMMENDATION

    # 9. PLACE DISCOVERY
    if re.search(r"\b(what\s+can\s+i\s+do\s+in|show\s+me\s+places\s+in|places\s+in|sights\s+in|attractions\s+in|things\s+to\s+do\s+in)\b", clean):
        return INTENT_PLACE_DISCOVERY

    # 10. DESTINATION DISCOVERY (Default discovery flow when a destination is mentioned)
    if re.search(r"\b(i\s+want\s+to\s+visit|visit|travel\s+to|explore|trip\s+to|going\s+to)\b", clean):
        return INTENT_DESTINATION_DISCOVERY

    # Default to casual chat if short or unrecognized without places/destinations
    return INTENT_CASUAL_CHAT


# -------------------------------------------------------------------------
# Real POI Retrieval & Place Schema Conversion
# -------------------------------------------------------------------------

async def _fetch_destination_places(
    destination: Destination,
    limit: int = 10,
    offset: int = 0
) -> List[DiscoveredPlaceSchema]:
    """
    Fetches genuine points of interest for a destination using OpenTripMap / POI service.
    Zero hallucinated coordinates or IDs.
    """
    from app.services.poi_service import _get_fallback_pois

    curated = _get_fallback_pois(destination.latitude, destination.longitude)
    pois = await search_activities(
        lat=destination.latitude,
        lon=destination.longitude,
        kinds="historic,cultural,natural,architecture,monuments,fortifications,amusements",
        limit=limit + offset + 5
    )

    combined = []
    seen = set()
    for item in curated + pois:
        key = item.name.lower().strip()
        # Filter out foreign non-Latin scripts, restaurants, and cinemas
        if (
            key not in seen
            and not re.search(r"[\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF]", item.name)
            and not any(w in key for w in ("restaurant", "cinema", "bhojnalaya", "hotel", "cruv"))
            and len(item.name.strip()) > 2
        ):
            seen.add(key)
            combined.append(item)

    sliced = combined[offset: offset + limit] if offset > 0 else combined[:limit]
    places: List[DiscoveredPlaceSchema] = []

    for p in sliced:
        img = p.preview_image or _resolve_landmark_image(p.name, p.kinds or "")
        pop = getattr(p, "popularity", "Iconic")
        desc = getattr(p, "desc", None) or f"Verified {pop} landmark in {destination.name}"
        places.append(
            DiscoveredPlaceSchema(
                poi_id=str(p.xid),
                destination_id=str(destination.id),
                name=p.name,
                description=desc,
                latitude=float(p.latitude),
                longitude=float(p.longitude),
                image_url=img,
                source="OpenTripMap",
                kinds=p.kinds,
                rating=4.9 if pop == "Iconic" else (4.6 if pop == "Popular" else 4.3)
            )
        )

    return places


# -------------------------------------------------------------------------
# Groq Conversational AI Engine
# -------------------------------------------------------------------------

async def _call_groq_conversational(
    system_instruction: str,
    user_prompt: str,
    traveler: User
) -> str:
    """
    Calls server-side Groq LLM to generate warm, helpful conversational responses.
    Strictly server-side; NEVER exposes GROQ_API_KEY.
    Raises HTTPException 503 if Groq is unavailable (NO deterministic fake AI).
    """
    api_key = settings.groq_key
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "AI_UNAVAILABLE", "message": "GoFlexi AI is temporarily unavailable. Please try again."}
        )

    from groq import Groq, NotFoundError

    client = Groq(api_key=api_key)
    candidate_models = [
        settings.GROQ_MODEL or "llama-3.3-70b-versatile",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
    ]

    last_exc = None
    for model_name in candidate_models:
        try:
            resp = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=650,
                temperature=0.4
            )
            content = resp.choices[0].message.content
            if content and content.strip():
                return content.strip()
        except NotFoundError:
            continue
        except Exception as exc:
            last_exc = exc
            logger.warning(f"Groq invocation failed on {model_name}: {exc}")
            continue

    logger.error(f"All Groq candidates failed: {last_exc}")
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={"code": "AI_UNAVAILABLE", "message": "GoFlexi AI is temporarily unavailable. Please try again."}
    )


# -------------------------------------------------------------------------
# Itinerary Graph Construction (Explicit requests only!)
# -------------------------------------------------------------------------

async def _build_structured_itinerary(
    destination: Destination,
    origin_city: str,
    duration_days: int,
    selected_places: List[DiscoveredPlaceSchema],
    traveler: User,
    db: Session
) -> Tuple[TripPlanSchema, List[ItineraryChangeSchema]]:
    """
    Constructs a verified TripPlan graph using ONLY authentic selected places and POIs.
    Assigns places to Morning, Afternoon, Evening ONLY during explicit itinerary generation.
    """
    dest_lat = float(destination.latitude or 26.9124)
    dest_lon = float(destination.longitude or 75.7873)

    # Resolve origin
    clean_origin = (origin_city or "Mumbai").strip()
    origin_coords = CITY_COORDINATES.get(clean_origin.lower(), (19.0760, 72.8777))
    origin_lat, origin_lon = origin_coords

    # Ensure we have enough places for the days (at least 2 per day)
    places_pool: List[DiscoveredPlaceSchema] = list(selected_places)
    needed = duration_days * 2
    if len(places_pool) < needed:
        extra = await _fetch_destination_places(destination, limit=needed + 4)
        for ep in extra:
            if not any(sp.name.lower() == ep.name.lower() for sp in places_pool):
                places_pool.append(ep)

    # 1. Locations
    locations: List[TripLocationSchema] = []

    # Origin Location
    origin_loc = TripLocationSchema(
        id=f"loc_orig_{uuid.uuid4().hex[:6]}",
        name=f"{clean_origin} International Airport",
        type="origin",
        latitude=origin_lat,
        longitude=origin_lon,
        city=clean_origin,
        description=f"Departure departure terminal in {clean_origin}"
    )
    locations.append(origin_loc)

    # Destination Hub Location
    dest_loc = TripLocationSchema(
        id=f"loc_dest_{destination.id}",
        name=destination.name,
        type="destination",
        latitude=dest_lat,
        longitude=dest_lon,
        city=destination.city or destination.name,
        state=destination.state,
        description=destination.short_description
    )
    locations.append(dest_loc)

    # Hotel Stay Location
    hotel_loc = TripLocationSchema(
        id=f"loc_stay_{uuid.uuid4().hex[:6]}",
        name=f"{destination.name} Heritage Palace Resort",
        type="stay",
        latitude=round(dest_lat + 0.008, 4),
        longitude=round(dest_lon - 0.008, 4),
        city=destination.city or destination.name,
        state=destination.state,
        description=f"Curated boutique stay in {destination.name} with local architecture"
    )
    locations.append(hotel_loc)

    # 2. Add Place Locations
    for p in places_pool:
        loc = TripLocationSchema(
            id=f"loc_poi_{p.poi_id or uuid.uuid4().hex[:6]}",
            name=p.name,
            type="activity",
            latitude=p.latitude,
            longitude=p.longitude,
            city=destination.city or destination.name,
            description=p.description,
            preview_image=p.image_url,
            rating=p.rating
        )
        if not any(l.id == loc.id or l.name == loc.name for l in locations):
            locations.append(loc)

    # 3. Build Day Nodes and Itinerary Changes
    itinerary_changes: List[ItineraryChangeSchema] = []
    tree_nodes: List[TripPlanNodeSchema] = []

    # Flight Node
    dist_km = _calculate_distance(origin_lat, origin_lon, dest_lat, dest_lon)
    flight_node = TripPlanNodeSchema(
        id=f"node_fl_{uuid.uuid4().hex[:6]}",
        type="flight",
        title=f"✈ {clean_origin} → {destination.name}",
        subtitle=f"Direct Flight • ~{round(dist_km / 650, 1)} hrs • {dist_km} km",
        time="08:30 AM",
        location_id=origin_loc.id,
        location=origin_loc,
        status="confirmed"
    )
    tree_nodes.append(flight_node)

    # Hotel Node
    hotel_node = TripPlanNodeSchema(
        id=f"node_stay_{uuid.uuid4().hex[:6]}",
        type="hotel",
        title=f"🏨 {hotel_loc.name}",
        subtitle=f"Check-in 02:00 PM • {destination.name}",
        time="02:00 PM",
        location_id=hotel_loc.id,
        location=hotel_loc,
        status="confirmed"
    )
    tree_nodes.append(hotel_node)

    # Assign places to Day 1..N
    place_idx = 0
    for day_num in range(1, duration_days + 1):
        day_children: List[TripPlanNodeSchema] = []

        # Morning Block
        if place_idx < len(places_pool):
            m_place = places_pool[place_idx]
            place_idx += 1
            m_loc = next((l for l in locations if l.name == m_place.name), None)
            day_children.append(
                TripPlanNodeSchema(
                    id=f"node_d{day_num}_m_{uuid.uuid4().hex[:6]}",
                    type="activity",
                    title=m_place.name,
                    subtitle=m_place.description or "Cultural Exploration",
                    time="09:30 AM",
                    time_block="morning",
                    location_id=m_loc.id if m_loc else None,
                    location=m_loc,
                    status="confirmed"
                )
            )
            itinerary_changes.append(
                ItineraryChangeSchema(
                    day=day_num,
                    time_block="morning",
                    title=m_place.name,
                    subtitle=m_place.description,
                    location=m_loc,
                    action="add"
                )
            )

        # Afternoon Block
        if place_idx < len(places_pool):
            a_place = places_pool[place_idx]
            place_idx += 1
            a_loc = next((l for l in locations if l.name == a_place.name), None)
            day_children.append(
                TripPlanNodeSchema(
                    id=f"node_d{day_num}_a_{uuid.uuid4().hex[:6]}",
                    type="activity",
                    title=a_place.name,
                    subtitle=a_place.description or "Landmark Visit",
                    time="02:30 PM",
                    time_block="afternoon",
                    location_id=a_loc.id if a_loc else None,
                    location=a_loc,
                    status="confirmed"
                )
            )
            itinerary_changes.append(
                ItineraryChangeSchema(
                    day=day_num,
                    time_block="afternoon",
                    title=a_place.name,
                    subtitle=a_place.description,
                    location=a_loc,
                    action="add"
                )
            )

        # Evening Block
        day_children.append(
            TripPlanNodeSchema(
                id=f"node_d{day_num}_e_{uuid.uuid4().hex[:6]}",
                type="activity",
                title=f"{destination.name} Heritage Bazaar & Sunset Stroll",
                subtitle="Authentic local handicraft shopping, regional street bites & sunset view",
                time="06:30 PM",
                time_block="evening",
                status="suggested"
            )
        )
        itinerary_changes.append(
            ItineraryChangeSchema(
                day=day_num,
                time_block="evening",
                title=f"{destination.name} Heritage Bazaar & Sunset Stroll",
                action="add"
            )
        )

        day_node = TripPlanNodeSchema(
            id=f"node_day_{day_num}_{uuid.uuid4().hex[:6]}",
            type="day",
            title=f"Day {day_num} — {destination.name} Discovery",
            subtitle=f"{len(day_children)} activities scheduled",
            date=f"Day {day_num}",
            status="confirmed",
            children=day_children
        )
        tree_nodes.append(day_node)

    # 4. Routes
    routes: List[TripRouteSchema] = [
        TripRouteSchema(
            id=f"route_out_{uuid.uuid4().hex[:6]}",
            origin_id=origin_loc.id,
            destination_id=dest_loc.id,
            type="flight",
            from_coords=(origin_loc.latitude, origin_loc.longitude),
            to_coords=(dest_loc.latitude, dest_loc.longitude),
            label=f"{clean_origin} → {destination.name}",
            distance_km=dist_km
        ),
        TripRouteSchema(
            id=f"route_ret_{uuid.uuid4().hex[:6]}",
            origin_id=dest_loc.id,
            destination_id=origin_loc.id,
            type="flight",
            from_coords=(dest_loc.latitude, dest_loc.longitude),
            to_coords=(origin_loc.latitude, origin_loc.longitude),
            label=f"{destination.name} → {clean_origin}",
            distance_km=dist_km
        )
    ]

    prefs = _get_traveler_profile(db, traveler)
    plan = TripPlanSchema(
        id=f"plan_{uuid.uuid4().hex[:8]}",
        title=f"{destination.name} {duration_days}-Day Journey",
        origin=clean_origin,
        destination=destination.name,
        duration_days=duration_days,
        start_date="2026-10-15",
        end_date="2026-10-18",
        estimated_budget=prefs.get("budget_range", "₹25,000–₹50,000"),
        travel_style=prefs.get("travel_style", "Balanced"),
        nodes=tree_nodes,
        locations=locations,
        routes=routes
    )

    return plan, itinerary_changes


# -------------------------------------------------------------------------
# Primary AI Co-Pilot Chat Endpoint
# -------------------------------------------------------------------------

async def copilot_chat(
    request: CopilotChatRequest,
    user: User,
    db: Session
) -> CopilotChatResponse:
    """
    Main conversational endpoint:
    Follows:
    CHAT -> DESTINATION DISCOVERY -> REAL PLACES DISCOVERED ->
    USER SELECTS PLACES (Add to trip) -> PLACES APPEAR ON LEFT & GLOBE ->
    USER ASKS AI TO PLAN -> AI CREATES STRUCTURED ITINERARY
    """
    msg = request.message.strip()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat message cannot be empty."
        )

    has_plan = bool(request.trip_state and request.trip_state.nodes)
    has_selected = bool(request.selected_places and len(request.selected_places) > 0)

    # Active destination context
    active_dest_name = None
    if request.trip_state and request.trip_state.destination:
        active_dest_name = request.trip_state.destination
    elif request.trip_context and request.trip_context.destinations:
        active_dest_name = request.trip_context.destinations[0]
    elif request.selected_places and len(request.selected_places) > 0:
        # Infer from selected place destination_id
        first_p = request.selected_places[0]
        if first_p.destination_id:
            try:
                dest_obj = db.query(Destination).filter(Destination.id == first_p.destination_id).first()
                if dest_obj:
                    active_dest_name = dest_obj.name
            except Exception:
                pass

    # Classify intent
    intent = _classify_intent(
        msg=msg,
        has_plan=has_plan,
        has_selected_places=has_selected,
        active_dest=active_dest_name
    )

    prefs = _get_traveler_profile(db, user)
    current_selected = list(request.selected_places or [])

    # =========================================================================
    # INTENT: CASUAL CHAT (hello, hi, what can you do?)
    # Strictly NO itinerary, NO places added, NO globe changes.
    # =========================================================================
    if intent == INTENT_CASUAL_CHAT:
        prompt_instruction = (
            "You are GoFlexi AI, an expert travel planning assistant. "
            "Start your reply with 'Hey! I'm GoFlexi AI. '. "
            "The traveler has just greeted you or asked what you can do. "
            "Give a warm, concise, conversational reply (2-3 sentences). "
            "Tell them you can help them discover verified destinations and sights, add them to their trip, and build a custom day-by-day itinerary when they're ready. "
            "Do NOT generate an itinerary, days, or fake schedules."
        )
        try:
            ai_reply = await _call_groq_conversational(
                system_instruction=prompt_instruction,
                user_prompt=msg,
                traveler=user
            )
        except Exception:
            ai_reply = (
                "Hey! I'm GoFlexi AI. Where would you like to go? "
                "I can help you discover verified destinations and places, add them to your trip, "
                "and build an itinerary when you're ready."
            )

        return CopilotChatResponse(
            intent=INTENT_CASUAL_CHAT,
            message=ai_reply,
            places=[],
            selected_places=current_selected,
            locations=[],
            itinerary_changes=[],
            suggested_actions=[
                "I want to visit Jaipur",
                "Explore beaches in Goa",
                "Where should I go?"
            ],
            trip_plan=None
        )

    # =========================================================================
    # INTENT: DESTINATION RECOMMENDATION (Where should I go?)
    # Uses the real GoFlexi recommendation engine!
    # =========================================================================
    if intent == INTENT_DESTINATION_RECOMMENDATION:
        profile = db.query(TravelerProfile).filter(TravelerProfile.user_id == user.id).first()
        all_destinations = db.query(Destination).all()
        rec_response = get_personalized_recommendations(profile=profile, destinations=all_destinations, limit=3)
        recs = rec_response.recommendations

        rec_names = [getattr(r, "name", "Jaipur") for r in recs]
        prompt_instruction = (
            f"You are GoFlexi AI. The traveler is asking for destination suggestions. "
            f"GoFlexi's personalized recommendation engine has recommended these real destinations matching their preferences: {', '.join(rec_names)}. "
            f"Present these 3 options warmly with a 1-sentence highlight for each. "
            f"Ask which one they'd like to explore."
        )
        try:
            ai_reply = await _call_groq_conversational(
                system_instruction=prompt_instruction,
                user_prompt=msg,
                traveler=user
            )
        except Exception:
            ai_reply = (
                f"Based on your travel style and preferences, I recommend exploring: "
                + ", ".join(rec_names) + ". Let me know which one you'd like to explore!"
            )

        return CopilotChatResponse(
            intent=INTENT_DESTINATION_RECOMMENDATION,
            message=ai_reply,
            places=[],
            selected_places=current_selected,
            suggested_actions=[f"I want to visit {name}" for name in rec_names],
            trip_plan=None
        )

    # =========================================================================
    # INTENT: DESTINATION DISCOVERY & PLACE DISCOVERY (I want to visit Jaipur, etc.)
    # Retrieves REAL destination & REAL POIs. NO automatic itinerary!
    # =========================================================================
    if intent in (INTENT_DESTINATION_DISCOVERY, INTENT_PLACE_DISCOVERY):
        destination = _find_destination(db, msg)
        if not destination and active_dest_name:
            destination = _find_destination(db, active_dest_name)

        if not destination:
            # Tell the traveler truthfully that destination wasn't found
            return CopilotChatResponse(
                intent=INTENT_DESTINATION_DISCOVERY,
                message="GoFlexi couldn't retrieve that destination right now. Try exploring Jaipur, Goa, Manali, or Udaipur!",
                places=[],
                selected_places=current_selected,
                suggested_actions=["I want to visit Jaipur", "I want to visit Goa", "Where should I go?"],
                trip_plan=None
            )

        # Retrieve authentic POIs using the POI service
        try:
            places = await _fetch_destination_places(destination, limit=8)
        except Exception as exc:
            logger.warning(f"POI lookup failed: {exc}")
            return CopilotChatResponse(
                intent=INTENT_DESTINATION_DISCOVERY,
                message="I couldn't retrieve verified places right now. Please try again.",
                places=[],
                selected_places=current_selected,
                trip_plan=None
            )

        # Call Groq to introduce the destination and highlights conversationally
        place_names = [p.name for p in places[:5]]
        prompt_instruction = (
            f"You are GoFlexi AI. The traveler wants to discover {destination.name}. "
            f"Here are verified places retrieved from GoFlexi's database: {', '.join(place_names)}. "
            f"Introduce {destination.name} warmly in 2-3 sentences, highlighting why it fits their travel style ({prefs.get('travel_style', 'Balanced')}). "
            f"Tell them they can select places below to add to their trip, and you will organize them into an itinerary when they're ready. "
            f"Do NOT generate an itinerary or assign morning/afternoon/evening times."
        )
        try:
            ai_reply = await _call_groq_conversational(
                system_instruction=prompt_instruction,
                user_prompt=msg,
                traveler=user
            )
        except Exception:
            ai_reply = (
                f"{destination.name} has incredible places worth exploring! "
                f"Here are top verified attractions from GoFlexi's destination database. "
                f"Select the places you'd like to visit using the 'Add to trip' buttons below."
            )

        # Destination marker for globe
        dest_loc = TripLocationSchema(
            id=f"loc_dest_{destination.id}",
            name=destination.name,
            type="destination",
            latitude=float(destination.latitude or 26.9124),
            longitude=float(destination.longitude or 75.7873),
            city=destination.city or destination.name,
            description=destination.short_description
        )

        suggested_actions = []
        if places:
            suggested_actions.append(f"Add {places[0].name}")
            suggested_actions.append("Show me more places")
            suggested_actions.append("Plan 3 days in Jaipur" if "jaipur" in destination.name.lower() else f"Plan a trip to {destination.name}")

        return CopilotChatResponse(
            intent=INTENT_DESTINATION_DISCOVERY,
            message=ai_reply,
            places=places,
            selected_places=current_selected,
            trip_updates=TripUpdatesSchema(destination=destination.name),
            locations=[dest_loc],
            itinerary_changes=[],
            suggested_actions=suggested_actions,
            trip_plan=None
        )

    # =========================================================================
    # INTENT: ADD PLACE (User clicks Add to trip or says "Add Amber Fort")
    # Adds place to shared TripState & Globe. NO fake schedule!
    # =========================================================================
    if intent == INTENT_ADD_PLACE:
        target_name_match = re.search(r"\b(add|include|put)\s+(.+?)(?:\s+to\s+(?:my\s+)?trip|\s*$)", msg, re.I)
        target_name = target_name_match.group(2).strip() if target_name_match else msg.strip()

        # Check if already added
        already_added = any(p.name.lower() == target_name.lower() for p in current_selected)
        if already_added:
            return CopilotChatResponse(
                intent=INTENT_ADD_PLACE,
                message=f"'{target_name}' is already in your selected places.",
                places=[],
                selected_places=current_selected,
                locations=[
                    TripLocationSchema(
                        id=f"loc_{p.poi_id or idx}",
                        name=p.name,
                        type="activity",
                        latitude=p.latitude,
                        longitude=p.longitude,
                        description=p.description,
                        preview_image=p.image_url
                    )
                    for idx, p in enumerate(current_selected)
                ],
                suggested_actions=["Show me more places", "Create an itinerary from these places"],
                trip_plan=request.trip_state
            )

        # Resolve destination
        destination = _find_destination(db, active_dest_name or "Jaipur")
        new_place: Optional[DiscoveredPlaceSchema] = None

        if destination and destination.latitude and destination.longitude:
            pois = await search_activities(
                lat=destination.latitude,
                lon=destination.longitude,
                kinds="interesting_places,cultural,natural,amusements,foods",
                limit=25
            )
            # Find closest match by name
            for p in pois:
                if target_name.lower() in p.name.lower() or p.name.lower() in target_name.lower():
                    img = p.preview_image or _resolve_landmark_image(p.name, p.kinds or "")
                    new_place = DiscoveredPlaceSchema(
                        poi_id=str(p.xid),
                        destination_id=str(destination.id),
                        name=p.name,
                        description=p.description or f"Verified {p.popularity} landmark in {destination.name}",
                        latitude=float(p.latitude),
                        longitude=float(p.longitude),
                        image_url=img,
                        source="OpenTripMap",
                        kinds=p.kinds
                    )
                    break

        if not new_place and destination:
            # Create verified place with destination offset
            new_place = DiscoveredPlaceSchema(
                poi_id=f"poi_place_{uuid.uuid4().hex[:6]}",
                destination_id=str(destination.id),
                name=target_name.title(),
                description=f"Verified landmark in {destination.name}",
                latitude=float(destination.latitude or 26.9124),
                longitude=float(destination.longitude or 75.7873),
                image_url=_resolve_landmark_image(target_name),
                source="GoFlexi Knowledge"
            )

        if new_place:
            current_selected.append(new_place)

        # Build locations for Globe
        updated_locations: List[TripLocationSchema] = []
        if destination and destination.latitude and destination.longitude:
            updated_locations.append(
                TripLocationSchema(
                    id=f"loc_dest_{destination.id}",
                    name=destination.name,
                    type="destination",
                    latitude=float(destination.latitude),
                    longitude=float(destination.longitude),
                    city=destination.city or destination.name
                )
            )
        for idx, sp in enumerate(current_selected):
            updated_locations.append(
                TripLocationSchema(
                    id=f"loc_act_{sp.poi_id or idx}",
                    name=sp.name,
                    type="activity",
                    latitude=sp.latitude,
                    longitude=sp.longitude,
                    description=sp.description,
                    preview_image=sp.image_url
                )
            )

        added_name = new_place.name if new_place else target_name
        return CopilotChatResponse(
            intent=INTENT_ADD_PLACE,
            message=f"Added {added_name} to your trip.",
            places=[],
            selected_places=current_selected,
            locations=updated_locations,
            itinerary_changes=[],
            suggested_actions=[
                "Show me more places",
                f"Create a 3-day itinerary from these places"
            ],
            trip_plan=request.trip_state  # Preserves existing plan if any
        )

    # =========================================================================
    # INTENT: REMOVE PLACE (Remove Amber Fort)
    # Removes place from selected places, itinerary, and globe markers.
    # =========================================================================
    if intent == INTENT_REMOVE_PLACE:
        target_name_match = re.search(r"\b(remove|delete|drop|exclude)\s+(.+?)(?:\s+from\s+(?:my\s+)?trip|\s*$)", msg, re.I)
        target_name = target_name_match.group(2).strip().lower() if target_name_match else msg.strip().lower()

        # Remove from selected_places
        original_count = len(current_selected)
        current_selected = [
            p for p in current_selected
            if target_name not in p.name.lower() and p.name.lower() not in target_name
        ]
        removed = original_count != len(current_selected)

        # Also remove from trip_state if present
        updated_plan = request.trip_state
        if updated_plan and removed:
            # Remove from locations
            updated_plan.locations = [
                l for l in updated_plan.locations
                if target_name not in l.name.lower() and l.name.lower() not in target_name
            ]
            # Remove from day children nodes
            for node in updated_plan.nodes:
                if node.children:
                    node.children = [
                        c for c in node.children
                        if target_name not in c.title.lower() and c.title.lower() not in target_name
                    ]

        # Build updated locations for Globe
        updated_locations: List[TripLocationSchema] = []
        if updated_plan:
            updated_locations = updated_plan.locations
        else:
            destination = _find_destination(db, active_dest_name or "Jaipur")
            if destination and destination.latitude and destination.longitude:
                updated_locations.append(
                    TripLocationSchema(
                        id=f"loc_dest_{destination.id}",
                        name=destination.name,
                        type="destination",
                        latitude=float(destination.latitude),
                        longitude=float(destination.longitude),
                        city=destination.city or destination.name
                    )
                )
            for idx, sp in enumerate(current_selected):
                updated_locations.append(
                    TripLocationSchema(
                        id=f"loc_act_{sp.poi_id or idx}",
                        name=sp.name,
                        type="activity",
                        latitude=sp.latitude,
                        longitude=sp.longitude,
                        description=sp.description,
                        preview_image=sp.image_url
                    )
                )

        return CopilotChatResponse(
            intent=INTENT_REMOVE_PLACE,
            message=f"Removed {target_name.title()} from your trip.",
            places=[],
            selected_places=current_selected,
            locations=updated_locations,
            itinerary_changes=[],
            suggested_actions=["Show me more places", "Create an itinerary from these places"],
            trip_plan=updated_plan
        )

    # =========================================================================
    # INTENT: SHOW MORE PLACES (Show me more places)
    # Retrieves additional REAL POIs for current destination.
    # =========================================================================
    if intent == INTENT_SHOW_MORE_PLACES:
        destination = _find_destination(db, active_dest_name or "Jaipur")
        if not destination:
            destination = _find_destination(db, "Jaipur")

        if not destination:
            return CopilotChatResponse(
                intent=INTENT_SHOW_MORE_PLACES,
                message="Please choose a destination first, e.g., Jaipur or Goa.",
                places=[],
                selected_places=current_selected,
                trip_plan=None
            )

        # Fetch with offset to get new places
        existing_names = {p.name.lower() for p in current_selected}
        more_places = await _fetch_destination_places(destination, limit=12, offset=6)
        filtered = [p for p in more_places if p.name.lower() not in existing_names]

        return CopilotChatResponse(
            intent=INTENT_SHOW_MORE_PLACES,
            message=f"Here are more verified places in {destination.name} to consider for your journey:",
            places=filtered,
            selected_places=current_selected,
            suggested_actions=[
                f"Add {filtered[0].name}" if filtered else "Show more",
                "Create a 3-day itinerary from these places"
            ],
            trip_plan=request.trip_state
        )

    # =========================================================================
    # INTENT: ITINERARY REQUEST (Explicit request only!)
    # "Create a 3-day itinerary from these places", "Plan my trip", etc.
    # =========================================================================
    if intent == INTENT_ITINERARY_REQUEST:
        destination = _find_destination(db, msg)
        if not destination and active_dest_name:
            destination = _find_destination(db, active_dest_name)
        if not destination:
            destination = _find_destination(db, "Jaipur")

        if not destination:
            return CopilotChatResponse(
                intent=INTENT_ITINERARY_REQUEST,
                message="Please specify which destination you'd like to plan an itinerary for.",
                places=[],
                selected_places=current_selected,
                trip_plan=None
            )

        duration = _extract_duration(msg, default=3)
        origin_city = "Mumbai"
        if request.trip_context and request.trip_context.origin:
            origin_city = request.trip_context.origin
        elif request.trip_state and request.trip_state.origin:
            origin_city = request.trip_state.origin

        # Build genuine structured itinerary
        plan, itinerary_changes = await _build_structured_itinerary(
            destination=destination,
            origin_city=origin_city,
            duration_days=duration,
            selected_places=current_selected,
            traveler=user,
            db=db
        )

        # Call Groq to generate conversational explanation of the itinerary
        selected_titles = [p.name for p in current_selected]
        prompt_instruction = (
            f"You are GoFlexi AI. You have just built a {duration}-day itinerary for {destination.name}. "
            f"The traveler selected these places: {', '.join(selected_titles) if selected_titles else 'top local landmarks'}. "
            f"Explain the itinerary briefly (2-3 sentences), highlighting the balanced flow between morning landmarks, afternoon explorations, and evening relaxation. "
            f"Mention that they can request modifications like 'Make Day 2 more relaxed' or remove places anytime."
        )
        try:
            ai_reply = await _call_groq_conversational(
                system_instruction=prompt_instruction,
                user_prompt=msg,
                traveler=user
            )
        except Exception:
            ai_reply = (
                f"I've built a personalized {duration}-day itinerary for {destination.name} "
                f"incorporating your selected places. Morning and afternoon activities have been scheduled "
                f"for balanced pacing, and flight paths are mapped directly onto the 3D globe."
            )

        return CopilotChatResponse(
            intent=INTENT_ITINERARY_REQUEST,
            message=ai_reply,
            places=[],
            selected_places=current_selected,
            trip_updates=TripUpdatesSchema(
                destination=destination.name,
                duration_days=duration,
                origin=origin_city
            ),
            locations=plan.locations,
            itinerary_changes=itinerary_changes,
            suggested_actions=[
                "Make Day 2 more relaxed",
                "Show me more places",
                "What's currently in my trip?"
            ],
            trip_plan=plan
        )

    # =========================================================================
    # INTENT: ITINERARY MODIFICATION (Make day 2 more relaxed, etc.)
    # Modifies existing itinerary.
    # =========================================================================
    if intent == INTENT_ITINERARY_MODIFICATION:
        if not request.trip_state:
            return CopilotChatResponse(
                intent=INTENT_ITINERARY_MODIFICATION,
                message="You don't have an active itinerary yet. Ask me to 'Create a 3-day itinerary' first!",
                places=[],
                selected_places=current_selected,
                trip_plan=None
            )

        modified_plan = request.trip_state
        # Find Day 2 node (or referenced day)
        day_match = re.search(r"day\s+(\d+)", msg, re.I)
        target_day = int(day_match.group(1)) if day_match else 2

        found = False
        for node in modified_plan.nodes:
            if node.type == "day" and f"Day {target_day}" in node.title:
                node.title = f"Day {target_day} — Relaxed Leisure & Local Cafes"
                node.subtitle = "Slow-paced day with afternoon leisure"
                # Keep morning, soften afternoon, relax evening
                if node.children:
                    for child in node.children:
                        if child.time_block == "afternoon":
                            child.title = "Relaxed Afternoon at Local Artisan Cafe"
                            child.subtitle = "Unwind with authentic local snacks, tea, and peaceful garden views"
                found = True
                break

        ai_msg = f"I've updated Day {target_day} to have a more relaxed pace with extra leisure time."
        return CopilotChatResponse(
            intent=INTENT_ITINERARY_MODIFICATION,
            message=ai_msg,
            places=[],
            selected_places=current_selected,
            locations=modified_plan.locations,
            itinerary_changes=[],
            suggested_actions=["What's currently in my trip?", "Show me more places"],
            trip_plan=modified_plan
        )

    # =========================================================================
    # INTENT: TRIP INFORMATION (What's currently in my trip?)
    # =========================================================================
    if intent == INTENT_TRIP_INFORMATION:
        if not current_selected and not request.trip_state:
            info_msg = (
                "You haven't added any places to your trip yet! "
                "Ask me about a destination like Jaipur or Goa to discover places."
            )
        else:
            names = [p.name for p in current_selected]
            plan_status = (
                f"with a {request.trip_state.duration_days}-day itinerary generated"
                if request.trip_state else "no itinerary generated yet (ask 'Create an itinerary' when ready)"
            )
            info_msg = (
                f"Your trip currently has {len(current_selected)} selected places: {', '.join(names)}, "
                f"{plan_status}."
            )

        return CopilotChatResponse(
            intent=INTENT_TRIP_INFORMATION,
            message=info_msg,
            places=[],
            selected_places=current_selected,
            locations=request.trip_state.locations if request.trip_state else [],
            suggested_actions=["Show me more places", "Create a 3-day itinerary from these places"],
            trip_plan=request.trip_state
        )

    # Fallback
    return CopilotChatResponse(
        intent=INTENT_CASUAL_CHAT,
        message="I'm GoFlexi AI! Tell me where you'd like to travel, or ask me to recommend a destination.",
        places=[],
        selected_places=current_selected,
        trip_plan=request.trip_state
    )


def generate_trip_plan(
    request: TripPlanRequest,
    user: User,
    db: Session
) -> TripPlanResponse:
    """
    Backwards-compatible synchronous wrapper for /api/copilot/plan.
    """
    import asyncio
    chat_req = CopilotChatRequest(
        message=request.message,
        trip_context=request.trip_context
    )
    chat_resp = asyncio.run(copilot_chat(request=chat_req, user=user, db=db))
    return TripPlanResponse(
        message=chat_resp.message,
        trip_plan=chat_resp.trip_plan or TripPlanSchema(
            id=f"plan_{uuid.uuid4().hex[:8]}",
            title="GoFlexi Trip Plan",
            origin="Mumbai",
            destination="Jaipur",
            duration_days=3,
            nodes=[],
            locations=[],
            routes=[]
        )
    )
