export interface TripLocation {
  id: string;
  name: string;
  type: 'origin' | 'destination' | 'flight' | 'hotel' | 'activity' | 'restaurant' | 'transport' | string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  day?: number;
  description?: string;
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
  type: 'root' | 'transport' | 'flight' | 'accommodation' | 'hotel' | 'day' | 'activity' | 'restaurant' | 'destination' | string;
  title: string;
  subtitle?: string;
  date?: string;
  time?: string;
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
  plan?: TripPlan;
  isThinking?: boolean;
}
