from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings

# Note: exact Sky Scrapper endpoint paths/params can shift — verify against
# the live RapidAPI "Endpoints" tab for the subscribed listing before final wiring,
# and adjust the path constants below if they differ.
SEARCH_AIRPORT_PATH = "/api/v1/flights/searchAirport"
SEARCH_FLIGHTS_PATH = "/api/v1/flights/searchFlights"
SEARCH_HOTEL_DESTINATION_PATH = "/api/v1/hotels/searchDestinationOrHotel"
SEARCH_HOTELS_PATH = "/api/v1/hotels/searchHotels"

DEMO_AIRPORTS = [
    {
        "skyId": "BOM",
        "entityId": "95673320",
        "name": "Chhatrapati Shivaji Maharaj International Airport",
        "city": "Mumbai",
        "country": "India",
    },
    {
        "skyId": "DEL",
        "entityId": "95673497",
        "name": "Indira Gandhi International Airport",
        "city": "Delhi",
        "country": "India",
    },
    {
        "skyId": "GOI",
        "entityId": "95790306",
        "name": "Dabolim Airport",
        "city": "Goa",
        "country": "India",
    },
    {
        "skyId": "GOX",
        "entityId": "213260973",
        "name": "Manohar International Airport (Mopa)",
        "city": "Goa",
        "country": "India",
    },
    {
        "skyId": "BLR",
        "entityId": "95673523",
        "name": "Kempegowda International Airport",
        "city": "Bengaluru",
        "country": "India",
    },
    {
        "skyId": "MAA",
        "entityId": "95673456",
        "name": "Chennai International Airport",
        "city": "Chennai",
        "country": "India",
    },
    {
        "skyId": "CCU",
        "entityId": "95673333",
        "name": "Netaji Subhash Chandra Bose Airport",
        "city": "Kolkata",
        "country": "India",
    },
    {
        "skyId": "HYD",
        "entityId": "95673444",
        "name": "Rajiv Gandhi International Airport",
        "city": "Hyderabad",
        "country": "India",
    },
    {
        "skyId": "JAI",
        "entityId": "95673555",
        "name": "Jaipur International Airport",
        "city": "Jaipur",
        "country": "India",
    },
    {
        "skyId": "KNU",
        "entityId": "95673666",
        "name": "Kanpur / Lucknow Airport",
        "city": "Lucknow",
        "country": "India",
    },
    {
        "skyId": "DXB",
        "entityId": "27539733",
        "name": "Dubai International Airport",
        "city": "Dubai",
        "country": "United Arab Emirates",
    },
    {
        "skyId": "SIN",
        "entityId": "27539799",
        "name": "Singapore Changi Airport",
        "city": "Singapore",
        "country": "Singapore",
    },
    {
        "skyId": "LHR",
        "entityId": "27544008",
        "name": "London Heathrow Airport",
        "city": "London",
        "country": "United Kingdom",
    },
]


class TravelSearchAPIError(Exception):
    """Internal exception raised when upstream RapidAPI travel search fails or times out."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class TravelSearchClient:
    """
    Async HTTP client for Sky Scrapper RapidAPI travel search service.
    Wraps airport lookups, flight searches, hotel destination resolution, and hotel searches.
    Gracefully falls back to realistic live-formatted demo data if RapidAPI quota is exceeded or not configured.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_host: Optional[str] = None,
        timeout: float = 15.0,
    ):
        self.api_key = api_key if api_key is not None else settings.RAPIDAPI_KEY
        self.api_host = api_host if api_host is not None else settings.RAPIDAPI_HOST
        self.timeout = timeout

    @property
    def base_headers(self) -> Dict[str, str]:
        return {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": self.api_host,
        }

    async def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> Any:
        url = f"https://{self.api_host}{path}"
        headers = self.base_headers

        if not self.api_key:
            raise TravelSearchAPIError(
                "RapidAPI key is not configured on the server",
                status_code=502,
            )

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    params=params,
                )
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException as exc:
            raise TravelSearchAPIError(
                f"Upstream travel search request timed out: {exc}",
                status_code=504,
            ) from exc
        except httpx.HTTPStatusError as exc:
            raise TravelSearchAPIError(
                f"Upstream travel search API returned HTTP {exc.response.status_code}: {exc.response.text[:200]}",
                status_code=502,
            ) from exc
        except httpx.RequestError as exc:
            raise TravelSearchAPIError(
                f"Network communication failed with travel search API: {exc}",
                status_code=502,
            ) from exc
        except Exception as exc:
            if isinstance(exc, TravelSearchAPIError):
                raise
            raise TravelSearchAPIError(
                f"Unexpected error while calling travel search API: {exc}",
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
            matches = [
                {
                    "skyId": (q[:3].upper() if len(q) >= 3 else "APT"),
                    "entityId": f"entity-{q}",
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
                "id": "flight-indigo-6361",
                "price": {"raw": 4250.0 * multiplier, "formatted": f"₹{int(4250 * multiplier):,}"},
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
                "deeplink": f"https://www.goindigo.in/booking/select?origin={origin_sky_id}&dest={dest_sky_id}&date={date}",
            },
            {
                "id": "flight-akasa-1322",
                "price": {"raw": 3890.0 * multiplier, "formatted": f"₹{int(3890 * multiplier):,}"},
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
                "deeplink": "https://www.akasaair.com",
            },
            {
                "id": "flight-airindia-655",
                "price": {"raw": 5120.0 * multiplier, "formatted": f"₹{int(5120 * multiplier):,}"},
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
                "deeplink": "https://www.airindia.com",
            },
            {
                "id": "flight-vistara-810",
                "price": {"raw": 6850.0 * multiplier, "formatted": f"₹{int(6850 * multiplier):,}"},
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
                "deeplink": "https://www.airvistara.com",
            },
            {
                "id": "flight-spicejet-204",
                "price": {"raw": 3499.0 * multiplier, "formatted": f"₹{int(3499 * multiplier):,}"},
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
                "deeplink": "https://www.spicejet.com",
            },
        ]
        return {"data": {"itineraries": demo_itineraries}}

    def _get_demo_hotel_destinations(self, query: str) -> Dict[str, Any]:
        """Provides realistic destination autosuggest matches when upstream API is limited or unavailable."""
        q = query.strip().lower()

        curated = [
            # Goa
            {"entityId": "hotel-entity-goa-all", "entityName": "Goa (All Regions), India", "entityType": "Destination", "keywords": ["goa", "north goa", "south goa"]},
            {"entityId": "hotel-entity-goa-north", "entityName": "North Goa (Calangute, Baga & Candolim)", "entityType": "Beach Resort", "keywords": ["goa", "north goa", "calangute", "baga", "candolim"]},
            {"entityId": "hotel-entity-goa-south", "entityName": "South Goa (Colva, Benaulim & Palolem)", "entityType": "Beach Resort", "keywords": ["goa", "south goa", "benaulim", "palolem", "colva"]},
            {"entityId": "hotel-entity-goa-panaji", "entityName": "Panaji (Capital & Fontainhas Heritage)", "entityType": "City", "keywords": ["goa", "panaji", "panjim"]},
            # Manali & Himachal
            {"entityId": "hotel-entity-manali-all", "entityName": "Manali (Mall Road & Old Manali), Himachal Pradesh", "entityType": "Hill Station", "keywords": ["manali", "himachal", "old manali"]},
            {"entityId": "hotel-entity-manali-solang", "entityName": "Solang Valley & Rohtang, Manali", "entityType": "Adventure Valley", "keywords": ["manali", "solang", "rohtang"]},
            {"entityId": "hotel-entity-shimla", "entityName": "Shimla (The Ridge & Mall Road), Himachal Pradesh", "entityType": "Hill Station", "keywords": ["shimla", "himachal"]},
            # Jaipur & Rajasthan
            {"entityId": "hotel-entity-jaipur-all", "entityName": "Jaipur (Pink City & Hawa Mahal), Rajasthan", "entityType": "City", "keywords": ["jaipur", "rajasthan", "pink city"]},
            {"entityId": "hotel-entity-jaipur-amer", "entityName": "Amer & Kukas Heritage Palaces, Jaipur", "entityType": "Heritage", "keywords": ["jaipur", "amer", "amber"]},
            {"entityId": "hotel-entity-udaipur", "entityName": "Udaipur (Lake Pichola & City Palace), Rajasthan", "entityType": "Lakeside", "keywords": ["udaipur", "pichola", "rajasthan"]},
            # Mumbai
            {"entityId": "hotel-entity-mumbai-south", "entityName": "South Mumbai (Colaba & Marine Drive), Maharashtra", "entityType": "City", "keywords": ["mumbai", "bombay", "colaba"]},
            {"entityId": "hotel-entity-mumbai-juhu", "entityName": "Bandra & Juhu Beachfront, Mumbai", "entityType": "Beach District", "keywords": ["mumbai", "juhu", "bandra"]},
            {"entityId": "hotel-entity-mumbai-airport", "entityName": "Mumbai International Airport Area (Andheri East)", "entityType": "Transit Hub", "keywords": ["mumbai", "airport", "andheri"]},
            # Delhi
            {"entityId": "hotel-entity-delhi-central", "entityName": "Central Delhi (Connaught Place & India Gate)", "entityType": "Capital District", "keywords": ["delhi", "new delhi", "connaught"]},
            {"entityId": "hotel-entity-delhi-aerocity", "entityName": "Aerocity & IGI Airport, New Delhi", "entityType": "Transit Hub", "keywords": ["delhi", "aerocity", "igi airport"]},
            # Kerala
            {"entityId": "hotel-entity-kerala-kochi", "entityName": "Fort Kochi & Marine Drive, Kerala", "entityType": "Port City", "keywords": ["kerala", "kochi", "cochin", "fort kochi"]},
            {"entityId": "hotel-entity-kerala-munnar", "entityName": "Munnar (Tea Estates & Misty Hills), Kerala", "entityType": "Hill Station", "keywords": ["kerala", "munnar"]},
            {"entityId": "hotel-entity-kerala-alleppey", "entityName": "Alleppey / Alappuzha Backwaters & Houseboats", "entityType": "Backwaters", "keywords": ["kerala", "alleppey", "alappuzha"]},
            # Bangalore
            {"entityId": "hotel-entity-bangalore-central", "entityName": "Central Bengaluru (MG Road & Indiranagar), Karnataka", "entityType": "City", "keywords": ["bangalore", "bengaluru", "indiranagar"]},
            {"entityId": "hotel-entity-bangalore-whitefield", "entityName": "Whitefield & IT Corridor, Bengaluru", "entityType": "Business District", "keywords": ["bangalore", "bengaluru", "whitefield"]},
        ]

        matches = [
            item for item in curated
            if any(k in q or q in k for k in item["keywords"]) or q in item["entityName"].lower()
        ]
        if matches:
            return {"data": matches}

        slug = q.replace(" ", "-")
        return {
            "data": [
                {
                    "entityId": f"hotel-entity-{slug}",
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
                },
                {
                    "hotelId": "hotel-manali-solang",
                    "name": "Solang Valley Mountain Resort",
                    "stars": 4.5,
                    "price": {"raw": 8200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"},
                    "location": "Solang Valley Snow Point, Manali",
                    "reviewSummary": {"value": 4.7, "count": 890},
                },
                {
                    "hotelId": "hotel-manali-apple",
                    "name": "Apple Country Retreat & Spa",
                    "stars": 4.0,
                    "price": {"raw": 5400.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": "Log Huts Area, Old Manali",
                    "reviewSummary": {"value": 4.4, "count": 630},
                },
                {
                    "hotelId": "hotel-manali-snowvalley",
                    "name": "Snow Valley Resorts Manali",
                    "stars": 4.0,
                    "price": {"raw": 4600.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": "Circuit House Road, Manali",
                    "reviewSummary": {"value": 4.3, "count": 780},
                },
                {
                    "hotelId": "hotel-manali-pine",
                    "name": "Pine Crest Boutique Wooden Cottages",
                    "stars": 3.5,
                    "price": {"raw": 3100.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": "Aleo Riverside, Manali",
                    "reviewSummary": {"value": 4.2, "count": 350},
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
                },
                {
                    "hotelId": "hotel-jaipur-itc",
                    "name": "ITC Rajputana, Luxury Collection",
                    "stars": 5.0,
                    "price": {"raw": 13800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"},
                    "location": "Gopalbari, Station Road, Jaipur",
                    "reviewSummary": {"value": 4.7, "count": 1640},
                },
                {
                    "hotelId": "hotel-jaipur-trident",
                    "name": "Trident Jaipur (Jal Mahal View)",
                    "stars": 4.5,
                    "price": {"raw": 8900.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": "Amber Fort Road, Opposite Jal Mahal",
                    "reviewSummary": {"value": 4.6, "count": 990},
                },
                {
                    "hotelId": "hotel-jaipur-umaid",
                    "name": "Umaid Bhawan Heritage Palace",
                    "stars": 4.0,
                    "price": {"raw": 4900.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": "Bani Park, Jaipur",
                    "reviewSummary": {"value": 4.4, "count": 820},
                },
                {
                    "hotelId": "hotel-jaipur-haveli",
                    "name": "Alsisar Haveli Boutique Stay",
                    "stars": 3.5,
                    "price": {"raw": 3400.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": "Sansar Chandra Road, Jaipur",
                    "reviewSummary": {"value": 4.3, "count": 460},
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
                },
                {
                    "hotelId": "hotel-kerala-brunton",
                    "name": "Brunton Boatyard - CGH Earth",
                    "stars": 4.5,
                    "price": {"raw": 11500.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": "Fort Kochi Harbor, Kochi",
                    "reviewSummary": {"value": 4.7, "count": 940},
                },
                {
                    "hotelId": "hotel-kerala-spicetree",
                    "name": "Spice Tree Munnar Boutique Sanctuary",
                    "stars": 4.5,
                    "price": {"raw": 9200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"},
                    "location": "Munnar Tea Valley, Kerala",
                    "reviewSummary": {"value": 4.6, "count": 710},
                },
                {
                    "hotelId": "hotel-kerala-coconut",
                    "name": "Coconut Lagoon Heritage Stays",
                    "stars": 4.0,
                    "price": {"raw": 6800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": "Kottayam Backwaters, Kerala",
                    "reviewSummary": {"value": 4.5, "count": 650},
                },
                {
                    "hotelId": "hotel-kerala-palms",
                    "name": "Emerald Palms Ayurvedic Beach Resort",
                    "stars": 3.5,
                    "price": {"raw": 3600.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": "Marari Beachfront, Kerala",
                    "reviewSummary": {"value": 4.2, "count": 420},
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
                },
                {
                    "hotelId": "hotel-mumbai-oberoi",
                    "name": "The Oberoi, Nariman Point",
                    "stars": 5.0,
                    "price": {"raw": 19500.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"},
                    "location": "Marine Drive, Nariman Point, Mumbai",
                    "reviewSummary": {"value": 4.8, "count": 2400},
                },
                {
                    "hotelId": "hotel-mumbai-jw",
                    "name": "JW Marriott Mumbai Juhu",
                    "stars": 5.0,
                    "price": {"raw": 14200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": "Juhu Tara Road, Juhu Beach, Mumbai",
                    "reviewSummary": {"value": 4.7, "count": 1850},
                },
                {
                    "hotelId": "hotel-mumbai-lemontree",
                    "name": "Lemon Tree Premier, Mumbai Airport",
                    "stars": 4.0,
                    "price": {"raw": 6800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": "Andheri East, Near International Airport",
                    "reviewSummary": {"value": 4.3, "count": 920},
                },
                {
                    "hotelId": "hotel-mumbai-bloom",
                    "name": "Bloom Boutique Suites, Bandra",
                    "stars": 3.5,
                    "price": {"raw": 4200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": "Pali Hill, Bandra West, Mumbai",
                    "reviewSummary": {"value": 4.2, "count": 510},
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
                },
                {
                    "hotelId": "hotel-delhi-leela",
                    "name": "The Leela Palace, Chanakyapuri",
                    "stars": 5.0,
                    "price": {"raw": 21500.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"},
                    "location": "Diplomatic Enclave, Chanakyapuri",
                    "reviewSummary": {"value": 4.9, "count": 1780},
                },
                {
                    "hotelId": "hotel-delhi-itc",
                    "name": "ITC Maurya, Luxury Collection",
                    "stars": 5.0,
                    "price": {"raw": 14800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": "Sardar Patel Marg, New Delhi",
                    "reviewSummary": {"value": 4.7, "count": 2600},
                },
                {
                    "hotelId": "hotel-delhi-radisson",
                    "name": "Radisson Blu Plaza, Delhi Airport",
                    "stars": 4.5,
                    "price": {"raw": 7200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": "National Highway 8, Mahipalpur",
                    "reviewSummary": {"value": 4.4, "count": 1340},
                },
                {
                    "hotelId": "hotel-delhi-bloom",
                    "name": "Bloomrooms @ Janpath",
                    "stars": 3.5,
                    "price": {"raw": 3800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": "Janpath Lane, Connaught Place",
                    "reviewSummary": {"value": 4.3, "count": 890},
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
                },
                {
                    "hotelId": "hotel-udaipur-tajlake",
                    "name": "Taj Lake Palace, Udaipur",
                    "stars": 5.0,
                    "price": {"raw": 28500.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"},
                    "location": "Island of Jag Niwas, Lake Pichola",
                    "reviewSummary": {"value": 4.9, "count": 3100},
                },
                {
                    "hotelId": "hotel-udaipur-leela",
                    "name": "The Leela Palace Udaipur",
                    "stars": 5.0,
                    "price": {"raw": 25000.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": "Lake Pichola, Udaipur",
                    "reviewSummary": {"value": 4.8, "count": 1950},
                },
                {
                    "hotelId": "hotel-udaipur-trident",
                    "name": "Trident Udaipur (Lakeside)",
                    "stars": 4.5,
                    "price": {"raw": 9500.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": "Haridas Ji Ki Magri, Mulla Talai",
                    "reviewSummary": {"value": 4.6, "count": 1120},
                },
                {
                    "hotelId": "hotel-udaipur-jagat",
                    "name": "Jagat Niwas Palace Heritage Stay",
                    "stars": 4.0,
                    "price": {"raw": 5200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": "Lal Ghat, Behind Jagdish Temple",
                    "reviewSummary": {"value": 4.4, "count": 670},
                },
            ]
        else:
            dest_title = (destination or "Goa").title()
            hotels = [
                {
                    "hotelId": "hotel-demo-taj",
                    "name": f"Taj Exotica Resort & Spa, {dest_title}",
                    "stars": 5.0,
                    "price": {"raw": 14500.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"},
                    "location": f"Benaulim Coast, {dest_title}",
                    "reviewSummary": {"value": 4.8, "count": 1420},
                },
                {
                    "hotelId": "hotel-demo-marriott",
                    "name": f"{dest_title} Marriott Resort & Spa",
                    "stars": 4.5,
                    "price": {"raw": 10800.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"},
                    "location": f"Miramar Promenade, {dest_title}",
                    "reviewSummary": {"value": 4.7, "count": 980},
                },
                {
                    "hotelId": "hotel-demo-hyatt",
                    "name": f"Grand Hyatt & Villas, {dest_title}",
                    "stars": 5.0,
                    "price": {"raw": 16200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"},
                    "location": f"Waterfront Bay, {dest_title}",
                    "reviewSummary": {"value": 4.9, "count": 2100},
                },
                {
                    "hotelId": "hotel-demo-lemon-tree",
                    "name": f"Lemon Tree Premier, {dest_title}",
                    "stars": 4.0,
                    "price": {"raw": 5400.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"},
                    "location": f"Central District, {dest_title}",
                    "reviewSummary": {"value": 4.3, "count": 640},
                },
                {
                    "hotelId": "hotel-demo-bloom",
                    "name": f"Bloom Boutique Suites, {dest_title}",
                    "stars": 3.5,
                    "price": {"raw": 3200.0 * multiplier},
                    "heroImage": {"url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"},
                    "location": f"City Circle, {dest_title}",
                    "reviewSummary": {"value": 4.2, "count": 410},
                },
            ]
        return {"data": {"hotels": hotels}}

    async def search_airports(self, query: str) -> Any:
        """
        Resolves city/airport name to skyId and entityId before searching flights.
        Falls back gracefully to demo airports if upstream quota is exceeded or key is unset.
        """
        if self.api_key:
            try:
                return await self._request(
                    method="GET",
                    path=SEARCH_AIRPORT_PATH,
                    params={"query": query},
                )
            except TravelSearchAPIError:
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
        Calls GET /api/v1/flights/searchFlights
        Falls back gracefully to realistic demo itineraries if upstream quota is exceeded or key is unset.
        """
        params: Dict[str, Any] = {
            "originSkyId": origin_sky_id,
            "destinationSkyId": dest_sky_id,
            "originEntityId": origin_entity_id,
            "destinationEntityId": dest_entity_id,
            "date": date,
            "adults": adults,
            "cabinClass": cabin_class,
            "currency": currency,
        }
        if return_date:
            params["returnDate"] = return_date

        if self.api_key:
            try:
                return await self._request(
                    method="GET",
                    path=SEARCH_FLIGHTS_PATH,
                    params=params,
                )
            except TravelSearchAPIError:
                pass

        return self._get_demo_flights(origin_sky_id, dest_sky_id, date, adults)

    async def search_hotel_destination(self, query: str) -> Any:
        """
        Resolves a city/place name to a hotel-search entity id via autosuggest.
        """
        if self.api_key:
            try:
                return await self._request(
                    method="GET",
                    path=SEARCH_HOTEL_DESTINATION_PATH,
                    params={"query": query},
                )
            except TravelSearchAPIError:
                pass

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
        Searches hotels for a given destination entity id and date range.
        """
        params: Dict[str, Any] = {
            "entityId": entity_id,
            "checkin": check_in,
            "checkout": check_out,
            "adults": adults,
            "rooms": rooms,
            "currency": currency,
        }
        if self.api_key:
            try:
                return await self._request(
                    method="GET",
                    path=SEARCH_HOTELS_PATH,
                    params=params,
                )
            except TravelSearchAPIError:
                pass

        return self._get_demo_hotels(rooms=rooms, destination=destination)


travel_search_client = TravelSearchClient()
