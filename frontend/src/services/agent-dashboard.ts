import { api } from './api-client';
import { UpcomingTourSummary, AgentActivity, OperationalAlert } from '../types/agent';

export interface BackendDashboardData {
  operator: {
    id: string;
    name: string;
    email: string;
    agency_name: string;
  };
  statistics: {
    total_travelers: number;
    total_tours: number;
    upcoming_tours: number;
    total_bookings: number;
    pending_bookings: number;
  };
  upcoming_tours: UpcomingTourSummary[];
  active_alerts: OperationalAlert[];
  recent_activity: AgentActivity[];
}

export const getOperatorDashboard = async (): Promise<BackendDashboardData> => {
  const res = await api.get<BackendDashboardData>('/agents/dashboard');
  return res.data;
};
