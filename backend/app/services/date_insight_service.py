import httpx
from datetime import datetime, date, timedelta
from typing import List, Tuple, Optional
from app.schemas.trip_wizard import WeatherOutlook, DateInsightResponse

OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
NAGER_HOLIDAYS_URL = "https://date.nager.at/api/v3/PublicHolidays"


def parse_date(date_str: str) -> date:
    """Safely parses YYYY-MM-DD string to date object."""
    try:
        return datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
    except Exception:
        return datetime.now().date() + timedelta(days=14)


def map_wmo_code_to_condition(code: Optional[int]) -> str:
    """Translates WMO weather codes into intuitive traveler weather summaries."""
    if code is None:
        return "Partly Cloudy"
    if code == 0:
        return "Clear Sky"
    elif code in (1, 2, 3):
        return "Partly Cloudy"
    elif code in (45, 48):
        return "Foggy & Misty"
    elif code in (51, 53, 55, 61, 63, 65):
        return "Light Rain / Showers"
    elif code in (66, 67, 80, 81, 82):
        return "Passing Rain Showers"
    elif code in (71, 73, 75, 85, 86):
        return "Snow Showers"
    elif code in (95, 96, 99):
        return "Thunderstorms"
    return "Pleasant & Clear"


def estimate_crowd(latitude: float, start_date: date, holiday_overlap: bool) -> Tuple[int, str]:
    """
    Deterministic crowd heuristic based on hemisphere seasonality and public holiday overlap.
    """
    month = start_date.month
    hemisphere_summer = {6, 7, 8} if latitude >= 0 else {12, 1, 2}
    hemisphere_winter_break = {12, 1} if latitude >= 0 else {6, 7}

    base = (
        75
        if month in hemisphere_summer or month in hemisphere_winter_break
        else 45
        if month in {3, 4, 5, 9, 10, 11}
        else 55
    )
    score = min(100, base + (20 if holiday_overlap else 0))
    label = "Low" if score < 45 else "Moderate" if score < 70 else "High"
    return score, label


async def fetch_weather_outlook(
    lat: float,
    lon: float,
    start_d: date,
    end_d: date,
) -> WeatherOutlook:
    """
    Retrieves weather forecast from Open-Meteo if within 16-day window,
    or calculates typical seasonal averages if planned further out.
    """
    today = datetime.now().date()
    days_until_start = (start_d - today).days

    # 1. Real-time forecast window (up to 16 days out)
    if 0 <= days_until_start <= 16:
        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
                "timezone": "auto",
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(OPEN_METEO_FORECAST_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json().get("daily", {})
                    max_temps = data.get("temperature_2m_max") or [28.0]
                    min_temps = data.get("temperature_2m_min") or [20.0]
                    precip_probs = data.get("precipitation_probability_max") or [15]
                    codes = data.get("weathercode") or [1]

                    avg_max = round(sum(max_temps) / len(max_temps), 1)
                    avg_min = round(sum(min_temps) / len(min_temps), 1)
                    max_precip = max(precip_probs)
                    primary_code = codes[0] if codes else 1

                    return WeatherOutlook(
                        temp_max=avg_max,
                        temp_min=avg_min,
                        precipitation_probability=int(max_precip),
                        condition=map_wmo_code_to_condition(primary_code),
                        is_forecast=True,
                        daily_summary=f"Expected highs of {avg_max}°C and lows of {avg_min}°C with {max_precip}% chance of rain.",
                    )
        except Exception:
            pass

    # 2. Typical seasonal weather estimate (further out than 16 days or API fallback)
    month = start_d.month
    # Warm tropical/subtropical baseline for typical Indian & tourist destinations
    if month in {5, 6, 7}:
        temp_high = 32.0 if lat < 30 else 24.0
        temp_low = 24.0 if lat < 30 else 14.0
        precip = 45 if lat < 28 else 20
        cond = "Warm & Humid" if lat < 28 else "Pleasant Alpine"
    elif month in {11, 12, 1, 2}:
        temp_high = 27.0 if lat < 25 else 16.0
        temp_low = 18.0 if lat < 25 else 4.0
        precip = 10
        cond = "Cool & Sunny" if lat < 25 else "Brisk Winter"
    else:
        temp_high = 29.0
        temp_low = 20.0
        precip = 15
        cond = "Sunny & Mild"

    return WeatherOutlook(
        temp_max=temp_high,
        temp_min=temp_low,
        precipitation_probability=precip,
        condition=cond,
        is_forecast=False,
        daily_summary=f"Typical seasonal weather: average highs around {temp_high}°C, lows around {temp_low}°C.",
    )


async def check_public_holidays(
    start_d: date,
    end_d: date,
    country_code: str = "IN",
) -> Tuple[bool, List[str]]:
    """
    Checks for public holiday overlap using Nager.Date API within [start_d - 2, end_d + 2].
    """
    window_start = start_d - timedelta(days=2)
    window_end = end_d + timedelta(days=2)
    holidays_found: List[str] = []

    years = {start_d.year, end_d.year}
    for year in years:
        try:
            url = f"{NAGER_HOLIDAYS_URL}/{year}/{country_code.upper()}"
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    items = resp.json()
                    for h in items:
                        h_date_str = h.get("date")
                        if h_date_str:
                            h_date = parse_date(h_date_str)
                            if window_start <= h_date <= window_end:
                                name = h.get("localName") or h.get("name") or "Public Holiday"
                                if name not in holidays_found:
                                    holidays_found.append(name)
        except Exception:
            pass

    return (len(holidays_found) > 0, holidays_found)


async def get_date_insights(
    lat: float,
    lon: float,
    start_date_str: str,
    end_date_str: str,
    country_code: str = "IN",
) -> DateInsightResponse:
    """
    Aggregates weather outlook, public holidays, and deterministic crowd estimates.
    """
    start_d = parse_date(start_date_str)
    end_d = parse_date(end_date_str)
    if end_d < start_d:
        end_d = start_d + timedelta(days=3)

    # 1. Weather
    weather = await fetch_weather_outlook(lat, lon, start_d, end_d)

    # 2. Public Holidays
    has_holiday, holidays = await check_public_holidays(start_d, end_d, country_code)

    # 3. Crowd Heuristic
    crowd_score, crowd_label = estimate_crowd(lat, start_d, has_holiday)

    disclaimer = "Crowd level is a seasonal + public-holiday estimate, not live occupancy data."

    return DateInsightResponse(
        weather=weather,
        crowd_score=crowd_score,
        crowd_label=crowd_label,
        crowd_disclaimer=disclaimer,
        holiday_overlap=has_holiday,
        holidays=holidays,
    )
