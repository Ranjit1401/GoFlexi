export interface AgentStats {
  activeTravelers: number;
  activeTours: number;
  upcomingTours: number;
  pendingActions: number;
}

export interface UpcomingTourSummary {
  id: string;
  tour: string;
  traveler: string;
  destination: string;
  dates: string;
  status: 'Confirmed' | 'Planning' | 'In Progress' | 'Cancelled';
}

export interface AgentActivity {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  type: 'traveler' | 'booking' | 'schedule' | 'inquiry';
}

export interface OperationalAlert {
  id: string;
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'info';
  category: 'approval' | 'conflict' | 'departure';
}

export interface TravelerRecord {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  tripsCount: number;
  status: 'Active' | 'Lead' | 'Completed' | 'Inactive';
  lastActivity: string;
  phone: string;
  preferredDestination?: string;
}

export interface TourPackage {
  id: string;
  title: string;
  destination: string;
  duration: string;
  pricePerPerson: string;
  category: 'Active' | 'Upcoming' | 'Completed';
  totalSlots: number;
  bookedSlots: number;
  startDate: string;
  endDate: string;
  imageUrl: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  traveler: string;
  travelerEmail: string;
  tour: string;
  service: 'Full Tour Package' | 'Hotel + Sightseeing' | 'Transport & Transfers' | 'Custom Excursion';
  date: string;
  amount: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}

export interface ScheduleItem {
  id: string;
  time: string;
  date: string;
  type: 'departure' | 'activity' | 'transfer' | 'checkin';
  title: string;
  details: string;
  travelerOrGroup: string;
  location: string;
  status: 'Scheduled' | 'On Track' | 'Delayed' | 'Completed';
}

export interface Vendor {
  id: string;
  name: string;
  category: 'Hotels' | 'Transport' | 'Activities' | 'Restaurants';
  location: string;
  contactPerson: string;
  phone: string;
  email: string;
  rating: number;
  status: 'Verified Partner' | 'Pending Review' | 'Active';
}

export interface AgentNotification {
  id: string;
  title: string;
  category: 'New booking' | 'Traveler request' | 'Schedule update' | 'Pending approval';
  message: string;
  time: string;
  read: boolean;
}
