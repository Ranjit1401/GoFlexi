export interface AirportSuggestion {
  skyId: string;
  entityId: string;
  name: string;
  city: string;
  country: string;
}

export interface FlightSearchRequest {
  origin: string;
  destination: string;
  depart_date: string;
  return_date?: string | null;
  adults?: number;
  cabin_class?: string;
  currency?: string;
}

export interface FlightOption {
  id: string;
  airline: string;
  price: number;
  currency: string;
  depart_time: string;
  arrive_time: string;
  duration_minutes: number;
  stops: number;
  origin_airport: string;
  destination_airport: string;
  booking_deeplink?: string | null;
}

export interface FlightSearchResponse {
  query: FlightSearchRequest;
  results: FlightOption[];
  count: number;
}

export interface HotelSearchRequest {
  destination: string;
  check_in: string;
  check_out: string;
  adults?: number;
  rooms?: number;
  currency?: string;
}

export interface HotelOption {
  id: string;
  name: string;
  star_rating?: number | null;
  price_per_night: number;
  currency: string;
  thumbnail_url?: string | null;
  address?: string | null;
  rating_score?: number | null;
  review_count?: number | null;
}

export interface HotelSearchResponse {
  query: HotelSearchRequest;
  results: HotelOption[];
  count: number;
}

export interface HotelDestinationSuggestion {
  entityId: string;
  name: string;
  entityType?: string;
}
