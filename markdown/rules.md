# Voyara — rules.md
## Engineering & AI-Agent Rules

**Product:** Voyara — Personalized Dynamic Tour Planning & Tour Operations Platform
**Stack:** React + Vite + TypeScript, FastAPI, PostgreSQL/Neon.

### 1. Product principles
Voyara follows:
**Discover → Personalize → Recommend → Plan → Price → Book → Prepare → Operate → Assist → Adapt → Complete → Review**

The core differentiator is a **living trip system**. A trip is modeled as dependencies between transport, hotels, activities, time, cost, availability and traveler preferences. When reality changes, Voyara should identify impact, generate alternatives, explain trade-offs and keep the human in control.

### 2. Source-of-truth hierarchy
1. `api-contract.md` — exact API shapes.
2. PostgreSQL schema + Alembic migrations — persisted data truth.
3. `trd.md` — architecture and algorithms.
4. `prd.md` — product requirements.
5. `app-flow.md` — navigation.
6. Existing code — implementation reality.
7. UI/theme docs — visual rules.

Never silently introduce API/schema drift. If a contract changes, update docs, types and tests together.

### 3. Build states
Every feature is:
- **BUILD** — implemented and verified.
- **IN PROGRESS** — actively being implemented.
- **MOCK** — intentional fixture/stub.
- **PLANNED** — designed, not implemented.
- **DEFERRED** — intentionally postponed.

Never call something live, real-time, AI-powered or dynamic unless it actually is.

### 4. Current foundation
Already established:
- traveler/agent auth and RBAC,
- Argon2 + JWT authentication,
- persistent traveler preferences,
- PostgreSQL/Neon,
- destination knowledge base,
- source/provenance tracking,
- GeoNames/OpenTripMap ingestion pipeline,
- deterministic personalized recommendations.

Do not replace these with mock/demo behavior.

### 5. Data authenticity
Distinguish:
**source facts** — coordinates, names, POIs, provider data;
**derived metadata** — place/experience/style/companion/pace classification.

Derived metadata is recommendation classification, not an official fact. Preserve provenance whenever possible. Never fabricate ratings, reviews, opening hours, prices or inventory.

### 6. Recommendation rules
Current content-based weights:
- place 35%
- experience 20%
- budget 15%
- travel style 10%
- companion 7%
- transport 5%
- pace 3%
- season 5%

Do not train ML without genuine behavioral data. Future hybrid ranking may combine content + embeddings + behavior + context.

### 7. AI rules
LLMs may interpret requests, explain results, generate structured plan proposals and call approved tools.
LLMs must not be the sole authority for pricing, payment confirmation, availability, settlement or recovery ranking. Deterministic services own auditable calculations.

### 8. Dynamic itinerary rules
When a node changes:
1. identify affected dependencies,
2. preserve unaffected confirmed nodes,
3. generate feasible alternatives,
4. calculate cost/time/impact,
5. explain trade-offs,
6. request approval,
7. propagate the approved change.

### 9. Security
Never commit secrets. Never log passwords/tokens. Enforce RBAC server-side. Validate ownership. Use migrations. Payment card data never passes through Voyara.

### 10. Frontend
React + Vite + TypeScript. Preserve existing UI unless redesign is explicitly requested. API calls belong in services/query layers. Loading, empty and error states are required. Backend onboarding state is the source of truth.

### 11. Database
PostgreSQL/Neon is persistent truth. All schema changes use Alembic. Use normalized relational tables for trips/bookings/dependencies; JSONB only where appropriate.

### 12. Realtime
Future canonical WebSocket events:
`gps_update`, `chat_message`, `itinerary_change`, `disruption_alert`, `recovery_options`.
Do not invent new event names without updating the API contract.

### 13. Innovation guardrail
Every innovation must solve a real travel/operator problem. Prefer:
- living trip graph,
- ripple impact analysis,
- what-if simulation,
- explainable recovery,
- human-in-the-loop AI,
- provenance-aware travel knowledge,
- operator digital twin,
- behavioral recommendation feedback.

### 14. Implementation process
Inspect → understand build state → make smallest coherent change → test → verify real API/database → update docs → report exact changes.
Never rewrite a subsystem unnecessarily.
