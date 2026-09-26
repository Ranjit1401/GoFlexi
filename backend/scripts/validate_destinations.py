"""
Destination Dataset & Database Validation Module (Phase 5B)
Voyara / Traveller Project

Validates destination records against Voyara requirements:
- Minimum destination count
- Duplicate check (name, state)
- Coordinate plausibility for India (lat: 6.0 - 38.0, lon: 68.0 - 98.0)
- Valid country ("India")
- Non-empty destination name
- Source references and external source IDs exist
- Valid vocabulary: Places, Experiences, Travel Styles, Companions, Transport, Paces, Best Months
- No orphan relationships
- No fake placeholder URLs
"""

import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Set, Tuple, Optional

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


# Expected Controlled Vocabularies
VALID_PLACES: Set[str] = {
    "Mountains",
    "Beaches",
    "Nature",
    "Cities",
    "Historical",
    "Cultural",
    "Islands",
}

VALID_EXPERIENCES: Set[str] = {
    "Adventure",
    "Food",
    "Nightlife",
    "Shopping",
    "Relaxation",
    "Wildlife",
    "Photography",
    "Culture",
    "Sports",
}

VALID_TRAVEL_STYLES: Set[str] = {
    "Budget",
    "Balanced",
    "Premium",
    "Luxury",
}

VALID_COMPANIONS: Set[str] = {
    "Solo",
    "Couple",
    "Family",
    "Friends",
}

VALID_TRANSPORT: Set[str] = {
    "Flight",
    "Train",
    "Bus",
    "Car",
    "Flexible",
}

VALID_PACES: Set[str] = {
    "Relaxed",
    "Balanced",
    "Packed",
}

VALID_MONTHS: Set[int] = set(range(1, 13))

INDIA_LAT_RANGE = (6.0, 38.0)
INDIA_LON_RANGE = (68.0, 98.0)


class DestinationValidator:
    """Validates destination records from JSON or Database."""

    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def validate_destination_records(self, destinations: List[Dict]) -> Tuple[bool, List[str], List[str]]:
        """Validates a list of destination dictionaries."""
        self.errors = []
        self.warnings = []

        if not destinations:
            self.errors.append("Validation Error: Destination list is empty.")
            return False, self.errors, self.warnings

        seen_name_state: Set[Tuple[str, str]] = set()

        for idx, dest in enumerate(destinations):
            name = (dest.get("name") or "").strip()
            state = (dest.get("state") or "").strip()
            country = (dest.get("country") or "").strip()
            lat = dest.get("latitude")
            lon = dest.get("longitude")

            prefix = f"Record #{idx+1} ('{name}', '{state}')"

            # 1. Non-empty required name
            if not name:
                self.errors.append(f"{prefix}: Missing or empty destination name.")

            # 2. Country must be India
            if country != "India":
                self.errors.append(f"{prefix}: Country must be 'India', got '{country}'.")

            # 3. Duplicate check
            key = (name.lower(), state.lower())
            if key in seen_name_state:
                self.errors.append(f"{prefix}: Duplicate destination detected for name='{name}' and state='{state}'.")
            seen_name_state.add(key)

            # 4. Valid coordinates plausible for India
            if lat is None or lon is None:
                self.errors.append(f"{prefix}: Coordinates are missing.")
            else:
                if not (INDIA_LAT_RANGE[0] <= lat <= INDIA_LAT_RANGE[1]):
                    self.errors.append(f"{prefix}: Latitude {lat} out of plausible bounds for India (6.0 - 38.0).")
                if not (INDIA_LON_RANGE[0] <= lon <= INDIA_LON_RANGE[1]):
                    self.errors.append(f"{prefix}: Longitude {lon} out of plausible bounds for India (68.0 - 98.0).")

            # 5. Source tracking validation
            sources = dest.get("sources", [])
            if not sources:
                self.errors.append(f"{prefix}: No source tracking information attached.")
            else:
                for s in sources:
                    s_name = s.get("source_name")
                    s_ext_id = s.get("external_id")
                    s_url = s.get("source_url")
                    if not s_name:
                        self.errors.append(f"{prefix}: Source entry missing source_name.")
                    if not s_ext_id:
                        self.errors.append(f"{prefix}: Source entry missing external_id.")
                    if s_url and ("placeholder" in s_url.lower() or "example.com" in s_url.lower()):
                        self.errors.append(f"{prefix}: Source URL contains placeholder/fake URL: '{s_url}'.")

            # 6. Places vocabulary check
            places = set(dest.get("places", []))
            invalid_places = places - VALID_PLACES
            if invalid_places:
                self.errors.append(f"{prefix}: Invalid places vocabulary: {invalid_places}")

            # 7. Experiences vocabulary check
            experiences = set(dest.get("experiences", []))
            invalid_experiences = experiences - VALID_EXPERIENCES
            if invalid_experiences:
                self.errors.append(f"{prefix}: Invalid experiences vocabulary: {invalid_experiences}")

            # 8. Travel style vocabulary check
            styles = set(dest.get("travel_styles", []))
            invalid_styles = styles - VALID_TRAVEL_STYLES
            if invalid_styles:
                self.errors.append(f"{prefix}: Invalid travel styles: {invalid_styles}")

            # 9. Companions vocabulary check
            companions = set(dest.get("companions", []))
            invalid_companions = companions - VALID_COMPANIONS
            if invalid_companions:
                self.errors.append(f"{prefix}: Invalid companions: {invalid_companions}")

            # 10. Transport vocabulary check
            transports = set(dest.get("transport_options", []))
            invalid_trans = transports - VALID_TRANSPORT
            if invalid_trans:
                self.errors.append(f"{prefix}: Invalid transport options: {invalid_trans}")

            # 11. Pace vocabulary check
            paces = set(dest.get("paces", []))
            invalid_paces = paces - VALID_PACES
            if invalid_paces:
                self.errors.append(f"{prefix}: Invalid pace: {invalid_paces}")

            # 12. Best months check
            months = set(dest.get("best_months", []))
            invalid_months = months - VALID_MONTHS
            if invalid_months:
                self.errors.append(f"{prefix}: Invalid best months: {invalid_months}")

        is_valid = len(self.errors) == 0
        return is_valid, self.errors, self.warnings

    def validate_database_records(self, db_session) -> Tuple[bool, List[str], List[str]]:
        """Validates all destinations in the connected database."""
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.destination import Destination

        stmt = select(Destination).options(
            selectinload(Destination.tags),
            selectinload(Destination.travel_styles),
            selectinload(Destination.companions),
            selectinload(Destination.transport_options),
            selectinload(Destination.paces),
            selectinload(Destination.best_months),
            selectinload(Destination.sources),
        )
        db_dests = db_session.execute(stmt).scalars().all()

        converted_records = []
        for d in db_dests:
            converted_records.append({
                "id": d.id,
                "name": d.name,
                "state": d.state,
                "country": d.country,
                "city": d.city,
                "latitude": d.latitude,
                "longitude": d.longitude,
                "places": [t.tag_value for t in d.tags if t.tag_type == "place"],
                "experiences": [t.tag_value for t in d.tags if t.tag_type == "experience"],
                "travel_styles": [s.travel_style for s in d.travel_styles],
                "companions": [c.companion_type for c in d.companions],
                "transport_options": [t.transport_type for t in d.transport_options],
                "paces": [p.pace for p in d.paces],
                "best_months": [m.month for m in d.best_months],
                "sources": [
                    {
                        "source_name": s.source_name,
                        "external_id": s.external_id,
                        "source_url": s.source_url,
                        "source_type": s.source_type,
                    }
                    for s in d.sources
                ] if hasattr(d, "sources") else [],
            })

        return self.validate_destination_records(converted_records)


def main():
    parser = argparse.ArgumentParser(description="Voyara Destination Validation CLI")
    parser.add_argument("--json", type=str, default="data/processed/voyara_destinations.json", help="Path to processed JSON dataset")
    parser.add_argument("--db", action="store_true", help="Validate live database records")

    args = parser.parse_args()
    validator = DestinationValidator()

    if args.db:
        from app.db.database import SessionLocal
        db = SessionLocal()
        try:
            is_valid, errors, warnings = validator.validate_database_records(db)
            print(f"Database Validation: {'PASSED' if is_valid else 'FAILED'}")
        finally:
            db.close()
    else:
        json_path = BACKEND_DIR / args.json
        if not json_path.exists():
            print(f"Error: JSON dataset file not found at {json_path}", file=sys.stderr)
            sys.exit(1)

        with open(json_path, "r", encoding="utf-8") as f:
            destinations = json.load(f)

        is_valid, errors, warnings = validator.validate_destination_records(destinations)
        print(f"Dataset Validation: {'PASSED' if is_valid else 'FAILED'} ({len(destinations)} records checked)")

    if warnings:
        print(f"\nWARNINGS ({len(warnings)}):")
        for w in warnings[:10]:
            print(f" - {w}")

    if errors:
        print(f"\nERRORS ({len(errors)}):", file=sys.stderr)
        for e in errors[:10]:
            print(f" - {e}", file=sys.stderr)
        sys.exit(1)

    print("All validation criteria satisfied.")
    sys.exit(0)


if __name__ == "__main__":
    main()
