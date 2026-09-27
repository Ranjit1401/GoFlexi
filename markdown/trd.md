# Voyara — Technical Requirements Document (TRD)

## 1. Technical vision

Voyara is a modular travel-intelligence and tour-operations platform.

Current:
```text
React/Vite/TS → FastAPI → PostgreSQL/Neon
                         ↘ GeoNames/OpenTripMap
```

Future:
```text
AI Orchestrator → Tool/MCP Gateway
       ↓
Trip Graph + Optimizer
       ↓
Realtime Gateway → Redis/WebSocket
```

## 2. Technology stack

### Frontend
React, Vite, TypeScript, Tailwind CSS, React Router, Axios/service layer, Lucide React.

### Backend
Python, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic, Argon2, JWT.

### Database
PostgreSQL on Neon.

### Current knowledge pipeline
GeoNames, OpenTripMap, geographic validation, raw/processed datasets and source tracking.

### Future infrastructure
Redis, WebSockets, Mapbox, LLM provider abstraction, MCP/tool gateway, payments, PostGIS.

## 3. Architecture principles

1. PostgreSQL is persistent truth.
2. Deterministic services own money, constraints and operational calculations.
3. AI orchestrates intent/tools but does not invent operational truth.
4. Material changes require human approval.
5. Destination facts retain provenance.
6. Add infrastructure only when the product requires it.

## 4. Current backend structure

```text
app/
├── api/routes/
├── core/
├── db/
├── models/
├── schemas/
├── services/
│   ├── recommendation_service.py
│   ├── destination_service.py
│   └── ...
└── main.py
```

Future domain boundaries:
`identity`, `planning`, `recommendation`, `knowledge`, `pricing`, `booking`, `operations`, `adaptation`, `realtime`, `ledger`, `ai`, `mcp_gateway`.

## 5. Current data architecture

Core entities:
- `users`
- `agents`
- `traveler_profiles`
- `traveler_interests`
- `destinations`
- `destination_tags`
- `destination_travel_styles`
- `destination_companions`
- `destination_transport`
- `destination_paces`
- `destination_best_months`
- `destination_sources`

## 6. Destination ingestion

```text
External source
 ↓
Raw cache
 ↓
Parse
 ↓
Normalize
 ↓
Deduplicate
 ↓
Voyara taxonomy classification
 ↓
Validate
 ↓
Attach provenance
 ↓
PostgreSQL
 ↓
Recommendation engine
```

The pipeline must be idempotent. Repeat ingestion should update existing records rather than create uncontrolled duplicates.

## 7. Recommendation architecture

Current:
```text
Traveler preferences
 ↓
Candidate pool
 ↓
Hard compatibility filter
 ↓
Feature matching
 ↓
Weighted score
 ↓
State diversity
 ↓
Explanation
 ↓
Top-K
```

Weights:
| Signal | Weight |
|---|---:|
| Place | 0.35 |
| Experience | 0.20 |
| Budget | 0.15 |
| Travel style | 0.10 |
| Companion | 0.07 |
| Transport | 0.05 |
| Pace | 0.03 |
| Season | 0.05 |

Current engine is content-based, not trained ML.

## 8. Recommendation evolution

Level 1: content-based matching.

Level 2:
```text
Traveler intent → embedding → destination/POI embeddings → semantic similarity
```

Level 3:
`content + semantic + behavior + context`

Level 4: learning-to-rank after enough genuine behavioral data exists.

Never fabricate training events.

## 9. Trip domain model

Future:
```text
Trip
 ├─ Traveler
 ├─ Origin
 ├─ Dates
 ├─ Preferences
 ├─ Destinations
 ├─ Legs
 ├─ Itinerary Items
 ├─ Bookings
 ├─ Vendors
 └─ Dependency Graph
```

## 10. Living trip graph

### Node types
- flight/train/bus
- hotel
- activity
- restaurant
- transfer
- guide
- booking
- traveler commitment

### Edge types
- `DEPENDS_ON`
- `PRECEDES`
- `LOCATED_AFTER`
- `BOOKING_FOR`
- `CONFLICTS_WITH`
- `REQUIRES`

Example:
```text
Mumbai→Delhi flight
 ↓
Delhi hotel
 ↓
Delhi activity
 ↓
Delhi→Jaipur train
 ↓
Jaipur hotel
 ↓
Jaipur activity
```

## 11. Ripple impact algorithm

When node X changes:
1. mark X disrupted;
2. traverse downstream dependencies;
3. classify unaffected/affected/blocked/optional nodes;
4. recalculate time, availability, cost and preference fit;
5. generate feasible recovery candidates;
6. score candidates;
7. return alternatives.

Future penalty:
```text
Penalty =
 W_COST × Δcost
 + W_TIME × Δtime
 + W_IMPACT × affected_nodes
 + W_PREFERENCE × preference_loss
```

Lower calculated penalty means lower disruption cost.

## 12. What-if simulation

```text
Original trip
 ↓
Temporary clone
 ↓
Apply hypothetical change
 ↓
Recalculate dependencies
 ↓
Calculate deltas
 ↓
Return simulation
```

No booking/state mutation occurs until confirmation.

## 13. AI Co-Pilot architecture

```text
User
 ↓
Chat UI
 ↓
AI Orchestrator
 ├─ preference service
 ├─ destination search
 ├─ recommendation service
 ├─ itinerary planner
 ├─ weather
 ├─ maps/POI
 └─ trip graph
 ↓
Structured plan delta
 ↓
Backend validation
 ↓
Human confirmation
 ↓
Persist
```

The LLM must not write arbitrary database state.

Example:
```json
{
  "action":"ADD_ACTIVITY",
  "trip_id":"uuid",
  "activity_id":"uuid",
  "day":2,
  "reason":"Matches your nature and photography preferences",
  "requires_confirmation":true
}
```

## 14. AI Co-Pilot UI

Three surfaces share one `TripState`:
- left: dependency/plan tree,
- center: globe/map route,
- right: AI assistant.

No independent fake state per panel.

## 15. Pricing

Future deterministic calculation:
```text
hotel + transport + activities + tickets + service fee + margin = total
```

LLM may explain pricing but never becomes the authoritative calculator.

## 16. Booking

Future:
```text
Traveler
 ↓
Checkout
 ↓
Payment provider
 ↓
Verified webhook
 ↓
Booking confirmation
 ↓
Voucher
 ↓
Trip state update
```

Never confirm a booking from a client-only success response.

## 17. Realtime

Future:
```text
Traveler/Operator/Driver
 ↓
WebSocket
 ↓
FastAPI gateway
 ↓
Redis
 ↓
Subscribed clients
```

Events:
`gps_update`, `chat_message`, `itinerary_change`, `disruption_alert`, `recovery_options`.

## 18. Operator command center

Future operator state:
```text
Active Tours
 ├─ Traveler
 ├─ Current location
 ├─ Current leg
 ├─ Booking state
 ├─ Vendor state
 ├─ Disruptions
 └─ Pending decisions
```

Actions:
approve/reject change, override itinerary, reassign vendor/driver, communicate with traveler.

## 19. Group settlement

Future:
```text
Activity cost
 ↓
Participants
 ↓
Individual owed amounts
 ↓
Net balances
 ↓
Greedy minimum cash-flow
 ↓
Minimal transfers
 ↓
UPI links
```

Keep this calculation deterministic and auditable.

## 20. Performance targets

Current:
- fast interactive recommendations,
- responsive UI,
- efficient destination queries.

Future engineering targets:
- itinerary scoring/generation ≤300ms at hackathon scale,
- realtime propagation target ≤500ms,
- settlement ≤30ms for small groups,
- 3D visualization target 60 FPS.

These are targets, not claims of current production performance.

## 21. Security

- Argon2 passwords.
- JWT authentication.
- server-side RBAC.
- resource ownership checks.
- environment-based secrets.
- verified payment webhooks.
- no raw card data.
- audit logs for material operational changes.

## 22. Testing strategy

### Backend
unit, API, auth/RBAC, recommendation scenarios, ingestion validation and migration tests.

### Frontend
TypeScript/build checks, critical route tests and browser E2E.

### Recommendation QA profiles
1. Mountain + Adventure + Budget + Friends.
2. Beach + Relaxation + Couple.
3. Historical + Culture + Family.
4. Wildlife + Nature + Photography.
5. City + Food + Nightlife.

Recommendations must be semantically plausible for each profile.

## 23. Deployment evolution

Current:
- Vite frontend,
- FastAPI backend,
- Neon PostgreSQL.

Future:
- Redis,
- WebSockets,
- background workers,
- monitoring,
- scalable provider integrations.

Do not add microservices/Kubernetes merely for architecture diagrams.

## 24. Implementation phases

1. Foundation — auth/preferences.
2. Knowledge — real destinations/provenance.
3. Recommendation — quality validation.
4. Explore — temporary filters and interaction signals.
5. Trip — draft trip and destination selection.
6. AI Co-Pilot — structured assistant.
7. Itinerary — constraint-aware generation.
8. Dynamic Graph — dependencies/ripple/what-if.
9. Operations — agent console/vendors/overrides.
10. Live — WebSocket/GPS/chat/disruptions.
11. Commercial — pricing/booking/payments/settlement.
12. Learning — behavioral data/hybrid recommendation/ML ranking.

## 25. Core engineering principle

Build in this order:

**real data → deterministic logic → structured AI → human approval → operational automation**

Not:

**fake data → chatbot → uncontrolled automation**.
