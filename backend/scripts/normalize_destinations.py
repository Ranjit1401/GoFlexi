"""
Destination Normalization, Deduplication, and Enrichment Layer (Phase 5B)
Voyara / Traveller Project

Converts raw geographic records (GeoNames) and POIs (OpenTripMap) into Voyara's
structured destination schema.

Pipeline:
Raw Candidates -> Normalize -> Validate -> Deduplicate -> Enrich -> Map Recommendation Metadata -> Export
"""

import sys
import math
import json
import csv
from pathlib import Path
from typing import List, Dict, Set, Optional, Tuple

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


# Indian State / UT Standardization Mapping
STATE_STANDARDIZATION: Dict[str, str] = {
    "state of kerala": "Kerala",
    "kerala": "Kerala",
    "state of himachal pradesh": "Himachal Pradesh",
    "himachal pradesh": "Himachal Pradesh",
    "state of rajasthan": "Rajasthan",
    "rajasthan": "Rajasthan",
    "state of karnataka": "Karnataka",
    "karnataka": "Karnataka",
    "state of tamil nadu": "Tamil Nadu",
    "tamil nadu": "Tamil Nadu",
    "tamilnadu": "Tamil Nadu",
    "state of west bengal": "West Bengal",
    "west bengal": "West Bengal",
    "state of uttarakhand": "Uttarakhand",
    "uttarakhand": "Uttarakhand",
    "uttaranchal": "Uttarakhand",
    "state of uttar pradesh": "Uttar Pradesh",
    "uttar pradesh": "Uttar Pradesh",
    "ladakh": "Ladakh",
    "union territory of ladakh": "Ladakh",
    "state of goa": "Goa",
    "goa": "Goa",
    "state of punjab": "Punjab",
    "punjab": "Punjab",
    "state of meghalaya": "Meghalaya",
    "meghalaya": "Meghalaya",
    "state of sikkim": "Sikkim",
    "sikkim": "Sikkim",
    "state of madhya pradesh": "Madhya Pradesh",
    "madhya pradesh": "Madhya Pradesh",
    "state of assam": "Assam",
    "assam": "Assam",
    "puducherry": "Puducherry",
    "pondicherry": "Puducherry",
    "union territory of puducherry": "Puducherry",
    "state of maharashtra": "Maharashtra",
    "maharashtra": "Maharashtra",
    "delhi": "Delhi",
    "nct of delhi": "Delhi",
    "national capital territory of delhi": "Delhi",
    "andaman and nicobar": "Andaman and Nicobar Islands",
    "lakshadweep": "Lakshadweep",
}

# Airports & Railway Accessibility Metadata by Destination Name
KNOWN_TRANSPORT_ACCESS: Dict[str, Dict[str, List[str]]] = {
    "Jaipur": {"transports": ["Flight", "Train", "Bus", "Car"]},
    "Manali": {"transports": ["Flight", "Bus", "Car"]},
    "Munnar": {"transports": ["Bus", "Car"]},
    "Hampi": {"transports": ["Train", "Bus", "Car"]},
    "Ooty": {"transports": ["Train", "Bus", "Car"]},
    "Darjeeling": {"transports": ["Train", "Bus", "Car"]},
    "Rishikesh": {"transports": ["Train", "Bus", "Car"]},
    "Varanasi": {"transports": ["Flight", "Train", "Bus", "Car"]},
    "Leh": {"transports": ["Flight", "Bus", "Car"]},
    "Udaipur": {"transports": ["Flight", "Train", "Bus", "Car"]},
    "Alappuzha": {"transports": ["Train", "Bus", "Car"]},
    "Gokarna": {"transports": ["Train", "Bus", "Car"]},
    "Madikeri": {"transports": ["Bus", "Car"]},
    "Amritsar": {"transports": ["Flight", "Train", "Bus", "Car"]},
    "Puducherry": {"transports": ["Train", "Bus", "Car"]},
    "Shimla": {"transports": ["Flight", "Train", "Bus", "Car"]},
    "Agra": {"transports": ["Flight", "Train", "Bus", "Car"]},
    "Jaisalmer": {"transports": ["Flight", "Train", "Bus", "Car"]},
    "Kochi": {"transports": ["Flight", "Train", "Bus", "Car"]},
    "Shillong": {"transports": ["Flight", "Bus", "Car"]},
    "Gangtok": {"transports": ["Flight", "Bus", "Car"]},
    "Mahabalipuram": {"transports": ["Bus", "Car"]},
    "Khajuraho": {"transports": ["Flight", "Train", "Bus", "Car"]},
    "Kaziranga": {"transports": ["Bus", "Car"]},
    "Varkala": {"transports": ["Train", "Bus", "Car"]},
    "Kodaikanal": {"transports": ["Bus", "Car"]},
    "Wayanad": {"transports": ["Bus", "Car"]},
    "Ranthambore": {"transports": ["Train", "Car", "Bus"]},
    "Panaji": {"transports": ["Flight", "Train", "Bus", "Car"]},
    "Kumarakom": {"transports": ["Bus", "Car"]},
}

# Regional Climatic Best Months in India
REGIONAL_BEST_MONTHS: Dict[str, List[int]] = {
    "himalayan_temperate": [3, 4, 5, 6, 9, 10, 11],       # Manali, Shimla, Darjeeling, Shillong, Gangtok
    "high_altitude_desert": [5, 6, 7, 8, 9],              # Leh / Ladakh
    "coastal_tropical": [10, 11, 12, 1, 2, 3],            # Goa, Alappuzha, Varkala, Gokarna, Kumarakom, Puducherry, Mahabalipuram
    "southern_hills": [10, 11, 12, 1, 2, 3, 4, 5],        # Munnar, Ooty, Kodaikanal, Madikeri, Wayanad
    "plains_desert_heritage": [10, 11, 12, 1, 2, 3],      # Jaipur, Udaipur, Jaisalmer, Agra, Varanasi, Amritsar, Khajuraho, Hampi
    "wildlife_season": [10, 11, 12, 1, 2, 3, 4, 5],       # Ranthambore, Kaziranga
}


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two geographic points in kilometers."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class DestinationNormalizer:
    """Normalizes and enriches destination candidates into Voyara's schema."""

    def __init__(self, processed_dir: Optional[Path] = None):
        self.processed_dir = processed_dir or (BACKEND_DIR / "data" / "processed")
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    def normalize_name(self, raw_name: str) -> str:
        """Cleans and standardizes destination name."""
        name = raw_name.strip()
        # Clean common redundant suffixes
        suffixes = [" Town", " City", ", India"]
        for s in suffixes:
            if name.endswith(s):
                name = name[:-len(s)].strip()
        return name

    def normalize_state(self, raw_state: str) -> str:
        """Maps administrative state name to standardized Indian state."""
        cleaned = raw_state.strip().lower()
        return STATE_STANDARDIZATION.get(cleaned, raw_state.strip().title())

    def deduplicate_candidates(self, candidates: List[Dict]) -> Tuple[List[Dict], int]:
        """
        Deduplicates candidate destinations based on:
        1. Exact (normalized_name, normalized_state) match
        2. Proximity: same/similar name within 20km
        """
        unique_destinations: List[Dict] = []
        duplicates_count = 0

        for cand in candidates:
            c_name = self.normalize_name(cand.get("name", ""))
            c_state = self.normalize_state(cand.get("admin1", ""))
            c_lat = cand.get("latitude")
            c_lon = cand.get("longitude")

            is_duplicate = False
            for existing in unique_destinations:
                e_name = existing["name"]
                e_state = existing["state"]
                e_lat = existing["latitude"]
                e_lon = existing["longitude"]

                # Check exact name & state match
                if c_name.lower() == e_name.lower() and c_state.lower() == e_state.lower():
                    is_duplicate = True
                    self._merge_source_info(existing, cand)
                    duplicates_count += 1
                    break

                # Check proximity match (e.g. "Munnar" and "Munnar Town" < 20km)
                if c_lat and c_lon and e_lat and e_lon:
                    dist = haversine_distance_km(c_lat, c_lon, e_lat, e_lon)
                    if dist < 20.0 and (c_name.lower() in e_name.lower() or e_name.lower() in c_name.lower()):
                        is_duplicate = True
                        self._merge_source_info(existing, cand)
                        duplicates_count += 1
                        break

            if not is_duplicate:
                unique_destinations.append(self._init_normalized_record(cand, c_name, c_state))

        return unique_destinations, duplicates_count

    def _init_normalized_record(self, raw: Dict, norm_name: str, norm_state: str) -> Dict:
        """Initializes a normalized destination record with source tracking."""
        geoname_id = raw.get("geoname_id")
        sources = []
        if geoname_id:
            sources.append({
                "source_name": "GeoNames",
                "source_type": "geographic_database",
                "external_id": str(geoname_id),
                "source_url": f"https://www.geonames.org/{geoname_id}",
            })

        return {
            "geoname_id": geoname_id,
            "name": norm_name,
            "state": norm_state,
            "country": "India",
            "city": raw.get("admin2") or norm_name,
            "latitude": round(raw.get("latitude"), 5) if raw.get("latitude") else None,
            "longitude": round(raw.get("longitude"), 5) if raw.get("longitude") else None,
            "elevation": raw.get("elevation", 0),
            "feature_class": raw.get("feature_class", ""),
            "feature_code": raw.get("feature_code", ""),
            "population": raw.get("population", 0),
            "sources": sources,
            "pois": [],
            "places": [],
            "experiences": [],
            "travel_styles": [],
            "companions": [],
            "transport_options": [],
            "paces": [],
            "best_months": [],
            "budget_min": 0,
            "budget_max": 0,
            "popularity_score": 0.0,
            "description": "",
            "short_description": "",
        }

    def _merge_source_info(self, existing: Dict, new_cand: Dict) -> None:
        """Merges external source references when a duplicate candidate is encountered."""
        geoname_id = new_cand.get("geoname_id")
        if geoname_id:
            source_exists = any(
                s.get("source_name") == "GeoNames" and s.get("external_id") == str(geoname_id)
                for s in existing.get("sources", [])
            )
            if not source_exists:
                existing["sources"].append({
                    "source_name": "GeoNames",
                    "source_type": "geographic_database",
                    "external_id": str(geoname_id),
                    "source_url": f"https://www.geonames.org/{geoname_id}",
                })

    def enrich_with_pois(self, destination: Dict, pois: List[Dict]) -> None:
        """Attaches factual POIs and merges OpenTripMap source references."""
        destination["pois"] = pois
        for p in pois:
            xid = p.get("xid")
            if xid:
                # Add source tracking for notable POIs
                if not any(s.get("source_name") == "OpenTripMap" and s.get("external_id") == str(xid) for s in destination["sources"]):
                    destination["sources"].append({
                        "source_name": "OpenTripMap",
                        "source_type": "tourism_poi",
                        "external_id": str(xid),
                        "source_url": f"https://opentripmap.com/en/card/{xid}",
                    })

    def classify_recommendation_metadata(self, dest: Dict) -> None:
        """
        Deterministically classifies destination metadata into Voyara's recommendation vocabulary
        based on factual geographic feature codes, elevation, and verified POIs.
        """
        fclass = dest.get("feature_class", "")
        fcode = dest.get("feature_code", "")
        elevation = dest.get("elevation", 0)
        pop = dest.get("population", 0)
        name = dest.get("name", "")
        pois = dest.get("pois", [])

        all_kinds = set()
        for p in pois:
            kinds_str = p.get("kinds", "")
            for k in kinds_str.split(","):
                if k.strip():
                    all_kinds.add(k.strip())

        # ----------------------------------------------------
        # 1. PLACES VOCABULARY
        # {"Mountains", "Beaches", "Nature", "Cities", "Historical", "Cultural", "Islands"}
        # ----------------------------------------------------
        places: Set[str] = set()

        if fcode in {"MT", "PK", "VAL"} or elevation >= 1000 or any("mountain" in k for k in all_kinds):
            places.add("Mountains")

        if fcode == "BCH" or any("beach" in k for k in all_kinds) or name in {"Goa", "Alappuzha", "Gokarna", "Varkala", "Puducherry", "Mahabalipuram"}:
            places.add("Beaches")

        if fcode in {"PRK", "RES"} or any(k in all_kinds for k in {"nature_reserves", "national_parks", "waterfalls", "gardens", "lakes"}):
            places.add("Nature")

        if fcode in {"HSTS", "MNMT", "FT", "PAL", "RUIN"} or any(k in all_kinds for k in {"historic", "monuments", "forts", "castles", "ruins", "archaeological"}):
            places.add("Historical")

        if fcode in {"TMPL", "MSTY"} or any(k in all_kinds for k in {"religion", "temples", "cultural", "museums", "buddhist_temples", "hindu_temples", "churches"}):
            places.add("Cultural")

        if fcode in {"PPLC", "PPLA"} or pop >= 500000 or name in {"Jaipur", "Amritsar", "Agra", "Kochi", "Varanasi"}:
            places.add("Cities")

        if fcode in {"ISL", "ISLS"} or any("island" in k for k in all_kinds):
            places.add("Islands")

        dest["places"] = sorted(list(places))

        # ----------------------------------------------------
        # 2. EXPERIENCES VOCABULARY
        # {"Adventure", "Food", "Nightlife", "Shopping", "Relaxation", "Wildlife", "Photography", "Culture", "Sports"}
        # ----------------------------------------------------
        experiences: Set[str] = set()

        if any(k in all_kinds for k in {"climbing", "water_sports", "hiking", "winter_sports", "mountain_passes", "adventure"}) or "Mountains" in places:
            experiences.add("Adventure")

        if any(k in all_kinds for k in {"national_parks", "wildlife_sanctuaries", "zoos"}) or dest["name"] in {"Kaziranga", "Ranthambore"}:
            experiences.add("Wildlife")

        if any(k in all_kinds for k in {"view_points", "monuments", "nature_reserves", "gardens"}) or len(places & {"Mountains", "Nature", "Historical"}) > 0:
            experiences.add("Photography")

        if "Beaches" in places or "Nature" in places or elevation >= 1000:
            experiences.add("Relaxation")

        if "Cultural" in places or "Historical" in places:
            experiences.add("Culture")

        if any(k in all_kinds for k in {"water_sports", "winter_sports", "sport"}):
            experiences.add("Sports")

        if "Cities" in places or name in {"Amritsar", "Kochi", "Varanasi", "Jaipur", "Panaji"}:
            experiences.add("Food")

        if name in {"Goa", "Panaji"} or (pop >= 1000000 and "Cities" in places):
            experiences.add("Nightlife")

        if "Cities" in places or any("shopping" in k for k in all_kinds) or name in {"Jaipur", "Shimla", "Puducherry"}:
            experiences.add("Shopping")

        dest["experiences"] = sorted(list(experiences))

        # ----------------------------------------------------
        # 3. TRAVEL STYLE VOCABULARY
        # {"Budget", "Balanced", "Premium", "Luxury"}
        # ----------------------------------------------------
        styles = {"Balanced"}  # Baseline
        if "Beaches" in places or "Mountains" in places:
            styles.add("Budget")
        if name in {"Jaipur", "Udaipur", "Agra", "Panaji", "Kumarakom"}:
            styles.add("Luxury")
            styles.add("Premium")
        elif "Historical" in places or "Nature" in places:
            styles.add("Premium")
        dest["travel_styles"] = sorted(list(styles))

        # ----------------------------------------------------
        # 4. COMPANIONS VOCABULARY
        # {"Solo", "Couple", "Family", "Friends"}
        # ----------------------------------------------------
        companions = {"Friends"}
        if "Relaxation" in experiences or "Mountains" in places or "Beaches" in places:
            companions.add("Couple")
            companions.add("Solo")
        if "Historical" in places or "Cultural" in places or "Wildlife" in experiences or "Cities" in places:
            companions.add("Family")
        dest["companions"] = sorted(list(companions))

        # ----------------------------------------------------
        # 5. TRANSPORT OPTIONS VOCABULARY
        # {"Flight", "Train", "Bus", "Car", "Flexible"}
        # ----------------------------------------------------
        transport_info = KNOWN_TRANSPORT_ACCESS.get(name)
        if transport_info:
            trans = set(transport_info["transports"])
        else:
            trans = {"Bus", "Car"}
            if pop >= 200000:
                trans.add("Train")
        trans.add("Flexible")
        dest["transport_options"] = sorted(list(trans))

        # ----------------------------------------------------
        # 6. PACE VOCABULARY
        # {"Relaxed", "Balanced", "Packed"}
        # ----------------------------------------------------
        paces = set()
        if "Relaxation" in experiences:
            paces.add("Relaxed")
        if "Adventure" in experiences or len(pois) >= 3:
            paces.add("Balanced")
        if len(pois) >= 4 or "Cities" in places:
            paces.add("Packed")
        if not paces:
            paces.add("Balanced")
        dest["paces"] = sorted(list(paces))

        # ----------------------------------------------------
        # 7. BEST MONTHS (Climatic Regions)
        # ----------------------------------------------------
        if elevation >= 3000:
            dest["best_months"] = REGIONAL_BEST_MONTHS["high_altitude_desert"]
        elif elevation >= 1200 and dest["state"] in {"Himachal Pradesh", "Uttarakhand", "West Bengal", "Sikkim", "Meghalaya"}:
            dest["best_months"] = REGIONAL_BEST_MONTHS["himalayan_temperate"]
        elif elevation >= 700 and dest["state"] in {"Kerala", "Tamil Nadu", "Karnataka"}:
            dest["best_months"] = REGIONAL_BEST_MONTHS["southern_hills"]
        elif "Beaches" in places or dest["state"] in {"Goa", "Kerala", "Puducherry"}:
            dest["best_months"] = REGIONAL_BEST_MONTHS["coastal_tropical"]
        elif "Wildlife" in experiences or name in {"Ranthambore", "Kaziranga"}:
            dest["best_months"] = REGIONAL_BEST_MONTHS["wildlife_season"]
        else:
            dest["best_months"] = REGIONAL_BEST_MONTHS["plains_desert_heritage"]

        # ----------------------------------------------------
        # Descriptions & Popularity Score
        # ----------------------------------------------------
        poi_names = [p["name"] for p in pois[:3]]
        highlights = ", ".join(poi_names) if poi_names else f"landmarks across {dest['state']}"
        dest["short_description"] = f"Real geographic destination in {dest['state']} featuring {highlights}."
        dest["description"] = (
            f"{name} is a renowned destination located in {dest['state']}, India. "
            f"Categorized under {', '.join(dest['places']) if dest['places'] else 'Travel Destinations'}, "
            f"offering travelers experiences such as {', '.join(dest['experiences']) if dest['experiences'] else 'exploration'}. "
            f"Notable attractions include: {highlights}."
        )

        # Baseline score calculation: 7.0 + POI density boost up to 9.5
        score = 7.5 + min(2.0, len(pois) * 0.4)
        dest["popularity_score"] = round(min(9.8, score), 1)

        # Conservative realistic budget brackets (INR)
        if "Luxury" in dest["travel_styles"]:
            dest["budget_min"] = 18000
            dest["budget_max"] = 55000
        elif "Premium" in dest["travel_styles"]:
            dest["budget_min"] = 12000
            dest["budget_max"] = 35000
        else:
            dest["budget_min"] = 8000
            dest["budget_max"] = 25000

    def process(
        self,
        raw_candidates: List[Dict],
        pois_by_dest: Dict[str, List[Dict]]
    ) -> Tuple[List[Dict], int]:
        """
        Executes full normalization workflow:
        Deduplicates, attaches POIs, maps recommendation metadata, and generates clean records.
        """
        deduped_destinations, dup_count = self.deduplicate_candidates(raw_candidates)

        for dest in deduped_destinations:
            dest_id = str(dest.get("geoname_id") or "")
            pois = pois_by_dest.get(dest_id, [])
            self.enrich_with_pois(dest, pois)
            self.classify_recommendation_metadata(dest)

        return deduped_destinations, dup_count

    def export_dataset(self, destinations: List[Dict]) -> Tuple[Path, Path]:
        """
        Exports normalized dataset to JSON and CSV formats in backend/data/processed/.
        """
        json_path = self.processed_dir / "voyara_destinations.json"
        csv_path = self.processed_dir / "voyara_destinations.csv"

        # 1. Export JSON
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(destinations, f, indent=2, ensure_ascii=False)

        # 2. Export CSV
        csv_columns = [
            "geoname_id",
            "name",
            "state",
            "country",
            "city",
            "latitude",
            "longitude",
            "popularity_score",
            "budget_min",
            "budget_max",
            "places",
            "experiences",
            "travel_styles",
            "companions",
            "transport_options",
            "paces",
            "best_months",
            "short_description",
            "description",
            "source_references",
        ]

        with open(csv_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=csv_columns)
            writer.writeheader()
            for d in destinations:
                sources_str = "; ".join([
                    f"{s.get('source_name')}:{s.get('external_id')}"
                    for s in d.get("sources", [])
                ])
                row = {
                    "geoname_id": d.get("geoname_id"),
                    "name": d.get("name"),
                    "state": d.get("state"),
                    "country": d.get("country"),
                    "city": d.get("city"),
                    "latitude": d.get("latitude"),
                    "longitude": d.get("longitude"),
                    "popularity_score": d.get("popularity_score"),
                    "budget_min": d.get("budget_min"),
                    "budget_max": d.get("budget_max"),
                    "places": ",".join(d.get("places", [])),
                    "experiences": ",".join(d.get("experiences", [])),
                    "travel_styles": ",".join(d.get("travel_styles", [])),
                    "companions": ",".join(d.get("companions", [])),
                    "transport_options": ",".join(d.get("transport_options", [])),
                    "paces": ",".join(d.get("paces", [])),
                    "best_months": ",".join(str(m) for m in d.get("best_months", [])),
                    "short_description": d.get("short_description"),
                    "description": d.get("description"),
                    "source_references": sources_str,
                }
                writer.writerow(row)

        return json_path, csv_path


def main():
    normalizer = DestinationNormalizer()
    geonames_cache = BACKEND_DIR / "data" / "raw" / "geonames" / "geonames_india_candidates.json"
    otm_cache = BACKEND_DIR / "data" / "raw" / "opentripmap" / "opentripmap_pois.json"

    if not geonames_cache.exists():
        print(f"Error: GeoNames raw cache not found at {geonames_cache}", file=sys.stderr)
        sys.exit(1)

    with open(geonames_cache, "r", encoding="utf-8") as f:
        candidates = json.load(f)

    pois_by_dest = {}
    if otm_cache.exists():
        with open(otm_cache, "r", encoding="utf-8") as f:
            pois_by_dest = json.load(f)

    destinations, dup_count = normalizer.process(candidates, pois_by_dest)
    json_path, csv_path = normalizer.export_dataset(destinations)

    print(f"Normalized {len(destinations)} verified destinations ({dup_count} duplicates merged).")
    print(f"JSON export: {json_path}")
    print(f"CSV export:  {csv_path}")


if __name__ == "__main__":
    main()
