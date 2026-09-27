# Voyara — API Contract

## 1. Contract status
This document separates **CURRENT** endpoints from **PLANNED** endpoints.

Local backend base:
`http://127.0.0.1:8000/api`

Authenticated requests:
`Authorization: Bearer <access_token>`

Do not implement PLANNED endpoints until their schema is approved and covered by migrations/tests.

## 2. Conventions
JSON bodies. UUID identifiers where applicable. Existing endpoint response shapes are authoritative in code. New list APIs should use:
```json
{"items":[],"page":1,"page_size":20,"total":0}
```

Recommended structured error:
```json
{"error":{"code":"VALIDATION_ERROR","message":"Invalid request"}}
```

Roles:
- `traveler`
- `agent`
- future `driver`

# 3. CURRENT — Authentication

## POST `/api/auth/register`
Creates a user.

Request:
```json
{"name":"Ranjit","email":"user@example.com","password":"password","role":"traveler"}
```

## POST `/api/auth/login`
Request:
```json
{"email":"user@example.com","password":"password","role":"traveler"}
```

Success:
```json
{"access_token":"<jwt>","token_type":"bearer"}
```

Rules:
- invalid credentials → 401;
- wrong role → 403/appropriate auth error;
- backend failure must not authenticate the frontend;
- failed login must not redirect to dashboard.

## GET `/api/auth/me`
Returns the authenticated user.

## GET `/api/users/me`
Returns the authenticated profile.

## GET `/api/agents/me`
Agent-only profile endpoint. Traveler access → 403.

# 4. CURRENT — Traveler preferences

## PUT `/api/users/me/preferences`
Persists onboarding selections.

Conceptual request:
```json
{
  "places":["Mountains","Nature"],
  "experiences":["Adventure","Photography"],
  "travel_style":"Balanced",
  "companions":"Friends",
  "transport":"Bus",
  "itinerary_pace":"Balanced",
  "budget_range":"₹25k–₹50k",
  "onboarding_completed":true
}
```

## GET `/api/users/me/preferences`
Returns the saved preferences. `onboarding_completed` is the backend source of truth.

# 5. CURRENT — Destination knowledge

## GET `/api/destinations`
Supports pagination, search and destination filters.

Example response:
```json
{"items":[],"page":1,"page_size":20,"total":192}
```

## GET `/api/destinations/{destination_id}`
Returns destination details. Unknown ID → 404.

# 6. CURRENT — Recommendations

## GET `/api/recommendations`
Traveler-only. Query: `limit` 1–50, default 10.

The existing service:
1. loads preferences,
2. hard-filters incompatible candidates,
3. calculates normalized feature scores,
4. applies weighted scoring,
5. limits state diversity,
6. generates deterministic explanations.

Current weights:
place .35, experience .20, budget .15, travel_style .10, companion .07, transport .05, pace .03, season .05.

Do not silently create a second recommendation algorithm.

# 7. PLANNED — Explore

## GET `/api/explore/recommendations`
Combines saved preferences with temporary Explore filters:
place, experience, state, style, companion, transport, pace, budget and search.

Explore filters must not overwrite saved preferences.

# 8. PLANNED — Trips

## POST `/api/trips`
Creates a draft trip.

```json
{
  "title":"Rajasthan Adventure",
  "start_date":"2026-11-10",
  "end_date":"2026-11-15",
  "origin":"Mumbai",
  "destination_ids":["uuid1","uuid2"]
}
```

## GET `/api/trips`
Lists the user's trips.

## GET `/api/trips/{trip_id}`
Returns trip details.

## PATCH `/api/trips/{trip_id}`
Updates a draft trip.

# 9. PLANNED — AI Trip Co-Pilot

## POST `/api/trips/{trip_id}/copilot/messages`

Request:
```json
{"message":"Make the trip more relaxed and add one nature experience."}
```

Response:
```json
{
  "message":"I can adjust the plan.",
  "plan_delta":{},
  "requires_confirmation":true
}
```

The assistant does not directly confirm bookings or financial changes.

# 10. PLANNED — Itinerary

## POST `/api/trips/{trip_id}/generate`
Starts generation.

## GET `/api/trips/{trip_id}/generate/status`
Returns:
```json
{"status":"queued|running|completed|failed","progress":75}
```

## GET `/api/trips/{trip_id}/itinerary`
Returns structured day-by-day itinerary.

# 11. PLANNED — Living trip graph

## GET `/api/trips/{trip_id}/graph`

Example:
```json
{
  "nodes":[
    {"id":"transport-1","type":"TRANSPORT","status":"CONFIRMED"},
    {"id":"hotel-1","type":"HOTEL","status":"CONFIRMED"}
  ],
  "edges":[
    {"from":"transport-1","to":"hotel-1","type":"DEPENDS_ON"}
  ]
}
```

# 12. PLANNED — Dynamic adaptation

## POST `/api/trips/{trip_id}/disruptions`
Creates/records a disruption.

## GET `/api/trips/{trip_id}/disruptions/{disruption_id}/impact`
Returns affected nodes and cost/time/preference deltas.

## GET `/api/trips/{trip_id}/disruptions/{disruption_id}/recovery-options`
Returns feasible recovery strategies.

## POST `/api/recovery-options/{option_id}/accept`
Applies a user-approved strategy.

# 13. PLANNED — Operator

Potential agent routes:
- `GET /api/agent/tours`
- `GET /api/agent/tours/{trip_id}`
- `GET /api/agent/travelers`
- `GET /api/agent/vendors`
- `POST /api/agent/vendors`
- `PATCH /api/agent/vendors/{vendor_id}`
- `GET /api/agent/modification-requests`
- `POST /api/agent/trips/{trip_id}/override`

All require agent role and resource ownership.

# 14. PLANNED — Realtime

WebSocket:
`/ws/trips/{trip_id}?token=<jwt>`

Canonical events:
- `gps_update`
- `chat_message`
- `itinerary_change`
- `disruption_alert`
- `recovery_options`

High-frequency GPS belongs on WebSocket, not REST.

# 15. PLANNED — AI tools / MCP
Internal tool layer may expose:
- weather,
- POI/destination details,
- maps,
- vendor inventory,
- availability.

Frontend never calls MCP servers directly.

# 16. Error codes
Recommended:
`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN_ROLE`, `NOT_FOUND`, `CONFLICT`, `VENDOR_UNAVAILABLE`, `PAYMENT_FAILED`, `GENERATION_IN_PROGRESS`, `INTERNAL_ERROR`.

# 17. Governance
Every endpoint addition requires:
1. contract entry,
2. Pydantic schema,
3. service,
4. route,
5. frontend/shared type,
6. tests.

No undocumented endpoint becomes a product dependency.
