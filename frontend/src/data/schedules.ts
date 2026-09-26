import { ScheduleItem } from '../types/agent';

export const mockSchedules: ScheduleItem[] = [
  {
    id: 'sch-1',
    time: '06:30 AM',
    date: 'Today, 12 Jun',
    type: 'departure',
    title: 'Flight 6E-241 Departure to Dabolim (Goa)',
    details: 'Airport pickup assigned to Coastal Rides fleet.',
    travelerOrGroup: 'Rahul Sharma & Party (2 pax)',
    location: 'Terminal 2, Mumbai Airport',
    status: 'On Track'
  },
  {
    id: 'sch-2',
    time: '11:00 AM',
    date: 'Today, 12 Jun',
    type: 'checkin',
    title: 'Villa Candolim Boutique Check-in',
    details: 'Welcome drinks arranged. Early room allotment confirmed.',
    travelerOrGroup: 'Rahul Sharma & Party (2 pax)',
    location: 'Candolim, North Goa',
    status: 'Scheduled'
  },
  {
    id: 'sch-3',
    time: '02:30 PM',
    date: 'Today, 12 Jun',
    type: 'transfer',
    title: 'Private Chauffeur Transfer to Fontainhas',
    details: 'Driver Rajesh (Innova Crysta - GA-03-A-4122).',
    travelerOrGroup: 'Priya Mehta Group',
    location: 'North Goa to Panaji',
    status: 'Scheduled'
  },
  {
    id: 'sch-4',
    time: '05:00 PM',
    date: 'Today, 12 Jun',
    type: 'activity',
    title: 'Private Catamaran Sunset Cruise',
    details: 'Boarding at Chapora jetty. Snorkeling gear & refreshments ready.',
    travelerOrGroup: 'Corporate Incentive Group (14 pax)',
    location: 'Chapora River Mouth, Goa',
    status: 'Scheduled'
  },
  {
    id: 'sch-5',
    time: '08:00 AM',
    date: 'Tomorrow, 13 Jun',
    type: 'departure',
    title: 'Rohtang Snow Excursion 4x4 Convoy',
    details: 'Green permit validated. Warm suits equipped.',
    travelerOrGroup: 'Amit Shah Family (4 pax)',
    location: 'Mall Road, Manali',
    status: 'Scheduled'
  },
  {
    id: 'sch-6',
    time: '01:00 PM',
    date: 'Tomorrow, 13 Jun',
    type: 'checkin',
    title: 'Alleppey Premium Houseboat Check-in',
    details: 'Chef prepared traditional Karimeen lunch on arrival.',
    travelerOrGroup: 'Kavita Nair & Guests',
    location: 'Finishing Point Jetty, Alleppey',
    status: 'Scheduled'
  }
];
