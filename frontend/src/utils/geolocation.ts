/**
 * GoFlexi — Browser Geolocation & Reverse Geocoding Utility
 * 
 * Tracks the user's current GPS coordinates using the HTML5 Geolocation API
 * and converts them into a friendly city/region name for origin & departure points.
 */

export interface DetectedLocation {
  city: string;
  state?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  formatted: string;
}

// Fallback lookup table for major coordinates if external reverse geocoder is throttled or offline
const KNOWN_METRO_COORDINATES: Array<{ name: string; lat: number; lon: number }> = [
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
  { name: 'Goa', lat: 15.2993, lon: 74.124 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
];

function findNearestKnownCity(lat: number, lon: number): string | null {
  let closest: string | null = null;
  let minDistance = Infinity;

  for (const city of KNOWN_METRO_COORDINATES) {
    const dLat = city.lat - lat;
    const dLon = city.lon - lon;
    const distSq = dLat * dLat + dLon * dLon;
    // within ~1.2 degrees (~130 km)
    if (distSq < 1.44 && distSq < minDistance) {
      minDistance = distSq;
      closest = city.name;
    }
  }

  return closest;
}

/**
 * Requests the user's current GPS position via browser Geolocation API
 * and reverse geocodes it to a city name.
 */
export async function getCurrentLocationCity(): Promise<DetectedLocation> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    });
  });

  const { latitude, longitude } = position.coords;

  // Try OpenStreetMap Nominatim reverse geocode (Free & reliable for cities worldwide)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const cityName =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.village ||
        addr.suburb ||
        addr.state_district ||
        addr.county ||
        addr.state;

      const stateName = addr.state;
      const countryName = addr.country || 'India';
      const countryCode = (addr.country_code || 'in').toUpperCase();

      if (cityName) {
        return {
          city: cityName,
          state: stateName,
          country: countryName,
          countryCode,
          latitude,
          longitude,
          formatted: [cityName, countryName].filter(Boolean).join(', '),
        };
      }
    }
  } catch {
    // If Nominatim timed out or failed (e.g. rate limit), use nearest known metro
  }

  // Fallback to nearest metro
  const fallbackCity = findNearestKnownCity(latitude, longitude) || 'My Current Location';

  return {
    city: fallbackCity,
    latitude,
    longitude,
    formatted: fallbackCity,
  };
}
