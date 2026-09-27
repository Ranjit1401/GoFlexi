# Voyara — App Flow

## 1. Product navigation

Roles:
- Traveler
- Agent/Operator
- future Driver/Guide

Main traveler journey:

**Landing → Auth → Preferences → Discover → Recommend → Explore → Trip → AI Co-Pilot → Itinerary → Price → Book → Prepare → Live Trip → Adapt → Review**

## 2. Authentication flow

```text
Landing
 ├─ Traveler → Login/Register
 └─ Agent    → Login/Register
```

Traveler login:
```text
Login
 ↓
POST /api/auth/login
 ↓
GET /api/auth/me
 ↓
GET /api/users/me/preferences
 ↓
onboarding_completed?
 ├─ NO  → Onboarding
 └─ YES → Dashboard
```

Backend preference state is authoritative.

## 3. Traveler onboarding

```text
Places
 ↓
Experiences
 ↓
Travel Style
 ↓
Companions
 ↓
Transport
 ↓
Pace
 ↓
Budget
 ↓
PUT /api/users/me/preferences
 ↓
Dashboard
```

## 4. Dashboard

Contains:
- personalized recommendations,
- recent/upcoming trips,
- Explore entry,
- AI Trip Co-Pilot entry,
- future saved/visited data.

Flow:
```text
Saved Preferences
 ↓
Recommendation Engine
 ↓
Real Destination Knowledge Base
 ↓
Personalized Cards
```

## 5. Explore

```text
Explore
 ↓
Search destination/activity
 ↓
Temporary filters
 ├─ place
 ├─ experience
 ├─ state
 ├─ style
 ├─ companion
 ├─ transport
 ├─ pace
 └─ budget
 ↓
Explore Recommendation API
 ↓
Cards
 ├─ View
 ├─ Save
 └─ Plan Trip
```

Explore filters do not overwrite onboarding preferences.

## 6. Destination detail

```text
Destination Card
 ↓
Destination Detail
 ├─ overview
 ├─ location
 ├─ experiences
 ├─ best months
 ├─ style/companion fit
 ├─ transport
 ├─ source/provenance
 └─ Plan Trip
```

## 7. Trip creation

```text
Plan Trip
 ↓
Trip Setup
 ├─ origin
 ├─ destination(s)
 ├─ dates
 ├─ budget
 └─ pace
 ↓
Draft Trip
 ↓
Trip Workspace
```

## 8. AI Trip Co-Pilot

Three synchronized panels:

```text
┌─────────────────┬────────────────────────┬──────────────────────┐
│ Trip Plan Tree  │ Globe / Route          │ AI Assistant         │
│ Day 1           │ destination nodes      │ user message         │
│  ├ hotel        │ route/dependencies     │ assistant response   │
│  └ activity     │ selected destination   │ proposed changes     │
│ Day 2           │                        │ confirmation         │
└─────────────────┴────────────────────────┴──────────────────────┘
```

All panels consume one structured `TripState`. Chat text is not the source of truth.

## 9. Itinerary generation

```text
Trip configuration
 ↓
Validate constraints
 ↓
Destination/POI knowledge
 ↓
Candidate plan
 ↓
Deterministic validation
 ↓
Spatial optimization
 ↓
Schedule-gap filling
 ↓
Explain plan
 ↓
Itinerary Preview
```

## 10. Itinerary preview

Traveler can:
- inspect day-by-day plan,
- inspect route,
- inspect activities,
- inspect estimated cost,
- ask Co-Pilot for changes,
- proceed to pricing.

## 11. Price → Book → Prepare

```text
Itinerary
 ↓
Price Breakdown
 ↓
Checkout
 ↓
Payment Provider
 ↓
Verified payment confirmation
 ↓
Booking Confirmation
 ↓
Pre-Trip Checklist
```

Booking confirmation must eventually depend on verified provider callbacks/webhooks.

## 12. Live trip

```text
Live Trip Home
 ├─ Today's Plan
 ├─ Live Map
 ├─ AI Concierge
 ├─ Group Chat
 ├─ Add-on Activity
 └─ Trip Status
```

## 13. Dynamic adaptation

Core innovation flow:

```text
Real-world event
 ↓
Disruption detected
 ↓
Affected dependency identified
 ↓
Ripple/impact analysis
 ↓
Recovery candidates
 ↓
Trade-off scoring
 ↓
Explain alternatives
 ↓
Traveler/Operator approval
 ↓
Trip graph updated
 ↓
Affected surfaces synchronized
```

Example:
```text
Delhi → Jaipur train cancelled
 ↓
arrival shift
 ↓
hotel check-in affected
 ↓
evening activity affected
 ↓
return timing checked
 ↓
recovery strategies
```

Unaffected confirmed reservations should remain untouched.

## 14. Operator flow

```text
Agent Login
 ↓
Agent Dashboard
 ├─ Travelers
 ├─ Tours
 ├─ Bookings
 ├─ Schedules
 ├─ Vendors
 ├─ Notifications
 └─ Settings
```

Future:
```text
Active Tour
 ↓
Live state
 ↓
Modification/disruption
 ↓
Evaluate
 ↓
Approve / Override
 ↓
Traveler synchronized
```

## 15. Future driver flow

```text
Driver Login
 ↓
Today's Assignment
 ↓
Start Leg
 ↓
Live GPS WebSocket
 ↓
Complete Leg
```

## 16. Current screen inventory

- Landing
- Traveler Auth
- Agent Auth
- Traveler Onboarding
- Traveler Dashboard
- Explore
- Destination Detail
- Trips
- New Trip
- Profile
- Agent Dashboard
- Agent Travelers
- Agent Tours
- Agent Bookings
- Agent Schedules
- Agent Vendors
- Agent Notifications
- Agent Settings

## 17. Planned screens

- AI Trip Co-Pilot
- Trip Workspace
- Itinerary Preview
- Price Breakdown
- Checkout
- Booking Confirmation
- Pre-Trip Checklist
- Live Trip Home
- Live Map
- AI Concierge
- Group Chat
- Disruption/Recovery
- Trip Wrap-Up
- Review
- Operator Control Center
- Manual Override
- Driver App

## 18. UX principles
1. Never hide system state.
2. Clearly distinguish AI proposals from confirmed actions.
3. Consequential changes require confirmation.
4. Explain recommendation/recovery reasons.
5. Show provenance where factual trust matters.
6. Preserve human control.
7. Never replace working functionality with fake AI behavior.
