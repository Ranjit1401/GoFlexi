import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_traveler
from app.models.user import User
from app.schemas.copilot import (
    TripPlanSchema,
    TripPlanNodeSchema,
    TripLocationSchema,
    TripRouteSchema,
)
from app.schemas.travel_search import FlightOption, HotelOption
from app.schemas.trip_wizard import (
    GeoResult,
    POIResult,
    POIDetail,
    DateInsightResponse,
    BudgetPreview,
    WizardActivity,
    TripRecommendationRequest,
    TripRecommendationResponse,
    DigitalTwinResponse,
)
from app.services.geocoding_service import geocode_place, haversine_km
from app.services.poi_service import search_activities, get_activity_detail
from app.services.date_insight_service import get_date_insights, parse_date
from app.services.digital_twin_service import get_digital_twin
from app.services.ranking_service import (
    rank_flights,
    rank_hotels,
    FLIGHT_BUDGET_RATIO,
    HOTEL_BUDGET_RATIO,
)
from app.services.travel_search_service import travel_search_client
from app.api.routes.travel_search import (
    _parse_airport_suggestions,
    _pick_best_airport,
    _parse_flight_options,
    _parse_hotel_destinations,
    _parse_hotel_options,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trip-wizard", tags=["Trip Wizard"])


@router.get(
    "/destinations",
    response_model=List[GeoResult],
    summary="Geocode destination query via Open-Meteo",
)
async def get_geocoded_destinations(
    query: str = Query(..., min_length=1, description="City or destination query"),
    traveler: User = Depends(get_current_traveler),
):
    """
    Geocodes a search string into real coordinates, admin regions, and country codes.
    Requires Traveler authentication.
    """
    return await geocode_place(query)


@router.get(
    "/activities",
    response_model=List[POIResult],
    summary="Search activities and POIs around coordinates",
)
async def get_activities(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    mode: Literal["popular", "hidden"] = Query("popular", description="popular (iconic first) or hidden (gems first)"),
    radius_m: int = Query(20000, ge=1000, le=50000, description="Radius in meters"),
    traveler: User = Depends(get_current_traveler),
):
    """
    Returns attractions and activities classified by popularity.
    - 'popular' mode prioritizes Iconic & Popular spots (Step 1).
    - 'hidden' mode prioritizes Hidden Gems & Lesser-known spots (Step 5).
    """
    raw_pois = await search_activities(lat=lat, lon=lon, radius_m=radius_m)

    if mode == "hidden":
        # Hidden gems first, then Popular, then Iconic
        order = {"Hidden Gem": 0, "Popular": 1, "Iconic": 2}
        sorted_pois = sorted(raw_pois, key=lambda x: order.get(x.popularity, 1))
    else:
        # Iconic first, then Popular, then Hidden Gem
        order = {"Iconic": 0, "Popular": 1, "Hidden Gem": 2}
        sorted_pois = sorted(raw_pois, key=lambda x: order.get(x.popularity, 1))

    return sorted_pois


@router.get(
    "/activities/{xid}",
    response_model=POIDetail,
    summary="Get single POI detail on-demand",
)
async def get_poi_detail_endpoint(
    xid: str,
    traveler: User = Depends(get_current_traveler),
):
    """
    Fetches detailed extracts, descriptions, and images for an individual activity card.
    """
    return await get_activity_detail(xid)


@router.get(
    "/date-insight",
    response_model=DateInsightResponse,
    summary="Get weather outlook, holiday overlap, and crowd estimate",
)
async def get_date_insight_endpoint(
    lat: float = Query(..., description="Destination latitude"),
    lon: float = Query(..., description="Destination longitude"),
    start_date: str = Query(..., description="Departure date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="Return date (YYYY-MM-DD)"),
    country_code: str = Query("IN", description="ISO 2-letter country code"),
    traveler: User = Depends(get_current_traveler),
):
    """
    Aggregates weather conditions, national public holiday overlaps, and crowd heuristics.
    """
    return await get_date_insights(
        lat=lat,
        lon=lon,
        start_date_str=start_date,
        end_date_str=end_date,
        country_code=country_code,
    )


@router.get(
    "/digital-twin",
    response_model=DigitalTwinResponse,
    summary="Live weather + what-if digital twin simulation",
)
async def get_digital_twin_endpoint(
    lat: float = Query(..., description="Destination latitude"),
    lon: float = Query(..., description="Destination longitude"),
    destination: str = Query(..., min_length=1, description="Destination name"),
    start_date: str = Query(..., description="Trip start date YYYY-MM-DD"),
    end_date: str = Query(..., description="Trip end date YYYY-MM-DD"),
    rainfall_mm: Optional[float] = Query(None, ge=0, le=500),
    temperature_c: Optional[float] = Query(None, ge=-50, le=60),
    storm_duration_hours: Optional[float] = Query(None, ge=0, le=72),
    traveler: User = Depends(get_current_traveler),
):
    """
    Extends the existing travel planner with a weather-driven digital twin.
    Live weather is the baseline; optional parameters create an isolated what-if scenario.
    """
    return await get_digital_twin(
        destination=destination,
        lat=lat,
        lon=lon,
        start_date=start_date,
        end_date=end_date,
        rainfall_mm=rainfall_mm,
        temperature_c=temperature_c,
        storm_duration_hours=storm_duration_hours,
    )


@router.get(
    "/budget-preview",
    response_model=BudgetPreview,
    summary="Live flight and accommodation budget preview bounds",
)
async def get_budget_preview(
    destination: str = Query(..., description="Destination city"),
    start_date: str = Query(..., description="Departure date YYYY-MM-DD"),
    end_date: str = Query(..., description="Return date YYYY-MM-DD"),
    travelers: int = Query(1, ge=1, le=20, description="Party size"),
    departure_city: str = Query(..., min_length=2, description="Origin city"),
    traveler: User = Depends(get_current_traveler),
):
    """
    Queries live flight and hotel pricing only.
    If an upstream provider does not return data, the endpoint fails instead
    of presenting fabricated budget numbers.
    """
    start_d = parse_date(start_date)
    end_d = parse_date(end_date)
    nights = max(1, (end_d - start_d).days)

    try:
        origin_raw = await travel_search_client.search_airports(departure_city)
        origin_suggs = _parse_airport_suggestions(origin_raw)
        dest_raw = await travel_search_client.search_airports(destination)
        dest_suggs = _parse_airport_suggestions(dest_raw)

        if not origin_suggs or not dest_suggs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Could not resolve origin or destination airport.",
            )

        origin_apt = _pick_best_airport(origin_suggs, departure_city)
        dest_apt = _pick_best_airport(dest_suggs, destination)

        raw_flights = await travel_search_client.search_flights(
            origin_sky_id=origin_apt.skyId,
            dest_sky_id=dest_apt.skyId,
            origin_entity_id=origin_apt.entityId,
            dest_entity_id=dest_apt.entityId,
            date=start_date,
            return_date=end_date,
            adults=travelers,
        )
        flight_options = _parse_flight_options(raw_flights)

        if not flight_options:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No live flight prices were returned for this trip.",
            )

        hotel_dest_raw = await travel_search_client.search_hotel_destination(destination)
        hotel_dests = _parse_hotel_destinations(hotel_dest_raw)

        if not hotel_dests:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Could not resolve the hotel destination.",
            )

        raw_hotels = await travel_search_client.search_hotels(
            entity_id=hotel_dests[0]["entityId"],
            check_in=start_date,
            check_out=end_date,
            adults=travelers,
            rooms=max(1, (travelers + 1) // 2),
            destination=destination,
        )
        hotel_options = _parse_hotel_options(raw_hotels)

        if not hotel_options:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No live hotel prices were returned for this trip.",
            )

        flight_prices = [flight.price for flight in flight_options if flight.price > 0]
        hotel_prices = [hotel.price_per_night for hotel in hotel_options if hotel.price_per_night > 0]

        if not flight_prices or not hotel_prices:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Live pricing was returned without usable prices.",
            )

        flight_min = min(flight_prices)
        flight_max = max(flight_prices)
        hotel_min = min(hotel_prices)
        hotel_max = max(hotel_prices)

        min_total = round(flight_min + (hotel_min * nights), 0)
        max_total = round(flight_max + (hotel_max * nights), 0)

        return BudgetPreview(
            min_price=min_total,
            max_price=max_total,
            flight_min=flight_min,
            flight_max=flight_max,
            hotel_min=hotel_min,
            hotel_max=hotel_max,
            currency="INR",
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Live budget preview failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Live travel pricing is temporarily unavailable.",
        ) from exc


@router.post(
    "/recommend",
    response_model=TripRecommendationResponse,
    summary="Composite 8-step recommendation and TripPlan graph generation",
)
async def recommend_trip(
    request: TripRecommendationRequest,
    traveler: User = Depends(get_current_traveler),
):
    """
    Composite recommendation engine:
    1. Finds & ranks flights by style, price, and non-stop bonus within budget.
    2. Finds & ranks hotels by style, star tier, and rating within budget.
    3. Assembles a full TripPlan graph matching copilot schemas from user-selected activities.
    """
    start_d = parse_date(request.start_date)
    end_d = parse_date(request.end_date)
    duration_days = max(1, (end_d - start_d).days + 1)

    # 1. Resolve Flights (use traveler's explicit selection if provided, else search)
    top_flight: Optional[FlightOption] = request.selected_flight
    alt_flights: List[FlightOption] = []
    if not top_flight:
        all_flights: List[FlightOption] = []
        try:
            origin_raw = await travel_search_client.search_airports(request.departure_city)
            origin_suggs = _parse_airport_suggestions(origin_raw)
            dest_raw = await travel_search_client.search_airports(request.destination)
            dest_suggs = _parse_airport_suggestions(dest_raw)

            if origin_suggs and dest_suggs:
                origin_apt = _pick_best_airport(origin_suggs, request.departure_city)
                dest_apt = _pick_best_airport(dest_suggs, request.destination)

                raw_flights = await travel_search_client.search_flights(
                    origin_sky_id=origin_apt.skyId,
                    dest_sky_id=dest_apt.skyId,
                    origin_entity_id=origin_apt.entityId,
                    dest_entity_id=dest_apt.entityId,
                    date=request.start_date,
                    return_date=request.end_date,
                    adults=request.travelers,
                )
                all_flights = _parse_flight_options(raw_flights)
        except Exception:
            pass

        top_flight, alt_flights = rank_flights(
            flights=all_flights,
            travel_style=request.travel_style,
            budget_max=request.budget_max,
        )

    # 2. Resolve Hotels (use traveler's explicit selection if provided, else search)
    top_hotel: Optional[HotelOption] = request.selected_hotel
    alt_hotels: List[HotelOption] = []
    if not top_hotel:
        all_hotels: List[HotelOption] = []
        try:
            hotel_dest_raw = await travel_search_client.search_hotel_destination(request.destination)
            hotel_dests = _parse_hotel_destinations(hotel_dest_raw)
            if hotel_dests:
                entity_id = hotel_dests[0]["entityId"]
                raw_hotels = await travel_search_client.search_hotels(
                    entity_id=entity_id,
                    check_in=request.start_date,
                    check_out=request.end_date,
                    adults=request.travelers,
                    rooms=max(1, (request.travelers + 1) // 2),
                    destination=request.destination,
                )
                all_hotels = _parse_hotel_options(raw_hotels)
        except Exception:
            pass

        top_hotel, alt_hotels = rank_hotels(
            hotels=all_hotels,
            travel_style=request.travel_style,
            budget_max=request.budget_max,
        )

    # 3. Assemble TripPlan Nodes & Locations
    locations: List[TripLocationSchema] = []
    tree_nodes: List[TripPlanNodeSchema] = []

    # Geocode departure city for origin coordinates
    origin_lat = 19.0760
    origin_lon = 72.8777
    try:
        geo_candidates = await geocode_place(request.departure_city)
        if geo_candidates:
            origin_lat = geo_candidates[0].latitude
            origin_lon = geo_candidates[0].longitude
        else:
            logger.warning(
                "Failed to geocode departure city '%s'. Falling back to Mumbai coordinates (19.0760, 72.8777).",
                request.departure_city,
            )
    except Exception as e:
        logger.warning(
            "Exception while geocoding departure city '%s': %s. Falling back to Mumbai coordinates (19.0760, 72.8777).",
            request.departure_city,
            e,
        )

    # Origin & Destination Locations
    origin_loc = TripLocationSchema(
        id=f"loc_orig_{uuid.uuid4().hex[:6]}",
        name=f"{request.departure_city} Hub",
        type="origin",
        latitude=origin_lat,
        longitude=origin_lon,
        city=request.departure_city,
        description=f"Departure hub in {request.departure_city}",
    )
    dest_loc = TripLocationSchema(
        id=f"loc_dest_{uuid.uuid4().hex[:6]}",
        name=f"{request.destination} Center",
        type="destination",
        latitude=request.destination_lat,
        longitude=request.destination_lon,
        city=request.destination,
        description=f"Destination gateway in {request.destination}",
    )
    locations.extend([origin_loc, dest_loc])

    # Flight Node
    if top_flight:
        flight_title = f"✈ Outbound: {top_flight.airline} ({top_flight.origin_airport or request.departure_city} → {top_flight.destination_airport or request.destination})"
        flight_sub = f"Depart {top_flight.depart_time or 'Morning'} • ₹{int(top_flight.price):,} • {top_flight.stops} Stop{'s' if top_flight.stops != 1 else ''}"
    else:
        flight_title = f"✈ Outbound Transit: {request.departure_city} → {request.destination}"
        flight_sub = "Scheduled flight departure • Express non-stop"

    flight_node = TripPlanNodeSchema(
        id=f"node_fl_out_{uuid.uuid4().hex[:6]}",
        type="flight",
        title=flight_title,
        subtitle=flight_sub,
        date=f"Day 1 ({request.start_date})",
        status="confirmed",
    )
    tree_nodes.append(flight_node)

    # Hotel Node
    if top_hotel:
        hotel_loc = TripLocationSchema(
            id=f"loc_hotel_{uuid.uuid4().hex[:6]}",
            name=top_hotel.name,
            type="hotel",
            latitude=round(request.destination_lat + 0.005, 4),
            longitude=round(request.destination_lon - 0.004, 4),
            city=request.destination,
            description=top_hotel.address or f"Stay at {top_hotel.name}",
        )
        locations.append(hotel_loc)

        hotel_node = TripPlanNodeSchema(
            id=f"node_hotel_{uuid.uuid4().hex[:6]}",
            type="hotel",
            title=f"🏨 Stay: {top_hotel.name}",
            subtitle=f"{top_hotel.star_rating or 4.0}★ Stay • ₹{int(top_hotel.price_per_night):,}/night",
            date=f"{request.start_date} to {request.end_date}",
            location_id=hotel_loc.id,
            location=hotel_loc,
            status="confirmed",
            children=[
                TripPlanNodeSchema(
                    id=f"node_amenity_{uuid.uuid4().hex[:6]}",
                    type="activity",
                    title="Reserved Room & Concierge Services",
                    subtitle="Daily breakfast and resort access included",
                    status="confirmed",
                )
            ],
        )
        tree_nodes.append(hotel_node)

    # Activity allocation across days
    user_acts = list(request.activities)
    # If fewer activities than days, fetch or supplement
    if len(user_acts) < duration_days * 2:
        extra_pois = await search_activities(lat=request.destination_lat, lon=request.destination_lon, limit=15)
        existing_names = {a.name for a in user_acts}
        for p in extra_pois:
            if p.name not in existing_names:
                user_acts.append(
                    WizardActivity(
                        xid=p.xid,
                        name=p.name,
                        popularity=p.popularity,
                        kinds=p.kinds,
                        latitude=p.latitude,
                        longitude=p.longitude,
                        description=f"Scenic highlight in {request.destination}",
                    )
                )
                existing_names.add(p.name)

    act_idx = 0
    for day_num in range(1, duration_days + 1):
        day_date = start_d + timedelta(days=day_num - 1)
        day_children: List[TripPlanNodeSchema] = []

        # 2 activities per day
        for _ in range(2):
            if act_idx < len(user_acts):
                act_data = user_acts[act_idx]
            else:
                act_data = user_acts[act_idx % len(user_acts)] if user_acts else None
            act_idx += 1

            if act_data:
                act_lat = act_data.latitude or round(request.destination_lat + (0.008 * (act_idx % 4)), 4)
                act_lon = act_data.longitude or round(request.destination_lon + (0.008 * ((act_idx + 1) % 4)), 4)

                act_loc = TripLocationSchema(
                    id=f"loc_act_{uuid.uuid4().hex[:6]}",
                    name=act_data.name,
                    type="activity",
                    latitude=act_lat,
                    longitude=act_lon,
                    city=request.destination,
                    day=day_num,
                    description=act_data.description or f"{act_data.popularity} activity in {request.destination}",
                )
                locations.append(act_loc)

                act_node = TripPlanNodeSchema(
                    id=f"node_act_{uuid.uuid4().hex[:6]}",
                    type="activity",
                    title=act_data.name,
                    subtitle=f"{act_data.popularity} • {act_data.kinds or 'Sightseeing'}",
                    date=f"Day {day_num} ({day_date.strftime('%b %d')})",
                    location_id=act_loc.id,
                    location=act_loc,
                    status="suggested",
                )
                day_children.append(act_node)

        day_node = TripPlanNodeSchema(
            id=f"node_day_{day_num}_{uuid.uuid4().hex[:6]}",
            type="day",
            title=f"Day {day_num}: {request.destination}",
            subtitle=f"{day_date.strftime('%A, %b %d')} • Curated Sightseeing & Leisure",
            date=f"Day {day_num}",
            status="confirmed",
            children=day_children,
        )
        tree_nodes.append(day_node)

    # Return Flight Node
    ret_title = f"✈ Return Flight: {request.destination} → {request.departure_city}"
    ret_sub = "Evening scheduled departure"
    if top_flight:
        ret_title = f"✈ Return: {top_flight.airline} ({request.destination} → {request.departure_city})"
        ret_sub = f"Non-stop return flight • {top_flight.airline}"

    ret_flight_node = TripPlanNodeSchema(
        id=f"node_fl_ret_{uuid.uuid4().hex[:6]}",
        type="flight",
        title=ret_title,
        subtitle=ret_sub,
        date=f"Day {duration_days} ({request.end_date})",
        status="confirmed",
    )
    tree_nodes.append(ret_flight_node)

    # Flight Routes
    flight_dist = haversine_km(
        origin_loc.latitude,
        origin_loc.longitude,
        dest_loc.latitude,
        dest_loc.longitude,
    )
    routes: List[TripRouteSchema] = [
        TripRouteSchema(
            id=f"route_out_{uuid.uuid4().hex[:6]}",
            origin_id=origin_loc.id,
            destination_id=dest_loc.id,
            type="flight",
            from_coords=(origin_loc.latitude, origin_loc.longitude),
            to_coords=(dest_loc.latitude, dest_loc.longitude),
            label=f"{request.departure_city} → {request.destination}",
            distance_km=flight_dist,
        ),
        TripRouteSchema(
            id=f"route_ret_{uuid.uuid4().hex[:6]}",
            origin_id=dest_loc.id,
            destination_id=origin_loc.id,
            type="flight",
            from_coords=(dest_loc.latitude, dest_loc.longitude),
            to_coords=(origin_loc.latitude, origin_loc.longitude),
            label=f"{request.destination} → {request.departure_city}",
            distance_km=flight_dist,
        ),
    ]

    budget_label = (
        f"₹{int(request.budget_min):,} – ₹{int(request.budget_max):,}"
        if request.budget_min and request.budget_max
        else "Custom Budget"
    )

    trip_plan = TripPlanSchema(
        id=f"plan_wiz_{uuid.uuid4().hex[:8]}",
        title=f"{duration_days}-Day Trip to {request.destination}",
        origin=request.departure_city,
        destination=request.destination,
        duration_days=duration_days,
        start_date=request.start_date,
        end_date=request.end_date,
        estimated_budget=budget_label,
        travel_style=request.travel_style,
        nodes=tree_nodes,
        locations=locations,
        routes=routes,
    )

    msg = f"Your {duration_days}-day itinerary to {request.destination} has been structured with your chosen stay, flight, and curated activities!"

    return TripRecommendationResponse(
        trip_plan=trip_plan,
        recommended_flight=top_flight,
        recommended_hotel=top_hotel,
        alternate_flights=alt_flights,
        alternate_hotels=alt_hotels,
        message=msg,
    )
