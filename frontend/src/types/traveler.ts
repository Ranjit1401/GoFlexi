export interface TravelPreferences {
  attractions: string[]; // Mountains, Beaches, Nature, Cities, Historical, Cultural, Islands
  experiences: string[]; // Adventure, Food, Nightlife, Shopping, Relaxation, Wildlife, Photography, Culture, Sports
  travelStyle: 'Budget' | 'Balanced' | 'Premium' | 'Luxury' | '';
  companions: 'Solo' | 'Couple' | 'Family' | 'Friends' | '';
  transportation: string[]; // Flight, Train, Bus, Car, Flexible
  pacing: 'Relaxed' | 'Balanced' | 'Packed' | '';
  budgetRange: 'Under ₹10,000' | '₹10,000 – ₹25,000' | '₹25,000 – ₹50,000' | '₹50,000 – ₹1,00,000' | '₹1,00,000+' | '';
}

export interface Destination {
  id: string;
  name: string;
  tagline: string;
  description: string;
  imageUrl: string;
  fallbackImageUrl?: string;
  tags: string[];
  estimatedBudget: string;
  travelStyle: string[];
  durationDays: number;
  highlightExperiences: string[];
  rating: number;
  reviewsCount: number;
  bestSeason: string;
}

export interface TripCostBreakdown {
  flights?: number;
  hotel?: number;
  activities?: number;
  taxes?: number;
  total?: number;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  travelersCount: number;
  budget: string;
  status: 'Upcoming' | 'Past' | 'Draft';
  paymentStatus?: 'Pending' | 'Paid';
  paymentId?: string;
  paidAt?: string;
  costBreakdown?: TripCostBreakdown;
  imageUrl: string;
  itinerarySummary: string;
  tags: string[];
  stops?: string[];
}

export interface NewTripRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: string;
  interests: string[];
  travelStyle: string;
}
