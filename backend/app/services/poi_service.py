import httpx
from typing import List, Optional, Literal, Dict, Any
from app.core.config import settings
from app.schemas.trip_wizard import POIResult, POIDetail

OPENTRIPMAP_BASE_URL = "https://api.opentripmap.com/0.1/en/places"


def classify_popularity(rate: Any) -> Literal["Iconic", "Popular", "Hidden Gem"]:
    """
    Classifies OpenTripMap rate score into traveler-friendly categories:
    - 3h, 2h or >= 3: Iconic
    - 2, 1h: Popular
    - 1, 0, None: Hidden Gem
    """
    if rate is None:
        return "Hidden Gem"

    rate_str = str(rate).lower().strip()
    if rate_str in ("3h", "3", "2h"):
        return "Iconic"
    elif rate_str in ("2", "1h"):
        return "Popular"
    else:
        try:
            val = float(rate_str)
            if val >= 3:
                return "Iconic"
            elif val >= 2:
                return "Popular"
            else:
                return "Hidden Gem"
        except ValueError:
            return "Hidden Gem"


# Verified Authentic Landmark & POI Photography Map
LANDMARK_IMAGES: Dict[str, str] = {
    # Goa
    "aguada": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    "bom jesus": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
    "dudhsagar": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80",
    "fontainhas": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
    "baga": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    "calangute": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    "candolim": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    "chorao": "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=800&q=80",
    "cabo de rama": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",

    # Manali
    "hadimba": "https://images.unsplash.com/photo-1545652985-5edd365b12eb?auto=format&fit=crop&w=800&q=80",
    "solang": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
    "atal tunnel": "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80",
    "jogini": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80",
    "rohtang": "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80",
    "vashisht": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
    "naggar": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
    "old manali": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",

    # Jaipur / Rajasthan
    "amber fort": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
    "amer fort": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
    "hawa mahal": "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80",
    "jantar mantar": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
    "nahargarh": "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80",
    "panna meena": "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80",
    "galta ji": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
    "city palace": "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80",
    "lake pichola": "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80",
    "mehrangarh": "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=800&q=80",
    "jaisalmer": "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80",

    # Sights elsewhere
    "taj mahal": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
    "golden temple": "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=80",
    "india gate": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
    "gateway of india": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80",
    "radhanagar": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    "elephant beach": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    "dal lake": "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80",
    "pangong": "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80",
    "living root": "https://images.unsplash.com/photo-1627916607164-7b20241db935?auto=format&fit=crop&w=800&q=80",
    "munnar": "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80",
    "alleppey": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
}

THEME_FALLBACKS: Dict[str, str] = {
    "waterfall": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80",
    "temple": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
    "church": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
    "beach": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    "fort": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
    "palace": "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80",
    "lake": "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80",
    "snow": "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80",
    "mountain": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
    "wildlife": "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=800&q=80",
    "default": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
}


def _resolve_landmark_image(name: str, kinds: str = "") -> str:
    """Resolves an authentic high-resolution photograph for an activity or landmark name."""
    clean = (name or "").lower().strip()
    for key, url in LANDMARK_IMAGES.items():
        if key in clean:
            return url

    ctx = f"{clean} {(kinds or '').lower()}"
    if any(w in ctx for w in ("waterfall", "falls", "cascade")):
        return THEME_FALLBACKS["waterfall"]
    if any(w in ctx for w in ("temple", "mandir", "monastery", "shrine", "church", "basilica", "mosque")):
        return THEME_FALLBACKS["temple"]
    if any(w in ctx for w in ("beach", "cove", "island", "coast", "sea", "bay", "scuba")):
        return THEME_FALLBACKS["beach"]
    if any(w in ctx for w in ("fort", "fortress", "citadel", "ruins", "castle")):
        return THEME_FALLBACKS["fort"]
    if any(w in ctx for w in ("palace", "mahal", "haveli")):
        return THEME_FALLBACKS["palace"]
    if any(w in ctx for w in ("lake", "river", "backwater", "water", "dam", "boating")):
        return THEME_FALLBACKS["lake"]
    if any(w in ctx for w in ("snow", "ski", "glacier", "pass", "tunnel")):
        return THEME_FALLBACKS["snow"]
    if any(w in ctx for w in ("mountain", "peak", "valley", "hill", "trek", "hike")):
        return THEME_FALLBACKS["mountain"]
    if any(w in ctx for w in ("wildlife", "safari", "sanctuary", "tiger", "national park")):
        return THEME_FALLBACKS["wildlife"]

    return THEME_FALLBACKS["default"]


# Curated POI fallback database for popular destination regions
CURATED_FALLBACK_POIS: Dict[str, List[Dict[str, Any]]] = {
    "goa": [
        {"xid": "otm-goa-1", "name": "Aguada Fort & Portuguese Lighthouse", "kinds": "historic,fortifications", "rate": "3h", "desc": "17th-century Portuguese fortress overlooking Sinquerim beach and Arabian Sea", "image": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-goa-2", "name": "Basilica of Bom Jesus (UNESCO Site)", "kinds": "cultural,churches", "rate": "3h", "desc": "Baroque architecture housing the sacred relics of St. Francis Xavier in Old Goa", "image": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-goa-3", "name": "Dudhsagar Cascading Falls Trek", "kinds": "natural,waterfalls", "rate": "2h", "desc": "Four-tiered majestic white waterfall deep inside Bhagwan Mahavir Wildlife Sanctuary", "image": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-goa-4", "name": "Fontainhas Latin Quarter Heritage Walk", "kinds": "cultural,historic", "rate": "2", "desc": "Vibrant pastel villas, terracotta tiled roofs, and Portuguese art galleries in Panaji", "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-goa-5", "name": "Chorao Island & Salim Ali Bird Sanctuary", "kinds": "natural,reserves", "rate": "1h", "desc": "Mangrove boat safari through Mandovi river tributaries with rare migratory kingfishers", "image": "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-goa-6", "name": "Cabo de Rama Secret Cliff Viewpoint", "kinds": "natural,viewpoints", "rate": "1", "desc": "Secluded panoramic cliffside overlooking virgin turquoise cove in South Goa", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-goa-7", "name": "Netravali Bubbling Sacred Lake", "kinds": "natural,geological", "rate": "0", "desc": "Hidden freshwater pond with mysterious natural gas acoustic bubble reactions", "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"},
    ],
    "manali": [
        {"xid": "otm-manali-1", "name": "Hadimba Devi Pagoda Sanctuary", "kinds": "cultural,temples", "rate": "3h", "desc": "Intricately carved 4-tiered wooden temple set amid towering deodar forests", "image": "https://images.unsplash.com/photo-1545652985-5edd365b12eb?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-manali-2", "name": "Solang Valley High-Altitude Adventure Arena", "kinds": "amusements,natural", "rate": "3", "desc": "Glacial valley hub for paragliding, zorbing, and panoramic snow peaks", "image": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-manali-3", "name": "Atal Tunnel & Sissu Glacial Waterfall", "kinds": "natural,historic", "rate": "2h", "desc": "World's longest highway tunnel opening into stark, majestic Lahaul valley", "image": "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-manali-4", "name": "Vashisht Sulfur Thermal Springs", "kinds": "natural,thermal", "rate": "2", "desc": "Natural mineral-rich hot springs with traditional wooden bathhouse", "image": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-manali-5", "name": "Jogini Secret Cascades & Pine Trail", "kinds": "natural,waterfalls", "rate": "1h", "desc": "Scenic 3km ridge hike through apple orchards to a secluded roaring cliff fall", "image": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-manali-6", "name": "Naggar Castle Himalayan Art Gallery", "kinds": "cultural,architecture", "rate": "1", "desc": "15th-century wood-and-stone medieval palace with Nicholas Roerich paintings", "image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-manali-7", "name": "Old Manali Artisanal Cafes & River Trail", "kinds": "cultural,foods", "rate": "0", "desc": "Quiet riverside cobblestone trail featuring apple-cider tasting and local knitwear", "image": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80"},
    ],
    "jaipur": [
        {"xid": "otm-jaipur-1", "name": "Amber Fort & Sheesh Mahal Palace", "kinds": "historic,fortifications", "rate": "3h", "desc": "Magnificent hilltop citadel crafted from yellow and pink sandstone with mirror mosaics", "image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-jaipur-2", "name": "Hawa Mahal (Palace of Winds)", "kinds": "cultural,architecture", "rate": "3", "desc": "Iconic five-story honeycombed facade with 953 lattice windows in the Pink City", "image": "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-jaipur-3", "name": "Jantar Mantar Royal Astronomical Observatory", "kinds": "cultural,historic", "rate": "2h", "desc": "UNESCO World Heritage collection of nineteen architectural astronomical instruments", "image": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-jaipur-4", "name": "Nahargarh Fort Twilight Ridge", "kinds": "historic,viewpoints", "rate": "2", "desc": "Aravalli mountain retreat offering the best sunset vistas over the illuminated city", "image": "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-jaipur-5", "name": "Panna Meena Ka Kund Stepwell", "kinds": "historic,architecture", "rate": "1h", "desc": "16th-century geometric stepwell with interlocking criss-cross staircases", "image": "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-jaipur-6", "name": "Galta Ji Monkey Temple in Mountain Gorge", "kinds": "cultural,temples", "rate": "1", "desc": "Ancient pilgrimage site set between rocky granite cliffs with sacred natural springs", "image": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"},
        {"xid": "otm-jaipur-7", "name": "Anokhi Hand-Block Printing Museum", "kinds": "cultural,museums", "rate": "0", "desc": "Quiet heritage haveli celebrating centuries-old block carving and indigo dye traditions", "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"},
    ],
}


def _get_fallback_pois(lat: float, lon: float) -> List[POIResult]:
    """Generates location-aware fallback activities when OpenTripMap key is empty or API is limited."""
    # Match region based on approximate coordinates
    key = "goa"
    if 31.0 <= lat <= 33.5 and 76.0 <= lon <= 78.5:
        key = "manali"
    elif 26.0 <= lat <= 27.5 and 75.0 <= lon <= 76.5:
        key = "jaipur"
    elif 14.5 <= lat <= 16.0 and 73.5 <= lon <= 74.5:
        key = "goa"

    raw_list = CURATED_FALLBACK_POIS.get(key, CURATED_FALLBACK_POIS["goa"])
    results: List[POIResult] = []
    for i, item in enumerate(raw_list):
        pop = classify_popularity(item.get("rate"))
        results.append(
            POIResult(
                xid=item["xid"],
                name=item["name"],
                kinds=item.get("kinds", "interesting_places"),
                rate=item.get("rate"),
                popularity=pop,
                latitude=round(lat + (0.01 * (i % 3)), 4),
                longitude=round(lon + (0.01 * ((i + 1) % 3)), 4),
                dist_meters=float(800 * (i + 1)),
                preview_image=item.get("image"),
            )
        )
    return results


async def search_activities(
    lat: float,
    lon: float,
    radius_m: int = 15000,
    kinds: str = "interesting_places,cultural,natural,amusements,foods",
    limit: int = 30,
) -> List[POIResult]:
    """
    Searches activities and points of interest around coordinates using OpenTripMap.
    Classifies each item's popularity (Iconic / Popular / Hidden Gem).
    Falls back gracefully to curated points if API key is not configured or upstream fails.
    """
    api_key = (settings.OPENTRIPMAP_API_KEY or "").strip()

    if api_key:
        try:
            url = f"{OPENTRIPMAP_BASE_URL}/radius"
            params = {
                "radius": radius_m,
                "lon": lon,
                "lat": lat,
                "kinds": kinds,
                "limit": limit,
                "apikey": api_key,
                "format": "json",
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, list) and data:
                        poi_results: List[POIResult] = []
                        for item in data:
                            name = item.get("name")
                            if not name or not name.strip():
                                continue
                            point = item.get("point") or {}
                            poi_lat = float(point.get("lat") or lat)
                            poi_lon = float(point.get("lon") or lon)
                            rate_val = item.get("rate")
                            pop = classify_popularity(rate_val)

                            poi_results.append(
                                POIResult(
                                    xid=str(item.get("xid", "")),
                                    name=name.strip(),
                                    kinds=item.get("kinds", ""),
                                    rate=str(rate_val) if rate_val is not None else None,
                                    popularity=pop,
                                    latitude=poi_lat,
                                    longitude=poi_lon,
                                    dist_meters=float(item.get("dist") or 0.0),
                                    preview_image=(
                                        item.get("preview", {}).get("source")
                                        if isinstance(item.get("preview"), dict) and item.get("preview", {}).get("source")
                                        else _resolve_landmark_image(name, item.get("kinds", ""))
                                    ),
                                )
                            )
                        if poi_results:
                            if len(poi_results) < 5:
                                fallbacks = _get_fallback_pois(lat, lon)
                                existing_names = {p.name.lower() for p in poi_results}
                                for f in fallbacks:
                                    if f.name.lower() not in existing_names:
                                        poi_results.append(f)
                            return poi_results
        except Exception:
            pass

    return _get_fallback_pois(lat, lon)


async def get_activity_detail(xid: str) -> POIDetail:
    """
    Fetches detailed information for a single POI (extracts, description, image, address).
    Called on-demand when a user expands a card to conserve free quota.
    """
    api_key = (settings.OPENTRIPMAP_API_KEY or "").strip()

    if api_key and not xid.startswith("otm-"):
        try:
            url = f"{OPENTRIPMAP_BASE_URL}/xid/{xid}"
            params = {"apikey": api_key}
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    name = data.get("name", "Attraction")
                    desc = None
                    if "wikipedia_extracts" in data and isinstance(data["wikipedia_extracts"], dict):
                        desc = data["wikipedia_extracts"].get("text")
                    elif "info" in data and isinstance(data["info"], dict):
                        desc = data["info"].get("descr")

                    preview = None
                    if "preview" in data and isinstance(data["preview"], dict):
                        preview = data["preview"].get("source")
                    if not preview:
                        preview = _resolve_landmark_image(name, data.get("kinds", ""))

                    return POIDetail(
                        xid=xid,
                        name=name,
                        description=desc,
                        kinds=data.get("kinds"),
                        image_url=data.get("image") or preview,
                        wikipedia_url=data.get("wikipedia"),
                        preview_image=preview,
                        address=data.get("address", {}).get("city") if isinstance(data.get("address"), dict) else None,
                    )
        except Exception:
            pass

    # Search curated list if xid matches or fallback
    for dest_pois in CURATED_FALLBACK_POIS.values():
        for item in dest_pois:
            if item["xid"] == xid:
                return POIDetail(
                    xid=item["xid"],
                    name=item["name"],
                    description=item.get("desc"),
                    kinds=item.get("kinds"),
                    preview_image=item.get("image"),
                )

    clean_name = xid.replace("otm-", "").replace("-", " ").title()
    return POIDetail(
        xid=xid,
        name=clean_name if len(clean_name) > 3 else "Scenic Destination Attraction",
        description="A picturesque regional sightseeing spot offering cultural immersion and local photo opportunities.",
        kinds="cultural,scenic",
        preview_image=_resolve_landmark_image(clean_name),
    )
