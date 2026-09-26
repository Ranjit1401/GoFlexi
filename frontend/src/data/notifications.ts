import { AgentActivity, AgentNotification, OperationalAlert } from '../types/agent';

export const mockNotifications: AgentNotification[] = [
  {
    id: 'notif-1',
    title: 'New Booking Received',
    category: 'New booking',
    message: 'Rahul Sharma confirmed booking VY-8921 for Goa Luxury Coastal & Heritage (₹69,000).',
    time: '15 mins ago',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Special Meal Request',
    category: 'Traveler request',
    message: 'Priya Mehta requested Jain vegetarian meals for the Himalayan High Altitude Pass expedition.',
    time: '1 hour ago',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Flight Reschedule Notice',
    category: 'Schedule update',
    message: 'Flight 6E-241 departure delayed by 25 mins. Chauffeur pickup automatically rescheduled.',
    time: '3 hours ago',
    read: true
  },
  {
    id: 'notif-4',
    title: 'Custom Quote Approval Needed',
    category: 'Pending approval',
    message: 'Customized 6-day Meghalaya trekking itinerary awaiting manager sign-off before invoice release.',
    time: 'Yesterday',
    read: false
  },
  {
    id: 'notif-5',
    title: 'Airport Transfer Confirmed',
    category: 'Schedule update',
    message: 'Skyline Premium Fleet confirmed Innova Crysta for Amit Shah at Cochin International Airport.',
    time: '2 days ago',
    read: true
  }
];

export const mockAgentActivities: AgentActivity[] = [
  {
    id: 'act-1',
    title: 'New traveler registered',
    description: 'Rohan Deshmukh created a traveler profile interested in Andaman scuba packages.',
    timeAgo: '12 mins ago',
    type: 'traveler'
  },
  {
    id: 'act-2',
    title: 'Booking updated',
    description: 'Booking VY-8923 (Amit Shah) upgraded to Luxury Houseboat Suite.',
    timeAgo: '45 mins ago',
    type: 'booking'
  },
  {
    id: 'act-3',
    title: 'Tour schedule changed',
    description: 'Sunset cruise boarding time moved from 4:30 PM to 5:00 PM due to tide forecast.',
    timeAgo: '2 hours ago',
    type: 'schedule'
  },
  {
    id: 'act-4',
    title: 'New inquiry received',
    description: 'Inquiry for 12 pax corporate retreat in Rajasthan received via web portal.',
    timeAgo: '4 hours ago',
    type: 'inquiry'
  }
];

export const mockOperationalAlerts: OperationalAlert[] = [
  {
    id: 'alt-1',
    title: 'Pending Approvals',
    description: '3 custom itineraries and 2 vendor invoices require supervisor review today.',
    urgency: 'high',
    category: 'approval'
  },
  {
    id: 'alt-2',
    title: 'Schedule Conflicts',
    description: 'Chauffeur double-booking flagged for Panaji transfer at 2:30 PM.',
    urgency: 'medium',
    category: 'conflict'
  },
  {
    id: 'alt-3',
    title: 'Upcoming Departures',
    description: '4 groups departing in the next 48 hours. Pre-departure checklists 100% verified.',
    urgency: 'info',
    category: 'departure'
  }
];
