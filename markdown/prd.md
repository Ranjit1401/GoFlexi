# Voyara — Product Requirements Document (PRD)

## 1. Product
**Voyara** is a personalized dynamic tour planning and tour-operations platform for Travelers and Tour Operators, initially focused on India.

## 2. Problem
Existing travel products mainly solve discovery or static itinerary generation. They struggle with personal preferences, multi-city dependencies, vendor coordination, cost constraints and changes during an active trip.

Voyara treats a trip as a **dynamic system**, not a static document.

## 3. Vision
> Create personalized journeys that understand the traveler, destination knowledge and operational constraints — then help adapt the journey when reality changes.

## 4. Users

### Traveler
Needs personalized destinations, trustworthy information, itinerary planning, transparent pricing, assistance and disruption recovery.

### Tour Operator
Needs centralized tour monitoring, traveler management, vendor management, pricing/margin controls, schedule visibility, communication and manual overrides.

### Future Driver/Guide
Needs assignment, trip-leg status, location sharing and operational notifications.

## 5. Lifecycle
1. Discover
2. Personalize
3. Recommend
4. Plan
5. Price
6. Book
7. Prepare
8. Operate
9. Assist
10. Adapt
11. Complete
12. Review

## 6. Current verified scope
**BUILD:** authentication/RBAC, traveler preferences persistence, destination knowledge base, source tracking, GeoNames/OpenTripMap ingestion, deterministic recommendation engine.

**IN PROGRESS / next:** recommendation-quality validation, reliable existing-user onboarding state, Explore workflow, trip creation and AI Trip Co-Pilot.

**PLANNED:** constraint-aware itinerary generation, dynamic trip graph, pricing, booking, operator command center, vendors, WebSockets, GPS, chat, disruption recovery and settlements.

## 7. Functional requirements

### FR-01 Authentication
Register/login by role. Failed authentication must never create a session.

### FR-02 Persistent preferences
Preferences survive logout/login. Backend `onboarding_completed` is authoritative.

### FR-03 Destination knowledge
Destination records are source-backed and searchable.

### FR-04 Recommendations
Recommendations use actual traveler preferences and destination metadata.

### FR-05 Explainability
Recommendations expose understandable reasons.

### FR-06 Explore
Users can temporarily apply filters without overwriting saved preferences.

### FR-07 Trip creation
Users can create draft trips from one or more destinations.

### FR-08 AI Trip Co-Pilot
Conversational assistant produces structured trip changes, not only prose.

### FR-09 Living itinerary graph
Trips eventually contain dependency relationships between bookings, activities, transport and time.

### FR-10 Price transparency
Every cost is attributable to a component.

### FR-11 Operator operations
Operators can monitor and act on active tours.

### FR-12 Dynamic adaptation
The system identifies downstream effects of a disruption and proposes alternatives.

### FR-13 Human control
Material changes require traveler/operator approval.

## 8. Innovation layer

### 8.1 Living Trip Graph
Model transport, hotel, activities, reservations, time windows, travelers and vendors as dependency nodes.

### 8.2 Ripple Impact Analyzer
When one node changes, calculate affected nodes, cost delta, time delta and preference impact.

### 8.3 What-If Simulator
Allow questions such as: “What if I stay one extra night in Jaipur?” Simulate consequences without modifying the real trip until confirmed.

### 8.4 Trade-off Recovery Cards
Present alternatives based on cost, time, impact and preference fit instead of one opaque AI answer.

### 8.5 Evidence / Provenance
Retain source information for factual destination knowledge.

### 8.6 Human-in-the-loop agentic planning
AI proposes; deterministic services validate; human approves.

### 8.7 Operator Digital Twin
Future operator view represents active tours, travelers, vehicles, bookings, vendors, disruptions and pending decisions.

### 8.8 Recommendation feedback loop
Search, view, save, dismiss, trip creation, booking, completion and rating can become future personalization signals. Do not fabricate training data.

## 9. Non-functional requirements
- Fast interactive recommendation responses.
- Deterministic calculations for money and operational decisions.
- Server-side RBAC.
- Secure secrets and authentication.
- Explainable recommendations/recovery.
- Database-backed state.
- Future real-time target: sub-500ms event propagation.
- Future itinerary scoring target: ≤300ms for hackathon-scale deterministic workloads.

## 10. Success metrics
Early:
- onboarding completion,
- recommendation API success,
- recommendation click/save,
- trip creation,
- itinerary acceptance.

Later:
- recommendation relevance,
- booking conversion,
- disruption recovery time,
- operator resolution time,
- traveler satisfaction,
- repeat-trip personalization.

## 11. Explicit current non-goals
Do not claim current production support for live hotel/flight inventory, production payments, GPS, real-time disruption detection, trained ML recommendation or fully autonomous booking.

## 12. North Star
A traveler should be able to say:
**“I want a trip that fits me.”**
Then:
**“Build the trip.”**
And during travel:
**“Something changed.”**
Voyara should understand the impact, present alternatives and preserve human control.
