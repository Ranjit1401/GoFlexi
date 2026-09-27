import { api } from './api-client';
import { AgentNotification, AgentActivity, OperationalAlert } from '../types/agent';

export interface BackendNotification {
  id: string;
  agent_id: string;
  title: string;
  message: string;
  category: AgentNotification['category'];
  notification_type: 'notification' | 'activity' | 'alert';
  urgency: 'high' | 'medium' | 'info';
  is_read: boolean;
  time_label: string | null;
  created_at: string;
}

export const getNotifications = async (): Promise<AgentNotification[]> => {
  const res = await api.get<BackendNotification[]>('/agent/notifications');
  return (res.data || []).map((n) => ({
    id: n.id,
    title: n.title,
    category: n.category,
    message: n.message,
    time: n.time_label || 'Just now',
    read: n.is_read,
  }));
};

export const getAgentActivities = async (): Promise<AgentActivity[]> => {
  const res = await api.get<BackendNotification[]>('/agent/notifications', {
    params: { notification_type: 'activity' },
  });
  const items = res.data || [];
  if (items.length === 0) {
    // Return all notifications adapted as activities
    const all = await api.get<BackendNotification[]>('/agent/notifications');
    return (all.data || []).slice(0, 4).map((n) => ({
      id: n.id,
      title: n.title,
      description: n.message,
      timeAgo: n.time_label || 'Recently',
      type: (n.category.toLowerCase().includes('traveler')
        ? 'traveler'
        : n.category.toLowerCase().includes('booking')
        ? 'booking'
        : 'schedule') as AgentActivity['type'],
    }));
  }

  return items.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.message,
    timeAgo: n.time_label || 'Recently',
    type: (n.category.toLowerCase().includes('traveler')
      ? 'traveler'
      : n.category.toLowerCase().includes('booking')
      ? 'booking'
      : 'schedule') as AgentActivity['type'],
  }));
};

export const getOperationalAlerts = async (): Promise<OperationalAlert[]> => {
  const res = await api.get<BackendNotification[]>('/agent/notifications', {
    params: { notification_type: 'alert' },
  });
  const items = res.data || [];
  if (items.length === 0) {
    const all = await api.get<BackendNotification[]>('/agent/notifications');
    return (all.data || [])
      .filter((n) => n.urgency === 'high' || n.urgency === 'medium')
      .slice(0, 3)
      .map((n) => ({
        id: n.id,
        title: n.title,
        description: n.message,
        urgency: n.urgency,
        category: (n.category.toLowerCase().includes('approval')
          ? 'approval'
          : n.category.toLowerCase().includes('schedule')
          ? 'departure'
          : 'conflict') as OperationalAlert['category'],
      }));
  }

  return items.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.message,
    urgency: n.urgency,
    category: (n.category.toLowerCase().includes('approval')
      ? 'approval'
      : n.category.toLowerCase().includes('schedule')
      ? 'departure'
      : 'conflict') as OperationalAlert['category'],
  }));
};

export const markNotificationRead = async (id: string, read?: boolean): Promise<void> => {
  const params: Record<string, boolean> = {};
  if (read !== undefined) params.read = read;
  await api.put(`/agent/notifications/${id}/read`, null, { params });
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.put('/agent/notifications/mark-all-read');
};

export const dismissNotification = async (id: string): Promise<void> => {
  await api.delete(`/agent/notifications/${id}`);
};

