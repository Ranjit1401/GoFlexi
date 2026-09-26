import { api } from './api-client';

export interface RecommendationItem {
  destination_id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  short_description: string;
  description: string;
  score: number;
  match_percentage: number;
  matched_preferences: string[];
  explanation: string;
  relevant_tags: string[];
  budget_min: number;
  budget_max: number;
  popularity_score: number;
  places?: string[];
  experiences?: string[];
  travel_styles?: string[];
  companions?: string[];
  transport_options?: string[];
  paces?: string[];
  best_months?: number[];
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
  total: number;
  generated_at: string;
}

export interface ExploreFilterParams {
  limit?: number;
  search?: string;
  travel_date?: string;
  places?: string[];
  experiences?: string[];
  travel_style?: string;
  companions?: string[];
  transport?: string[];
  pace?: string;
  budget_range?: string;
  state?: string;
  sort_by?: 'recommended' | 'match_score' | 'popularity' | 'budget_asc' | 'budget_desc';
}

const CACHE_KEY = 'GoFlexi_recommendations_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let memoryCache: { data: RecommendationResponse; timestamp: number } | null = null;

export const getCachedRecommendations = (): RecommendationItem[] => {
  const now = Date.now();
  if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.data.recommendations;
  }

  try {
    const raw = sessionStorage.getItem(CACHE_KEY) || localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.recommendations) && now - parsed.timestamp < CACHE_TTL_MS) {
        memoryCache = {
          data: {
            recommendations: parsed.recommendations,
            total: parsed.total || parsed.recommendations.length,
            generated_at: parsed.generated_at || new Date().toISOString(),
          },
          timestamp: parsed.timestamp,
        };
        return parsed.recommendations;
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return [];
};

export const setCachedRecommendations = (data: RecommendationResponse) => {
  const timestamp = Date.now();
  memoryCache = { data, timestamp };
  try {
    const payload = JSON.stringify({
      recommendations: data.recommendations,
      total: data.total,
      generated_at: data.generated_at,
      timestamp,
    });
    sessionStorage.setItem(CACHE_KEY, payload);
    localStorage.setItem(CACHE_KEY, payload);
  } catch {
    // Ignore storage quota error
  }
};

export const clearCachedRecommendations = () => {
  memoryCache = null;
  try {
    sessionStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore
  }
};

export const getRecommendations = async (
  limit: number = 10,
  forceRefresh: boolean = false
): Promise<RecommendationResponse> => {
  if (!forceRefresh) {
    const cached = getCachedRecommendations();
    if (cached.length > 0 && memoryCache) {
      return memoryCache.data;
    }
  }

  const res = await api.get('/recommendations', {
    params: { limit },
  });
  const data = res.data as RecommendationResponse;
  setCachedRecommendations(data);
  return data;
};

export const getExploreRecommendations = async (
  filters: ExploreFilterParams = {}
): Promise<RecommendationResponse> => {
  const queryParams: Record<string, string | number> = {};

  if (filters.limit) queryParams.limit = filters.limit;
  if (filters.search?.trim()) queryParams.search = filters.search.trim();
  if (filters.travel_date) queryParams.travel_date = filters.travel_date;
  if (filters.places && filters.places.length > 0) {
    queryParams.places = filters.places.join(',');
  }
  if (filters.experiences && filters.experiences.length > 0) {
    queryParams.experiences = filters.experiences.join(',');
  }
  if (filters.travel_style?.trim()) {
    queryParams.travel_style = filters.travel_style.trim();
  }
  if (filters.companions && filters.companions.length > 0) {
    queryParams.companions = filters.companions.join(',');
  }
  if (filters.transport && filters.transport.length > 0) {
    queryParams.transport = filters.transport.join(',');
  }
  if (filters.pace?.trim()) {
    queryParams.pace = filters.pace.trim();
  }
  if (filters.budget_range?.trim()) {
    queryParams.budget_range = filters.budget_range.trim();
  }
  if (filters.state?.trim()) {
    queryParams.state = filters.state.trim();
  }
  if (filters.sort_by?.trim()) {
    queryParams.sort_by = filters.sort_by.trim();
  }

  const res = await api.get('/recommendations', {
    params: queryParams,
  });
  return res.data as RecommendationResponse;
};
