import { api } from './api-client';
import { Vendor } from '../types/agent';

export interface BackendVendor {
  id: string;
  agent_id: string;
  name: string;
  category: Vendor['category'];
  location: string;
  contact_person: string;
  phone: string;
  email: string;
  rating: number;
  status: Vendor['status'];
  created_at: string;
  updated_at: string;
}

export const mapVendor = (v: BackendVendor): Vendor => ({
  id: v.id,
  name: v.name,
  category: v.category,
  location: v.location,
  contactPerson: v.contact_person,
  phone: v.phone,
  email: v.email,
  rating: v.rating,
  status: v.status,
});

export const getVendors = async (category?: string, search?: string): Promise<Vendor[]> => {
  const params: Record<string, string> = {};
  if (category && category !== 'All') params.category = category;
  if (search) params.search = search;

  const res = await api.get<BackendVendor[]>('/agent/vendors', { params });
  return (res.data || []).map(mapVendor);
};

export const createVendor = async (payload: {
  name: string;
  category: Vendor['category'];
  location: string;
  contactPerson: string;
  phone: string;
  email: string;
  rating?: number;
  status?: string;
}): Promise<Vendor> => {
  const res = await api.post<BackendVendor>('/agent/vendors', {
    name: payload.name,
    category: payload.category,
    location: payload.location,
    contact_person: payload.contactPerson,
    phone: payload.phone,
    email: payload.email,
    rating: payload.rating || 4.8,
    status: payload.status || 'Verified Partner',
  });
  return mapVendor(res.data);
};

export const updateVendor = async (
  id: string,
  payload: Partial<BackendVendor>
): Promise<Vendor> => {
  const res = await api.put<BackendVendor>(`/agent/vendors/${id}`, payload);
  return mapVendor(res.data);
};

export const deleteVendor = async (id: string): Promise<void> => {
  await api.delete(`/agent/vendors/${id}`);
};
