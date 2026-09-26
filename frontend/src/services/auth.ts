import { AgentProfile, UserProfile, Role } from '../types/auth';
import { api, setAuthToken, clearAuthToken, hasAuthToken } from './api-client';

export { setAuthToken, clearAuthToken, hasAuthToken };

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
  updated_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: BackendUser;
}

export interface RegisterResponse {
  message: string;
  user: BackendUser;
}

export interface AgentProfileResponse {
  user: BackendUser;
  agency: {
    id: string;
    agency_name: string;
    created_at?: string;
    updated_at?: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
  role: Role;
}

export interface TravelerRegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'traveler';
}

export interface AgentRegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'agent';
  agency_name: string;
}

export type RegisterPayload = TravelerRegisterPayload | AgentRegisterPayload;

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const res = await api.post('/auth/login', payload);
  return res.data as LoginResponse;
};

export const register = async (
  payload: RegisterPayload
): Promise<RegisterResponse> => {
  const res = await api.post('/auth/register', payload);
  return res.data as RegisterResponse;
};

export const fetchCurrentUser = async (): Promise<BackendUser> => {
  const res = await api.get('/auth/me');
  return res.data as BackendUser;
};

export const fetchAgentProfile = async (): Promise<AgentProfileResponse> => {
  const res = await api.get('/agents/me');
  return res.data as AgentProfileResponse;
};

export const buildUserProfile = (bu: BackendUser): UserProfile => ({
  id: String(bu.id),
  name: bu.name,
  email: bu.email,
  role: 'traveler',
  createdAt: bu.created_at,
});

export const buildAgentProfile = (resp: AgentProfileResponse): AgentProfile => ({
  id: String(resp.user.id),
  name: resp.user.name,
  email: resp.user.email,
  role: 'agent',
  createdAt: resp.user.created_at,
  agencyName: resp.agency.agency_name,
});
