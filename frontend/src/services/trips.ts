import { api } from './api-client';
import { Trip, TripCostBreakdown } from '../types/traveler';

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
  payment_status?: 'Pending' | 'Paid';
  payment_id?: string | null;
  paid_at?: string | null;
  cost_breakdown?: TripCostBreakdown | null;
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
  paymentStatus: item.payment_status || 'Pending',
  paymentId: item.payment_id || undefined,
  paidAt: item.paid_at || undefined,
  costBreakdown: item.cost_breakdown || undefined,
  imageUrl: item.image_url || '',
  itinerarySummary: item.itinerary_summary || '',
  tags: item.tags || [],
  stops: item.stops || [],
});

export const getTrips = async (filters?: { status?: string; paymentStatus?: string } | string): Promise<Trip[]> => {
  const params: Record<string, string> = {};
  if (typeof filters === 'string') {
    if (filters) params.status = filters;
  } else if (filters) {
    if (filters.status) params.status = filters.status;
    if (filters.paymentStatus) params.payment_status = filters.paymentStatus;
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
  payment_status?: 'Pending' | 'Paid';
  payment_id?: string;
  paid_at?: string;
  cost_breakdown?: TripCostBreakdown;
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

export const payTrip = async (tripId: string): Promise<Trip> => {
  const res = await api.put<BackendTripResponse>(`/trips/${tripId}/pay`);
  return mapBackendTripToFrontend(res.data);
};

export const deleteTrip = async (tripId: string): Promise<void> => {
  await api.delete(`/trips/${tripId}`);
};
