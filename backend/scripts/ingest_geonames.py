"""
GeoNames Geographic Destination Ingestion Module (Phase 5B)
Voyara / Traveller Project

Discovers real Indian geographic places as destination candidates from GeoNames API.
- Queries GeoNames searchJSON API when GEONAMES_USERNAME is configured
- Supports multi-category queries: administrative hubs, historic sites, hill stations,
  national parks, beaches, and islands to discover 100+ genuine Indian destinations
- Captures geographic metadata: name, ascii_name, alternate_names, coordinates,
  feature_class, feature_code, country_code, admin1 (state), admin2 (district),
  population, elevation, geoname_id
- Saves/loads raw responses from backend/data/raw/geonames/
"""

import os
import sys
import json
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


ALLOWED_FEATURE_CLASSES = {"P", "S", "T", "L", "H"}
ALLOWED_FEATURE_CODES = {
    # Populated places
    "PPLC", "PPLA", "PPLA2", "PPL",
    # Historical / Cultural / Monuments / Forts / Ruins
    "HSTS", "MNMT", "FT", "PAL", "RUIN", "TMPL", "MSTY",
    # Hypsographic / Mountains / Valleys / Islands
    "MT", "PK", "VAL", "ISL", "ISLS",
    # Parks / Reserves / Protected areas
    "PRK", "RES",
    # Hydrographic / Beaches
    "BCH",
}

REJECTED_FEATURE_CODES = {"PPLX", "PPLQ", "PPLW", "AGRC", "AIRP"}

INDIA_LAT_RANGE = (6.0, 38.0)
INDIA_LON_RANGE = (68.0, 98.0)


class GeoNamesClient:
    """Client for discovering real Indian destinations from GeoNames API or raw cache."""

    def __init__(self, username: Optional[str] = None, cache_dir: Optional[Path] = None):
        if username is not None:
            self.username = username.strip()
        elif settings and settings.GEONAMES_USERNAME:
            self.username = settings.GEONAMES_USERNAME.strip()
        else:
            self.username = (os.getenv("GEONAMES_USERNAME") or "").strip()

        self.cache_dir = cache_dir or (BACKEND_DIR / "data" / "raw" / "geonames")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.default_cache_file = self.cache_dir / "geonames_india_candidates.json"

    def check_configuration(self) -> Tuple[bool, str]:
        """Validates whether GEONAMES_USERNAME is configured."""
        if not self.username:
            msg = (
                "ERROR: GEONAMES_USERNAME is not configured.\n"
                "Please configure GEONAMES_USERNAME in backend/.env or your environment.\n"
                "Example: GEONAMES_USERNAME=my_geonames_account"
            )
            return False, msg
        return True, "GEONAMES_USERNAME is configured."

    def test_connection(self) -> Tuple[bool, str, Optional[int]]:
        """
        Executes a real test request to GeoNames API without exposing credentials.
        Returns: (success: bool, message: str, status_code: Optional[int])
        """
        configured, msg = self.check_configuration()
        if not configured:
            return False, "API NOT CONFIGURED", None

        url = (
            f"http://api.geonames.org/searchJSON?"
            f"country=IN&name=Jaipur&maxRows=1&username={urllib.parse.quote(self.username)}"
        )
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Voyara-Ingestion/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                status_code = resp.status
                body = resp.read().decode("utf-8")
                data = json.loads(body)

                if "status" in data:
                    err_msg = data["status"].get("message", "Unknown GeoNames error")
                    return False, f"GeoNames API Error (HTTP {status_code}): {err_msg}", status_code

                if "geonames" in data:
                    return True, f"GeoNames API request successful (HTTP {status_code})", status_code
                return False, f"Unexpected GeoNames response format (HTTP {status_code})", status_code

        except urllib.error.HTTPError as e:
            err_msg = e.reason
            try:
                body = e.read().decode("utf-8")
                data = json.loads(body)
                if "status" in data and "message" in data["status"]:
                    err_msg = data["status"]["message"].strip()
            except Exception:
                pass
            return False, f"GeoNames HTTP Error: {e.code} - {err_msg}", e.code
        except urllib.error.URLError as e:
            return False, f"GeoNames Network Error: {e.reason}", None
        except Exception as e:
            return False, f"GeoNames Connection Failed: {str(e)}", None

    def fetch_candidates(
        self,
        target_count: int = 120,
        allow_cache_fallback: bool = True
    ) -> List[Dict]:
        """
        Discovers Indian destination candidates from live GeoNames API across diverse
        feature categories (cities, monuments, hill stations, parks, beaches).
        """
        configured, msg = self.check_configuration()
        if not configured:
            if allow_cache_fallback and self.default_cache_file.exists():
                print(f"[GeoNames] {msg}")
                print(f"[GeoNames] Falling back to local raw data cache: {self.default_cache_file}")
                return self.load_raw_cache()
            else:
                print(msg, file=sys.stderr)
                raise ValueError(msg)

        all_candidates: Dict[int, Dict] = {}

        # Query categories designed to discover major Indian tourism destinations
        search_queries = [
            {"cities": "cities15000", "maxRows": "100"},
            {"featureClass": "S", "maxRows": "50"},  # Monuments, forts, ruins
            {"featureClass": "L", "maxRows": "40"},  # Parks, wildlife reserves
            {"featureClass": "T", "maxRows": "40"},  # Mountains, peaks, valleys
            {"featureCode": "BCH", "maxRows": "30"}, # Beaches
        ]

        for query_params in search_queries:
            if len(all_candidates) >= target_count:
                break

            params = {
                "country": "IN",
                "username": self.username,
                "style": "FULL",
                **query_params
            }
            url = "http://api.geonames.org/searchJSON?" + urllib.parse.urlencode(params)
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Voyara-Ingestion/1.0"})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    body = resp.read().decode("utf-8")
                    data = json.loads(body)

                    if "status" in data:
                        err_msg = data["status"].get("message", "GeoNames API error")
                        print(f"[GeoNames Warning] {err_msg}", file=sys.stderr)
                        break

                    records = data.get("geonames", [])
                    for r in records:
                        gid = r.get("geonameId")
                        if gid and gid not in all_candidates:
                            extracted = self._extract_fields(r)
                            all_candidates[gid] = extracted

            except Exception as e:
                print(f"[GeoNames] Error in search query ({query_params}): {e}", file=sys.stderr)
                break

        results = list(all_candidates.values())

        if not results:
            print("[GeoNames] Using official GeoNames gazetteer dataset to obtain 100+ verified Indian destinations.")
            results = self.fetch_from_geonames_dump(target_count=target_count)

        if not results and allow_cache_fallback and self.default_cache_file.exists():
            print("[GeoNames] Falling back to local raw cache.")
            return self.load_raw_cache()

        if results:
            self.save_raw_cache(results)

        return results

    def fetch_from_geonames_dump(self, target_count: int = 120) -> List[Dict]:
        """
        Fetches authentic GeoNames destinations directly from the official open
        GeoNames gazetteer dump (cities15000.zip) containing real geographic records for India.
        """
        import zipfile
        import io

        admin1_map = {
            '01': 'Andaman and Nicobar Islands', '02': 'Andhra Pradesh', '03': 'Assam', '05': 'Chandigarh',
            '07': 'Dadra and Nagar Haveli', '09': 'Gujarat', '10': 'Haryana', '11': 'Himachal Pradesh',
            '12': 'Jammu and Kashmir', '13': 'Kerala', '14': 'Lakshadweep', '16': 'Maharashtra',
            '17': 'Manipur', '18': 'Meghalaya', '19': 'Karnataka', '20': 'Nagaland', '21': 'Odisha',
            '22': 'Puducherry', '23': 'Punjab', '24': 'Rajasthan', '25': 'Tamil Nadu', '26': 'Tripura',
            '28': 'West Bengal', '29': 'Sikkim', '30': 'Arunachal Pradesh', '31': 'Mizoram', '33': 'Goa',
            '34': 'Bihar', '35': 'Madhya Pradesh', '36': 'Uttar Pradesh', '37': 'West Bengal',
            '38': 'Jharkhand', '39': 'Uttarakhand', '40': 'Chhattisgarh', '41': 'Telangana',
            '42': 'Ladakh', '70': 'Delhi'
        }

        print("[GeoNames] Downloading official GeoNames gazetteer dataset...")
        url = "https://download.geonames.org/export/dump/cities15000.zip"
        req = urllib.request.Request(url, headers={"User-Agent": "Voyara-Ingestion/1.0"})

        records = []
        try:
            with urllib.request.urlopen(req, timeout=40) as resp:
                z = zipfile.ZipFile(io.BytesIO(resp.read()))
                with z.open("cities15000.txt") as f:
                    for line in f:
                        parts = line.decode("utf-8", errors="ignore").split("\t")
                        if len(parts) > 14 and parts[8] == "IN":
                            records.append({
                                "geoname_id": int(parts[0]),
                                "name": parts[2],  # ascii_name
                                "ascii_name": parts[2],
                                "alternate_names": [n.strip() for n in parts[3].split(",")[:5] if n.strip()],
                                "latitude": float(parts[4]),
                                "longitude": float(parts[5]),
                                "feature_class": parts[6],
                                "feature_code": parts[7],
                                "country_code": parts[8],
                                "admin1": admin1_map.get(parts[10], parts[10]),
                                "admin2": parts[11],
                                "population": int(parts[14]),
                                "elevation": int(parts[15]) if parts[15] and parts[15] != "" else 0,
                            })
        except Exception as e:
            print(f"[GeoNames] Failed to download GeoNames gazetteer: {e}", file=sys.stderr)
            return []

        tourist_keywords = [
            'manali', 'shimla', 'dharamshala', 'dalhousie', 'kullu', 'kasauli', 'solan',
            'nainital', 'mussoorie', 'rishikesh', 'haridwar', 'dehradun', 'almora', 'auli',
            'jaipur', 'udaipur', 'jodhpur', 'jaisalmer', 'bikaner', 'pushkar', 'mount abu', 'ajmer', 'alwar',
            'agra', 'varanasi', 'mathura', 'vrindavan', 'lucknow', 'ayodhya', 'jhansi', 'prayagraj',
            'khajuraho', 'gwalior', 'orchha', 'ujjain', 'bhopal', 'indore', 'mandav', 'jabalpur',
            'panaji', 'margao', 'vasco da gama', 'mapusa', 'goa',
            'hampi', 'mysore', 'gokarna', 'madikeri', 'chikmagalur', 'hassan', 'mangalore', 'badami',
            'munnar', 'alappuzha', 'kochi', 'varkala', 'kumarakom', 'wayanad', 'thiruvananthapuram', 'kozhikode', 'kannur',
            'ooty', 'kodaikanal', 'mahabalipuram', 'madurai', 'rameshwaram', 'kanyakumari', 'thanjavur', 'coimbatore',
            'darjeeling', 'kalimpong', 'gangtok', 'shillong', 'cherrapunji', 'kaziranga', 'guwahati', 'puri', 'bhubaneswar',
            'leh', 'kargil', 'srinagar', 'gulmarg', 'pahalgam', 'anantnag', 'amritsar', 'chandigarh',
            'puducherry', 'port blair', 'diu', 'daman', 'aurangabad', 'mahabaleshwar', 'lonavala', 'nashik', 'pune', 'mumbai',
            'shirdi', 'tirupati', 'somnath', 'dwarka', 'ranthambore', 'corbett', 'bellary', 'dindigul', 'idukki'
        ]

        selected = []
        seen_names = set()
        for kw in tourist_keywords:
            for r in records:
                n = r['name'].lower()
                if kw in n and n not in seen_names:
                    seen_names.add(n)
                    selected.append(r)
                    break

        if len(selected) < target_count:
            for r in records:
                n = r['name'].lower()
                if n not in seen_names and r['population'] >= 40000:
                    seen_names.add(n)
                    selected.append(r)
                    if len(selected) >= target_count:
                        break

        print(f"[GeoNames] Extracted {len(selected)} verified destination candidates from GeoNames.")
        self.save_raw_cache(selected)
        return selected

    def _extract_fields(self, raw: Dict) -> Dict:
        """Extracts required metadata from a raw GeoNames record."""
        return {
            "geoname_id": raw.get("geonameId"),
            "name": raw.get("name") or raw.get("toponymName", ""),
            "ascii_name": raw.get("asciiName") or raw.get("name", ""),
            "alternate_names": [
                a.get("name") if isinstance(a, dict) else str(a)
                for a in raw.get("alternateNames", [])
            ][:10],
            "latitude": float(raw.get("lat")) if raw.get("lat") is not None else None,
            "longitude": float(raw.get("lng")) if raw.get("lng") is not None else None,
            "feature_class": raw.get("fcl") or raw.get("fcodeName", ""),
            "feature_code": raw.get("fcode", ""),
            "country_code": raw.get("countryCode", "IN"),
            "admin1": raw.get("adminName1", ""),
            "admin2": raw.get("adminName2", ""),
            "population": int(raw.get("population", 0)) if raw.get("population") is not None else 0,
            "elevation": int(raw.get("elevation", 0)) if raw.get("elevation") is not None else 0,
        }

    def filter_candidates(self, candidates: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Deterministic candidate filtering for tourism relevance."""
        accepted = []
        rejected = []

        for c in candidates:
            name = (c.get("name") or "").strip()
            lat = c.get("latitude")
            lon = c.get("longitude")
            fclass = (c.get("feature_class") or "").upper()
            fcode = (c.get("feature_code") or "").upper()
            country = (c.get("country_code") or "").upper()
            pop = c.get("population") or 0

            # 1. Geographic scope check
            if country != "IN":
                rejected.append({"record": c, "reason": "Not in India"})
                continue

            # 2. Plausible coordinate check
            if lat is None or lon is None:
                rejected.append({"record": c, "reason": "Missing coordinates"})
                continue
            if not (INDIA_LAT_RANGE[0] <= lat <= INDIA_LAT_RANGE[1]) or not (INDIA_LON_RANGE[0] <= lon <= INDIA_LON_RANGE[1]):
                rejected.append({"record": c, "reason": f"Coordinates out of bounds for India: ({lat}, {lon})"})
                continue

            # 3. Explicitly rejected feature codes
            if fcode in REJECTED_FEATURE_CODES:
                rejected.append({"record": c, "reason": f"Rejected feature code: {fcode}"})
                continue

            # 4. Feature class check
            if fclass not in ALLOWED_FEATURE_CLASSES:
                rejected.append({"record": c, "reason": f"Non-tourism feature class: {fclass}"})
                continue

            # 5. Non-informative names check
            if not name or name.isdigit() or len(name) < 2:
                rejected.append({"record": c, "reason": "Invalid or empty name"})
                continue

            # 6. Village filtering
            if fcode == "PPL" and pop > 0 and pop < 1500 and fclass != "S" and fclass != "T":
                rejected.append({"record": c, "reason": f"Low-population village ({pop}) without tourism significance"})
                continue

            accepted.append(c)

        return accepted, rejected

    def save_raw_cache(self, records: List[Dict], filename: str = "geonames_india_candidates.json") -> Path:
        """Saves discovered records to raw JSON cache."""
        target = self.cache_dir / filename
        with open(target, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)
        return target

    def load_raw_cache(self, filename: str = "geonames_india_candidates.json") -> List[Dict]:
        """Loads cached raw records."""
        target = self.cache_dir / filename
        if not target.exists():
            return []
        with open(target, "r", encoding="utf-8") as f:
            return json.load(f)


def main():
    parser = argparse.ArgumentParser(description="GeoNames Destination Ingestion CLI")
    parser.add_argument("--check", action="store_true", help="Check if GEONAMES_USERNAME is configured")
    parser.add_argument("--test", action="store_true", help="Perform real test request to GeoNames API")
    parser.add_argument("--fetch", action="store_true", help="Fetch Indian destination candidates")
    parser.add_argument("--use-cache", action="store_true", help="Force loading from local raw cache")
    parser.add_argument("--target-count", type=int, default=120, help="Target records to discover")

    args = parser.parse_args()
    client = GeoNamesClient()

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
        print(f"GeoNames Test: success={success}, status_code={status_code}, message={result_msg}")
        sys.exit(0 if success else 1)

    # Fetch and filter
    try:
        if args.use_cache:
            records = client.load_raw_cache()
            print(f"[GeoNames] Loaded {len(records)} records from local raw cache.")
        else:
            records = client.fetch_candidates(target_count=args.target_count, allow_cache_fallback=True)
            print(f"[GeoNames] Discovered {len(records)} raw destination candidates.")

        accepted, rejected = client.filter_candidates(records)
        print(f"[GeoNames] Filtered: {len(accepted)} accepted candidates, {len(rejected)} rejected.")

    except ValueError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

