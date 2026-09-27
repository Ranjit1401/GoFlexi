import { api } from './api-client';
import { ScheduleItem } from '../types/agent';

export interface BackendSchedule {
  id: string;
  agent_id: string;
  time: string;
  date: string;
  item_type: ScheduleItem['type'];
  title: string;
  details: string | null;
  traveler_or_group: string;
  location: string;
  status: ScheduleItem['status'];
  created_at: string;
  updated_at: string;
}

export const mapSchedule = (s: BackendSchedule): ScheduleItem => ({
  id: s.id,
  time: s.time,
  date: s.date,
  type: s.item_type,
  title: s.title,
  details: s.details || '',
  travelerOrGroup: s.traveler_or_group,
  location: s.location,
  status: s.status,
});

export const getSchedules = async (
  itemType?: string,
  status?: string
): Promise<ScheduleItem[]> => {
  const params: Record<string, string> = {};
  if (itemType && itemType !== 'all') params.item_type = itemType;
  if (status && status !== 'all') params.status = status;

  const res = await api.get<BackendSchedule[]>('/agent/schedules', { params });
  return (res.data || []).map(mapSchedule);
};

export const createSchedule = async (
  payload: {
    time: string;
    date: string;
    item_type: string;
    title: string;
    details?: string;
    traveler_or_group: string;
    location: string;
    status?: string;
  }
): Promise<ScheduleItem> => {
  const res = await api.post<BackendSchedule>('/agent/schedules', payload);
  return mapSchedule(res.data);
};

export const updateSchedule = async (
  id: string,
  payload: Partial<BackendSchedule>
): Promise<ScheduleItem> => {
  const res = await api.put<BackendSchedule>(`/agent/schedules/${id}`, payload);
  return mapSchedule(res.data);
};

export const deleteSchedule = async (id: string): Promise<void> => {
  await api.delete(`/agent/schedules/${id}`);
};
