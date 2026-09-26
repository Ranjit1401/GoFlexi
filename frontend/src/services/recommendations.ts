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
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
  total: number;
  generated_at: string;
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
