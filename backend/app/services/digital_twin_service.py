from __future__ import annotations

from datetime import datetime, timezone
from typing import List

import httpx

from app.schemas.trip_wizard import DigitalTwinImpact, DigitalTwinResponse, DigitalTwinScenario, SocialSignal
from app.services.date_insight_service import fetch_weather_outlook, parse_date

REDDIT_SEARCH_URL = "https://www.reddit.com/search.json"


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def direction(value: float) -> str:
    if value > 1.0:
        return "increase"
    if value < -1.0:
        return "decrease"
    return "stable"


def build_impacts(rainfall_mm: float, temperature_c: float, storm_hours: float) -> tuple[int, int, List[DigitalTwinImpact]]:
    rain_factor = clamp(rainfall_mm / 100.0, 0, 2)
    storm_factor = clamp(storm_hours / 12.0, 0, 2)
    heat_factor = clamp(max(temperature_c - 32.0, 0) / 10.0, 0, 2)

    transport = clamp(rain_factor * 34 + storm_factor * 28 + heat_factor * 8, 0, 95)
    outdoor = -clamp(rain_factor * 42 + storm_factor * 30 + heat_factor * 12, 0, 95)
    indoor = clamp(rain_factor * 18 + storm_factor * 14 + heat_factor * 7, 0, 70)
    hotel = clamp(rain_factor * 11 + storm_factor * 9 + heat_factor * 3, 0, 35)

    risk = int(round(clamp(transport * 0.40 + abs(outdoor) * 0.35 + indoor * 0.10 + hotel * 0.15, 0, 100)))
    uncertainty = int(round(clamp(8 + risk * 0.12, 8, 22)))

    impacts = [
        DigitalTwinImpact(
            name="Transport movement",
            change_pct=round(transport, 1),
            uncertainty_pct=uncertainty,
            direction=direction(transport),
            explanation="Higher rainfall and storm duration increase the simulated probability of delays and slower movement.",
        ),
        DigitalTwinImpact(
            name="Outdoor activity demand",
            change_pct=round(outdoor, 1),
            uncertainty_pct=uncertainty + 2,
            direction=direction(outdoor),
            explanation="Outdoor attraction demand shifts downward as rain and prolonged storms make outdoor plans less attractive.",
        ),
        DigitalTwinImpact(
            name="Indoor activity demand",
            change_pct=round(indoor, 1),
            uncertainty_pct=uncertainty + 1,
            direction=direction(indoor),
            explanation="Museums, malls, restaurants and other indoor options receive a simulated demand uplift during poor weather.",
        ),
        DigitalTwinImpact(
            name="Hotel occupancy pressure",
            change_pct=round(hotel, 1),
            uncertainty_pct=uncertainty + 2,
            direction=direction(hotel),
            explanation="The model simulates higher pressure on nearby indoor accommodation when movement and outdoor activity are disrupted.",
        ),
    ]
    return risk, uncertainty, impacts


async def fetch_social_signals(destination: str) -> tuple[List[SocialSignal], str]:
    query = f'"{destination}" (rain OR storm OR flood OR weather OR travel)'
    try:
        headers = {"User-Agent": "GoFlexi-DigitalTwin/1.0"}
        async with httpx.AsyncClient(timeout=7.0, headers=headers) as client:
            response = await client.get(REDDIT_SEARCH_URL, params={"q": query, "sort": "new", "t": "week", "limit": 5, "raw_json": 1})
            if response.status_code != 200:
                return [], f"Public social signal service returned HTTP {response.status_code}."
            children = response.json().get("data", {}).get("children", [])
            signals: List[SocialSignal] = []
            for child in children:
                data = child.get("data") or {}
                title = (data.get("title") or "").strip()
                if not title:
                    continue
                created = data.get("created_utc")
                created_iso = datetime.fromtimestamp(created, tz=timezone.utc).isoformat() if created else None
                permalink = data.get("permalink")
                signals.append(
                    SocialSignal(
                        title=title[:180],
                        score=int(data.get("score") or 0),
                        created_at=created_iso,
                        source="Reddit public search",
                        url=f"https://www.reddit.com{permalink}" if permalink else None,
                    )
                )
            return signals, "Public traveler discussions from Reddit search."
    except Exception:
        return [], "Public social signal lookup was unavailable for this update."


async def get_digital_twin(
    destination: str,
    lat: float,
    lon: float,
    start_date: str,
    end_date: str,
    rainfall_mm: float | None = None,
    temperature_c: float | None = None,
    storm_duration_hours: float | None = None,
) -> DigitalTwinResponse:
    start_d = parse_date(start_date)
    end_d = parse_date(end_date)
    live_weather = await fetch_weather_outlook(lat, lon, start_d, end_d)

    rain = float(rainfall_mm if rainfall_mm is not None else live_weather.precipitation_probability * 0.8)
    temp = float(temperature_c if temperature_c is not None else (live_weather.temp_max + live_weather.temp_min) / 2)
    storm = float(storm_duration_hours if storm_duration_hours is not None else max(1.0, live_weather.precipitation_probability / 20.0))

    risk, uncertainty, impacts = build_impacts(rain, temp, storm)
    social_signals, social_status = await fetch_social_signals(destination)
    if social_signals:
        # Public signals add a small, bounded uncertainty adjustment; they never fabricate a signal.
        uncertainty = min(30, uncertainty + min(5, len(social_signals)))

    return DigitalTwinResponse(
        destination=destination,
        live_weather=live_weather,
        scenario=DigitalTwinScenario(
            rainfall_mm=round(rain, 1),
            temperature_c=round(temp, 1),
            storm_duration_hours=round(storm, 1),
        ),
        system_risk_probability=risk,
        system_risk_uncertainty=uncertainty,
        impacts=impacts,
        social_signals=social_signals,
        social_signal_status=social_status,
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
