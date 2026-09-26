import { TourPackage, UpcomingTourSummary } from '../types/agent';

export const mockUpcomingTourSummaries: UpcomingTourSummary[] = [
  {
    id: 'sum-1',
    tour: 'Goa Summer Escape',
    traveler: 'Rahul Sharma',
    destination: 'Goa',
    dates: '12 Jun – 16 Jun',
    status: 'Confirmed'
  },
  {
    id: 'sum-2',
    tour: 'Himalayan Adventure',
    traveler: 'Priya Mehta',
    destination: 'Manali',
    dates: '20 Jun – 27 Jun',
    status: 'Planning'
  },
  {
    id: 'sum-3',
    tour: 'Kerala Discovery',
    traveler: 'Amit Shah',
    destination: 'Kerala',
    dates: '25 Jun – 30 Jun',
    status: 'Confirmed'
  },
  {
    id: 'sum-4',
    tour: 'Meghalaya Living Roots',
    traveler: 'Sneha Kapoor',
    destination: 'Meghalaya',
    dates: '02 Jul – 07 Jul',
    status: 'Confirmed'
  },
  {
    id: 'sum-5',
    tour: 'Royal Rajasthan Heritage',
    traveler: 'Vikram Malhotra',
    destination: 'Rajasthan',
    dates: '10 Jul – 16 Jul',
    status: 'Planning'
  }
];

export const mockTourPackages: TourPackage[] = [
  {
    id: 'pkg-1',
    title: 'Goa Luxury Coastal & Heritage',
    destination: 'Goa',
    duration: '4 Days / 3 Nights',
    pricePerPerson: '₹34,500',
    category: 'Active',
    totalSlots: 15,
    bookedSlots: 14,
    startDate: '12 Jun 2026',
    endDate: '16 Jun 2026',
    imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'pkg-2',
    title: 'Himalayan High Altitude Pass',
    destination: 'Manali & Rohtang',
    duration: '7 Days / 6 Nights',
    pricePerPerson: '₹42,000',
    category: 'Upcoming',
    totalSlots: 20,
    bookedSlots: 16,
    startDate: '20 Jun 2026',
    endDate: '27 Jun 2026',
    imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'pkg-3',
    title: 'Kerala Backwaters & Tea Estates',
    destination: 'Kerala',
    duration: '6 Days / 5 Nights',
    pricePerPerson: '₹48,900',
    category: 'Active',
    totalSlots: 12,
    bookedSlots: 12,
    startDate: '25 Jun 2026',
    endDate: '30 Jun 2026',
    imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'pkg-4',
    title: 'Meghalaya Cloud Forest Trek',
    destination: 'Meghalaya',
    duration: '5 Days / 4 Nights',
    pricePerPerson: '₹36,000',
    category: 'Upcoming',
    totalSlots: 10,
    bookedSlots: 6,
    startDate: '02 Jul 2026',
    endDate: '07 Jul 2026',
    imageUrl: 'https://images.unsplash.com/photo-1627916607164-7b20241db935?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'pkg-5',
    title: 'Golden Triangle & Desert Camps',
    destination: 'Rajasthan',
    duration: '8 Days / 7 Nights',
    pricePerPerson: '₹58,000',
    category: 'Completed',
    totalSlots: 18,
    bookedSlots: 18,
    startDate: '05 May 2026',
    endDate: '13 May 2026',
    imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'pkg-6',
    title: 'Andaman Coral Sea Expedition',
    destination: 'Andaman',
    duration: '6 Days / 5 Nights',
    pricePerPerson: '₹64,000',
    category: 'Upcoming',
    totalSlots: 12,
    bookedSlots: 9,
    startDate: '18 Jul 2026',
    endDate: '24 Jul 2026',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/The_Coral_Reef_at_the_Andaman_Islands.jpg/500px-The_Coral_Reef_at_the_Andaman_Islands.jpg'
  }
];
