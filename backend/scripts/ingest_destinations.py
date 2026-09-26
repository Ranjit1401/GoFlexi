"""
Master Destination Data Ingestion Pipeline (Phase 5B)
Voyara / Traveller Project

Orchestrates the ingestion, candidate filtering, POI enrichment, normalization,
deduplication, validation, dataset export, and safe database upsert.

Usage:
  python scripts/ingest_destinations.py --source geonames
  python scripts/ingest_destinations.py --source opentripmap
  python scripts/ingest_destinations.py --source all --use-cache --import-db
"""

import sys
import uuid
import argparse
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from datetime import datetime

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from scripts.ingest_geonames import GeoNamesClient
from scripts.ingest_opentripmap import OpenTripMapClient
from scripts.normalize_destinations import DestinationNormalizer
from scripts.validate_destinations import DestinationValidator

from sqlalchemy import select, delete
from app.db.database import SessionLocal
from app.models.destination import (
    Destination,
    DestinationTag,
    DestinationTravelStyle,
    DestinationCompanion,
    DestinationTransport,
    DestinationPace,
    DestinationBestMonth,
    DestinationSource,
)


def run_pipeline(
    source: str = "all",
    use_cache: bool = False,
    import_db: bool = False,
    dry_run: bool = False,
    validate_only: bool = False,
) -> Dict:
    """
    Executes the ingestion pipeline.
    Returns audit statistics and execution summary.
    """
    geonames_client = GeoNamesClient()
    otm_client = OpenTripMapClient()
    normalizer = DestinationNormalizer()
    validator = DestinationValidator()

    # Track report statistics
    report = {
        "geonames_configured": False,
        "geonames_request_successful": False,
        "geonames_records_discovered": 0,
        "otm_configured": False,
        "otm_request_successful": False,
        "otm_pois_discovered": 0,
        "osm_used": True,
        "osm_purpose": "Geographic boundaries & rail/transit connectivity verification",
        "existing_destinations": 0,
        "discovered_candidates": 0,
        "verified_destinations": 0,
        "rejected_candidates": 0,
        "duplicates": 0,
        "sources_geonames": 0,
        "sources_otm": 0,
        "sources_other": 0,
        "inserted": 0,
        "updated": 0,
        "skipped": 0,
        "validation_passed": False,
    }

    # -------------------------------------------------------------------------
    # 1. API Configuration & Credential Validation
    # -------------------------------------------------------------------------
    gn_ok, gn_msg = geonames_client.check_configuration()
    otm_ok, otm_msg = otm_client.check_configuration()

    report["geonames_configured"] = gn_ok
    report["otm_configured"] = otm_ok

    # If user explicitly requested a source via CLI and credential is missing (and not using cache)
    if source == "geonames" and not gn_ok and not use_cache:
        print(gn_msg, file=sys.stderr)
        sys.exit(1)

    if source == "opentripmap" and not otm_ok and not use_cache:
        print(otm_msg, file=sys.stderr)
        sys.exit(1)

    # Test live connections if configured
    if gn_ok:
        test_ok, test_msg, _ = geonames_client.test_connection()
        report["geonames_request_successful"] = test_ok
        print(f"[GeoNames Test] {test_msg}")
    else:
        print(f"[GeoNames Status] {gn_msg}")

    if otm_ok:
        test_ok, test_msg, _ = otm_client.test_connection()
        report["otm_request_successful"] = test_ok
        print(f"[OpenTripMap Test] {test_msg}")
    else:
        print(f"[OpenTripMap Status] {otm_msg}")

    # -------------------------------------------------------------------------
    # 2. Candidate Discovery (GeoNames)
    # -------------------------------------------------------------------------
    print("\n--- Step 1: Discovering Geographic Candidates ---")
    try:
        if gn_ok and not use_cache:
            raw_candidates = geonames_client.fetch_candidates(allow_cache_fallback=True)
        else:
            raw_candidates = geonames_client.load_raw_cache()
            print(f"[GeoNames] Loaded {len(raw_candidates)} records from local raw cache.")
    except Exception as e:
        print(f"[GeoNames] Failed to retrieve candidates: {e}", file=sys.stderr)
        sys.exit(1)

    report["discovered_candidates"] = len(raw_candidates)
    report["geonames_records_discovered"] = len(raw_candidates)

    # Filter candidates
    accepted_candidates, rejected = geonames_client.filter_candidates(raw_candidates)
    report["rejected_candidates"] = len(rejected)
    print(f"[Filter] Candidates: {len(raw_candidates)} total, {len(accepted_candidates)} accepted, {len(rejected)} rejected.")

    # -------------------------------------------------------------------------
    # 3. POI Enrichment (OpenTripMap)
    # -------------------------------------------------------------------------
    print("\n--- Step 2: Enriching with Tourist POIs ---")
    if otm_ok and not use_cache:
        pois_by_dest = otm_client.enrich_destinations(accepted_candidates, allow_cache_fallback=True)
    else:
        pois_by_dest = otm_client.load_raw_cache()
        total_pois = sum(len(p) for p in pois_by_dest.values())
        report["otm_pois_discovered"] = total_pois
        print(f"[OpenTripMap] Loaded {total_pois} POIs across {len(pois_by_dest)} destinations from local raw cache.")

    # -------------------------------------------------------------------------
    # 4. Normalization, Deduplication & Recommendation Mapping
    # -------------------------------------------------------------------------
    print("\n--- Step 3: Normalizing & Mapping Recommendation Metadata ---")
    destinations, dup_count = normalizer.process(accepted_candidates, pois_by_dest)
    report["duplicates"] = dup_count
    report["verified_destinations"] = len(destinations)

    # Count source references
    for d in destinations:
        for s in d.get("sources", []):
            if s.get("source_name") == "GeoNames":
                report["sources_geonames"] += 1
            elif s.get("source_name") == "OpenTripMap":
                report["sources_otm"] += 1
            else:
                report["sources_other"] += 1

    # Export datasets to JSON and CSV
    json_path, csv_path = normalizer.export_dataset(destinations)
    print(f"[Export] Saved normalized JSON: {json_path}")
    print(f"[Export] Saved normalized CSV:  {csv_path}")

    # -------------------------------------------------------------------------
    # 5. Validation
    # -------------------------------------------------------------------------
    print("\n--- Step 4: Validating Normalized Records ---")
    is_valid, errors, warnings = validator.validate_destination_records(destinations)
    report["validation_passed"] = is_valid
    if not is_valid:
        print(f"Validation FAILED with {len(errors)} errors:", file=sys.stderr)
        for err in errors[:5]:
            print(f" - {err}", file=sys.stderr)
        if not dry_run and import_db:
            print("Aborting database import due to validation errors.", file=sys.stderr)
            sys.exit(1)
    else:
        print(f"Validation PASSED ({len(destinations)} verified destination records).")

    if validate_only:
        return report

    # -------------------------------------------------------------------------
    # 6. Database Upsert & Audit
    # -------------------------------------------------------------------------
    db = SessionLocal()
    try:
        # Check current destinations count
        current_db_dests = db.execute(select(Destination)).scalars().all()
        report["existing_destinations"] = len(current_db_dests)

        print("\n==================================================")
        print("DESTINATION INGESTION AUDIT")
        print("==================================================")
        print(f"CURRENT DESTINATIONS: {report['existing_destinations']}")
        print(f"NEW REAL CANDIDATES:  {report['discovered_candidates']}")
        print(f"VERIFIED DESTINATIONS:{report['verified_destinations']}")
        print(f"DUPLICATES:           {report['duplicates']}")
        print(f"REJECTED CANDIDATES:  {report['rejected_candidates']}")
        print("==================================================")

        if dry_run or not import_db:
            print("[Audit] Running in DRY-RUN mode. Database was not modified.")
            return report

        print("\n--- Step 5: Safe Idempotent Database Import ---")
        existing_lookup = {
            (d.name.strip().lower(), d.state.strip().lower()): d
            for d in current_db_dests
        }

        created_count = 0
        updated_count = 0
        skipped_count = 0

        tags_to_add = []
        styles_to_add = []
        companions_to_add = []
        transports_to_add = []
        paces_to_add = []
        months_to_add = []
        sources_to_add = []
        dest_ids_to_clean = []

        now_utc = datetime.now()

        for item in destinations:
            name = item["name"]
            state = item["state"]
            key = (name.strip().lower(), state.strip().lower())

            existing_dest = existing_lookup.get(key)
            if existing_dest is None:
                # INSERT NEW DESTINATION
                dest_id = uuid.uuid4()
                dest = Destination(
                    id=dest_id,
                    name=name,
                    country=item.get("country", "India"),
                    state=state,
                    city=item.get("city", name),
                    description=item.get("description", ""),
                    short_description=item.get("short_description", ""),
                    latitude=item.get("latitude"),
                    longitude=item.get("longitude"),
                    budget_min=item.get("budget_min", 0),
                    budget_max=item.get("budget_max", 0),
                    popularity_score=item.get("popularity_score", 0.0),
                )
                db.add(dest)
                created_count += 1
            else:
                # UPDATE EXISTING DESTINATION
                dest_id = existing_dest.id
                dest_ids_to_clean.append(dest_id)
                existing_dest.country = item.get("country", "India")
                existing_dest.city = item.get("city", name)
                # Keep richer description if already present, or update
                if not existing_dest.description or len(item.get("description", "")) > len(existing_dest.description):
                    existing_dest.description = item.get("description", "")
                if not existing_dest.short_description:
                    existing_dest.short_description = item.get("short_description", "")
                existing_dest.latitude = item.get("latitude") or existing_dest.latitude
                existing_dest.longitude = item.get("longitude") or existing_dest.longitude
                if item.get("budget_min", 0) > 0 and existing_dest.budget_min == 0:
                    existing_dest.budget_min = item["budget_min"]
                if item.get("budget_max", 0) > 0 and existing_dest.budget_max == 0:
                    existing_dest.budget_max = item["budget_max"]
                if item.get("popularity_score", 0.0) > 0 and existing_dest.popularity_score == 0:
                    existing_dest.popularity_score = item["popularity_score"]
                updated_count += 1

            # Child Metadata Preparation
            for place in set(item.get("places", [])):
                tags_to_add.append(DestinationTag(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    tag_type="place",
                    tag_value=place
                ))

            for exp in set(item.get("experiences", [])):
                tags_to_add.append(DestinationTag(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    tag_type="experience",
                    tag_value=exp
                ))

            for style in set(item.get("travel_styles", [])):
                styles_to_add.append(DestinationTravelStyle(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    travel_style=style
                ))

            for comp in set(item.get("companions", [])):
                companions_to_add.append(DestinationCompanion(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    companion_type=comp
                ))

            for trans in set(item.get("transport_options", [])):
                transports_to_add.append(DestinationTransport(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    transport_type=trans
                ))

            for pace in set(item.get("paces", [])):
                paces_to_add.append(DestinationPace(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    pace=pace
                ))

            for month in set(item.get("best_months", [])):
                months_to_add.append(DestinationBestMonth(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    month=month
                ))

            for src in item.get("sources", []):
                sources_to_add.append(DestinationSource(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    source_name=src.get("source_name", "GeoNames"),
                    source_url=src.get("source_url"),
                    source_type=src.get("source_type", "geographic_database"),
                    external_id=src.get("external_id"),
                    verified_at=now_utc,
                ))

        # Idempotent cleanup of old child records for updated destinations
        if dest_ids_to_clean:
            db.execute(delete(DestinationTag).where(DestinationTag.destination_id.in_(dest_ids_to_clean)))
            db.execute(delete(DestinationTravelStyle).where(DestinationTravelStyle.destination_id.in_(dest_ids_to_clean)))
            db.execute(delete(DestinationCompanion).where(DestinationCompanion.destination_id.in_(dest_ids_to_clean)))
            db.execute(delete(DestinationTransport).where(DestinationTransport.destination_id.in_(dest_ids_to_clean)))
            db.execute(delete(DestinationPace).where(DestinationPace.destination_id.in_(dest_ids_to_clean)))
            db.execute(delete(DestinationBestMonth).where(DestinationBestMonth.destination_id.in_(dest_ids_to_clean)))
            db.execute(delete(DestinationSource).where(DestinationSource.destination_id.in_(dest_ids_to_clean)))

        db.add_all(tags_to_add)
        db.add_all(styles_to_add)
        db.add_all(companions_to_add)
        db.add_all(transports_to_add)
        db.add_all(paces_to_add)
        db.add_all(months_to_add)
        db.add_all(sources_to_add)

        db.commit()

        report["inserted"] = created_count
        report["updated"] = updated_count
        report["skipped"] = skipped_count

        print(f"[Database Import] Completed successfully!")
        print(f"INSERTED: {created_count}")
        print(f"UPDATED:  {updated_count}")
        print(f"SKIPPED:  {skipped_count}")

    except Exception as e:
        db.rollback()
        print(f"[Database Error] Ingestion failed: {e}", file=sys.stderr)
        raise
    finally:
        db.close()

    return report


def main():
    parser = argparse.ArgumentParser(description="Voyara Destination Ingestion Master CLI")
    parser.add_argument("--source", type=str, choices=["geonames", "opentripmap", "all", "cache"], default="all", help="Data source to ingest from")
    parser.add_argument("--use-cache", action="store_true", help="Use local raw data cache instead of calling external APIs")
    parser.add_argument("--import-db", action="store_true", help="Upsert verified destinations into PostgreSQL/Neon")
    parser.add_argument("--dry-run", action="store_true", help="Simulate pipeline without modifying database")
    parser.add_argument("--validate", action="store_true", help="Validate normalized destination records")

    args = parser.parse_args()

    # If source is 'cache', set use_cache=True and source='all'
    if args.source == "cache":
        args.use_cache = True
        args.source = "all"

    run_pipeline(
        source=args.source,
        use_cache=args.use_cache,
        import_db=args.import_db,
        dry_run=args.dry_run,
        validate_only=args.validate,
    )


if __name__ == "__main__":
    main()
