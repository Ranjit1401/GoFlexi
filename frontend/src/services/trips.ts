import { api } from './api-client';
import { Trip } from '../types/traveler';

export interface BackendTripResponse {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  days: number;
  travelers_count: number;
  budget: string;
  status: 'Upcoming' | 'Past' | 'Draft';
  image_url: string | null;
  itinerary_summary: string | null;
  tags: string[] | null;
  stops: string[] | null;
  created_at: string;
  updated_at: string;
}

export const mapBackendTripToFrontend = (item: BackendTripResponse): Trip => ({
  id: item.id,
  title: item.title,
  destination: item.destination,
  startDate: item.start_date,
  endDate: item.end_date,
  days: item.days,
  travelersCount: item.travelers_count,
  budget: item.budget,
  status: item.status,
  imageUrl: item.image_url || '',
  itinerarySummary: item.itinerary_summary || '',
  tags: item.tags || [],
  stops: item.stops || [],
});

export const getTrips = async (status?: string): Promise<Trip[]> => {
  const params: Record<string, string> = {};
  if (status) {
    params.status = status;
  }
  const res = await api.get<BackendTripResponse[]>('/trips', { params });
  return (res.data || []).map(mapBackendTripToFrontend);
};

export const getTrip = async (tripId: string): Promise<Trip> => {
  const res = await api.get<BackendTripResponse>(`/trips/${tripId}`);
  return mapBackendTripToFrontend(res.data);
};

export interface CreateTripPayload {
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  days: number;
  travelers_count: number;
  budget: string;
  status?: string;
  image_url?: string;
  itinerary_summary?: string;
  tags?: string[];
  stops?: string[];
}

export const createTrip = async (payload: CreateTripPayload): Promise<Trip> => {
  const res = await api.post<BackendTripResponse>('/trips', payload);
  return mapBackendTripToFrontend(res.data);
};

export const updateTrip = async (
  tripId: string,
  payload: Partial<CreateTripPayload>
): Promise<Trip> => {
  const res = await api.put<BackendTripResponse>(`/trips/${tripId}`, payload);
  return mapBackendTripToFrontend(res.data);
};

export const deleteTrip = async (tripId: string): Promise<void> => {
  await api.delete(`/trips/${tripId}`);
};
