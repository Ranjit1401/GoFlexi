import math
import httpx
from typing import List, Optional
from app.schemas.trip_wizard import GeoResult

OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"

# Common curated fallback coordinates for major travel hubs
FALLBACK_PLACES = {
    "goa": GeoResult(name="Goa", country="India", admin1="Goa", latitude=15.2993, longitude=74.1240, country_code="IN"),
    "manali": GeoResult(name="Manali", country="India", admin1="Himachal Pradesh", latitude=32.2396, longitude=77.1887, country_code="IN"),
    "jaipur": GeoResult(name="Jaipur", country="India", admin1="Rajasthan", latitude=26.9124, longitude=75.7873, country_code="IN"),
    "mumbai": GeoResult(name="Mumbai", country="India", admin1="Maharashtra", latitude=19.0760, longitude=72.8777, country_code="IN"),
    "delhi": GeoResult(name="Delhi", country="India", admin1="Delhi", latitude=28.6139, longitude=77.2090, country_code="IN"),
    "kerala": GeoResult(name="Kochi", country="India", admin1="Kerala", latitude=9.9312, longitude=76.2673, country_code="IN"),
    "udaipur": GeoResult(name="Udaipur", country="India", admin1="Rajasthan", latitude=24.5854, longitude=73.7125, country_code="IN"),
    "shimla": GeoResult(name="Shimla", country="India", admin1="Himachal Pradesh", latitude=31.1048, longitude=77.1734, country_code="IN"),
    "bengaluru": GeoResult(name="Bengaluru", country="India", admin1="Karnataka", latitude=12.9716, longitude=77.5946, country_code="IN"),
    "bangalore": GeoResult(name="Bengaluru", country="India", admin1="Karnataka", latitude=12.9716, longitude=77.5946, country_code="IN"),
}


async def geocode_place(name: str, count: int = 5) -> List[GeoResult]:
    """
    Geocodes a place/city query into lat/lon coordinates using Open-Meteo Geocoding API.
    Zero-auth, free tier with resilient fallback to curated coordinates if unreachable.
    """
    clean_name = name.strip()
    if not clean_name:
        return []

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                OPEN_METEO_GEOCODING_URL,
                params={"name": clean_name, "count": count, "language": "en", "format": "json"}
            )
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results") or []
                geo_results: List[GeoResult] = []
                for item in results:
                    geo_results.append(
                        GeoResult(
                            name=item.get("name", clean_name),
                            country=item.get("country", "India"),
                            admin1=item.get("admin1"),
                            latitude=float(item.get("latitude", 0.0)),
                            longitude=float(item.get("longitude", 0.0)),
                            country_code=str(item.get("country_code", "IN")).upper(),
                        )
                    )
                if geo_results:
                    return geo_results
    except Exception:
        pass

    # Fallback to curated dictionary if network error or no results
    lower_query = clean_name.lower()
    for key, fb in FALLBACK_PLACES.items():
        if key in lower_query or lower_query in key:
            return [fb]

    # Default fallback object if completely unknown
    return [
        GeoResult(
            name=clean_name.title(),
            country="India",
            admin1=None,
            latitude=20.5937,
            longitude=78.9629,
            country_code="IN"
        )
    ]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees) using the Haversine formula.
    """
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)

