import { api } from './api-client';
import { TourPackage, UpcomingTourSummary } from '../types/agent';
import { getDestinationImage } from '../utils/placeImages';

export interface BackendTour {
  id: string;
  agent_id: string;
  name: string;
  description: string | null;
  destination: string | null;
  duration: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  max_participants: number;
  booked_slots: number;
  budget_per_person: number | null;
  currency: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const mapTour = (t: BackendTour): TourPackage => {
  const rawStatus = t.status === 'Draft' ? 'Upcoming' : t.status;
  const category: TourPackage['category'] =
    rawStatus === 'Active' || rawStatus === 'Completed' || rawStatus === 'Upcoming'
      ? rawStatus
      : 'Upcoming';

  return {
    id: t.id,
    title: t.name,
    destination: t.destination || 'India',
    duration: t.duration || '5 Days / 4 Nights',
    pricePerPerson: t.budget_per_person ? `₹${Number(t.budget_per_person).toLocaleString('en-IN')}` : '₹35,000',
    category,
    totalSlots: t.max_participants,
    bookedSlots: t.booked_slots,
    startDate: t.start_date || '01 Oct 2026',
    endDate: t.end_date || '06 Oct 2026',
    imageUrl: t.image_url || getDestinationImage(t.destination || t.name),
  };
};

export const getTours = async (category?: string): Promise<TourPackage[]> => {
  const params: Record<string, string> = {};
  if (category && category !== 'All') params.category = category;

  const res = await api.get<BackendTour[]>('/agent/tours', { params });
  return (res.data || []).map(mapTour);
};

export const getTourSummaries = async (): Promise<UpcomingTourSummary[]> => {
  const res = await api.get<UpcomingTourSummary[]>('/agent/tours/summaries');
  return res.data || [];
};

export const createTour = async (payload: {
  name: string;
  destination?: string;
  duration?: string;
  budget_per_person?: number;
  max_participants?: number;
  status?: string;
  image_url?: string;
  description?: string;
}): Promise<TourPackage> => {
  const res = await api.post<BackendTour>('/agent/tours', {
    name: payload.name,
    destination: payload.destination || 'Goa',
    duration: payload.duration || '5 Days / 4 Nights',
    budget_per_person: payload.budget_per_person || 35000,
    max_participants: payload.max_participants || 15,
    booked_slots: 0,
    status: payload.status || 'Active',
    currency: 'INR',
    image_url: payload.image_url,
    description: payload.description,
  });
  return mapTour(res.data);
};

export const updateTour = async (
  id: string,
  payload: Partial<BackendTour>
): Promise<TourPackage> => {
  const res = await api.put<BackendTour>(`/agent/tours/${id}`, payload);
  return mapTour(res.data);
};

export const deleteTour = async (id: string): Promise<void> => {
  await api.delete(`/agent/tours/${id}`);
};
