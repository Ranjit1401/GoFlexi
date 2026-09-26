import { api } from './api-client';
import {
  AirportSuggestion,
  FlightSearchRequest,
  FlightSearchResponse,
  HotelDestinationSuggestion,
  HotelSearchRequest,
  HotelSearchResponse,
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
