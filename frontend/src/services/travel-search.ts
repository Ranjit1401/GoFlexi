import { api } from './api-client';
import {
  AirportSuggestion,
  FlightSearchRequest,
  FlightSearchResponse,
  HotelDestinationSuggestion,
  HotelSearchRequest,
  HotelSearchResponse,
  TrainSearchRequest,
  TrainSearchResponse,
  TrainScheduleStop,
} from '../types/travel-search';

export const searchAirports = async (query: string): Promise<AirportSuggestion[]> => {
  const res = await api.get('/travel-search/airports', { params: { query } });
  return res.data as AirportSuggestion[];
};

export const searchFlights = async (
  payload: FlightSearchRequest
): Promise<FlightSearchResponse> => {
  const res = await api.post('/travel-search/flights', payload);
  return res.data as FlightSearchResponse;
};

export const searchHotelDestinations = async (
  query: string
): Promise<HotelDestinationSuggestion[]> => {
  const res = await api.get('/travel-search/hotels/destinations', { params: { query } });
  return res.data as HotelDestinationSuggestion[];
};

export const searchHotels = async (
  payload: HotelSearchRequest
): Promise<HotelSearchResponse> => {
  const res = await api.post('/travel-search/hotels', payload);
  return res.data as HotelSearchResponse;
};

export const searchTrains = async (
  payload: TrainSearchRequest
): Promise<TrainSearchResponse> => {
  const res = await api.post('/travel-search/trains', payload);
  return res.data as TrainSearchResponse;
};

export const getTrainSchedule = async (
  trainNumber: string
): Promise<TrainScheduleStop[]> => {
  const res = await api.get(`/travel-search/train-schedule/${trainNumber}`);
  return res.data as TrainScheduleStop[];
};

export const checkIsDomesticIndia = async (
  destination: string,
  origin?: string
): Promise<{ is_domestic_india: boolean; destination_is_india: boolean; origin_is_india: boolean }> => {
  const res = await api.get('/travel-search/is-domestic-india', {
    params: { destination, origin },
  });
  return res.data;
};

