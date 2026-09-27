import { api } from './api-client';
import {
  TripPlanRequest,
  TripPlanResponse,
  CopilotChatRequest,
  CopilotChatResponse,
} from '../types/trip-planner';

export const sendCopilotChat = async (
  request: CopilotChatRequest
): Promise<CopilotChatResponse> => {
  const res = await api.post('/copilot/chat', request);
  return res.data as CopilotChatResponse;
};

export const generateTripPlan = async (
  request: TripPlanRequest
): Promise<TripPlanResponse> => {
  const res = await api.post('/copilot/plan', request);
  return res.data as TripPlanResponse;
};
