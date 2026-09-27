import { api } from './api-client';
import { TravelerRecord } from '../types/agent';

export interface BackendAgentTraveler {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  trips_count: number;
  status: TravelerRecord['status'];
  last_activity: string;
  preferred_destination: string | null;
}

export const mapAgentTraveler = (t: BackendAgentTraveler): TravelerRecord => ({
  id: t.id,
  name: t.name,
  email: t.email,
  phone: t.phone,
  avatarUrl: t.avatar_url || undefined,
  tripsCount: t.trips_count,
  status: t.status,
  lastActivity: t.last_activity,
  preferredDestination: t.preferred_destination || undefined,
});

export const getAgentTravelers = async (
  status?: string,
  search?: string
): Promise<TravelerRecord[]> => {
  const params: Record<string, string> = {};
  if (status && status !== 'All') params.status = status;
  if (search) params.search = search;

  const res = await api.get<BackendAgentTraveler[]>('/agent/travelers', { params });
  return (res.data || []).map(mapAgentTraveler);
};

export const createAgentTraveler = async (payload: {
  name: string;
  email: string;
  phone?: string;
  preferred_destination?: string;
}): Promise<TravelerRecord> => {
  const res = await api.post<BackendAgentTraveler>('/agent/travelers', payload);
  return mapAgentTraveler(res.data);
};

