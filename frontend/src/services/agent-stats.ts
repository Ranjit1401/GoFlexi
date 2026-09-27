import { api } from './api-client';
import { AgentStats } from '../types/agent';

export interface BackendAgentStats {
  active_travelers: number;
  active_tours: number;
  upcoming_tours: number;
  pending_actions: number;
}

export const getAgentStats = async (): Promise<AgentStats> => {
  const res = await api.get<BackendAgentStats>('/agent/stats');
  const d = res.data;
  return {
    activeTravelers: d.active_travelers,
    activeTours: d.active_tours,
    upcomingTours: d.upcoming_tours,
    pendingActions: d.pending_actions,
  };
};
