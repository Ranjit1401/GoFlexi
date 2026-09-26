export type Role = 'traveler' | 'agent';

export type OnboardingStatus = 'loading' | 'pending' | 'completed' | 'not_started' | 'in_progress';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'traveler';
  createdAt: string;
  avatarUrl?: string;
  phone?: string;
  location?: string;
  bio?: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  agencyName: string;
  email: string;
  role: 'agent';
  createdAt: string;
  avatarUrl?: string;
  phone?: string;
  licenseNumber?: string;
  location?: string;
}

export interface AuthState {
  user: UserProfile | null;
  agent: AgentProfile | null;
  role: Role | null;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
}
