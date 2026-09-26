import { Booking } from '../types/agent';

export const mockBookings: Booking[] = [
  {
    id: 'bk-101',
    bookingCode: 'VY-8921',
    traveler: 'Rahul Sharma',
    travelerEmail: 'rahul.sharma@example.com',
    tour: 'Goa Luxury Coastal & Heritage',
    service: 'Full Tour Package',
    date: '12 Jun 2026',
    amount: '₹69,000',
    status: 'Confirmed'
  },
  {
    id: 'bk-102',
    bookingCode: 'VY-8922',
    traveler: 'Priya Mehta',
    travelerEmail: 'priya.mehta@example.com',
    tour: 'Himalayan High Altitude Pass',
    service: 'Hotel + Sightseeing',
    date: '20 Jun 2026',
    amount: '₹84,000',
    status: 'Pending'
  },
  {
    id: 'bk-103',
    bookingCode: 'VY-8923',
    traveler: 'Amit Shah',
    travelerEmail: 'amit.shah@example.com',
    tour: 'Kerala Backwaters & Tea Estates',
    service: 'Full Tour Package',
    date: '25 Jun 2026',
    amount: '₹97,800',
    status: 'Confirmed'
  },
  {
    id: 'bk-104',
    bookingCode: 'VY-8924',
    traveler: 'Sneha Kapoor',
    travelerEmail: 'sneha.kapoor@example.com',
    tour: 'Meghalaya Cloud Forest Trek',
    service: 'Custom Excursion',
    date: '02 Jul 2026',
    amount: '₹36,000',
    status: 'Confirmed'
  },
  {
    id: 'bk-105',
    bookingCode: 'VY-8925',
    traveler: 'Vikram Malhotra',
    travelerEmail: 'vikram.m@example.com',
    tour: 'Golden Triangle & Desert Camps',
    service: 'Transport & Transfers',
    date: '10 Jul 2026',
    amount: '₹22,500',
    status: 'Pending'
  },
  {
    id: 'bk-106',
    bookingCode: 'VY-8926',
    traveler: 'Ananya Roy',
    travelerEmail: 'ananya.roy@example.com',
    tour: 'Andaman Coral Sea Expedition',
    service: 'Full Tour Package',
    date: '18 Jul 2026',
    amount: '₹1,28,000',
    status: 'Cancelled'
  },
  {
    id: 'bk-107',
    bookingCode: 'VY-8927',
    traveler: 'Kavita Nair',
    travelerEmail: 'kavita.nair@example.com',
    tour: 'Sikkim Monastic Trails',
    service: 'Hotel + Sightseeing',
    date: '28 Jul 2026',
    amount: '₹51,000',
    status: 'Confirmed'
  }
];
