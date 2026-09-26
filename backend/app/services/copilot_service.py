import re
import math
import uuid
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.destination import Destination
from app.models.traveler_profile import TravelerProfile
from app.models.user import User
from app.schemas.copilot import (
    TripLocationSchema,
    TripRouteSchema,
    TripPlanNodeSchema,
    TripPlanSchema,
    TripPlanRequest,
    TripPlanResponse,
)

# Canonical geographic coordinates for common transit hubs & international destinations
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
    "paris": (48.8566, 2.3522),
    "tokyo": (35.6762, 139.6503),
    "london": (51.5074, -0.1278),
    "dubai": (25.2048, 55.2708),
    "singapore": (1.3521, 103.8198),
    "bali": (-8.4095, 115.1889),
    "new york": (40.7128, -74.0060),
}

# Curated itinerary activities and sights per destination category/region
CURATED_SIGHTS: Dict[str, List[Dict[str, Any]]] = {
    "goa": [
        {"name": "Baga Beach Watersports", "type": "activity", "lat_offset": 0.04, "lon_offset": -0.03, "desc": "Parasailing, jet ski, and seaside relaxation"},
        {"name": "Fort Aguada Heritage", "type": "activity", "lat_offset": 0.01, "lon_offset": -0.05, "desc": "17th-century Portuguese lighthouse and coastal vistas"},
        {"name": "Seaside Sunset Dinner", "type": "restaurant", "lat_offset": 0.02, "lon_offset": -0.04, "desc": "Fresh seafood dining at Candolim shore"},
        {"name": "Basilica of Bom Jesus", "type": "activity", "lat_offset": -0.01, "lon_offset": 0.03, "desc": "UNESCO Baroque heritage architecture in Old Goa"},
        {"name": "Latin Quarter Heritage Walk", "type": "activity", "lat_offset": -0.02, "lon_offset": 0.01, "desc": "Fontainhas colorful Portuguese villas and cafes"},
        {"name": "Mandovi River Cruise", "type": "activity", "lat_offset": -0.02, "lon_offset": 0.02, "desc": "Sunset folk dance and river catamaran sailing"},
    ],
    "manali": [
        {"name": "Old Manali Apple Orchards", "type": "activity", "lat_offset": 0.015, "lon_offset": -0.01, "desc": "Wooden chalets, rustic cafes, and mountain trails"},
        {"name": "Solang Valley Snow Point", "type": "activity", "lat_offset": 0.09, "lon_offset": -0.05, "desc": "Paragliding, quad biking, and alpine panoramas"},
        {"name": "Riverside Trout Dining", "type": "restaurant", "lat_offset": 0.01, "lon_offset": 0.005, "desc": "Traditional Himachali freshwater trout meal"},
        {"name": "Atal Tunnel & Sissu Falls", "type": "activity", "lat_offset": 0.18, "lon_offset": -0.04, "desc": "Engineering marvel leading to Lahaul valley cascades"},
        {"name": "Hadimba Devi Temple", "type": "activity", "lat_offset": -0.005, "lon_offset": -0.01, "desc": "Pagoda-style cedar forest sanctuary"},
    ],
    "jaipur": [
        {"name": "Amber Fort Elephant Path", "type": "activity", "lat_offset": 0.08, "lon_offset": 0.05, "desc": "Sheesh Mahal and hilltop Rajput fortress"},
        {"name": "Hawa Mahal & City Palace", "type": "activity", "lat_offset": 0.01, "lon_offset": 0.02, "desc": "Palace of Winds facade and royal courtyards"},
        {"name": "Chokhi Dhani Ethnic Feast", "type": "restaurant", "lat_offset": -0.10, "lon_offset": 0.04, "desc": "Traditional Rajasthani thali and folk arts"},
        {"name": "Nahargarh Sunset Overlook", "type": "activity", "lat_offset": 0.05, "lon_offset": 0.01, "desc": "Sweeping twilight city vista from Aravalli ridge"},
    ],
    "udaipur": [
        {"name": "City Palace & Royal Museum", "type": "activity", "lat_offset": 0.01, "lon_offset": 0.01, "desc": "Marble balconies overlooking Lake Pichola"},
        {"name": "Lake Pichola Shikara Cruise", "type": "activity", "lat_offset": 0.005, "lon_offset": -0.01, "desc": "Sunset boat ride past Taj Lake Palace and Jagmandir"},
        {"name": "Ambrai Ghat Rooftop Dinner", "type": "restaurant", "lat_offset": 0.008, "lon_offset": -0.005, "desc": "Candlelight dinner with illuminated palace views"},
        {"name": "Saheliyon Ki Bari Fountains", "type": "activity", "lat_offset": 0.03, "lon_offset": 0.02, "desc": "Marble elephant pools and royal garden oasis"},
    ],
    "srinagar": [
        {"name": "Dal Lake Shikara Experience", "type": "activity", "lat_offset": 0.01, "lon_offset": 0.02, "desc": "Wooden houseboats and floating craft markets"},
        {"name": "Nishat & Shalimar Mughal Gardens", "type": "activity", "lat_offset": 0.04, "lon_offset": 0.05, "desc": "Terraced Persian watercourses and Zabarwan backdrop"},
        {"name": "Wazwan Multi-Course Feast", "type": "restaurant", "lat_offset": -0.01, "lon_offset": 0.01, "desc": "Authentic Kashmiri culinary banquet"},
        {"name": "Pari Mahal Palace of Fairies", "type": "activity", "lat_offset": 0.02, "lon_offset": 0.04, "desc": "Astronomical observatory over Dal Lake"},
    ],
}


def _extract_duration(message: str, default: int = 3) -> int:
    """Extract trip duration from traveler prompt text."""
    msg = message.lower()
    if "weekend" in msg:
        return 3
    match = re.search(r"(\d+)\s*(?:-| )*(?:day|night)s?", msg)
    if match:
        days = int(match.group(1))
        return min(max(days, 2), 14)
    return default


def _calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great circle distance in kilometers."""
    r = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 1)


def generate_trip_plan(
    request: TripPlanRequest,
    user: User,
    db: Session
) -> TripPlanResponse:
    """
    Generates a personalized, structured multi-agent trip plan using the
    GoFlexi Destination Knowledge Base and saved Neon traveler preferences.
    """
    msg = request.message.strip()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trip request message cannot be empty."
        )

    # 1. Fetch user profile & preferences from Neon DB
    profile: Optional[TravelerProfile] = db.query(TravelerProfile).filter(
        TravelerProfile.user_id == user.id
    ).first()

    travel_style = profile.travel_style if profile and profile.travel_style else "Balanced"
    companions = profile.companions if profile and profile.companions else "Couple"
    pacing = profile.itinerary_pace if profile and profile.itinerary_pace else "Balanced"
    budget_range = profile.budget_range if profile and profile.budget_range else "₹25,000 – ₹50,000"

    duration = _extract_duration(msg, default=3 if pacing == "Relaxed" else 4)

    # 2. Identify target destination
    # Check Neon destinations table first
    destinations = db.query(Destination).all()
    matched_dest: Optional[Destination] = None

    msg_lower = msg.lower()
    for d in destinations:
        name_lower = d.name.lower()
        city_lower = d.city.lower() if d.city else ""
        if name_lower in msg_lower or (city_lower and city_lower in msg_lower):
            matched_dest = d
            break

    # If not matched directly, check common keywords like "goa", "kerala", "rajasthan"
    if not matched_dest:
        for keyword in ["goa", "manali", "jaipur", "udaipur", "srinagar", "shillong", "darjeeling", "rishikesh", "alleppey", "munnar", "ooty", "coorg", "leh", "ladakh"]:
            if keyword in msg_lower:
                for d in destinations:
                    if keyword in d.name.lower() or keyword in d.state.lower() or keyword in d.city.lower():
                        matched_dest = d
                        break
            if matched_dest:
                break

    # Check international destinations fallback if requested
    dest_name = ""
    dest_lat: float = 0.0
    dest_lon: float = 0.0
    dest_city = ""
    dest_state = ""

    if matched_dest:
        dest_name = matched_dest.name
        dest_lat = matched_dest.latitude or 15.2993
        dest_lon = matched_dest.longitude or 74.1240
        dest_city = matched_dest.city
        dest_state = matched_dest.state
    else:
        # Check international list (Paris, Tokyo, etc.)
        for city_key, coords in CITY_COORDINATES.items():
            if city_key in msg_lower:
                dest_name = city_key.title()
                dest_lat, dest_lon = coords
                dest_city = dest_name
                dest_state = "International"
                break

    if not dest_name:
        # Fallback to the top destination in the KB
        if destinations:
            top_dest = destinations[0]
            dest_name = top_dest.name
            dest_lat = top_dest.latitude or 15.4989
            dest_lon = top_dest.longitude or 73.8278
            dest_city = top_dest.city
            dest_state = top_dest.state
        else:
            dest_name = "North Goa"
            dest_lat = 15.4989
            dest_lon = 73.8278
            dest_city = "Panaji"
            dest_state = "Goa"

    # Origin resolution (default Mumbai or Delhi)
    origin_name = "Mumbai"
    if request.trip_context and request.trip_context.origin:
        origin_name = request.trip_context.origin
    elif "from delhi" in msg_lower:
        origin_name = "Delhi"
    elif "from bengaluru" in msg_lower or "from bangalore" in msg_lower:
        origin_name = "Bengaluru"

    origin_coords = CITY_COORDINATES.get(origin_name.lower(), (19.0760, 72.8777))
    origin_lat, origin_lon = origin_coords

    # 3. Build Key Geographic Locations / Waypoints
    locations: List[TripLocationSchema] = []

    # Origin
    origin_loc = TripLocationSchema(
        id=f"loc_origin_{uuid.uuid4().hex[:6]}",
        name=f"{origin_name} International Airport",
        type="origin",
        latitude=origin_lat,
        longitude=origin_lon,
        city=origin_name,
        description=f"Departure hub in {origin_name}"
    )
    locations.append(origin_loc)

    # Destination primary waypoint
    dest_loc = TripLocationSchema(
        id=f"loc_dest_{uuid.uuid4().hex[:6]}",
        name=dest_name,
        type="destination",
        latitude=dest_lat,
        longitude=dest_lon,
        city=dest_city,
        state=dest_state,
        description=f"Primary journey hub in {dest_name}"
    )
    locations.append(dest_loc)

    # Accommodation waypoint
    hotel_lat = round(dest_lat + 0.015, 4)
    hotel_lon = round(dest_lon - 0.012, 4)
    hotel_loc = TripLocationSchema(
        id=f"loc_hotel_{uuid.uuid4().hex[:6]}",
        name=f"{dest_name} Heritage Villa & Spa",
        type="hotel",
        latitude=hotel_lat,
        longitude=hotel_lon,
        city=dest_city,
        state=dest_state,
        description=f"Curated {travel_style.lower()} stay with panoramic views"
    )
    locations.append(hotel_loc)

    # 4. Sights and Activities
    city_key = dest_city.lower() if dest_city else dest_name.lower()
    sights_template = CURATED_SIGHTS.get("goa")
    for k in CURATED_SIGHTS.keys():
        if k in city_key or k in dest_name.lower():
            sights_template = CURATED_SIGHTS[k]
            break

    # 5. Build Tree Nodes Hierarchy
    tree_nodes: List[TripPlanNodeSchema] = []

    # Flight Outbound Node
    flight_out_node = TripPlanNodeSchema(
        id=f"node_fl_out_{uuid.uuid4().hex[:6]}",
        type="flight",
        title=f"✈ {origin_name} → {dest_name}",
        subtitle="Non-stop Scheduled Flight • 1h 20m",
        date="Day 1 Departure",
        time="08:30 AM — 09:50 AM",
        location_id=origin_loc.id,
        location=origin_loc,
        status="confirmed",
        children=[
            TripPlanNodeSchema(
                id=f"node_fl_seat_{uuid.uuid4().hex[:6]}",
                type="flight",
                title="Premium Window Seats (Rows 4A, 4B)",
                subtitle="Express boarding & cabin baggage included",
                status="confirmed"
            )
        ]
    )
    tree_nodes.append(flight_out_node)

    # Accommodation Node
    hotel_node = TripPlanNodeSchema(
        id=f"node_hotel_{uuid.uuid4().hex[:6]}",
        type="hotel",
        title="🏨 Accommodation",
        subtitle=hotel_loc.name,
        date=f"Nights 1 to {duration}",
        time="Check-in from 01:00 PM",
        location_id=hotel_loc.id,
        location=hotel_loc,
        status="confirmed",
        children=[
            TripPlanNodeSchema(
                id=f"node_hotel_ci_{uuid.uuid4().hex[:6]}",
                type="hotel",
                title="VIP Priority Check-in",
                subtitle="Welcome beverage & suite walkthrough",
                status="confirmed"
            ),
            TripPlanNodeSchema(
                id=f"node_hotel_am_{uuid.uuid4().hex[:6]}",
                type="activity",
                title="Curated Breakfast & Spa Access",
                subtitle="Included daily with scenic outlook",
                status="confirmed"
            )
        ]
    )
    tree_nodes.append(hotel_node)

    # Day-by-Day Activity Nodes
    sight_idx = 0
    for day_num in range(1, duration + 1):
        day_children: List[TripPlanNodeSchema] = []

        # 2 activities per day
        for _ in range(2):
            sight_data = sights_template[sight_idx % len(sights_template)]
            sight_idx += 1

            act_lat = round(dest_lat + sight_data["lat_offset"], 4)
            act_lon = round(dest_lon + sight_data["lon_offset"], 4)
            
            act_loc = TripLocationSchema(
                id=f"loc_act_{uuid.uuid4().hex[:6]}",
                name=sight_data["name"],
                type=sight_data["type"],
                latitude=act_lat,
                longitude=act_lon,
                city=dest_city,
                state=dest_state,
                day=day_num,
                description=sight_data["desc"]
            )
            locations.append(act_loc)

            act_node = TripPlanNodeSchema(
                id=f"node_act_{uuid.uuid4().hex[:6]}",
                type=sight_data["type"],
                title=sight_data["name"],
                subtitle=sight_data["desc"],
                date=f"Day {day_num}",
                location_id=act_loc.id,
                location=act_loc,
                status="suggested"
            )
            day_children.append(act_node)

        day_node = TripPlanNodeSchema(
            id=f"node_day_{day_num}_{uuid.uuid4().hex[:6]}",
            type="day",
            title=f"Day {day_num}",
            subtitle=f"{dest_name} Exploration & Leisure",
            date=f"Day {day_num}",
            status="confirmed",
            children=day_children
        )
        tree_nodes.append(day_node)

    # Return Flight Node
    flight_ret_node = TripPlanNodeSchema(
        id=f"node_fl_ret_{uuid.uuid4().hex[:6]}",
        type="flight",
        title=f"✈ Return: {dest_name} → {origin_name}",
        subtitle="Evening Non-stop Return Flight • 1h 20m",
        date=f"Day {duration} Departure",
        time="07:45 PM — 09:05 PM",
        location_id=dest_loc.id,
        location=dest_loc,
        status="confirmed",
        children=[]
    )
    tree_nodes.append(flight_ret_node)

    # 6. Build Flight Arcs & Routes
    routes: List[TripRouteSchema] = []
    
    # Outbound flight arc
    dist_out = _calculate_distance(origin_lat, origin_lon, dest_lat, dest_lon)
    routes.append(
        TripRouteSchema(
            id=f"route_out_{uuid.uuid4().hex[:6]}",
            origin_id=origin_loc.id,
            destination_id=dest_loc.id,
            type="flight",
            from_coords=(origin_lat, origin_lon),
            to_coords=(dest_lat, dest_lon),
            label=f"{origin_name} → {dest_name}",
            distance_km=dist_out
        )
    )

    # Return flight arc
    routes.append(
        TripRouteSchema(
            id=f"route_ret_{uuid.uuid4().hex[:6]}",
            origin_id=dest_loc.id,
            destination_id=origin_loc.id,
            type="flight",
            from_coords=(dest_lat, dest_lon),
            to_coords=(origin_lat, origin_lon),
            label=f"{dest_name} → {origin_name}",
            distance_km=dist_out
        )
    )

    # 7. Assemble Complete TripPlan
    trip_title = f"{duration}-Day Trip to {dest_name}"
    trip_plan = TripPlanSchema(
        id=f"plan_{uuid.uuid4().hex[:8]}",
        title=trip_title,
        origin=origin_name,
        destination=dest_name,
        duration_days=duration,
        estimated_budget=budget_range,
        travel_style=travel_style,
        nodes=tree_nodes,
        locations=locations,
        routes=routes
    )

    assistant_msg = (
        f"I've structured a custom {duration}-day journey to {dest_name} starting from {origin_name}. "
        f"The itinerary is tuned to your {travel_style.lower()} style and {pacing.lower()} pace with {companions.lower()} accommodations. "
        f"You can explore the interactive 3D route on the globe, expand each day's plan in the tree, or select any waypoint to focus coordinates."
    )

    return TripPlanResponse(
        message=assistant_msg,
        trip_plan=trip_plan
    )
