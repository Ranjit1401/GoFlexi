import { api } from './api-client';
import { TravelPreferences } from '../types/traveler';

export interface TravelerPreferencesUpdatePayload {
  places: string[];
  experiences: string[];
  travel_style: string;
  companions: string;
  transport: string;
  itinerary_pace: string;
  budget_range: string;
  onboarding_completed: boolean;
}

export interface TravelerPreferencesResponseData {
  id: string | null;
  user_id: string;
  places: string[];
  experiences: string[];
  travel_style: string;
  companions: string;
  transport: string;
  itinerary_pace: string;
  budget_range: string;
  onboarding_completed: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export const getTravelerPreferences = async (): Promise<TravelerPreferencesResponseData> => {
  const res = await api.get('/users/me/preferences');
  return res.data as TravelerPreferencesResponseData;
};

export const saveTravelerPreferences = async (
  payload: TravelerPreferencesUpdatePayload
): Promise<TravelerPreferencesResponseData> => {
  const res = await api.put('/users/me/preferences', payload);
  return res.data as TravelerPreferencesResponseData;
};

export const toTravelPreferences = (
  resp: TravelerPreferencesResponseData
): TravelPreferences => ({
  attractions: resp.places || [],
  experiences: resp.experiences || [],
  travelStyle: (resp.travel_style as TravelPreferences['travelStyle']) || 'Balanced',
  companions: (resp.companions as TravelPreferences['companions']) || 'Couple',
  transportation: resp.transport
    ? resp.transport.split(',').map((s) => s.trim()).filter(Boolean)
    : ['Flight', 'Car'],
  pacing: (resp.itinerary_pace as TravelPreferences['pacing']) || 'Balanced',
  budgetRange: (resp.budget_range as TravelPreferences['budgetRange']) || '₹25,000 – ₹50,000',
});

export const toPreferencesPayload = (
  prefs: TravelPreferences
): TravelerPreferencesUpdatePayload => ({
  places: prefs.attractions,
  experiences: prefs.experiences,
  travel_style: prefs.travelStyle,
  companions: prefs.companions,
  transport: Array.isArray(prefs.transportation)
    ? prefs.transportation.join(', ')
    : String(prefs.transportation || 'Flexible'),
  itinerary_pace: prefs.pacing,
  budget_range: prefs.budgetRange,
  onboarding_completed: true,
});
