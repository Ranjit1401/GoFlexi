import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { UserProfile, AgentProfile, Role, AuthState, OnboardingStatus } from '../types/auth';
import { TravelPreferences } from '../types/traveler';
import {
  login as apiLogin,
  register as apiRegister,
  fetchCurrentUser,
  fetchAgentProfile,
  setAuthToken,
  clearAuthToken,
  hasAuthToken,
  buildUserProfile,
  buildAgentProfile,
} from '../services/auth';
import {
  getTravelerPreferences,
  saveTravelerPreferences,
  toTravelPreferences,
  toPreferencesPayload,
} from '../services/preferences';
import { clearCachedRecommendations } from '../services/recommendations';
import { parseApiError } from '../services/api-client';

interface AuthContextType extends AuthState {
  preferences: TravelPreferences | null;
  authLoading: boolean;
  onboardingStatus: OnboardingStatus;
  loginTraveler: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; onboardingCompleted?: boolean; error?: string }>;
  registerTraveler: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginAgent: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  registerAgent: (
    name: string,
    agencyName: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  saveOnboardingPreferences: (
    prefs: TravelPreferences
  ) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateAgentProfile: (profile: Partial<AgentProfile>) => void;
}

const DEFAULT_PREFERENCES: TravelPreferences = {
  attractions: ['Beaches', 'Mountains', 'Nature'],
  experiences: ['Adventure', 'Relaxation', 'Food'],
  travelStyle: 'Balanced',
  companions: 'Couple',
  transportation: ['Flight', 'Car'],
  pacing: 'Balanced',
  budgetRange: '₹25,000 – ₹50,000',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authResultError = (error: unknown, fallback: string): string => {
  const parsed = parseApiError(error);
  if (parsed.isNetworkError) return 'Unable to connect to server';
  return parsed.message || fallback;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>('loading');

  const [preferences, setPreferences] = useState<TravelPreferences | null>(() => {
    try {
      const stored = localStorage.getItem('GoFlexi_preferences');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [authLoading, setAuthLoading] = useState(true);

  // Session restoration on startup: the ONLY source of truth is the JWT + /api/auth/me + /api/users/me/preferences
  useEffect(() => {
    const restoreSession = async () => {
      if (!hasAuthToken()) {
        setAuthLoading(false);
        setOnboardingStatus('pending');
        return;
      }

      try {
        const backendUser = await fetchCurrentUser();

        if (backendUser.role === 'agent') {
          const agentResp = await fetchAgentProfile();
          setAgent(buildAgentProfile(agentResp));
          setUser(null);
          setRole('agent');
          setOnboardingStatus('completed');
        } else {
          setUser(buildUserProfile(backendUser));
          setAgent(null);
          setRole('traveler');
          try {
            const prefResp = await getTravelerPreferences();
            if (prefResp.onboarding_completed) {
              const loadedPrefs = toTravelPreferences(prefResp);
              setPreferences(loadedPrefs);
              setOnboardingStatus('completed');
              localStorage.setItem('GoFlexi_preferences', JSON.stringify(loadedPrefs));
              localStorage.setItem('GoFlexi_onboarding', 'true');
            } else {
              setPreferences(null);
              setOnboardingStatus('pending');
              localStorage.removeItem('GoFlexi_preferences');
              localStorage.removeItem('GoFlexi_onboarding');
            }
          } catch {
            const cachedOnboarding = localStorage.getItem('GoFlexi_onboarding') === 'true';
            setOnboardingStatus(cachedOnboarding ? 'completed' : 'pending');
          }
        }
        setAuthLoading(false);
      } catch {
        clearAuthToken();
        setUser(null);
        setAgent(null);
        setRole(null);
        setPreferences(null);
        setOnboardingStatus('pending');
        try {
          localStorage.removeItem('GoFlexi_preferences');
          localStorage.removeItem('GoFlexi_onboarding');
        } catch {
          // ignore
        }
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loginTraveler = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; onboardingCompleted?: boolean; error?: string }> => {
    try {
      const res = await apiLogin({ email, password, role: 'traveler' });
      setAuthToken(res.access_token);
      setUser(buildUserProfile(res.user));
      setRole('traveler');
      setAgent(null);
      setOnboardingStatus('loading');

      let isCompleted = false;
      try {
        const prefResp = await getTravelerPreferences();
        if (prefResp.onboarding_completed) {
          const loadedPrefs = toTravelPreferences(prefResp);
          setPreferences(loadedPrefs);
          setOnboardingStatus('completed');
          localStorage.setItem('GoFlexi_preferences', JSON.stringify(loadedPrefs));
          localStorage.setItem('GoFlexi_onboarding', 'true');
          isCompleted = true;
        } else {
          setPreferences(null);
          setOnboardingStatus('pending');
          localStorage.removeItem('GoFlexi_preferences');
          localStorage.removeItem('GoFlexi_onboarding');
        }
      } catch {
        const cached = localStorage.getItem('GoFlexi_onboarding') === 'true';
        setOnboardingStatus(cached ? 'completed' : 'pending');
        isCompleted = cached;
      }
      return { success: true, onboardingCompleted: isCompleted };
    } catch (error) {
      clearAuthToken();
      setOnboardingStatus('pending');
      return { success: false, error: authResultError(error, 'Login failed') };
    }
  };

  const loginAgent = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiLogin({ email, password, role: 'agent' });
      setAuthToken(res.access_token);
      const agentResp = await fetchAgentProfile();
      setAgent(buildAgentProfile(agentResp));
      setUser(null);
      setRole('agent');
      setOnboardingStatus('completed');
      return { success: true };
    } catch (error) {
      clearAuthToken();
      setOnboardingStatus('pending');
      return { success: false, error: authResultError(error, 'Login failed') };
    }
  };

  const registerTraveler = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiRegister({
        name,
        email,
        password,
        role: 'traveler',
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: authResultError(error, 'Registration failed') };
    }
  };

  const registerAgent = async (
    name: string,
    agencyName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiRegister({
        name,
        email,
        password,
        role: 'agent',
        agency_name: agencyName,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: authResultError(error, 'Registration failed') };
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    setAgent(null);
    setRole(null);
    setPreferences(null);
    setOnboardingStatus('pending');
    try {
      localStorage.removeItem('GoFlexi_preferences');
      localStorage.removeItem('GoFlexi_onboarding');
      clearCachedRecommendations();
    } catch {
      // ignore
    }
  };

  const saveOnboardingPreferences = async (
    prefs: TravelPreferences
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = toPreferencesPayload(prefs);
      const resp = await saveTravelerPreferences(payload);
      const updatedPrefs = toTravelPreferences(resp);
      setPreferences(updatedPrefs);
      setOnboardingStatus('completed');
      localStorage.setItem('GoFlexi_preferences', JSON.stringify(updatedPrefs));
      localStorage.setItem('GoFlexi_onboarding', 'true');
      clearCachedRecommendations();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: authResultError(error, 'Failed to save travel preferences'),
      };
    }
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...profile });
    }
  };

  const updateAgentProfile = (profile: Partial<AgentProfile>) => {
    if (agent) {
      setAgent({ ...agent, ...profile });
    }
  };

  const isAuthenticated = Boolean(
    (role === 'traveler' && user) || (role === 'agent' && agent)
  );

  const onboardingCompleted = onboardingStatus === 'completed';

  const effectivePreferences =
    preferences || (onboardingCompleted ? DEFAULT_PREFERENCES : null);

  return (
    <AuthContext.Provider
      value={{
        user,
        agent,
        role,
        isAuthenticated,
        onboardingCompleted,
        onboardingStatus,
        authLoading,
        preferences: effectivePreferences,
        loginTraveler,
        registerTraveler,
        loginAgent,
        registerAgent,
        logout,
        saveOnboardingPreferences,
        updateUserProfile,
        updateAgentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
