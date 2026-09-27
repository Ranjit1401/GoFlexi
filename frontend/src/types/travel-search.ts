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
  airline_logo?: string | null;
  flight_number?: string | null;
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
  booking_link?: string | null;
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

export interface TrainScheduleStop {
  station_code: string;
  station_name: string;
  arrival_time: string;
  departure_time: string;
  halt_minutes: number;
  distance_km: number;
  day: number;
}

export interface TrainOption {
  id: string;
  train_number: string;
  train_name: string;
  origin_station_code: string;
  origin_station_name: string;
  destination_station_code: string;
  destination_station_name: string;
  depart_time: string;
  arrive_time: string;
  duration_minutes: number;
  duration_formatted: string;
  run_days: string[];
  available_classes: string[];
  price: number;
  currency: string;
  train_type: string;
  booking_link?: string | null;
  schedule?: TrainScheduleStop[] | null;
}

export interface TrainSearchRequest {
  origin: string;
  destination: string;
  depart_date: string;
  travelers?: number;
  train_class?: string;
}

export interface TrainSearchResponse {
  query: TrainSearchRequest;
  is_domestic_india: boolean;
  results: TrainOption[];
  count: number;
}

