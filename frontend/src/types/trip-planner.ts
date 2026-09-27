import { FlightOption, HotelOption } from './travel-search';

export interface TripLocation {
  id: string;
  name: string;
  type: 'origin' | 'destination' | 'flight' | 'hotel' | 'stay' | 'activity' | 'restaurant' | 'transport' | string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  day?: number;
  time_block?: 'morning' | 'afternoon' | 'evening' | string;
  description?: string;
  destination_id?: string;
  poi_id?: string;
  rating?: number;
  preview_image?: string;
  metadata?: Record<string, any>;
}

export interface TripRoute {
  id: string;
  origin_id: string;
  destination_id: string;
  type: string;
  from_coords: [number, number];
  to_coords: [number, number];
  label?: string;
  distance_km?: number;
}

export interface TripPlanNode {
  id: string;
  type: 'root' | 'transport' | 'flight' | 'accommodation' | 'hotel' | 'day' | 'time_block' | 'activity' | 'restaurant' | 'destination' | string;
  title: string;
  subtitle?: string;
  date?: string;
  time?: string;
  time_block?: 'morning' | 'afternoon' | 'evening' | string;
  location_id?: string;
  location?: TripLocation;
  status?: 'confirmed' | 'suggested' | 'optional';
  children?: TripPlanNode[];
}

export interface TripPlan {
  id: string;
  title: string;
  origin: string;
  destination: string;
  duration_days: number;
  start_date?: string;
  end_date?: string;
  estimated_budget?: string;
  travel_style?: string;
  nodes: TripPlanNode[];
  locations: TripLocation[];
  routes: TripRoute[];
}

export interface ItineraryChange {
  day: number;
  time_block: 'morning' | 'afternoon' | 'evening' | string;
  title: string;
  subtitle?: string;
  description?: string;
  destination_id?: string;
  poi_id?: string;
  location?: TripLocation;
  action: 'add' | 'update' | 'remove' | string;
}

export interface TripUpdates {
  origin?: string;
  destination?: string;
  destinations?: string[];
  duration_days?: number;
  start_date?: string;
  end_date?: string;
  budget?: string;
  travel_style?: string;
  travelers?: number;
}

export interface DiscoveredPlace {
  poi_id?: string;
  destination_id?: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  source?: string;
  source_url?: string;
  kinds?: string;
  rating?: number;
  reviews?: number;
}

export interface CopilotChatRequest {
  message: string;
  trip_id?: string;
  trip_state?: TripPlan | null;
  selected_places?: DiscoveredPlace[];
  trip_context?: {
    origin?: string;
    destinations?: string[];
    start_date?: string;
    end_date?: string;
    budget?: number;
    travelers?: number;
  };
}

export interface CopilotChatResponse {
  intent: string;
  message: string;
  places: DiscoveredPlace[];
  selected_places?: DiscoveredPlace[];
  trip_updates?: TripUpdates;
  locations: TripLocation[];
  itinerary_changes: ItineraryChange[];
  suggested_actions: string[];
  trip_plan?: TripPlan;
}

export interface TripPlanRequest {
  message: string;
  trip_context?: {
    origin?: string;
    destinations?: string[];
    start_date?: string;
    end_date?: string;
    budget?: number;
    travelers?: number;
  };
}

export interface TripPlanResponse {
  message: string;
  trip_plan: TripPlan;
}

export interface CopilotChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  intent?: string;
  places?: DiscoveredPlace[];
  plan?: TripPlan;
  suggestedActions?: string[];
  isThinking?: boolean;
}

// -------------------------------------------------------------
// 8-Step Trip Planning Wizard Interfaces
// -------------------------------------------------------------
export interface GeoResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  country_code?: string;
}

export type POIPopularity = 'Iconic' | 'Popular' | 'Hidden Gem';

export interface POIResult {
  xid: string;
  name: string;
  kinds: string;
  rate?: string;
  popularity: POIPopularity;
  latitude: number;
  longitude: number;
  dist_meters?: number;
  preview_image?: string;
}

export interface POIDetail {
  xid: string;
  name: string;
  description?: string;
  kinds?: string;
  image_url?: string;
  wikipedia_url?: string;
  address?: string;
  preview_image?: string;
}

export interface WeatherOutlook {
  temp_max: number;
  temp_min: number;
  precipitation_probability: number;
  condition: string;
  is_forecast: boolean;
  daily_summary?: string;
}


export interface DigitalTwinImpact {
  name: string;
  change_pct: number;
  uncertainty_pct: number;
  direction: 'increase' | 'decrease' | 'stable';
  explanation: string;
}

export interface SocialSignal {
  title: string;
  score?: number;
  created_at?: string;
  source: string;
  url?: string;
}

export interface DigitalTwinResponse {
  destination: string;
  live_weather: WeatherOutlook;
  scenario: {
    rainfall_mm: number;
    temperature_c: number;
    storm_duration_hours: number;
  };
  system_risk_probability: number;
  system_risk_uncertainty: number;
  impacts: DigitalTwinImpact[];
  social_signals: SocialSignal[];
  social_signal_status: string;
  updated_at: string;
}

export interface DateInsight {
  weather: WeatherOutlook;
  crowd_score: number;
  crowd_label: 'Low' | 'Moderate' | 'High' | string;
  crowd_disclaimer: string;
  holiday_overlap: boolean;
  holidays: string[];
}

export interface BudgetPreview {
  min_price: number;
  max_price: number;
  flight_min: number;
  flight_max: number;
  hotel_min: number;
  hotel_max: number;
  currency: string;
  flight_budget_ratio?: number;
  hotel_budget_ratio?: number;
}

export interface WizardActivity {
  xid: string;
  name: string;
  popularity: POIPopularity;
  kinds?: string;
  latitude?: number;
  longitude?: number;
  day?: number;
  description?: string;
  preview_image?: string;
  cost?: number;
}

export interface TripRecommendationRequest {
  destination: string;
  destination_lat: number;
  destination_lon: number;
  country_code?: string;
  departure_city?: string;
  start_date: string;
  end_date: string;
  travelers?: number;
  budget_min?: number;
  budget_max?: number;
  activities?: WizardActivity[];
  travel_style?: string;
  selected_flight?: FlightOption | null;
  selected_hotel?: HotelOption | null;
}

export interface TripRecommendationResponse {
  trip_plan: TripPlan;
  recommended_flight?: FlightOption | null;
  recommended_hotel?: HotelOption | null;
  alternate_flights?: FlightOption[];
  alternate_hotels?: HotelOption[];
  message: string;
}

export interface WikivoyageSummary {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
}
