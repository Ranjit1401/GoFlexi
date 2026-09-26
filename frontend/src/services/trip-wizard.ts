import axios from 'axios';
import { api } from './api-client';
import {
  GeoResult,
  POIResult,
  POIDetail,
  DateInsight,
  BudgetPreview,
  TripRecommendationRequest,
  TripRecommendationResponse,
  WikivoyageSummary,
} from '../types/trip-planner';

export async function searchDestinations(query: string): Promise<GeoResult[]> {
  const resp = await api.get<GeoResult[]>('/trip-wizard/destinations', {
    params: { query },
  });
  return resp.data;
}

export async function searchActivities(
  lat: number,
  lon: number,
  mode: 'popular' | 'hidden' = 'popular',
  radius_m: number = 20000
): Promise<POIResult[]> {
  const resp = await api.get<POIResult[]>('/trip-wizard/activities', {
    params: { lat, lon, mode, radius_m },
  });
  return resp.data;
}

export async function getActivityDetail(xid: string): Promise<POIDetail> {
  const resp = await api.get<POIDetail>(`/trip-wizard/activities/${encodeURIComponent(xid)}`);
  return resp.data;
}

export async function getDateInsight(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  countryCode: string = 'IN'
): Promise<DateInsight> {
  const resp = await api.get<DateInsight>('/trip-wizard/date-insight', {
    params: {
      lat,
      lon,
      start_date: startDate,
      end_date: endDate,
      country_code: countryCode,
    },
  });
  return resp.data;
}

export async function getBudgetPreview(
  destination: string,
  startDate: string,
  endDate: string,
  travelers: number = 1,
  departureCity: string = 'Mumbai'
): Promise<BudgetPreview> {
  const resp = await api.get<BudgetPreview>('/trip-wizard/budget-preview', {
    params: {
      destination,
      start_date: startDate,
      end_date: endDate,
      travelers,
      departure_city: departureCity,
    },
  });
  return resp.data;
}

export async function recommendTrip(
  payload: TripRecommendationRequest
): Promise<TripRecommendationResponse> {
  const resp = await api.post<TripRecommendationResponse>('/trip-wizard/recommend', payload);
  return resp.data;
}

export async function getWikivoyageSummary(destination: string): Promise<WikivoyageSummary | null> {
  try {
    const cleanTitle = destination.trim().split(',')[0].replace(/\s+/g, '_');
    const url = `https://en.wikivoyage.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTitle)}`;
    const resp = await axios.get(url, { timeout: 4000 });
    if (resp.status === 200 && resp.data) {
      return {
        title: resp.data.title || destination,
        extract: resp.data.extract || '',
        thumbnail: resp.data.thumbnail,
      };
    }
  } catch {
    // Wikivoyage is optional context bonus - swallow error gracefully
  }
  return null;
}
