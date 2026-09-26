import re
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings

SERPAPI_SEARCH_URL = "https://serpapi.com/search.json"

# Extensive IATA dictionary mapping city and airport search terms to 3-letter IATA codes
IATA_LOOKUP: Dict[str, str] = {
    "goa": "GOI",
    "north goa": "GOX",
    "south goa": "GOI",
    "dabolim": "GOI",
    "mopa": "GOX",
    "mumbai": "BOM",
    "bombay": "BOM",
    "delhi": "DEL",
    "new delhi": "DEL",
    "indira gandhi": "DEL",
    "bangalore": "BLR",
    "bengaluru": "BLR",
    "kempegowda": "BLR",
    "chennai": "MAA",
    "madras": "MAA",
    "kolkata": "CCU",
    "calcutta": "CCU",
    "hyderabad": "HYD",
    "jaipur": "JAI",
    "pink city": "JAI",
    "ahmedabad": "AMD",
    "pune": "PNQ",
    "kochi": "COK",
    "cochin": "COK",
    "kerala": "COK",
    "manali": "KUU",
    "kullu": "KUU",
    "bhuntar": "KUU",
    "shimla": "SLV",
    "srinagar": "SXR",
    "kashmir": "SXR",
    "leh": "IXL",
    "ladakh": "IXL",
    "dehradun": "DED",
    "rishikesh": "DED",
    "mussoorie": "DED",
    "udaipur": "UDR",
    "jodhpur": "JDH",
    "lucknow": "LKO",
    "kanpur": "KNU",
    "varanasi": "VNS",
    "banaras": "VNS",
    "kashi": "VNS",
    "agra": "AGR",
    "amritsar": "ATQ",
    "chandigarh": "IXC",
    "guwahati": "GAU",
    "patna": "PAT",
    "bhubaneswar": "BBI",
    "port blair": "IXZ",
    "andaman": "IXZ",
    "indore": "IDR",
    "bhopal": "BHO",
    "raipur": "RPR",
    "ranchi": "IXR",
    "nagpur": "NAG",
    "vadodara": "BDQ",
    "surat": "STV",
    "rajkot": "RAJ",
    "visakhapatnam": "VTZ",
    "vizag": "VTZ",
    "tirupati": "TIR",
    "vijayawada": "VGA",
    "mangalore": "IXE",
    "coimbatore": "CJB",
    "madurai": "IXM",
    "trichy": "TRZ",
    "calicut": "CCJ",
    "kannur": "CNN",
    "bagdogra": "IXB",
    "darjeeling": "IXB",
    "gangtok": "IXB",
    "dubai": "DXB",
    "singapore": "SIN",
    "bangkok": "BKK",
    "bali": "DPS",
    "denpasar": "DPS",
    "kuala lumpur": "KUL",
    "london": "LHR",
    "new york": "JFK",
    "paris": "CDG",
    "tokyo": "NRT",
}

KNOWN_IATA_CODES = {
    "BOM", "DEL", "GOI", "GOX", "BLR", "MAA", "CCU", "HYD", "AMD", "PNQ",
    "JAI", "LKO", "KNU", "COK", "TRV", "SXR", "IXL", "KUU", "DED", "IXZ",
    "PAT", "GAU", "BBI", "ATQ", "IXC", "UDR", "JDH", "BDQ", "NAG", "VTZ",
    "IDR", "BHO", "RPR", "IXR", "VNS", "AGR", "GWL", "IXB", "IXA", "IMF",
    "SHL", "DMU", "AJL", "IXS", "TEZ", "IXE", "CJB", "TRZ", "IXM", "CNN",
    "CCJ", "TIR", "VGA", "STV", "RAJ", "HJR", "JSA", "BKB", "DXB", "SIN",
    "BKK", "DPS", "KUL", "LHR", "JFK", "CDG", "NRT",
}

DEMO_AIRPORTS = [
    {
        "skyId": "BOM",
        "entityId": "BOM",
        "name": "Chhatrapati Shivaji Maharaj International Airport",
        "city": "Mumbai",
        "country": "India",
    },
    {
        "skyId": "DEL",
        "entityId": "DEL",
        "name": "Indira Gandhi International Airport",
        "city": "Delhi",
        "country": "India",
    },
    {
        "skyId": "GOI",
        "entityId": "GOI",
        "name": "Dabolim International Airport",
        "city": "Goa",
        "country": "India",
    },
    {
        "skyId": "GOX",
        "entityId": "GOX",
        "name": "Manohar International Airport (Mopa)",
        "city": "Goa",
        "country": "India",
    },
    {
        "skyId": "BLR",
        "entityId": "BLR",
        "name": "Kempegowda International Airport",
        "city": "Bengaluru",
        "country": "India",
    },
    {
        "skyId": "MAA",
        "entityId": "MAA",
        "name": "Chennai International Airport",
        "city": "Chennai",
        "country": "India",
    },
    {
        "skyId": "CCU",
        "entityId": "CCU",
        "name": "Netaji Subhash Chandra Bose Airport",
        "city": "Kolkata",
        "country": "India",
    },
    {
        "skyId": "HYD",
        "entityId": "HYD",
        "name": "Rajiv Gandhi International Airport",
        "city": "Hyderabad",
        "country": "India",
    },
    {
        "skyId": "JAI",
        "entityId": "JAI",
        "name": "Jaipur International Airport",
        "city": "Jaipur",
        "country": "India",
    },
    {
        "skyId": "COK",
        "entityId": "COK",
        "name": "Cochin International Airport",
        "city": "Kochi",
        "country": "India",
    },
    {
        "skyId": "KUU",
        "entityId": "KUU",
        "name": "Kullu Manali Bhuntar Airport",
        "city": "Manali",
        "country": "India",
    },
    {
        "skyId": "UDR",
        "entityId": "UDR",
        "name": "Maharana Pratap Airport",
        "city": "Udaipur",
        "country": "India",
    },
    {
        "skyId": "SXR",
        "entityId": "SXR",
        "name": "Sheikh ul-Alam International Airport",
        "city": "Srinagar",
        "country": "India",
    },
    {
        "skyId": "IXL",
        "entityId": "IXL",
        "name": "Kushok Bakula Rimpochee Airport",
        "city": "Leh",
        "country": "India",
    },
    {
        "skyId": "DED",
        "entityId": "DED",
        "name": "Jolly Grant Airport",
        "city": "Dehradun",
        "country": "India",
    },
    {
        "skyId": "LKO",
        "entityId": "LKO",
        "name": "Chaudhary Charan Singh International Airport",
        "city": "Lucknow",
        "country": "India",
    },
    {
        "skyId": "AMD",
        "entityId": "AMD",
        "name": "Sardar Vallabhbhai Patel International Airport",
        "city": "Ahmedabad",
        "country": "India",
    },
    {
        "skyId": "PNQ",
        "entityId": "PNQ",
        "name": "Pune International Airport",
        "city": "Pune",
        "country": "India",
    },
    {
        "skyId": "IXZ",
        "entityId": "IXZ",
        "name": "Veer Savarkar International Airport",
        "city": "Port Blair",
        "country": "India",
    },
    {
        "skyId": "DXB",
        "entityId": "DXB",
        "name": "Dubai International Airport",
        "city": "Dubai",
        "country": "United Arab Emirates",
    },
    {
        "skyId": "SIN",
        "entityId": "SIN",
        "name": "Singapore Changi Airport",
        "city": "Singapore",
        "country": "Singapore",
    },
    {
        "skyId": "LHR",
        "entityId": "LHR",
        "name": "London Heathrow Airport",
        "city": "London",
        "country": "United Kingdom",
    },
]


def resolve_iata_code(query: str) -> str:
    """
    Resolves any city name, airport name, or code into a standard 3-letter IATA code.
    Prioritizes curated mapping over substring guesses.
    """
    q = (query or "").strip().lower()
    if not q:
        return "DEL"

    # Check exact city/region match in lookup
    if q in IATA_LOOKUP:
        return IATA_LOOKUP[q]

    # Check known IATA code
    if q.upper() in KNOWN_IATA_CODES:
        return q.upper()

    # Check parentheses e.g. "Goa Dabolim (GOI)"
    paren_match = re.search(r"\(([A-Za-z]{3})\)", query)
    if paren_match:
        code = paren_match.group(1).upper()
        if code in KNOWN_IATA_CODES:
            return code

    # Check partial key matches
    for key, code in IATA_LOOKUP.items():
        if key in q:
            return code

    # Fallback to uppercase 3 letters if alphabetic
    if len(q) == 3 and q.isalpha():
        return q.upper()

    return "DEL"


def extract_price(val: Any) -> float:
    """Robust extractor that handles int, float, dict with nested price fields, or formatted currency strings."""
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, dict):
        for k in ["extracted_lowest", "extracted_before_taxes_fees", "raw", "amount", "value", "lowest"]:
            if k in val and val[k] is not None:
                p = extract_price(val[k])
                if p > 0:
                    return p
    if isinstance(val, str):
        cleaned = re.sub(r"[^\d.]", "", val.replace(",", ""))
        try:
            return float(cleaned) if cleaned else 0.0
        except ValueError:
            return 0.0
    return 0.0


class TravelSearchAPIError(Exception):
    """Internal exception raised when upstream travel search fails or times out."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class TravelSearchClient:
    """
    Async HTTP client for SerpApi travel search (Google Flights & Google Hotels engines).
    Fetches real-time live airline fares, flight schedules, hotel prices, star ratings, and photos.
    Gracefully falls back to realistic demo data if API key is not configured or upstream limits are reached.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        timeout: float = 20.0,
    ):
        self._custom_api_key = api_key
        self.timeout = timeout

    @property
    def api_key(self) -> str:
        if self._custom_api_key is not None:
            return self._custom_api_key.strip()
        return settings.serpapi_key

    async def _request(
        self,
        engine: str,
        params: Dict[str, Any],
    ) -> Any:
        """Makes an asynchronous GET request to SerpApi."""
        if not self.api_key:
            raise TravelSearchAPIError(
                "SerpApi API key is not configured on the server",
                status_code=502,
            )

        query_params = {
            "engine": engine,
            "api_key": self.api_key,
            **params,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    url=SERPAPI_SEARCH_URL,
                    params=query_params,
                )
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, dict) and "error" in data:
                        raise TravelSearchAPIError(
                            f"SerpApi returned error: {data['error']}",
                            status_code=502,
                        )
                    return data

                # Check for 4xx or 5xx
                raise TravelSearchAPIError(
                    f"SerpApi returned HTTP {response.status_code}: {response.text[:200]}",
                    status_code=502,
                )
        except httpx.TimeoutException as exc:
            raise TravelSearchAPIError(
                f"SerpApi request timed out: {exc}",
                status_code=504,
            ) from exc
        except httpx.RequestError as exc:
            raise TravelSearchAPIError(
                f"Network communication failed with SerpApi: {exc}",
                status_code=502,
            ) from exc
        except Exception as exc:
            if isinstance(exc, TravelSearchAPIError):
                raise
            raise TravelSearchAPIError(
                f"Unexpected error while calling SerpApi: {exc}",
                status_code=502,
            ) from exc

    def _get_demo_airports(self, query: str) -> Dict[str, Any]:
        q = query.lower().strip()
        matches = [
            a
            for a in DEMO_AIRPORTS
            if q in a["skyId"].lower() or q in a["city"].lower() or q in a["name"].lower()
        ]
        if not matches:
            resolved_iata = resolve_iata_code(query)
            matches = [
                {
                    "skyId": resolved_iata,
                    "entityId": resolved_iata,
                    "name": f"{query.title()} Airport",
                    "city": query.title(),
                    "country": "India",
                }
            ]
        return {
            "status": True,
            "data": [
                {
                    "skyId": m["skyId"],
                    "entityId": m["entityId"],
                    "presentation": {
                        "title": m["city"],
                        "suggestionTitle": m["name"],
                        "subtitle": m["country"],
                    },
                    "navigation": {
                        "entityId": m["entityId"],
                        "localizedName": m["name"],
                        "relevantFlightParams": {
                            "skyId": m["skyId"],
                            "entityId": m["entityId"],
                            "localizedName": m["city"],
                        },
                    },
                }
                for m in matches
            ],
        }

    def _get_demo_flights(
        self,
        origin_sky_id: str,
        dest_sky_id: str,
        date: str,
        adults: int,
    ) -> Dict[str, Any]:
        multiplier = max(1, adults)
        demo_itineraries = [
            {
                "id": f"flight-indigo-{origin_sky_id}-{dest_sky_id}-6361",
                "airline": "IndiGo",
                "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/6E.png",
                "flight_number": "6E 6361",
                "price": 4250.0 * multiplier,
                "legs": [
                    {
                        "origin": {"name": f"{origin_sky_id} Airport", "displayCode": origin_sky_id},
                        "destination": {"name": f"{dest_sky_id} Airport", "displayCode": dest_sky_id},
                        "departure": f"{date}T06:45:00",
                        "arrival": f"{date}T08:05:00",
                        "durationInMinutes": 80,
                        "stopCount": 0,
                        "carriers": {"marketing": [{"name": "IndiGo"}]},
                    }
                ],
                "deeplink": f"https://www.google.com/travel/flights?q=Flights%20from%20{origin_sky_id}%20to%20{dest_sky_id}%20on%20{date}",
            },
            {
                "id": f"flight-akasa-{origin_sky_id}-{dest_sky_id}-1322",
                "airline": "Akasa Air",
                "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/QP.png",
                "flight_number": "QP 1322",
                "price": 3890.0 * multiplier,
                "legs": [
                    {
                        "origin": {"name": f"{origin_sky_id} Airport", "displayCode": origin_sky_id},
                        "destination": {"name": f"{dest_sky_id} Airport", "displayCode": dest_sky_id},
                        "departure": f"{date}T10:15:00",
                        "arrival": f"{date}T11:40:00",
                        "durationInMinutes": 85,
                        "stopCount": 0,
                        "carriers": {"marketing": [{"name": "Akasa Air"}]},
                    }
                ],
                "deeplink": f"https://www.google.com/travel/flights?q=Flights%20from%20{origin_sky_id}%20to%20{dest_sky_id}%20on%20{date}",
            },
            {
                "id": f"flight-airindia-{origin_sky_id}-{dest_sky_id}-655",
                "airline": "Air India",
                "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/AI.png",
                "flight_number": "AI 655",
                "price": 5120.0 * multiplier,
                "legs": [
                    {
                        "origin": {"name": f"{origin_sky_id} Airport", "displayCode": origin_sky_id},
                        "destination": {"name": f"{dest_sky_id} Airport", "displayCode": dest_sky_id},
                        "departure": f"{date}T14:30:00",
                        "arrival": f"{date}T15:55:00",
                        "durationInMinutes": 85,
                        "stopCount": 0,
                        "carriers": {"marketing": [{"name": "Air India"}]},
                    }
                ],
                "deeplink": f"https://www.google.com/travel/flights?q=Flights%20from%20{origin_sky_id}%20to%20{dest_sky_id}%20on%20{date}",
            },
            {
                "id": f"flight-vistara-{origin_sky_id}-{dest_sky_id}-810",
                "airline": "Vistara",
                "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/UK.png",
                "flight_number": "UK 810",
                "price": 6850.0 * multiplier,
                "legs": [
                    {
                        "origin": {"name": f"{origin_sky_id} Airport", "displayCode": origin_sky_id},
                        "destination": {"name": f"{dest_sky_id} Airport", "displayCode": dest_sky_id},
                        "departure": f"{date}T17:10:00",
                        "arrival": f"{date}T18:35:00",
                        "durationInMinutes": 85,
                        "stopCount": 0,
                        "carriers": {"marketing": [{"name": "Vistara"}]},
                    }
                ],
                "deeplink": f"https://www.google.com/travel/flights?q=Flights%20from%20{origin_sky_id}%20to%20{dest_sky_id}%20on%20{date}",
            },
            {
                "id": f"flight-spicejet-{origin_sky_id}-{dest_sky_id}-204",
                "airline": "SpiceJet",
                "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/SG.png",
                "flight_number": "SG 204",
                "price": 3499.0 * multiplier,
                "legs": [
                    {
                        "origin": {"name": f"{origin_sky_id} Airport", "displayCode": origin_sky_id},
                        "destination": {"name": f"{dest_sky_id} Airport", "displayCode": dest_sky_id},
                        "departure": f"{date}T20:25:00",
                        "arrival": f"{date}T21:45:00",
                        "durationInMinutes": 80,
                        "stopCount": 0,
                        "carriers": {"marketing": [{"name": "SpiceJet"}]},
                    }
                ],
                "deeplink": f"https://www.google.com/travel/flights?q=Flights%20from%20{origin_sky_id}%20to%20{dest_sky_id}%20on%20{date}",
            },
        ]
        return {"data": {"itineraries": demo_itineraries}}

    def _get_demo_hotel_destinations(self, query: str) -> Dict[str, Any]:
        """Provides realistic destination autosuggest matches."""
        q = query.strip().lower()

        curated = [
            {"entityId": "Goa, India", "entityName": "Goa (All Regions), India", "entityType": "Destination", "keywords": ["goa", "north goa", "south goa"]},
            {"entityId": "North Goa, India", "entityName": "North Goa (Calangute, Baga & Candolim)", "entityType": "Beach Resort", "keywords": ["goa", "north goa", "calangute", "baga", "candolim"]},
            {"entityId": "South Goa, India", "entityName": "South Goa (Colva, Benaulim & Palolem)", "entityType": "Beach Resort", "keywords": ["goa", "south goa", "benaulim", "palolem", "colva"]},
            {"entityId": "Panaji, Goa, India", "entityName": "Panaji (Capital & Fontainhas Heritage)", "entityType": "City", "keywords": ["goa", "panaji", "panjim"]},
            {"entityId": "Manali, Himachal Pradesh, India", "entityName": "Manali (Mall Road & Old Manali), Himachal Pradesh", "entityType": "Hill Station", "keywords": ["manali", "himachal", "old manali"]},
            {"entityId": "Solang Valley, Manali, India", "entityName": "Solang Valley & Rohtang, Manali", "entityType": "Adventure Valley", "keywords": ["manali", "solang", "rohtang"]},
            {"entityId": "Shimla, Himachal Pradesh, India", "entityName": "Shimla (The Ridge & Mall Road), Himachal Pradesh", "entityType": "Hill Station", "keywords": ["shimla", "himachal"]},
            {"entityId": "Jaipur, Rajasthan, India", "entityName": "Jaipur (Pink City & Hawa Mahal), Rajasthan", "entityType": "City", "keywords": ["jaipur", "rajasthan", "pink city"]},
            {"entityId": "Amer, Jaipur, Rajasthan, India", "entityName": "Amer & Kukas Heritage Palaces, Jaipur", "entityType": "Heritage", "keywords": ["jaipur", "amer", "amber"]},
            {"entityId": "Udaipur, Rajasthan, India", "entityName": "Udaipur (Lake Pichola & City Palace), Rajasthan", "entityType": "Lakeside", "keywords": ["udaipur", "pichola", "rajasthan"]},
            {"entityId": "South Mumbai, Maharashtra, India", "entityName": "South Mumbai (Colaba & Marine Drive), Maharashtra", "entityType": "City", "keywords": ["mumbai", "bombay", "colaba"]},
            {"entityId": "Bandra, Mumbai, Maharashtra, India", "entityName": "Bandra & Juhu Beachfront, Mumbai", "entityType": "Beach District", "keywords": ["mumbai", "juhu", "bandra"]},
            {"entityId": "Central Delhi, Delhi, India", "entityName": "Central Delhi (Connaught Place & India Gate)", "entityType": "Capital District", "keywords": ["delhi", "new delhi", "connaught"]},
            {"entityId": "Aerocity, New Delhi, India", "entityName": "Aerocity & IGI Airport, New Delhi", "entityType": "Transit Hub", "keywords": ["delhi", "aerocity", "igi airport"]},
            {"entityId": "Fort Kochi, Kerala, India", "entityName": "Fort Kochi & Marine Drive, Kerala", "entityType": "Port City", "keywords": ["kerala", "kochi", "cochin", "fort kochi"]},
            {"entityId": "Munnar, Kerala, India", "entityName": "Munnar (Tea Estates & Misty Hills), Kerala", "entityType": "Hill Station", "keywords": ["kerala", "munnar"]},
            {"entityId": "Alleppey, Kerala, India", "entityName": "Alleppey / Alappuzha Backwaters & Houseboats", "entityType": "Backwaters", "keywords": ["kerala", "alleppey", "alappuzha"]},
            {"entityId": "Bengaluru, Karnataka, India", "entityName": "Central Bengaluru (MG Road & Indiranagar), Karnataka", "entityType": "City", "keywords": ["bangalore", "bengaluru", "indiranagar"]},
            {"entityId": "Srinagar, Kashmir, India", "entityName": "Srinagar (Dal Lake & Mughal Gardens), Kashmir", "entityType": "Hill Station", "keywords": ["srinagar", "kashmir", "dal lake"]},
            {"entityId": "Leh, Ladakh, India", "entityName": "Leh (Pangong & Nubra Valley Gateway), Ladakh", "entityType": "Mountain Valley", "keywords": ["leh", "ladakh"]},
        ]

        matches = [
            item for item in curated
            if any(k in q or q in k for k in item["keywords"]) or q in item["entityName"].lower()
        ]
        if matches:
            return {"data": matches}

        return {
            "data": [
                {
                    "entityId": f"{query.title()}, India",
                    "entityName": f"{query.title()}, India",
                    "entityType": "Destination",
                }
            ]
        }

    def _get_demo_hotels(self, rooms: int, destination: Optional[str] = None) -> Dict[str, Any]:
        d = (destination or "goa").lower()
        multiplier = max(1, rooms)

        if "manali" in d:
            hotels = [
                {
                    "hotelId": "hotel-manali-himalayan",
                    "name": "The Himalayan Castle Resort & Spa",
                    "stars": 5.0,
                    "price": {"raw": 11800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"},
                    "location": "Hadimba Forest Sanctuary, Manali",
                    "reviewSummary": {"value": 4.8, "count": 1120},
                    "link": "https://www.google.com/travel/hotels/s/manali-himalayan",
                },
                {
                    "hotelId": "hotel-manali-solang",
                    "name": "Solang Valley Mountain Resort",
                    "stars": 4.5,
                    "price": {"raw": 8200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"},
                    "location": "Solang Valley Snow Point, Manali",
                    "reviewSummary": {"value": 4.7, "count": 890},
                    "link": "https://www.google.com/travel/hotels/s/manali-solang",
                },
                {
                    "hotelId": "hotel-manali-apple",
                    "name": "Apple Country Retreat & Spa",
                    "stars": 4.0,
                    "price": {"raw": 5400.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": "Log Huts Area, Old Manali",
                    "reviewSummary": {"value": 4.4, "count": 630},
                    "link": "https://www.google.com/travel/hotels/s/manali-apple",
                },
                {
                    "hotelId": "hotel-manali-snowvalley",
                    "name": "Snow Valley Resorts Manali",
                    "stars": 4.0,
                    "price": {"raw": 4600.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": "Circuit House Road, Manali",
                    "reviewSummary": {"value": 4.3, "count": 780},
                    "link": "https://www.google.com/travel/hotels/s/manali-snowvalley",
                },
                {
                    "hotelId": "hotel-manali-pine",
                    "name": "Pine Crest Boutique Wooden Cottages",
                    "stars": 3.5,
                    "price": {"raw": 3100.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": "Aleo Riverside, Manali",
                    "reviewSummary": {"value": 4.2, "count": 350},
                    "link": "https://www.google.com/travel/hotels/s/manali-pine",
                },
            ]
        elif "jaipur" in d or "rajasthan" in d:
            hotels = [
                {
                    "hotelId": "hotel-jaipur-rambagh",
                    "name": "Rambagh Palace by Taj",
                    "stars": 5.0,
                    "price": {"raw": 24500.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"},
                    "location": "Bhawani Singh Road, Jaipur",
                    "reviewSummary": {"value": 4.9, "count": 2150},
                    "link": "https://www.google.com/travel/hotels/s/jaipur-rambagh",
                },
                {
                    "hotelId": "hotel-jaipur-itc",
                    "name": "ITC Rajputana, Luxury Collection",
                    "stars": 5.0,
                    "price": {"raw": 13800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"},
                    "location": "Gopalbari, Station Road, Jaipur",
                    "reviewSummary": {"value": 4.7, "count": 1640},
                    "link": "https://www.google.com/travel/hotels/s/jaipur-itc",
                },
                {
                    "hotelId": "hotel-jaipur-trident",
                    "name": "Trident Jaipur (Jal Mahal View)",
                    "stars": 4.5,
                    "price": {"raw": 8900.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": "Amber Fort Road, Opposite Jal Mahal",
                    "reviewSummary": {"value": 4.6, "count": 990},
                    "link": "https://www.google.com/travel/hotels/s/jaipur-trident",
                },
                {
                    "hotelId": "hotel-jaipur-umaid",
                    "name": "Umaid Bhawan Heritage Palace",
                    "stars": 4.0,
                    "price": {"raw": 4900.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": "Bani Park, Jaipur",
                    "reviewSummary": {"value": 4.4, "count": 820},
                    "link": "https://www.google.com/travel/hotels/s/jaipur-umaid",
                },
                {
                    "hotelId": "hotel-jaipur-haveli",
                    "name": "Alsisar Haveli Boutique Stay",
                    "stars": 3.5,
                    "price": {"raw": 3400.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": "Sansar Chandra Road, Jaipur",
                    "reviewSummary": {"value": 4.3, "count": 460},
                    "link": "https://www.google.com/travel/hotels/s/jaipur-haveli",
                },
            ]
        elif "kerala" in d or "kochi" in d or "munnar" in d or "alleppey" in d:
            hotels = [
                {
                    "hotelId": "hotel-kerala-kumarakom",
                    "name": "Kumarakom Lake Resort",
                    "stars": 5.0,
                    "price": {"raw": 15800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"},
                    "location": "Vembanad Lake Shore, Kumarakom",
                    "reviewSummary": {"value": 4.9, "count": 1820},
                    "link": "https://www.google.com/travel/hotels/s/kerala-kumarakom",
                },
                {
                    "hotelId": "hotel-kerala-brunton",
                    "name": "Brunton Boatyard - CGH Earth",
                    "stars": 4.5,
                    "price": {"raw": 11500.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": "Fort Kochi Harbor, Kochi",
                    "reviewSummary": {"value": 4.7, "count": 940},
                    "link": "https://www.google.com/travel/hotels/s/kerala-brunton",
                },
                {
                    "hotelId": "hotel-kerala-spicetree",
                    "name": "Spice Tree Munnar Boutique Sanctuary",
                    "stars": 4.5,
                    "price": {"raw": 9200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"},
                    "location": "Munnar Tea Valley, Kerala",
                    "reviewSummary": {"value": 4.6, "count": 710},
                    "link": "https://www.google.com/travel/hotels/s/kerala-spicetree",
                },
                {
                    "hotelId": "hotel-kerala-coconut",
                    "name": "Coconut Lagoon Heritage Stays",
                    "stars": 4.0,
                    "price": {"raw": 6800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": "Kottayam Backwaters, Kerala",
                    "reviewSummary": {"value": 4.5, "count": 650},
                    "link": "https://www.google.com/travel/hotels/s/kerala-coconut",
                },
                {
                    "hotelId": "hotel-kerala-palms",
                    "name": "Emerald Palms Ayurvedic Beach Resort",
                    "stars": 3.5,
                    "price": {"raw": 3600.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": "Marari Beachfront, Kerala",
                    "reviewSummary": {"value": 4.2, "count": 420},
                    "link": "https://www.google.com/travel/hotels/s/kerala-palms",
                },
            ]
        elif "mumbai" in d or "bombay" in d:
            hotels = [
                {
                    "hotelId": "hotel-mumbai-taj",
                    "name": "The Taj Mahal Palace, Mumbai",
                    "stars": 5.0,
                    "price": {"raw": 26000.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"},
                    "location": "Apollo Bunder, Colaba, Mumbai",
                    "reviewSummary": {"value": 4.9, "count": 3200},
                    "link": "https://www.google.com/travel/hotels/s/mumbai-taj",
                },
                {
                    "hotelId": "hotel-mumbai-oberoi",
                    "name": "The Oberoi, Nariman Point",
                    "stars": 5.0,
                    "price": {"raw": 19500.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"},
                    "location": "Marine Drive, Nariman Point, Mumbai",
                    "reviewSummary": {"value": 4.8, "count": 2400},
                    "link": "https://www.google.com/travel/hotels/s/mumbai-oberoi",
                },
                {
                    "hotelId": "hotel-mumbai-jw",
                    "name": "JW Marriott Mumbai Juhu",
                    "stars": 5.0,
                    "price": {"raw": 14200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": "Juhu Tara Road, Juhu Beach, Mumbai",
                    "reviewSummary": {"value": 4.7, "count": 1850},
                    "link": "https://www.google.com/travel/hotels/s/mumbai-jw",
                },
                {
                    "hotelId": "hotel-mumbai-lemontree",
                    "name": "Lemon Tree Premier, Mumbai Airport",
                    "stars": 4.0,
                    "price": {"raw": 6800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": "Andheri East, Near International Airport",
                    "reviewSummary": {"value": 4.3, "count": 920},
                    "link": "https://www.google.com/travel/hotels/s/mumbai-lemon",
                },
                {
                    "hotelId": "hotel-mumbai-bloom",
                    "name": "Bloom Boutique Suites, Bandra",
                    "stars": 3.5,
                    "price": {"raw": 4200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": "Pali Hill, Bandra West, Mumbai",
                    "reviewSummary": {"value": 4.2, "count": 510},
                    "link": "https://www.google.com/travel/hotels/s/mumbai-bloom",
                },
            ]
        elif "delhi" in d:
            hotels = [
                {
                    "hotelId": "hotel-delhi-imperial",
                    "name": "The Imperial, Janpath New Delhi",
                    "stars": 5.0,
                    "price": {"raw": 18000.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"},
                    "location": "Janpath, Connaught Place, New Delhi",
                    "reviewSummary": {"value": 4.8, "count": 2100},
                    "link": "https://www.google.com/travel/hotels/s/delhi-imperial",
                },
                {
                    "hotelId": "hotel-delhi-leela",
                    "name": "The Leela Palace, Chanakyapuri",
                    "stars": 5.0,
                    "price": {"raw": 21500.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"},
                    "location": "Diplomatic Enclave, Chanakyapuri",
                    "reviewSummary": {"value": 4.9, "count": 1780},
                    "link": "https://www.google.com/travel/hotels/s/delhi-leela",
                },
                {
                    "hotelId": "hotel-delhi-itc",
                    "name": "ITC Maurya, Luxury Collection",
                    "stars": 5.0,
                    "price": {"raw": 14800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": "Sardar Patel Marg, New Delhi",
                    "reviewSummary": {"value": 4.7, "count": 2600},
                    "link": "https://www.google.com/travel/hotels/s/delhi-itc",
                },
                {
                    "hotelId": "hotel-delhi-radisson",
                    "name": "Radisson Blu Plaza, Delhi Airport",
                    "stars": 4.5,
                    "price": {"raw": 7200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": "National Highway 8, Mahipalpur",
                    "reviewSummary": {"value": 4.4, "count": 1340},
                    "link": "https://www.google.com/travel/hotels/s/delhi-radisson",
                },
                {
                    "hotelId": "hotel-delhi-bloom",
                    "name": "Bloomrooms @ Janpath",
                    "stars": 3.5,
                    "price": {"raw": 3800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": "Janpath Lane, Connaught Place",
                    "reviewSummary": {"value": 4.3, "count": 890},
                    "link": "https://www.google.com/travel/hotels/s/delhi-bloom",
                },
            ]
        elif "udaipur" in d:
            hotels = [
                {
                    "hotelId": "hotel-udaipur-oberoi",
                    "name": "The Oberoi Udaivilas, Lake Pichola",
                    "stars": 5.0,
                    "price": {"raw": 32000.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"},
                    "location": "Haridas Ji Ki Magri, Lake Pichola, Udaipur",
                    "reviewSummary": {"value": 4.9, "count": 2890},
                    "link": "https://www.google.com/travel/hotels/s/udaipur-oberoi",
                },
                {
                    "hotelId": "hotel-udaipur-tajlake",
                    "name": "Taj Lake Palace, Udaipur",
                    "stars": 5.0,
                    "price": {"raw": 28500.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"},
                    "location": "Island of Jag Niwas, Lake Pichola",
                    "reviewSummary": {"value": 4.9, "count": 3100},
                    "link": "https://www.google.com/travel/hotels/s/udaipur-tajlake",
                },
                {
                    "hotelId": "hotel-udaipur-leela",
                    "name": "The Leela Palace Udaipur",
                    "stars": 5.0,
                    "price": {"raw": 25000.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": "Lake Pichola, Udaipur",
                    "reviewSummary": {"value": 4.8, "count": 1950},
                    "link": "https://www.google.com/travel/hotels/s/udaipur-leela",
                },
                {
                    "hotelId": "hotel-udaipur-trident",
                    "name": "Trident Udaipur (Lakeside)",
                    "stars": 4.5,
                    "price": {"raw": 9500.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": "Haridas Ji Ki Magri, Mulla Talai",
                    "reviewSummary": {"value": 4.6, "count": 1120},
                    "link": "https://www.google.com/travel/hotels/s/udaipur-trident",
                },
                {
                    "hotelId": "hotel-udaipur-jagat",
                    "name": "Jagat Niwas Palace Heritage Stay",
                    "stars": 4.0,
                    "price": {"raw": 5200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": "Lal Ghat, Behind Jagdish Temple",
                    "reviewSummary": {"value": 4.4, "count": 670},
                    "link": "https://www.google.com/travel/hotels/s/udaipur-jagat",
                },
            ]
        else:
            dest_title = (destination or "Goa").title()
            hotels = [
                {
                    "hotelId": f"hotel-{dest_title.lower()}-taj",
                    "name": f"Taj Exotica Resort & Spa, {dest_title}",
                    "stars": 5.0,
                    "price": {"raw": 14500.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"},
                    "location": f"Benaulim Coast, {dest_title}",
                    "reviewSummary": {"value": 4.8, "count": 1420},
                    "link": f"https://www.google.com/travel/hotels/s/{dest_title.lower()}-taj",
                },
                {
                    "hotelId": f"hotel-{dest_title.lower()}-marriott",
                    "name": f"{dest_title} Marriott Resort & Spa",
                    "stars": 4.5,
                    "price": {"raw": 10800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": f"Miramar Promenade, {dest_title}",
                    "reviewSummary": {"value": 4.7, "count": 980},
                    "link": f"https://www.google.com/travel/hotels/s/{dest_title.lower()}-marriott",
                },
                {
                    "hotelId": f"hotel-{dest_title.lower()}-hyatt",
                    "name": f"Grand Hyatt & Villas, {dest_title}",
                    "stars": 5.0,
                    "price": {"raw": 16200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"},
                    "location": f"Waterfront Bay, {dest_title}",
                    "reviewSummary": {"value": 4.9, "count": 2100},
                    "link": f"https://www.google.com/travel/hotels/s/{dest_title.lower()}-hyatt",
                },
                {
                    "hotelId": f"hotel-{dest_title.lower()}-lemon-tree",
                    "name": f"Lemon Tree Premier, {dest_title}",
                    "stars": 4.0,
                    "price": {"raw": 5400.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": f"Central District, {dest_title}",
                    "reviewSummary": {"value": 4.3, "count": 640},
                    "link": f"https://www.google.com/travel/hotels/s/{dest_title.lower()}-lemon",
                },
                {
                    "hotelId": f"hotel-{dest_title.lower()}-bloom",
                    "name": f"Bloom Boutique Suites, {dest_title}",
                    "stars": 3.5,
                    "price": {"raw": 3200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": f"City Circle, {dest_title}",
                    "reviewSummary": {"value": 4.2, "count": 410},
                    "link": f"https://www.google.com/travel/hotels/s/{dest_title.lower()}-bloom",
                },
            ]
        return {"data": {"hotels": hotels}}

    async def search_airports(self, query: str) -> Any:
        """
        Resolves city/airport name to 3-letter IATA code and presentation object.
        Queries SerpApi google_flights_autocomplete if key is available, else matches known hubs.
        """
        if self.api_key:
            try:
                res = await self._request(
                    engine="google_flights_autocomplete",
                    params={"q": query, "hl": "en"},
                )
                if isinstance(res, dict) and "suggestions" in res:
                    suggestions = res["suggestions"]
                    if suggestions and isinstance(suggestions, list):
                        formatted = []
                        for s in suggestions:
                            code = s.get("id") or s.get("iata_code") or resolve_iata_code(s.get("name", query))
                            formatted.append({
                                "skyId": code,
                                "entityId": code,
                                "presentation": {
                                    "title": s.get("city") or s.get("name") or query.title(),
                                    "suggestionTitle": s.get("name") or f"{query.title()} Airport",
                                    "subtitle": s.get("country") or "India",
                                },
                                "navigation": {
                                    "entityId": code,
                                    "localizedName": s.get("name") or query.title(),
                                    "relevantFlightParams": {
                                        "skyId": code,
                                        "entityId": code,
                                        "localizedName": s.get("city") or query.title(),
                                    },
                                },
                            })
                        if formatted:
                            return {"status": True, "data": formatted}
            except Exception:
                pass

        return self._get_demo_airports(query)

    async def search_flights(
        self,
        origin_sky_id: str,
        dest_sky_id: str,
        origin_entity_id: str,
        dest_entity_id: str,
        date: str,
        return_date: Optional[str] = None,
        adults: int = 1,
        cabin_class: str = "economy",
        currency: str = "INR",
    ) -> Any:
        """
        Searches available flights between origin and destination.
        Calls SerpApi with engine=google_flights.
        Falls back gracefully to realistic demo itineraries if SerpApi key is unset or error occurs.
        """
        origin_iata = resolve_iata_code(origin_sky_id or origin_entity_id)
        dest_iata = resolve_iata_code(dest_sky_id or dest_entity_id)

        if self.api_key:
            try:
                params: Dict[str, Any] = {
                    "departure_id": origin_iata,
                    "arrival_id": dest_iata,
                    "outbound_date": date,
                    "currency": currency,
                    "adults": max(1, adults),
                    "hl": "en",
                    "gl": "in",
                }
                if return_date:
                    params["return_date"] = return_date
                    params["type"] = "1"  # Round trip
                else:
                    params["type"] = "2"  # One way

                class_map = {
                    "economy": "1",
                    "premium_economy": "2",
                    "business": "3",
                    "first": "4",
                }
                if cabin_class.lower() in class_map:
                    params["travel_class"] = class_map[cabin_class.lower()]

                serp_res = await self._request(
                    engine="google_flights",
                    params=params,
                )
                if (
                    isinstance(serp_res, dict)
                    and ("best_flights" in serp_res or "other_flights" in serp_res)
                ):
                    return serp_res
            except Exception:
                pass

        return self._get_demo_flights(origin_iata, dest_iata, date, adults)

    async def search_hotel_destination(self, query: str) -> Any:
        """
        Resolves a city/place name to hotel destination suggestions.
        """
        return self._get_demo_hotel_destinations(query)

    async def search_hotels(
        self,
        entity_id: str,
        check_in: str,
        check_out: str,
        adults: int = 1,
        rooms: int = 1,
        currency: str = "INR",
        destination: Optional[str] = None,
    ) -> Any:
        """
        Searches hotels for a given destination and date range.
        Calls SerpApi with engine=google_hotels.
        Falls back gracefully to realistic hotel options if key is unset or error occurs.
        """
        target_destination = destination or entity_id or "Goa"

        if self.api_key:
            try:
                params: Dict[str, Any] = {
                    "q": f"Hotels in {target_destination}",
                    "check_in_date": check_in,
                    "check_out_date": check_out,
                    "adults": max(1, adults),
                    "currency": currency,
                    "hl": "en",
                    "gl": "in",
                }
                serp_res = await self._request(
                    engine="google_hotels",
                    params=params,
                )
                if isinstance(serp_res, dict) and "properties" in serp_res:
                    return serp_res
            except Exception:
                pass

        return self._get_demo_hotels(rooms=rooms, destination=target_destination)


travel_search_client = TravelSearchClient()
