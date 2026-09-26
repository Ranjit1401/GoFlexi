from typing import List, Dict, Any, Tuple, Optional
from app.schemas.travel_search import FlightOption, HotelOption

STYLE_WEIGHTS: Dict[str, Dict[str, Any]] = {
    "Budget": {"price": 0.60, "quality": 0.10, "cabin": "economy", "min_star": 1},
    "Balanced": {"price": 0.35, "quality": 0.35, "cabin": "economy", "min_star": 3},
    "Premium": {"price": 0.20, "quality": 0.50, "cabin": "premium_economy", "min_star": 4},
    "Luxury": {"price": 0.10, "quality": 0.60, "cabin": "business", "min_star": 5},
}

# Proportion of overall budget allocated toward transport vs accommodations
FLIGHT_BUDGET_RATIO: float = 0.45
HOTEL_BUDGET_RATIO: float = 0.55


def rank_flights(
    flights: List[FlightOption],
    travel_style: str = "Balanced",
    budget_max: Optional[float] = None,
) -> Tuple[Optional[FlightOption], List[FlightOption]]:
    """
    Ranks flights by style weights, price, and non-stop convenience.
    Filters by budget if specified, returning top recommendation + up to 4 alternates.
    """
    if not flights:
        return None, []

    style_cfg = STYLE_WEIGHTS.get(travel_style, STYLE_WEIGHTS["Balanced"])
    price_weight = style_cfg["price"]
    quality_weight = style_cfg["quality"]

    # Filter within budget if specified (using flight allocation share)
    max_flight_budget = (budget_max * FLIGHT_BUDGET_RATIO) if budget_max else None
    eligible = [f for f in flights if max_flight_budget is None or f.price <= max_flight_budget]
    if not eligible:
        # If strict budget excludes all, keep all flights sorted by lowest price
        eligible = sorted(flights, key=lambda f: f.price)

    # Calculate min/max for normalization
    prices = [f.price for f in eligible]
    durations = [f.duration_minutes for f in eligible]
    min_p, max_p = min(prices), max(prices)
    min_d, max_d = min(durations), max(durations)

    scored: List[Tuple[float, FlightOption]] = []
    for f in eligible:
        norm_price = (f.price - min_p) / (max_p - min_p) if max_p > min_p else 0.5
        norm_duration = (f.duration_minutes - min_d) / (max_d - min_d) if max_d > min_d else 0.5
        norm_quality = 1.0 - norm_duration

        stops_bonus = 0.10 if f.stops == 0 else 0.0
        score = (quality_weight * norm_quality) - (price_weight * norm_price) + stops_bonus
        scored.append((score, f))

    # Highest score first
    scored.sort(key=lambda x: x[0], reverse=True)
    ranked = [item[1] for item in scored]

    top_flight = ranked[0] if ranked else None
    alternates = ranked[1:5] if len(ranked) > 1 else []
    return top_flight, alternates


def rank_hotels(
    hotels: List[HotelOption],
    travel_style: str = "Balanced",
    budget_max: Optional[float] = None,
) -> Tuple[Optional[HotelOption], List[HotelOption]]:
    """
    Ranks hotels by style weights, star tiers, review rating, and nightly price.
    Filters by budget if specified, returning top recommendation + up to 4 alternates.
    """
    if not hotels:
        return None, []

    style_cfg = STYLE_WEIGHTS.get(travel_style, STYLE_WEIGHTS["Balanced"])
    price_weight = style_cfg["price"]
    quality_weight = style_cfg["quality"]
    min_star = style_cfg["min_star"]

    max_hotel_budget = (budget_max * HOTEL_BUDGET_RATIO) if budget_max else None
    eligible = [h for h in hotels if max_hotel_budget is None or h.price_per_night <= max_hotel_budget]
    if not eligible:
        eligible = sorted(hotels, key=lambda h: h.price_per_night)

    prices = [h.price_per_night for h in eligible]
    min_p, max_p = min(prices), max(prices)

    scored: List[Tuple[float, HotelOption]] = []
    for h in eligible:
        norm_price = (h.price_per_night - min_p) / (max_p - min_p) if max_p > min_p else 0.5
        stars = h.star_rating or 3.0
        norm_star = min(1.0, stars / 5.0)
        review_val = (h.rating_score or 4.0) / 5.0

        star_bonus = 0.15 if stars >= min_star else 0.0
        norm_quality = (0.6 * norm_star) + (0.4 * review_val)

        score = (quality_weight * norm_quality) - (price_weight * norm_price) + star_bonus
        scored.append((score, h))

    scored.sort(key=lambda x: x[0], reverse=True)
    ranked = [item[1] for item in scored]

    top_hotel = ranked[0] if ranked else None
    alternates = ranked[1:5] if len(ranked) > 1 else []
    return top_hotel, alternates
