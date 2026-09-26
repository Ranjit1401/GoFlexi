"""
OpenTripMap Tourist POI Ingestion Module (Phase 5B)
Voyara / Traveller Project

Enriches destination candidates with real tourist POIs from OpenTripMap:
- Queries OpenTripMap radius API when OPENTRIPMAP_API_KEY is configured
- Captures factual POI metadata: xid, name, kinds/categories, coordinates, rate, distance
- Does NOT copy copyrighted descriptions or fabricate fake POIs
- Supports local raw data caching in backend/data/raw/opentripmap/
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import urllib.request
import urllib.parse
import urllib.error

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from app.core.config import settings
except ImportError:
    settings = None


class OpenTripMapClient:
    """Client for enriching destinations with real tourist POIs from OpenTripMap."""

    def __init__(self, api_key: Optional[str] = None, cache_dir: Optional[Path] = None):
        if api_key is not None:
            self.api_key = api_key.strip()
        elif settings and settings.OPENTRIPMAP_API_KEY:
            self.api_key = settings.OPENTRIPMAP_API_KEY.strip()
        else:
            self.api_key = (os.getenv("OPENTRIPMAP_API_KEY") or "").strip()

        self.cache_dir = cache_dir or (BACKEND_DIR / "data" / "raw" / "opentripmap")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.default_cache_file = self.cache_dir / "opentripmap_pois.json"

    def check_configuration(self) -> Tuple[bool, str]:
        """Validates whether OPENTRIPMAP_API_KEY is configured."""
        if not self.api_key:
            msg = (
                "ERROR: OPENTRIPMAP_API_KEY is not configured.\n"
                "Please configure OPENTRIPMAP_API_KEY in backend/.env or your environment.\n"
                "Example: OPENTRIPMAP_API_KEY=your_opentripmap_api_key_here"
            )
            return False, msg
        return True, "OPENTRIPMAP_API_KEY is configured."

    def test_connection(self) -> Tuple[bool, str, Optional[int]]:
        """
        Executes a real test request to OpenTripMap API without exposing the key.
        Returns: (success: bool, message: str, status_code: Optional[int])
        """
        configured, msg = self.check_configuration()
        if not configured:
            return False, "API NOT CONFIGURED", None

        # Test request using Jaipur coordinates (radius 1000m)
        url = (
            f"https://api.opentripmap.com/0.1/en/places/radius?"
            f"radius=1000&lon=75.7878&lat=26.9196&limit=1&format=json&apikey={urllib.parse.quote(self.api_key)}"
        )
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Voyara-Ingestion/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                status_code = resp.status
                body = resp.read().decode("utf-8")
                data = json.loads(body)

                if isinstance(data, list):
                    return True, f"OpenTripMap API request successful (HTTP {status_code})", status_code
                elif isinstance(data, dict) and "error" in data:
                    err_msg = data.get("error", "Unknown OpenTripMap error")
                    return False, f"OpenTripMap API Error: {err_msg}", status_code
                return True, f"OpenTripMap API responded (HTTP {status_code})", status_code

        except urllib.error.HTTPError as e:
            return False, f"OpenTripMap HTTP Error: {e.code} {e.reason}", e.code
        except urllib.error.URLError as e:
            return False, f"OpenTripMap Network Error: {e.reason}", None
        except Exception as e:
            return False, f"OpenTripMap Connection Failed: {str(e)}", None

    def fetch_pois_for_location(
        self,
        lat: float,
        lon: float,
        radius_meters: int = 15000,
        limit: int = 10,
    ) -> List[Dict]:
        """Queries OpenTripMap radius API for genuine tourist POIs near coordinates."""
        configured, msg = self.check_configuration()
        if not configured:
            raise ValueError(msg)

        params = {
            "radius": str(radius_meters),
            "lon": str(lon),
            "lat": str(lat),
            "rate": "2",  # Only rate 2 and 3 (notable attractions)
            "limit": str(limit),
            "format": "json",
            "apikey": self.api_key,
        }
        url = "https://api.opentripmap.com/0.1/en/places/radius?" + urllib.parse.urlencode(params)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Voyara-Ingestion/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                body = resp.read().decode("utf-8")
                raw_pois = json.loads(body)
                if not isinstance(raw_pois, list):
                    return []

                cleaned_pois = []
                for p in raw_pois:
                    name = (p.get("name") or "").strip()
                    if not name:
                        continue
                    cleaned_pois.append({
                        "xid": p.get("xid", ""),
                        "name": name,
                        "kinds": p.get("kinds", ""),
                        "point": p.get("point", {}),
                        "rate": p.get("rate", 0),
                        "dist": round(p.get("dist", 0), 1),
                    })
                return cleaned_pois

        except Exception as e:
            print(f"[OpenTripMap] Error fetching POIs for ({lat}, {lon}): {e}", file=sys.stderr)
            return []

    def enrich_destinations(
        self,
        destinations: List[Dict],
        allow_cache_fallback: bool = True
    ) -> Dict[str, List[Dict]]:
        """
        Enriches a list of destinations with real tourist POIs.
        Maps destination geoname_id (or identifier) -> List of POIs.
        """
        configured, msg = self.check_configuration()
        if not configured:
            if allow_cache_fallback and self.default_cache_file.exists():
                print(f"[OpenTripMap] {msg}")
                print(f"[OpenTripMap] Falling back to local raw POI cache: {self.default_cache_file}")
                return self.load_raw_cache()
            else:
                print(msg, file=sys.stderr)
                raise ValueError(msg)

        cached_data = self.load_raw_cache() if self.default_cache_file.exists() else {}
        results = dict(cached_data)

        fetched_count = 0
        for dest in destinations:
            dest_id = str(dest.get("geoname_id") or dest.get("name"))
            if dest_id in results and len(results[dest_id]) > 0:
                continue  # already enriched

            lat = dest.get("latitude")
            lon = dest.get("longitude")
            if lat is not None and lon is not None:
                pois = self.fetch_pois_for_location(lat, lon)
                results[dest_id] = pois
                fetched_count += 1
                time.sleep(0.15)

        self.save_raw_cache(results)
        print(f"[OpenTripMap] Enriched {fetched_count} destinations via live API (Total cached: {len(results)})")
        return results

    def save_raw_cache(self, pois_by_dest: Dict[str, List[Dict]], filename: str = "opentripmap_pois.json") -> Path:
        """Saves raw POI responses to cache file."""
        target = self.cache_dir / filename
        with open(target, "w", encoding="utf-8") as f:
            json.dump(pois_by_dest, f, indent=2, ensure_ascii=False)
        return target

    def load_raw_cache(self, filename: str = "opentripmap_pois.json") -> Dict[str, List[Dict]]:
        """Loads cached raw POIs."""
        target = self.cache_dir / filename
        if not target.exists():
            return {}
        with open(target, "r", encoding="utf-8") as f:
            return json.load(f)


def main():
    parser = argparse.ArgumentParser(description="OpenTripMap Tourism POI Ingestion CLI")
    parser.add_argument("--check", action="store_true", help="Check if OPENTRIPMAP_API_KEY is configured")
    parser.add_argument("--test", action="store_true", help="Perform real test request to OpenTripMap API")
    parser.add_argument("--use-cache", action="store_true", help="Force loading from local raw cache")

    args = parser.parse_args()
    client = OpenTripMapClient()

    if args.check:
        configured, msg = client.check_configuration()
        if configured:
            print(f"SUCCESS: {msg}")
            sys.exit(0)
        else:
            print(msg, file=sys.stderr)
            sys.exit(1)

    if args.test:
        configured, msg = client.check_configuration()
        if not configured:
            print(msg, file=sys.stderr)
            sys.exit(1)
        success, result_msg, status_code = client.test_connection()
        print(f"OpenTripMap Test: success={success}, status_code={status_code}, message={result_msg}")
        sys.exit(0 if success else 1)

    # Default action: check cache
    if args.use_cache:
        data = client.load_raw_cache()
        total_pois = sum(len(pois) for pois in data.values())
        print(f"[OpenTripMap] Loaded {len(data)} destinations with {total_pois} total POIs from local raw cache.")
    else:
        configured, msg = client.check_configuration()
        if not configured:
            print(msg, file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
