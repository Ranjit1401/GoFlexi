import { api } from './api-client';
import { Booking } from '../types/agent';

export interface BackendBooking {
  id: string;
  agent_id: string;
  booking_code: string;
  traveler_name: string;
  traveler_email: string;
  tour_name: string;
  service: Booking['service'];
  departure_date: string;
  amount: string;
  status: Booking['status'];
  created_at: string;
  updated_at: string;
}

export const mapBooking = (b: BackendBooking): Booking => ({
  id: b.id,
  bookingCode: b.booking_code,
  traveler: b.traveler_name,
  travelerEmail: b.traveler_email,
  tour: b.tour_name,
  service: b.service,
  date: b.departure_date,
  amount: b.amount,
  status: b.status,
});

export const getBookings = async (search?: string, status?: string): Promise<Booking[]> => {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (status && status !== 'All') params.status = status;

  const res = await api.get<BackendBooking[]>('/agent/bookings', { params });
  return (res.data || []).map(mapBooking);
};

export const updateBookingStatus = async (
  bookingId: string,
  status: Booking['status']
): Promise<Booking> => {
  const res = await api.put<BackendBooking>(`/agent/bookings/${bookingId}/status`, { status });
  return mapBooking(res.data);
};

export const createBooking = async (
  booking: {
    bookingCode: string;
    traveler: string;
    travelerEmail: string;
    tour: string;
    service: string;
    date: string;
    amount: string;
    status?: string;
  }
): Promise<Booking> => {
  const res = await api.post<BackendBooking>('/agent/bookings', {
    booking_code: booking.bookingCode,
    traveler_name: booking.traveler,
    traveler_email: booking.travelerEmail,
    tour_name: booking.tour,
    service: booking.service,
    departure_date: booking.date,
    amount: booking.amount,
    status: booking.status || 'Confirmed',
  });
  return mapBooking(res.data);
};
