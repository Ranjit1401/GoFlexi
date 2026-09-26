import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_traveler
from app.models.user import User
from app.schemas.travel_search import (
    AirportSuggestion,
    FlightSearchRequest,
    FlightOption,
    FlightSearchResponse,
    HotelSearchRequest,
    HotelOption,
    HotelSearchResponse,
)
from app.services.travel_search_service import (
    TravelSearchAPIError,
    travel_search_client,
)

router = APIRouter(prefix="/travel-search", tags=["Travel Search"])


def _parse_airport_suggestions(raw: Any) -> List[AirportSuggestion]:
    """Parses raw RapidAPI airport response into list of AirportSuggestion schemas."""
    items: List[AirportSuggestion] = []
    if isinstance(raw, dict):
        raw_items = raw.get("data") or raw.get("results") or []
    elif isinstance(raw, list):
        raw_items = raw
    else:
        raw_items = []

    for item in raw_items:
        if not isinstance(item, dict):
            continue

        navigation = item.get("navigation") or {}
        flight_params = navigation.get("relevantFlightParams") or {}
        presentation = item.get("presentation") or {}

        # Extract Sky Scrapper nested skyId and entityId
        sky_id = (
            item.get("skyId")
            or flight_params.get("skyId")
            or item.get("id")
            or item.get("iataCode")
            or ""
        )
        entity_id = (
            item.get("entityId")
            or flight_params.get("entityId")
            or navigation.get("entityId")
            or item.get("id")
            or ""
        )

        name = (
            item.get("name")
            or presentation.get("suggestionTitle")
            or presentation.get("title")
            or navigation.get("localizedName")
            or sky_id
        )
        city = (
            item.get("city")
            or presentation.get("title")
            or flight_params.get("localizedName")
            or navigation.get("localizedName")
            or ""
        )
        country = item.get("country") or presentation.get("subtitle") or ""

        if sky_id and entity_id:
            items.append(
                AirportSuggestion(
                    skyId=str(sky_id),
                    entityId=str(entity_id),
                    name=str(name),
                    city=str(city),
                    country=str(country),
                )
            )
    return items


def _parse_flight_options(raw: Any, default_currency: str = "INR") -> List[FlightOption]:
    """Parses raw RapidAPI flight response into list of FlightOption schemas."""
    options: List[FlightOption] = []
    if not isinstance(raw, dict):
        return options

    # Pre-shaped or mocked response
    if "results" in raw and isinstance(raw["results"], list):
        for item in raw["results"]:
            if isinstance(item, dict):
                options.append(
                    FlightOption(
                        id=str(item.get("id") or uuid.uuid4()),
                        airline=str(item.get("airline") or "Commercial Airline"),
                        price=float(item.get("price") or 0.0),
                        currency=str(item.get("currency") or default_currency),
                        depart_time=str(item.get("depart_time") or ""),
                        arrive_time=str(item.get("arrive_time") or ""),
                        duration_minutes=int(item.get("duration_minutes") or 0),
                        stops=int(item.get("stops") or 0),
                        origin_airport=str(item.get("origin_airport") or ""),
                        destination_airport=str(item.get("destination_airport") or ""),
                        booking_deeplink=item.get("booking_deeplink"),
                    )
                )
        return options

    # Standard Sky Scrapper response structure: data -> itineraries
    data = raw.get("data") or raw
    itineraries = data.get("itineraries") if isinstance(data, dict) else []
    if isinstance(itineraries, list):
        for itin in itineraries:
            if not isinstance(itin, dict):
                continue

            itin_id = str(itin.get("id") or uuid.uuid4())
            price_val = 0.0
            price_obj = itin.get("price")
            if isinstance(price_obj, dict):
                price_val = float(price_obj.get("raw") or 0.0)
            elif isinstance(price_obj, (int, float)):
                price_val = float(price_obj)

            legs = itin.get("legs") or []
            airline = "Commercial Airline"
            depart_time = ""
            arrive_time = ""
            duration = 0
            stops = 0
            origin_apt = ""
            dest_apt = ""

            if legs and isinstance(legs[0], dict):
                leg = legs[0]
                depart_time = str(leg.get("departure") or "")
                arrive_time = str(leg.get("arrival") or "")
                duration = int(leg.get("durationInMinutes") or 0)
                stops = int(leg.get("stopCount") or 0)

                carriers = leg.get("carriers", {}).get("marketing") or []
                if carriers and isinstance(carriers[0], dict):
                    airline = carriers[0].get("name") or airline

                origin_apt = (
                    leg.get("origin", {}).get("name")
                    or leg.get("origin", {}).get("displayCode")
                    or ""
                )
                dest_apt = (
                    leg.get("destination", {}).get("name")
                    or leg.get("destination", {}).get("displayCode")
                    or ""
                )

            options.append(
                FlightOption(
                    id=itin_id,
                    airline=airline,
                    price=price_val,
                    currency=default_currency,
                    depart_time=depart_time,
                    arrive_time=arrive_time,
                    duration_minutes=duration,
                    stops=stops,
                    origin_airport=origin_apt,
                    destination_airport=dest_apt,
                    booking_deeplink=itin.get("deeplink") or itin.get("booking_deeplink"),
                )
            )

    return options


def _parse_hotel_destinations(raw: Any) -> List[Dict[str, str]]:
    """Parses hotel destination autosuggest response into list of entity items."""
    results: List[Dict[str, str]] = []
    if isinstance(raw, dict):
        raw_items = raw.get("data") or raw.get("results") or []
    elif isinstance(raw, list):
        raw_items = raw
    else:
        raw_items = []

    for item in raw_items:
        if not isinstance(item, dict):
            continue
        entity_id = str(item.get("entityId") or item.get("id") or "")
        name = str(
            item.get("entityName")
            or item.get("name")
            or item.get("title")
            or item.get("suggestionTitle")
            or entity_id
        )
        import re
        clean_name = re.sub(r"<[^>]+>|\{[^}]+\}", "", name).strip()
        entity_type = str(item.get("entityType") or item.get("class") or "Destination")
        if entity_id:
            results.append({
                "entityId": entity_id,
                "name": clean_name or name,
                "entityType": entity_type.title(),
            })
    return results


def _parse_hotel_options(raw: Any, default_currency: str = "INR") -> List[HotelOption]:
    """Parses raw RapidAPI hotel search response into list of HotelOption schemas."""
    options: List[HotelOption] = []
    if not isinstance(raw, dict):
        return options

    # Pre-shaped or mocked response
    if "results" in raw and isinstance(raw["results"], list):
        for item in raw["results"]:
            if isinstance(item, dict):
                options.append(
                    HotelOption(
                        id=str(item.get("id") or uuid.uuid4()),
                        name=str(item.get("name") or "Hotel"),
                        star_rating=(
                            float(item["star_rating"])
                            if item.get("star_rating") is not None
                            else None
                        ),
                        price_per_night=float(item.get("price_per_night") or 0.0),
                        currency=str(item.get("currency") or default_currency),
                        thumbnail_url=item.get("thumbnail_url"),
                        address=item.get("address"),
                        rating_score=(
                            float(item["rating_score"])
                            if item.get("rating_score") is not None
                            else None
                        ),
                        review_count=(
                            int(item["review_count"])
                            if item.get("review_count") is not None
                            else None
                        ),
                    )
                )
        return options

    # Standard Sky Scrapper structure: data -> hotels
    data = raw.get("data") or raw
    hotels = data.get("hotels") if isinstance(data, dict) else []
    if isinstance(hotels, list):
        for h in hotels:
            if not isinstance(h, dict):
                continue

            price_val = float(h.get("rawPrice") or 0.0)
            if price_val == 0.0:
                price_obj = h.get("price") or h.get("rate")
                if isinstance(price_obj, dict):
                    price_val = float(price_obj.get("raw") or price_obj.get("amount") or 0.0)
                elif isinstance(price_obj, (int, float)):
                    price_val = float(price_obj)

            thumbnail = None
            hero = h.get("heroImage")
            if isinstance(hero, str):
                thumbnail = hero.replace("_WxH", "_600x400") if "_WxH" in hero else hero
            elif isinstance(hero, dict):
                thumbnail = hero.get("url")
            elif isinstance(h.get("thumbnail_url"), str):
                thumbnail = h["thumbnail_url"]

            # Rating Score
            rating_val = None
            review_summary = h.get("reviewSummary")
            if isinstance(review_summary, dict) and review_summary.get("value"):
                try:
                    rating_val = float(review_summary["value"])
                except Exception:
                    pass
            elif isinstance(h.get("rating"), dict) and h["rating"].get("value"):
                try:
                    rating_val = float(h["rating"]["value"]) / 2.0
                except Exception:
                    pass
            elif isinstance(h.get("rating"), (int, float)):
                rating_val = float(h["rating"])

            # Review Count
            count_val = None
            if isinstance(review_summary, dict) and review_summary.get("count"):
                try:
                    count_val = int(review_summary["count"])
                except Exception:
                    pass
            elif isinstance(h.get("rating"), dict) and h["rating"].get("count"):
                try:
                    count_val = int(h["rating"]["count"])
                except Exception:
                    pass
            elif isinstance(h.get("reviewCount"), (int, float)):
                count_val = int(h["reviewCount"])
            elif isinstance(h.get("review_count"), (int, float)):
                count_val = int(h["review_count"])

            address_str = h.get("distance") or h.get("location") or h.get("address")

            options.append(
                HotelOption(
                    id=str(h.get("hotelId") or h.get("id") or uuid.uuid4()),
                    name=str(h.get("name") or "Hotel"),
                    star_rating=(
                        float(h["stars"])
                        if "stars" in h and h["stars"] is not None
                        else None
                    ),
                    price_per_night=price_val,
                    currency=default_currency,
                    thumbnail_url=thumbnail,
                    address=address_str,
                    rating_score=rating_val,
                    review_count=count_val,
                )
            )

    return options


def _pick_best_airport(suggestions: List[AirportSuggestion], query: str) -> AirportSuggestion:
    """Finds best matching airport suggestion for a query string."""
    q = query.strip().lower()

    # 1. Exact skyId match (e.g. BOM, DEL, GOI)
    for s in suggestions:
        if s.skyId.lower() == q:
            return s

    # 2. Check if query contains skyId in parentheses e.g. "Goa Dabolim (GOI)"
    for s in suggestions:
        if f"({s.skyId.lower()})" in q or f" {s.skyId.lower()} " in f" {q} ":
            return s

    # 3. Match by city equality (e.g. "Goa" -> Goa Dabolim GOI, India)
    city_matches = [s for s in suggestions if s.city.lower() == q]
    if city_matches:
        airports = [s for s in city_matches if not s.skyId.startswith("I")]
        return airports[0] if airports else city_matches[0]

    # 4. Partial city match
    for s in suggestions:
        if q in s.city.lower():
            if not s.skyId.startswith("I"):
                return s

    # 5. Non-city aggregator fallback
    airports = [s for s in suggestions if not s.skyId.startswith("I")]
    return airports[0] if airports else suggestions[0]



@router.get(
    "/airports",
    response_model=List[AirportSuggestion],
    summary="Search airport and city suggestions for flight routing",
)
async def get_airports(
    query: str = Query(..., min_length=1, description="City or airport search term"),
    traveler: User = Depends(get_current_traveler),
):
    """
    Returns matching airports and transport hubs for flight search auto-completion.
    Requires Traveler authentication.
    """
    try:
        raw = await travel_search_client.search_airports(query=query)
        return _parse_airport_suggestions(raw)
    except TravelSearchAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Airport search is temporarily unavailable: {exc.message}",
        )


@router.post(
    "/flights",
    response_model=FlightSearchResponse,
    summary="Search live flights between origin and destination",
)
async def post_search_flights(
    request: FlightSearchRequest,
    traveler: User = Depends(get_current_traveler),
):
    """
    Searches available flights.
    1. Resolves origin/destination airport entities.
    2. Queries live Sky Scrapper flights API.
    3. Returns sorted flight options by price ascending.
    """
    try:
        # Step 1: Resolve origin
        origin_raw = await travel_search_client.search_airports(request.origin)
        origin_suggestions = _parse_airport_suggestions(origin_raw)
        if not origin_suggestions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Could not resolve airport for origin '{request.origin}'",
            )
        origin_match = _pick_best_airport(origin_suggestions, request.origin)

        # Step 2: Resolve destination
        dest_raw = await travel_search_client.search_airports(request.destination)
        dest_suggestions = _parse_airport_suggestions(dest_raw)
        if not dest_suggestions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Could not resolve airport for destination '{request.destination}'",
            )
        dest_match = _pick_best_airport(dest_suggestions, request.destination)

        # Step 3: Query flights
        raw_flights = await travel_search_client.search_flights(
            origin_sky_id=origin_match.skyId,
            dest_sky_id=dest_match.skyId,
            origin_entity_id=origin_match.entityId,
            dest_entity_id=dest_match.entityId,
            date=str(request.depart_date),
            return_date=str(request.return_date) if request.return_date else None,
            adults=request.adults,
            cabin_class=request.cabin_class,
            currency=request.currency,
        )

        results = _parse_flight_options(raw_flights, default_currency=request.currency)
        results.sort(key=lambda x: x.price)

        return FlightSearchResponse(
            query=request,
            results=results,
            count=len(results),
        )
    except HTTPException:
        raise
    except TravelSearchAPIError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Flight search is temporarily unavailable",
        )


@router.get(
    "/hotels/destinations",
    response_model=List[Dict[str, str]],
    summary="Search hotel destination entities for hotel search",
)
async def get_hotel_destinations(
    query: str = Query(..., min_length=1, description="City or hotel place query"),
    traveler: User = Depends(get_current_traveler),
):
    """
    Resolves destination name to hotel entity IDs.
    Requires Traveler authentication.
    """
    try:
        raw = await travel_search_client.search_hotel_destination(query=query)
        return _parse_hotel_destinations(raw)
    except TravelSearchAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Hotel destination lookup is temporarily unavailable: {exc.message}",
        )


@router.post(
    "/hotels",
    response_model=HotelSearchResponse,
    summary="Search live hotel accommodations",
)
async def post_search_hotels(
    request: HotelSearchRequest,
    traveler: User = Depends(get_current_traveler),
):
    """
    Searches hotels for a destination and date range.
    1. Resolves destination entity ID via autosuggest.
    2. Queries live Sky Scrapper hotel search API.
    3. Returns sorted hotel options by price ascending.
    """
    try:
        dest_raw = await travel_search_client.search_hotel_destination(request.destination)
        destinations = _parse_hotel_destinations(dest_raw)
        if not destinations:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Could not resolve hotel destination for '{request.destination}'",
            )
        entity_id = destinations[0]["entityId"]

        raw_hotels = await travel_search_client.search_hotels(
            entity_id=entity_id,
            check_in=str(request.check_in),
            check_out=str(request.check_out),
            adults=request.adults,
            rooms=request.rooms,
            currency=request.currency,
            destination=request.destination,
        )

        results = _parse_hotel_options(raw_hotels, default_currency=request.currency)
        results.sort(key=lambda x: x.price_per_night)

        return HotelSearchResponse(
            query=request,
            results=results,
            count=len(results),
        )
    except HTTPException:
        raise
    except TravelSearchAPIError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Hotel search is temporarily unavailable",
        )
