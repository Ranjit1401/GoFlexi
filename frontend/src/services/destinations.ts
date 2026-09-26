import { api } from './api-client';

export interface DestinationTag {
  id: string;
  destination_id: string;
  tag_type: 'place' | 'experience' | string;
  tag_value: string;
}

export interface DestinationListItem {
  id: string;
  name: string;
  country: string;
  state: string;
  city: string;
  short_description: string;
  budget_min: number;
  budget_max: number;
  popularity_score: number;
  places: string[];
  experiences: string[];
  travel_styles: string[];
  companions: string[];
  transport_options: string[];
  paces: string[];
  best_months: number[];
}

export interface DestinationDetail extends DestinationListItem {
  description: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  tags: DestinationTag[];
}

export interface DestinationListParams {
  page?: number;
  size?: number;
  search?: string;
  country?: string;
  state?: string;
}

export interface DestinationListResponse {
  items: DestinationListItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const getDestinations = async (
  params?: DestinationListParams
): Promise<DestinationListResponse> => {
  const res = await api.get('/destinations', { params });
  return res.data as DestinationListResponse;
};

export const getDestination = async (
  destinationId: string
): Promise<DestinationDetail> => {
  const res = await api.get(`/destinations/${destinationId}`);
  return res.data as DestinationDetail;
};

export const getDestinationStates = async (): Promise<string[]> => {
  const res = await api.get('/destinations/states/list');
  return res.data as string[];
};
