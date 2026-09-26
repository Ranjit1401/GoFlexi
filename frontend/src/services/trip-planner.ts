import { api } from './api-client';
import { TripPlanRequest, TripPlanResponse } from '../types/trip-planner';

export const generateTripPlan = async (
  request: TripPlanRequest
): Promise<TripPlanResponse> => {
  const res = await api.post('/copilot/plan', request);
  return res.data as TripPlanResponse;
};
