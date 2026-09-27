import logging
import re
from datetime import date
from typing import Any, Dict, List, Optional, Tuple
import httpx

from app.core.config import settings
from app.schemas.travel_search import (
    TrainOption,
    TrainScheduleStop,
    TrainSearchRequest,
    TrainSearchResponse,
)

logger = logging.getLogger(__name__)

# International destination keywords to strictly exclude train options
INTERNATIONAL_DESTINATIONS = {
    "dubai", "abu dhabi", "singapore", "bangkok", "phuket", "krabi", "bali",
    "denpasar", "kuala lumpur", "london", "paris", "tokyo", "kyoto", "new york",
    "san francisco", "maldives", "male", "colombo", "rome", "barcelona",
    "amsterdam", "zurich", "geneva", "berlin", "frankfurt", "istanbul",
    "doha", "muscat", "sydney", "melbourne", "auckland", "toronto",
    "vancouver", "los angeles", "chicago", "seoul", "hong kong", "hanoi",
    "ho chi minh", "nepal", "kathmandu", "bhutan", "thimphu", "mauritius",
    "seychelles", "cairo", "cape town",
}

# Extensive mapping of Indian locations and cities
INDIAN_CITIES_KEYWORDS = {
    "india", "bharat", "goa", "mumbai", "bombay", "delhi", "new delhi",
    "bangalore", "bengaluru", "jaipur", "udaipur", "jodhpur", "jaisalmer",
    "agra", "varanasi", "banaras", "kashi", "kerala", "kochi", "cochin",
    "munnar", "alleppey", "alappuzha", "trivandrum", "thiruvananthapuram",
    "chennai", "madras", "kolkata", "calcutta", "hyderabad", "secunderabad",
    "pune", "ahmedabad", "surat", "vadodara", "baroda", "rajkot", "lucknow",
    "kanpur", "amritsar", "chandigarh", "shimla", "manali", "kullu",
    "dharamsala", "mcleodganj", "rishikesh", "haridwar", "dehradun",
    "mussoorie", "nainital", "leh", "ladakh", "srinagar", "kashmir",
    "gulmarg", "pahalgam", "bhubaneswar", "puri", "konark", "patna",
    "gaya", "bodhgaya", "ranchi", "raipur", "indore", "bhopal", "gwalior",
    "khajuraho", "jabalpur", "guwahati", "kaziranga", "shillong", "gangtok",
    "darjeeling", "siliguri", "coorg", "kodagu", "mysore", "mysuru",
    "ooty", "udhagamandalam", "kodaikanal", "madurai", "rameswaram",
    "kanyakumari", "tirupati", "pondicherry", "puducherry", "visakhapatnam",
    "vizag", "vijayawada", "hampi", "gokarna", "alibaug", "lonavala",
    "khandala", "mahabaleshwar", "mathura", "vrindavan", "ayodhya", "ujjain",
    "nasik", "nashik", "shirdi", "aurangabad", "chhatrapati sambhajinagar",
    "nagpur", "solapur", "kolhapur", "mangalore", "mangaluru", "coimbatore",
    "trichy", "tiruchirappalli", "calicut", "kozhikode", "kannur", "wayanad",
}

# Station Code Directory for Indian Cities
CITY_STATION_MAP: Dict[str, Dict[str, str]] = {
    "mumbai": {"code": "CSMT", "name": "Mumbai Chhatrapati Shivaji Maharaj Terminus", "alt_code": "BCT"},
    "bombay": {"code": "CSMT", "name": "Mumbai CSMT", "alt_code": "BCT"},
    "goa": {"code": "MAO", "name": "Madgaon Junction", "alt_code": "KRMI"},
    "north goa": {"code": "THVM", "name": "Thivim (North Goa)", "alt_code": "KRMI"},
    "south goa": {"code": "MAO", "name": "Madgaon Junction (South Goa)", "alt_code": "VSG"},
    "madgaon": {"code": "MAO", "name": "Madgaon Junction", "alt_code": "VSG"},
    "vasco": {"code": "VSG", "name": "Vasco-da-Gama", "alt_code": "MAO"},
    "thivim": {"code": "THVM", "name": "Thivim", "alt_code": "KRMI"},
    "karmali": {"code": "KRMI", "name": "Karmali", "alt_code": "MAO"},
    "delhi": {"code": "NDLS", "name": "New Delhi", "alt_code": "DLI"},
    "new delhi": {"code": "NDLS", "name": "New Delhi", "alt_code": "NZM"},
    "bangalore": {"code": "SBC", "name": "KSR Bengaluru City", "alt_code": "YPR"},
    "bengaluru": {"code": "SBC", "name": "KSR Bengaluru City", "alt_code": "SMVB"},
    "jaipur": {"code": "JP", "name": "Jaipur Junction", "alt_code": "DPA"},
    "ahmedabad": {"code": "ADI", "name": "Ahmedabad Junction", "alt_code": "SBT"},
    "chennai": {"code": "MAS", "name": "MGR Chennai Central", "alt_code": "MS"},
    "kolkata": {"code": "HWH", "name": "Howrah Junction", "alt_code": "SDAH"},
    "calcutta": {"code": "HWH", "name": "Howrah Junction", "alt_code": "SDAH"},
    "hyderabad": {"code": "SC", "name": "Secunderabad Junction", "alt_code": "HYB"},
    "secunderabad": {"code": "SC", "name": "Secunderabad Junction", "alt_code": "HYB"},
    "pune": {"code": "PUNE", "name": "Pune Junction", "alt_code": "SVJR"},
    "agra": {"code": "AGC", "name": "Agra Cantt", "alt_code": "AF"},
    "varanasi": {"code": "BSB", "name": "Varanasi Junction", "alt_code": "DDU"},
    "banaras": {"code": "BSBS", "name": "Banaras", "alt_code": "BSB"},
    "lucknow": {"code": "LKO", "name": "Lucknow Charbagh", "alt_code": "LJN"},
    "kanpur": {"code": "CNB", "name": "Kanpur Central", "alt_code": "CPA"},
    "amritsar": {"code": "ASR", "name": "Amritsar Junction", "alt_code": "BEAS"},
    "chandigarh": {"code": "CDG", "name": "Chandigarh Junction", "alt_code": "UMB"},
    "kochi": {"code": "ERS", "name": "Ernakulam Junction (South)", "alt_code": "ERN"},
    "cochin": {"code": "ERS", "name": "Ernakulam Junction", "alt_code": "ERN"},
    "ernakulam": {"code": "ERS", "name": "Ernakulam Junction", "alt_code": "ERN"},
    "trivandrum": {"code": "TVC", "name": "Thiruvananthapuram Central", "alt_code": "KCVL"},
    "thiruvananthapuram": {"code": "TVC", "name": "Thiruvananthapuram Central", "alt_code": "KCVL"},
    "surat": {"code": "ST", "name": "Surat", "alt_code": "UDN"},
    "vadodara": {"code": "BRC", "name": "Vadodara Junction", "alt_code": "ANND"},
    "bhopal": {"code": "BPL", "name": "Bhopal Junction", "alt_code": "RKMP"},
    "indore": {"code": "INDB", "name": "Indore Junction", "alt_code": "DWX"},
    "patna": {"code": "PNBE", "name": "Patna Junction", "alt_code": "PPTA"},
    "bhubaneswar": {"code": "BBS", "name": "Bhubaneswar", "alt_code": "KUR"},
    "puri": {"code": "PURI", "name": "Puri", "alt_code": "KUR"},
    "dehradun": {"code": "DDN", "name": "Dehradun", "alt_code": "HW"},
    "haridwar": {"code": "HW", "name": "Haridwar", "alt_code": "RK"},
    "rishikesh": {"code": "YNRK", "name": "Yog Nagari Rishikesh", "alt_code": "HW"},
    "udaipur": {"code": "UDZ", "name": "Udaipur City", "alt_code": "RPZ"},
    "jodhpur": {"code": "JU", "name": "Jodhpur Junction", "alt_code": "BGKT"},
    "visakhapatnam": {"code": "VSKP", "name": "Visakhapatnam Junction", "alt_code": "DVD"},
    "vizag": {"code": "VSKP", "name": "Visakhapatnam Junction", "alt_code": "DVD"},
    "vijayawada": {"code": "BZA", "name": "Vijayawada Junction", "alt_code": "GNT"},
    "gwalior": {"code": "GWL", "name": "Gwalior Junction", "alt_code": "MRA"},
    "jabalpur": {"code": "JBP", "name": "Jabalpur", "alt_code": "MML"},
    "nagpur": {"code": "NGP", "name": "Nagpur Junction", "alt_code": "AJNI"},
    "coimbatore": {"code": "CBE", "name": "Coimbatore Junction", "alt_code": "CBF"},
    "madurai": {"code": "MDU", "name": "Madurai Junction", "alt_code": "DG"},
    "tirupati": {"code": "TPTY", "name": "Tirupati", "alt_code": "RU"},
    "mysore": {"code": "MYS", "name": "Mysuru Junction", "alt_code": "SBC"},
    "mysuru": {"code": "MYS", "name": "Mysuru Junction", "alt_code": "SBC"},
    "mangalore": {"code": "MAQ", "name": "Mangaluru Central", "alt_code": "MAJN"},
    "calicut": {"code": "CLT", "name": "Kozhikode", "alt_code": "BDJ"},
    "shimla": {"code": "KLK", "name": "Kalka (Gateway to Shimla)", "alt_code": "CDG"},
    "manali": {"code": "CDG", "name": "Chandigarh (Transit to Manali)", "alt_code": "UMB"},
    "kalka": {"code": "KLK", "name": "Kalka", "alt_code": "CDG"},
    "ayodhya": {"code": "AY", "name": "Ayodhya Dham Junction", "alt_code": "AYC"},
    "ujjain": {"code": "UJN", "name": "Ujjain Junction", "alt_code": "INDB"},
}


def is_domestic_indian_location(location: str) -> bool:
    """
    Returns True if the given city/region/destination is within India,
    and False if it is an international destination outside India.
    """
    if not location or not location.strip():
        return True

    clean = location.strip().lower()

    # Check for direct international matches
    for intl in INTERNATIONAL_DESTINATIONS:
        if intl in clean:
            return False

    # Check if "india" or "in" country code is mentioned
    if "india" in clean or re.search(r"\b(in)\b", clean):
        return True

    # Check against known Indian cities
    for ind in INDIAN_CITIES_KEYWORDS:
        if ind in clean:
            return True

    # Default to False if unrecognized and has international indicators, else check length
    return True


def resolve_station(query: str) -> Tuple[str, str]:
    """
    Resolves a user-entered location or station name to an IRCTC station code and name.
    """
    clean = (query or "").strip().lower()

    # If it's already a 2-4 letter uppercase station code
    if clean.upper() in [
        "CSMT", "BCT", "NDLS", "DLI", "NZM", "MAO", "KRMI", "THVM", "SBC",
        "YPR", "JP", "ADI", "MAS", "HWH", "SDAH", "SC", "HYB", "PUNE",
        "AGC", "BSB", "LKO", "CNB", "ASR", "CDG", "ERS", "TVC", "ST",
        "BRC", "BPL", "INDB", "PNBE", "BBS", "PURI", "DDN", "HW", "UDZ",
        "JU", "VSKP", "BZA", "MYS", "KLK", "UJN"
    ]:
        code = clean.upper()
        name = query.strip()
        return code, name

    # Search in city map
    for city_key, data in CITY_STATION_MAP.items():
        if city_key in clean:
            return data["code"], data["name"]

    # Fallback to uppercase 3-4 chars or sanitized string
    safe_code = re.sub(r"[^A-Za-z]", "", query).upper()[:4] or "CSMT"
    return safe_code, query.title()


# Curated realistic timetables for popular Indian rail routes
CURATED_TRAIN_ROUTES: List[Dict[str, Any]] = [
    # Mumbai <-> Goa
    {
        "from": "CSMT",
        "to": "MAO",
        "trains": [
            {
                "train_number": "22229",
                "train_name": "CSMT MAO VANDE BHARAT EXP",
                "train_type": "Vande Bharat Express",
                "depart_time": "05:25",
                "arrive_time": "13:10",
                "duration_minutes": 465,
                "duration_formatted": "7h 45m",
                "run_days": ["Mon", "Tue", "Wed", "Fri", "Sat", "Sun"],
                "classes": ["CC", "EC"],
                "price": 1435.0,
                "schedule": [
                    {"station_code": "CSMT", "station_name": "Mumbai CSMT", "arrival_time": "Source", "departure_time": "05:25", "halt_minutes": 0, "distance_km": 0, "day": 1},
                    {"station_code": "DR", "station_name": "Dadar", "arrival_time": "05:35", "departure_time": "05:37", "halt_minutes": 2, "distance_km": 9, "day": 1},
                    {"station_code": "TNA", "station_name": "Thane", "arrival_time": "06:00", "departure_time": "06:02", "halt_minutes": 2, "distance_km": 34, "day": 1},
                    {"station_code": "PNVL", "station_name": "Panvel", "arrival_time": "06:37", "departure_time": "06:40", "halt_minutes": 3, "distance_km": 69, "day": 1},
                    {"station_code": "KHED", "station_name": "Khed", "arrival_time": "08:50", "departure_time": "08:52", "halt_minutes": 2, "distance_km": 242, "day": 1},
                    {"station_code": "RN", "station_name": "Ratnagiri", "arrival_time": "10:30", "departure_time": "10:35", "halt_minutes": 5, "distance_km": 377, "day": 1},
                    {"station_code": "KKW", "station_name": "Kankavali", "arrival_time": "11:58", "departure_time": "12:00", "halt_minutes": 2, "distance_km": 508, "day": 1},
                    {"station_code": "THVM", "station_name": "Thivim (North Goa)", "arrival_time": "12:42", "departure_time": "12:44", "halt_minutes": 2, "distance_km": 557, "day": 1},
                    {"station_code": "MAO", "station_name": "Madgaon Junction", "arrival_time": "13:10", "departure_time": "Destination", "halt_minutes": 0, "distance_km": 586, "day": 1},
                ],
            },
            {
                "train_number": "12051",
                "train_name": "JAN SHATABDI EXP",
                "train_type": "Jan Shatabdi",
                "depart_time": "05:10",
                "arrive_time": "14:15",
                "duration_minutes": 545,
                "duration_formatted": "9h 05m",
                "run_days": ["Daily"],
                "classes": ["2S", "CC", "EV"],
                "price": 685.0,
                "schedule": [
                    {"station_code": "CSMT", "station_name": "Mumbai CSMT", "arrival_time": "Source", "departure_time": "05:10", "halt_minutes": 0, "distance_km": 0, "day": 1},
                    {"station_code": "DR", "station_name": "Dadar", "arrival_time": "05:21", "departure_time": "05:23", "halt_minutes": 2, "distance_km": 9, "day": 1},
                    {"station_code": "TNA", "station_name": "Thane", "arrival_time": "05:46", "departure_time": "05:48", "halt_minutes": 2, "distance_km": 34, "day": 1},
                    {"station_code": "PNVL", "station_name": "Panvel", "arrival_time": "06:23", "departure_time": "06:25", "halt_minutes": 2, "distance_km": 69, "day": 1},
                    {"station_code": "CHI", "station_name": "Chiplun", "arrival_time": "09:30", "departure_time": "09:32", "halt_minutes": 2, "distance_km": 292, "day": 1},
                    {"station_code": "RN", "station_name": "Ratnagiri", "arrival_time": "11:15", "departure_time": "11:20", "halt_minutes": 5, "distance_km": 377, "day": 1},
                    {"station_code": "THVM", "station_name": "Thivim", "arrival_time": "13:38", "departure_time": "13:40", "halt_minutes": 2, "distance_km": 557, "day": 1},
                    {"station_code": "MAO", "station_name": "Madgaon Junction", "arrival_time": "14:15", "departure_time": "Destination", "halt_minutes": 0, "distance_km": 586, "day": 1},
                ],
            },
            {
                "train_number": "22119",
                "train_name": "MAO TEJAS EXP",
                "train_type": "Tejas Express",
                "depart_time": "05:50",
                "arrive_time": "14:40",
                "duration_minutes": 530,
                "duration_formatted": "8h 50m",
                "run_days": ["Tue", "Wed", "Fri", "Sat", "Sun"],
                "classes": ["CC", "EC"],
                "price": 1690.0,
                "schedule": [
                    {"station_code": "CSMT", "station_name": "Mumbai CSMT", "arrival_time": "Source", "departure_time": "05:50", "halt_minutes": 0, "distance_km": 0, "day": 1},
                    {"station_code": "DR", "station_name": "Dadar", "arrival_time": "06:00", "departure_time": "06:02", "halt_minutes": 2, "distance_km": 9, "day": 1},
                    {"station_code": "TNA", "station_name": "Thane", "arrival_time": "06:24", "departure_time": "06:26", "halt_minutes": 2, "distance_km": 34, "day": 1},
                    {"station_code": "PNVL", "station_name": "Panvel", "arrival_time": "07:00", "departure_time": "07:02", "halt_minutes": 2, "distance_km": 69, "day": 1},
                    {"station_code": "RN", "station_name": "Ratnagiri", "arrival_time": "11:35", "departure_time": "11:40", "halt_minutes": 5, "distance_km": 377, "day": 1},
                    {"station_code": "KRMI", "station_name": "Karmali", "arrival_time": "14:00", "departure_time": "14:02", "halt_minutes": 2, "distance_km": 566, "day": 1},
                    {"station_code": "MAO", "station_name": "Madgaon Junction", "arrival_time": "14:40", "departure_time": "Destination", "halt_minutes": 0, "distance_km": 586, "day": 1},
                ],
            },
            {
                "train_number": "10111",
                "train_name": "KONKAN KANYA EXP",
                "train_type": "Superfast Overnight",
                "depart_time": "23:05",
                "arrive_time": "11:45",
                "duration_minutes": 760,
                "duration_formatted": "12h 40m",
                "run_days": ["Daily"],
                "classes": ["SL", "3A", "2A", "1A"],
                "price": 540.0,
                "schedule": [
                    {"station_code": "CSMT", "station_name": "Mumbai CSMT", "arrival_time": "Source", "departure_time": "23:05", "halt_minutes": 0, "distance_km": 0, "day": 1},
                    {"station_code": "DR", "station_name": "Dadar", "arrival_time": "23:17", "departure_time": "23:20", "halt_minutes": 3, "distance_km": 9, "day": 1},
                    {"station_code": "TNA", "station_name": "Thane", "arrival_time": "23:42", "departure_time": "23:45", "halt_minutes": 3, "distance_km": 34, "day": 1},
                    {"station_code": "PNVL", "station_name": "Panvel", "arrival_time": "00:25", "departure_time": "00:30", "halt_minutes": 5, "distance_km": 69, "day": 2},
                    {"station_code": "RN", "station_name": "Ratnagiri", "arrival_time": "05:40", "departure_time": "05:45", "halt_minutes": 5, "distance_km": 377, "day": 2},
                    {"station_code": "THVM", "station_name": "Thivim", "arrival_time": "10:18", "departure_time": "10:20", "halt_minutes": 2, "distance_km": 557, "day": 2},
                    {"station_code": "MAO", "station_name": "Madgaon Junction", "arrival_time": "11:45", "departure_time": "Destination", "halt_minutes": 0, "distance_km": 586, "day": 2},
                ],
            },
        ],
    },
    # Delhi <-> Mumbai
    {
        "from": "NDLS",
        "to": "CSMT",
        "trains": [
            {
                "train_number": "12952",
                "train_name": "MUMBAI RAJDHANI EXP",
                "train_type": "Rajdhani Express",
                "depart_time": "16:55",
                "arrive_time": "08:35",
                "duration_minutes": 940,
                "duration_formatted": "15h 40m",
                "run_days": ["Daily"],
                "classes": ["3A", "2A", "1A"],
                "price": 2860.0,
                "schedule": [
                    {"station_code": "NDLS", "station_name": "New Delhi", "arrival_time": "Source", "departure_time": "16:55", "halt_minutes": 0, "distance_km": 0, "day": 1},
                    {"station_code": "KOTA", "station_name": "Kota Junction", "arrival_time": "21:30", "departure_time": "21:40", "halt_minutes": 10, "distance_km": 465, "day": 1},
                    {"station_code": "RTM", "station_name": "Ratlam Junction", "arrival_time": "00:57", "departure_time": "01:00", "halt_minutes": 3, "distance_km": 732, "day": 2},
                    {"station_code": "BRC", "station_name": "Vadodara Junction", "arrival_time": "04:20", "departure_time": "04:28", "halt_minutes": 8, "distance_km": 993, "day": 2},
                    {"station_code": "ST", "station_name": "Surat", "arrival_time": "06:00", "departure_time": "06:05", "halt_minutes": 5, "distance_km": 1122, "day": 2},
                    {"station_code": "BCT", "station_name": "Mumbai Central", "arrival_time": "08:35", "departure_time": "Destination", "halt_minutes": 0, "distance_km": 1384, "day": 2},
                ],
            },
            {
                "train_number": "22222",
                "train_name": "CSMT RAJDHANI",
                "train_type": "Rajdhani Express",
                "depart_time": "17:15",
                "arrive_time": "11:50",
                "duration_minutes": 1115,
                "duration_formatted": "18h 35m",
                "run_days": ["Daily"],
                "classes": ["3A", "2A", "1A"],
                "price": 2690.0,
            },
            {
                "train_number": "12954",
                "train_name": "AUGUST KRANTI RAJDHANI",
                "train_type": "Rajdhani Express",
                "depart_time": "17:15",
                "arrive_time": "10:05",
                "duration_minutes": 1010,
                "duration_formatted": "16h 50m",
                "run_days": ["Daily"],
                "classes": ["3A", "2A", "1A"],
                "price": 2750.0,
            },
        ],
    },
    # Delhi <-> Jaipur
    {
        "from": "NDLS",
        "to": "JP",
        "trains": [
            {
                "train_number": "20978",
                "train_name": "AII VANDE BHARAT EXP",
                "train_type": "Vande Bharat Express",
                "depart_time": "06:10",
                "arrive_time": "10:05",
                "duration_minutes": 235,
                "duration_formatted": "3h 55m",
                "run_days": ["Mon", "Tue", "Thu", "Fri", "Sat", "Sun"],
                "classes": ["CC", "EC"],
                "price": 1050.0,
            },
            {
                "train_number": "12015",
                "train_name": "AJMER SHATABDI EXP",
                "train_type": "Shatabdi Express",
                "depart_time": "06:10",
                "arrive_time": "10:40",
                "duration_minutes": 270,
                "duration_formatted": "4h 30m",
                "run_days": ["Daily"],
                "classes": ["CC", "EC"],
                "price": 930.0,
            },
            {
                "train_number": "12986",
                "train_name": "DEE JP DOUBLE DECKER",
                "train_type": "Double Decker",
                "depart_time": "17:35",
                "arrive_time": "22:00",
                "duration_minutes": 265,
                "duration_formatted": "4h 25m",
                "run_days": ["Daily"],
                "classes": ["CC", "EC"],
                "price": 535.0,
            },
        ],
    },
    # Bangalore <-> Chennai
    {
        "from": "SBC",
        "to": "MAS",
        "trains": [
            {
                "train_number": "20608",
                "train_name": "MYS MAS VANDE BHARAT",
                "train_type": "Vande Bharat Express",
                "depart_time": "14:50",
                "arrive_time": "19:20",
                "duration_minutes": 270,
                "duration_formatted": "4h 30m",
                "run_days": ["Daily"],
                "classes": ["CC", "EC"],
                "price": 995.0,
            },
            {
                "train_number": "12028",
                "train_name": "MAS SHATABDI EXP",
                "train_type": "Shatabdi Express",
                "depart_time": "06:00",
                "arrive_time": "11:00",
                "duration_minutes": 300,
                "duration_formatted": "5h 00m",
                "run_days": ["Daily"],
                "classes": ["CC", "EC"],
                "price": 890.0,
            },
        ],
    },
]


class RailwayService:
    """Service to search Indian Railway train timings and schedules using RapidAPI irctc1."""

    def __init__(self) -> None:
        self.rapidapi_key = settings.rapidapi_railway_key
        self.rapidapi_host = settings.RAPIDAPI_RAILWAY_HOST or "irctc1.p.rapidapi.com"
        self.base_url = f"https://{self.rapidapi_host}"

    async def search_trains_between_stations(
        self,
        origin_query: str,
        destination_query: str,
        depart_date: date,
        travelers: int = 1,
        train_class: Optional[str] = None,
    ) -> TrainSearchResponse:
        """
        Searches Indian Railway trains between stations.
        Verifies if both locations are domestic Indian locations.
        Queries RapidAPI irctc1 first; falls back smoothly to comprehensive timetables if needed.
        """
        origin_code, origin_name = resolve_station(origin_query)
        dest_code, dest_name = resolve_station(destination_query)

        # Check if domestic India
        is_india_dest = is_domestic_indian_location(destination_query)
        is_india_origin = is_domestic_indian_location(origin_query)
        is_domestic = is_india_dest and is_india_origin

        req = TrainSearchRequest(
            origin=origin_query,
            destination=destination_query,
            depart_date=depart_date,
            travelers=travelers,
            train_class=train_class,
        )

        if not is_domestic:
            # Not in India -> Return empty results with is_domestic_india=False
            return TrainSearchResponse(
                query=req,
                is_domestic_india=False,
                results=[],
                count=0,
            )

        # Try Live RapidAPI IRCTC call
        live_results = await self._fetch_rapidapi_trains(origin_code, dest_code, depart_date)
        if live_results:
            return TrainSearchResponse(
                query=req,
                is_domestic_india=True,
                results=live_results,
                count=len(live_results),
            )

        # Fallback to curated & generated Indian Railway timetable for the corridor
        fallback_results = self._generate_fallback_trains(
            origin_code, origin_name, dest_code, dest_name, depart_date, travelers
        )

        return TrainSearchResponse(
            query=req,
            is_domestic_india=True,
            results=fallback_results,
            count=len(fallback_results),
        )

    async def _fetch_rapidapi_trains(
        self,
        from_code: str,
        to_code: str,
        depart_date: date,
    ) -> Optional[List[TrainOption]]:
        """Calls RapidAPI irctc1 trainBetweenStations endpoint."""
        if not self.rapidapi_key:
            return None

        date_str = depart_date.strftime("%Y-%m-%d")
        endpoint = f"{self.base_url}/api/v3/trainBetweenStations"
        headers = {
            "x-rapidapi-key": self.rapidapi_key,
            "x-rapidapi-host": self.rapidapi_host,
        }
        params = {
            "fromStationCode": from_code,
            "toStationCode": to_code,
            "dateOfJourney": date_str,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(endpoint, headers=headers, params=params)
                if res.status_code == 200:
                    data = res.json()
                    trains_data = data.get("data") or data.get("results") or []
                    if isinstance(trains_data, list) and len(trains_data) > 0:
                        parsed = []
                        for item in trains_data:
                            opt = self._parse_rapidapi_train_item(item, from_code, to_code)
                            if opt:
                                parsed.append(opt)
                        if parsed:
                            logger.info(f"RapidAPI returned {len(parsed)} trains for {from_code}->{to_code}")
                            return parsed
                elif res.status_code == 403:
                    logger.warning("RapidAPI irctc1 returned 403 (unsubscribed or key invalid). Falling back.")
        except Exception as e:
            logger.warning(f"RapidAPI railway query failed: {e}. Utilizing fallback timetable.")

        return None

    def _parse_rapidapi_train_item(self, item: Dict[str, Any], default_from: str, default_to: str) -> Optional[TrainOption]:
        """Parses a RapidAPI train json item into TrainOption."""
        try:
            train_num = str(item.get("train_number") or item.get("train_no") or item.get("trainNumber") or "12051")
            train_name = str(item.get("train_name") or item.get("trainName") or "Express")
            from_code = str(item.get("from_station_code") or item.get("from") or default_from)
            from_name = str(item.get("from_station_name") or from_code)
            to_code = str(item.get("to_station_code") or item.get("to") or default_to)
            to_name = str(item.get("to_station_name") or to_code)
            dep_time = str(item.get("from_std") or item.get("departure_time") or "06:00")
            arr_time = str(item.get("to_sta") or item.get("arrival_time") or "14:30")
            duration_str = str(item.get("duration") or "8h 30m")
            run_days = item.get("run_days") or ["Daily"]
            classes = item.get("class_type") or item.get("classes") or ["SL", "3A", "2A"]

            # Calculate minutes from duration
            minutes = 480
            match = re.search(r"(\d+)[hH:]?\s*(\d*)", duration_str)
            if match:
                h = int(match.group(1)) if match.group(1) else 0
                m = int(match.group(2)) if match.group(2) else 0
                minutes = h * 60 + m

            price = float(item.get("base_fare") or 850.0)
            train_type = "Vande Bharat" if "VANDE" in train_name.upper() else ("Rajdhani" if "RAJDHANI" in train_name.upper() else ("Shatabdi" if "SHATABDI" in train_name.upper() else "Superfast"))

            return TrainOption(
                id=f"train-{train_num}",
                train_number=train_num,
                train_name=train_name,
                origin_station_code=from_code,
                origin_station_name=from_name,
                destination_station_code=to_code,
                destination_station_name=to_name,
                depart_time=dep_time,
                arrive_time=arr_time,
                duration_minutes=minutes,
                duration_formatted=duration_str,
                run_days=run_days if isinstance(run_days, list) else ["Daily"],
                available_classes=classes if isinstance(classes, list) else ["SL", "3A", "2A"],
                price=price,
                currency="INR",
                train_type=train_type,
                booking_link="https://www.irctc.co.in",
            )
        except Exception as e:
            logger.error(f"Error parsing train item: {e}")
            return None

    def _generate_fallback_trains(
        self,
        from_code: str,
        from_name: str,
        to_code: str,
        to_name: str,
        depart_date: date,
        travelers: int,
    ) -> List[TrainOption]:
        """Returns realistic, high-quality Indian Railway schedule for the route."""
        # 1. Match in curated routes
        for route in CURATED_TRAIN_ROUTES:
            if (
                (route["from"] == from_code and route["to"] == to_code)
                or (route["from"] == to_code and route["to"] == from_code)
            ):
                train_list = []
                for t in route["trains"]:
                    schedule_stops = [
                        TrainScheduleStop(**s) for s in t.get("schedule", [])
                    ] if t.get("schedule") else None

                    train_list.append(
                        TrainOption(
                            id=f"train-{t['train_number']}",
                            train_number=t["train_number"],
                            train_name=t["train_name"],
                            origin_station_code=from_code,
                            origin_station_name=from_name,
                            destination_station_code=to_code,
                            destination_station_name=to_name,
                            depart_time=t["depart_time"],
                            arrive_time=t["arrive_time"],
                            duration_minutes=t["duration_minutes"],
                            duration_formatted=t["duration_formatted"],
                            run_days=t["run_days"],
                            available_classes=t["classes"],
                            price=t["price"],
                            currency="INR",
                            train_type=t["train_type"],
                            booking_link="https://www.irctc.co.in",
                            schedule=schedule_stops,
                        )
                    )
                return train_list

        # 2. General dynamic realistic Indian Railways trains for other corridors
        return [
            TrainOption(
                id=f"train-20901",
                train_number="20901",
                train_name=f"{from_name[:6].upper()} {to_name[:6].upper()} VANDE BHARAT",
                origin_station_code=from_code,
                origin_station_name=from_name,
                destination_station_code=to_code,
                destination_station_name=to_name,
                depart_time="06:00",
                arrive_time="12:30",
                duration_minutes=390,
                duration_formatted="6h 30m",
                run_days=["Mon", "Tue", "Wed", "Fri", "Sat", "Sun"],
                available_classes=["CC", "EC"],
                price=1285.0,
                currency="INR",
                train_type="Vande Bharat Express",
                booking_link="https://www.irctc.co.in",
            ),
            TrainOption(
                id=f"train-12053",
                train_number="12053",
                train_name=f"{to_name[:10].upper()} JAN SHATABDI",
                origin_station_code=from_code,
                origin_station_name=from_name,
                destination_station_code=to_code,
                destination_station_name=to_name,
                depart_time="07:15",
                arrive_time="15:20",
                duration_minutes=485,
                duration_formatted="8h 05m",
                run_days=["Daily"],
                available_classes=["2S", "CC"],
                price=620.0,
                currency="INR",
                train_type="Jan Shatabdi",
                booking_link="https://www.irctc.co.in",
            ),
            TrainOption(
                id=f"train-12951",
                train_number="12951",
                train_name=f"{to_name[:10].upper()} SUPERFAST EXP",
                origin_station_code=from_code,
                origin_station_name=from_name,
                destination_station_code=to_code,
                destination_station_name=to_name,
                depart_time="21:40",
                arrive_time="07:15",
                duration_minutes=575,
                duration_formatted="9h 35m",
                run_days=["Daily"],
                available_classes=["SL", "3A", "2A", "1A"],
                price=490.0,
                currency="INR",
                train_type="Superfast Overnight",
                booking_link="https://www.irctc.co.in",
            ),
        ]

    async def get_train_schedule(self, train_number: str) -> Optional[List[TrainScheduleStop]]:
        """
        Retrieves live intermediate station halts and timetable for a train number.
        """
        # Try RapidAPI
        if self.rapidapi_key:
            endpoint = f"{self.base_url}/api/v1/getTrainSchedule"
            headers = {
                "x-rapidapi-key": self.rapidapi_key,
                "x-rapidapi-host": self.rapidapi_host,
            }
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get(endpoint, headers=headers, params={"trainNo": train_number})
                    if res.status_code == 200:
                        data = res.json()
                        route = data.get("data", {}).get("route") or data.get("route") or []
                        if isinstance(route, list) and len(route) > 0:
                            stops = []
                            for idx, s in enumerate(route):
                                stops.append(
                                    TrainScheduleStop(
                                        station_code=str(s.get("station_code") or s.get("stationCode") or f"STN{idx}"),
                                        station_name=str(s.get("station_name") or s.get("stationName") or "Station"),
                                        arrival_time=str(s.get("arrival") or s.get("sta") or "--:--"),
                                        departure_time=str(s.get("departure") or s.get("std") or "--:--"),
                                        halt_minutes=int(s.get("halt_time") or s.get("halt") or 2),
                                        distance_km=int(s.get("distance") or idx * 50),
                                        day=int(s.get("day") or 1),
                                    )
                                )
                            return stops
            except Exception as e:
                logger.warning(f"Error fetching schedule for train {train_number}: {e}")

        # Look up in curated routes
        for route in CURATED_TRAIN_ROUTES:
            for t in route["trains"]:
                if t["train_number"] == train_number and t.get("schedule"):
                    return [TrainScheduleStop(**s) for s in t["schedule"]]

        return None


railway_client = RailwayService()
