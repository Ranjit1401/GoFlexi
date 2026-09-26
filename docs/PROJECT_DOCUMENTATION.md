# GoFlexi — Complete Technical & System Architecture Documentation

> **Version**: 1.0.0  
> **Status**: Production-Ready / Active  
> **Repository**: [GoFlexi (GitHub)](https://github.com/Ranjit1401/GoFlexi)  
> **Architecture**: Decoupled Dual-Portal Web Application (React 19 + FastAPI + Neon PostgreSQL)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Directory Structure](#4-project-directory-structure)
5. [Database Architecture & Data Models](#5-database-architecture--data-models)
6. [Authentication & Role-Based Access Control (RBAC)](#6-authentication--role-based-access-control-rbac)
7. [The 8-Step Manual Trip-Planning Recommendation Engine](#7-the-8-step-manual-trip-planning-recommendation-engine)
8. [AI Trip Co-Pilot & 3D Route Workspace](#8-ai-trip-co-pilot--3d-route-workspace)
9. [Travel Search Integration (Flights & Accommodations)](#9-travel-search-integration-flights--accommodations)
10. [Data Ingestion, Normalization & Enrichment Pipeline](#10-data-ingestion-normalization--enrichment-pipeline)
11. [Complete REST API Reference](#11-complete-rest-api-reference)
12. [Environment Configuration Reference](#12-environment-configuration-reference)
13. [Local Development & Setup Guide](#13-local-development--setup-guide)
14. [Automated Testing & Quality Assurance](#14-automated-testing--quality-assurance)

---

## 1. Executive Summary

**GoFlexi** is a high-performance, full-stack travel platform engineered to connect travelers seeking personalized, data-driven itineraries with tour operators managing group logistics, bookings, and departures.

### The Dual-Portal Paradigm
- **Traveler Portal**: Provides end-to-end journey creation. Travelers can construct trips using either an **AI-driven conversational Co-Pilot with a 3D Route Globe** or an interactive **8-step recommendation engine** combining live geocoding, OpenTripMap points of interest, Open-Meteo weather forecasts, Nager.Date holiday detection, Wikivoyage travel summaries, and Sky Scrapper flight/hotel search.
- **Tour Operator Portal (Agent Operations)**: A dedicated command dashboard for travel agencies and tour operators to monitor active departures, track booked travelers, inspect rosters, and manage capacity.

---

## 2. System Architecture

GoFlexi follows a clean, decoupled client-server architecture:

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                        |
|                                                                                       |
|   +------------------------------------+   +--------------------------------------+   |
|   |         Traveler Portal            |   |         Agent Portal (Command)       |   |
|   |  - 8-Step Trip Recommendation      |   |  - Operations Dashboard & Metrics    |   |
|   |  - AI Trip Co-Pilot & 3D Globe     |   |  - Tour Departure Manager            |   |
|   |  - Live Flight & Hotel Search      |   |  - Booking Ledger & Passenger Roster |   |
|   |  - Destination Directory & Sights  |   |  - Agency Profile & Verification     |   |
|   +------------------------------------+   +--------------------------------------+   |
|                                     │                          │                      |
|                                     ▼                          ▼                      |
|                   React 19 / TypeScript / Vite / Tailwind CSS / Context API           |
+---------------------------------------------------------------------------------------+
                                            │  HTTPS / REST (JWT in Bearer Header)
                                            ▼
+---------------------------------------------------------------------------------------+
|                                    SERVER TIER                                        |
|                                                                                       |
|                                 FastAPI (ASGI)                                        |
|  +---------------------------------------------------------------------------------+  |
|  | Middleware: CORS, Request Profiling, JWT Bearer Dependency Injection            |  |
|  +---------------------------------------------------------------------------------+  |
|  | Route Modules:                                                                  |  |
|  |   • /api/auth          • /api/agents            • /api/destinations             |  |
|  |   • /api/preferences   • /api/recommendations   • /api/copilot                  |  |
|  |   • /api/travel-search • /api/trip-wizard                                       |  |
|  +---------------------------------------------------------------------------------+  |
|  | Service Layer:                                                                  |  |
|  |   • geocoding_service    • poi_service         • date_insight_service           |  |
|  |   • ranking_service      • travel_search_client• copilot_service                |  |
|  |   • dataset_service      • recommendation_service                               |  |
|  +---------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
          │                                  │                               │
          ▼                                  ▼                               ▼
+-------------------+              +-------------------+           +-------------------+
|   DATA STORAGE    |              |  FREE PUBLIC APIs |           | RAPIDAPI SERVICES |
|                   |              |                   |           |                   |
| Neon Serverless   |              | • Open-Meteo      |           | • Sky Scrapper    |
| PostgreSQL        |              |   (Geocoding &    |           |   (Flights &      |
| (SQLAlchemy 2.0 & |              |    Forecasts)     |           |    Hotels Search) |
|  Alembic)         |              | • Nager.Date      |           |                   |
|                   |              |   (Holidays)      |           |                   |
|                   |              | • Wikivoyage REST |           |                   |
|                   |              | • OpenTripMap API |           |                   |
+-------------------+              +-------------------+           +-------------------+
```

---

## 3. Technology Stack

### Frontend
| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime / Library** | React | 19.x | Component rendering and virtual DOM |
| **Language** | TypeScript | 5.x | Strict static typing across components and services |
| **Build Tool** | Vite | 8.x | Lightning-fast HMR and Rollup production bundling |
| **Styling** | Tailwind CSS | 4.x | Utility-first responsive design system |
| **Routing** | React Router | 7.x | Declarative client-side routing with RBAC guards |
| **Icons** | Lucide React | Latest | Modern iconography |
| **HTTP Client** | Axios | 1.x | Async HTTP requests with interceptors for JWT injection |
| **State Management** | React Context + useReducer | Native | Reducer-backed stores (`AuthContext`, `TripWizardContext`, `ToastContext`) |

### Backend
| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | FastAPI | 0.115+ | High-throughput async REST API framework |
| **ASGI Server** | Uvicorn | Standard | Asynchronous server gateway interface |
| **ORM** | SQLAlchemy | 2.0+ | Modern mapped declarations and transactional sessions |
| **Database Migrations** | Alembic | 1.14+ | Schema revision tracking and database migrations |
| **Validation / Settings**| Pydantic v2 + Pydantic-Settings | 2.x | Schema serialization, validation, and `.env` loading |
| **Database Driver** | Psycopg 3 (`psycopg[binary]`) | 3.x | High-performance PostgreSQL connector |
| **Password Hashing** | Argon2 (`argon2-cffi`) | 23.x | State-of-the-art memory-hard password hashing |
| **Tokens** | PyJWT | 2.x | RFC 7519 compliant JSON Web Token authentication |
| **HTTP Client** | HTTPX | 0.28+ | Outbound async HTTP client for external travel APIs |
| **Testing** | Pytest + AnyIO + Starlette TestClient | 9.x | Asynchronous and unit test suites |

### Database
- **Engine**: PostgreSQL 16 (Hosted via **Neon Serverless PostgreSQL** with connection pooling).

---

## 4. Project Directory Structure

```text
GoFlexi/
├── README.md                                # Repository overview and initial quickstart
├── docs/
│   └── PROJECT_DOCUMENTATION.md             # Complete technical architecture manual
├── backend/
│   ├── .env.example                         # Environment variable template
│   ├── alembic.ini                          # Alembic database migration config
│   ├── requirements.txt                     # Pinned Python package dependencies
│   ├── alembic/
│   │   ├── env.py                           # Migration runtime configuration
│   │   └── versions/                        # Migration revisions
│   │       ├── 001_initial_users_and_agents.py
│   │       ├── 002_traveler_preferences_and_tags.py
│   │       ├── 003_destinations_and_sights.py
│   │       └── 004_destination_sources_table.py
│   ├── app/
│   │   ├── main.py                          # FastAPI application initialization & route mounting
│   │   ├── api/
│   │   │   ├── deps.py                      # Database session and JWT traveler/agent injectors
│   │   │   └── routes/                      # Route handlers
│   │   │       ├── auth.py                  # User registration, login, profile me
│   │   │       ├── agents.py                # Operations dashboard, tours, bookings
│   │   │       ├── preferences.py           # Traveler onboarding survey preferences
│   │   │       ├── recommendations.py       # Destination suggestions matching preferences
│   │   │       ├── destinations.py          # Destination database querying & filters
│   │   │       ├── copilot.py               # AI Copilot conversational planning
│   │   │       ├── travel_search.py         # Sky Scrapper airport, flight & hotel search
│   │   │       └── trip_wizard.py           # 8-step recommendation engine composite routes
│   │   ├── core/
│   │   │   ├── config.py                    # Settings class, Pydantic env resolution, CORS
│   │   │   └── security.py                  # Argon2 password verification, JWT creation
│   │   ├── db/
│   │   │   └── session.py                   # Engine initialization and get_db session generator
│   │   ├── models/                          # SQLAlchemy ORM database models
│   │   │   ├── user.py                      # User model (Travelers and Agents)
│   │   │   ├── agent.py                     # Agent operator metadata model
│   │   │   ├── preferences.py               # Traveler preferences & companion settings
│   │   │   └── destination.py               # Destinations, tags, and data sources
│   │   ├── schemas/                         # Pydantic data validation schemas
│   │   │   ├── auth.py                      # Auth tokens, credentials, and profile schemas
│   │   │   ├── agent.py                     # Operator roster and booking schemas
│   │   │   ├── preferences.py               # Onboarding preferences schemas
│   │   │   ├── destination.py               # Destination models
│   │   │   ├── copilot.py                   # Itinerary graph schema (TripPlanSchema)
│   │   │   ├── travel_search.py             # Flights and hotels schemas
│   │   │   └── trip_wizard.py               # 8-step wizard request/response schemas
│   │   └── services/                        # Business logic & external API clients
│   │       ├── geocoding_service.py         # Open-Meteo place geocoding
│   │       ├── poi_service.py               # OpenTripMap POIs + popularity classifier
│   │       ├── date_insight_service.py      # Weather + Nager.Date + crowd heuristic
│   │       ├── ranking_service.py           # Style-weighted flight & hotel ranker
│   │       ├── travel_search_service.py     # Sky Scrapper RapidAPI client & fallback data
│   │       ├── copilot_service.py           # Multi-agent itinerary generator
│   │       ├── dataset_service.py           # Local destination dataset query service
│   │       └── recommendation_service.py    # Preference-based destination scorer
│   ├── data/                                # Curated datasets
│   │   ├── processed/                       # voyara_destinations.json, .csv
│   │   └── raw/                             # GeoNames and OpenTripMap raw caches
│   ├── scripts/                             # Data ingestion & normalization scripts
│   │   ├── ingest_destinations.py
│   │   ├── ingest_geonames.py
│   │   ├── ingest_opentripmap.py
│   │   ├── normalize_destinations.py
│   │   └── validate_destinations.py
│   └── tests/                               # Pytest automated test suites
│       ├── conftest.py                      # Test client fixtures & mock DB
│       ├── test_auth.py
│       ├── test_copilot.py
│       ├── test_destinations.py
│       ├── test_explore_recommendations.py
│       ├── test_ingestion_pipeline.py
│       ├── test_preferences.py
│       ├── test_recommendations.py
│       ├── test_travel_search.py
│       └── test_trip_wizard.py
│
└── frontend/
    ├── package.json                         # Client dependencies and scripts
    ├── vite.config.ts                       # Vite bundler configuration
    ├── tailwind.config.js                   # Tailwind CSS styling tokens
    └── src/
        ├── App.tsx                          # App root with ToastProvider & AuthProvider
        ├── routes/
        │   └── AppRoutes.tsx                # Route tree, ProtectedRoute, PublicRoute
        ├── context/
        │   ├── AuthContext.tsx              # Session state, JWT storage, role management
        │   ├── ToastContext.tsx             # Interactive toast dispatching
        │   └── TripWizardContext.tsx        # Reducer state for 8-step recommendation wizard
        ├── services/                        # Axios API integration modules
        │   ├── api-client.ts                # Axios instance with auth request interceptor
        │   ├── auth.ts                      # Login, register, token refresh calls
        │   ├── preferences.ts               # Onboarding preference sync
        │   ├── recommendations.ts           # Destination exploration recommendations
        │   ├── destinations.ts              # Destination query API
        │   ├── copilot.ts                   # AI Copilot message dispatch
        │   ├── travel-search.ts             # Sky Scrapper flights & hotels client
        │   └── trip-wizard.ts               # 8-step wizard API & Wikivoyage summary
        ├── types/                           # TypeScript interfaces
        │   ├── auth.ts                      # UserProfile, AgentProfile, AuthState
        │   ├── traveler.ts                  # TravelPreferences, Trip models
        │   ├── travel-search.ts             # FlightOption, HotelOption, AirportSuggestion
        │   └── trip-planner.ts              # TripPlan, TripLocation, TripWizard interfaces
        ├── components/
        │   ├── ui/                          # Reusable UI components (Button, Input, Card, Modal)
        │   ├── traveler/                    # Traveler-specific widgets
        │   │   ├── ActivityCard.tsx         # POI card with popularity badges and detail modal
        │   │   ├── FlightSearchPanel.tsx    # Live flight search with style-weighted ranking
        │   │   ├── HotelSearchPanel.tsx     # Live hotel search with style-weighted ranking
        │   │   ├── TripPlanTree.tsx         # Day-by-day interactive itinerary timeline
        │   │   ├── TripGlobe.tsx            # 3D interactive route visualizer
        │   │   └── AiTripAssistant.tsx      # Co-pilot conversational panel
        │   └── agent/                       # Tour operator command widgets
        └── pages/                           # Application Views
            ├── LandingPage.tsx              # Public home marketing page
            ├── RoleSelectPage.tsx           # Role selection (Traveler vs Tour Operator)
            ├── traveler/                    # Traveler Portal pages
            │   ├── TravelerAuthPage.tsx     # Traveler Login/Registration
            │   ├── TravelerOnboardingPage.tsx # Travel style, pacing & companion survey
            │   ├── TravelerDashboardPage.tsx# Traveler overview, weather ticker, trips
            │   ├── TravelerExplorePage.tsx  # Destination catalog & filters
            │   ├── TravelerNewTripPage.tsx  # 8-step recommendation engine wizard
            │   ├── AiTripCopilotPage.tsx    # 3-panel AI planning & 3D globe workspace
            │   ├── TravelerTripsPage.tsx    # Itinerary ledger (Upcoming, Past, Draft)
            │   └── TravelerProfilePage.tsx  # Profile editor
            └── agent/                       # Agent Portal pages
                ├── AgentAuthPage.tsx        # Operator Login/Registration
                ├── AgentDashboardPage.tsx   # Fleet departures, revenue, bookings
                ├── AgentToursPage.tsx       # Tour package catalog manager
                ├── AgentBookingsPage.tsx    # Reservation ledger & approvals
                ├── AgentRosterPage.tsx      # Passenger manifested lists
                └── AgentProfilePage.tsx     # Agency verification & settings
```

---

## 5. Database Architecture & Data Models

GoFlexi runs on **PostgreSQL** managed through **SQLAlchemy 2.0** ORM and **Alembic** migrations.

```
       +-----------------------+
       |         users         |
       +-----------------------+
       | id (UUID / PK)        |
       | email (VARCHAR, UQ)   |
       | password_hash (TEXT)  |
       | name (VARCHAR)        |
       | role (traveler/agent) |
       | location, phone, bio  |
       | is_active (BOOLEAN)   |
       | created_at (DATETIME) |
       +-----------------------+
              │          │
   1-to-1     │          │ 1-to-1
              ▼          ▼
+---------------------+  +-------------------------+
|       agents        |  |  traveler_preferences   |
+---------------------+  +-------------------------+
| id (UUID / PK)      |  | id (UUID / PK)          |
| user_id (FK -> users|  | user_id (FK -> users)   |
| agency_name (STR)   |  | companion_type (STR)    |
| license_number(STR) |  | travel_pace (STR)       |
| phone, location     |  | budget_tier (STR)       |
| is_verified (BOOL)  |  | transport_pref (STR)    |
+---------------------+  | interest_tags (JSON)    |
                         | onboarding_done (BOOL)  |
                         +-------------------------+

+-------------------------------------------------------------+
|                        destinations                         |
+-------------------------------------------------------------+
| id (UUID / PK)                                              |
| name (VARCHAR, INDEX)                                       |
| state (VARCHAR), country (VARCHAR)                          |
| latitude (FLOAT), longitude (FLOAT)                         |
| description (TEXT), category (VARCHAR)                      |
| tags (JSON), popularity_score (FLOAT)                       |
+-------------------------------------------------------------+
```

---

## 6. Authentication & Role-Based Access Control (RBAC)

### Security Primitives
1. **Password Hashing**: Uses `argon2id` via `argon2-cffi` (memory-hard, resistant to GPU/ASIC attacks).
2. **Token Generation**: RFC 7519 JSON Web Tokens (PyJWT) signed with `HS256` and configured expiration (`ACCESS_TOKEN_EXPIRE_MINUTES`).
3. **Role Segregation**: Users possess either the `traveler` or `agent` role:
   - `get_current_user`: Base dependency extracting and validating the JWT payload.
   - `get_current_traveler`: Rejects tokens not carrying `role == 'traveler'`.
   - `get_current_agent`: Rejects tokens not carrying `role == 'agent'`.

### Client-Side Route Protection (`AppRoutes.tsx`)
- `<ProtectedRoute allowedRole="traveler" requireOnboarding={true}>`: Wraps `/user/*`. Redirects unauthenticated visitors to `/user/auth` and incomplete travelers to `/user/onboarding`.
- `<ProtectedRoute allowedRole="agent">`: Wraps `/agent/*`. Restricts access strictly to verified tour operators.
- `<PublicRoute restrictForRole="traveler">`: Prevents logged-in travelers from navigating back to login/signup pages.

---

## 7. The 8-Step Manual Trip-Planning Recommendation Engine

The manual planner located at [TravelerNewTripPage.tsx](file:///Users/gauravchauhan/goflexi/GoFlexi/frontend/src/pages/traveler/TravelerNewTripPage.tsx) is a full recommendation engine powered entirely by free, zero-auth public APIs:

```
+-------------------------------------------------------------------------------------------------------------------+
|                                            THE 8-STEP TARGET FLOW                                                 |
+-------------------------------------------------------------------------------------------------------------------+
|                                                                                                                   |
|  [Step 1: Destination & Activities]       --> Open-Meteo Geocoding + OpenTripMap Iconic/Popular Sights            |
|                │                                                                                                  |
|  [Step 2: Dates & Climate Outlook]       --> Open-Meteo 16-Day Forecast + Nager.Date + Crowd Heuristic            |
|                │                                                                                                  |
|  [Step 3: Travelers & Party Sizing]       --> Solo, Couple, Small Group, Family allocations                       |
|                │                                                                                                  |
|  [Step 4: Live Budget Range Bounds]       --> Live Flight + Hotel Price Check -> Dynamic Min/Max Bounds          |
|                │                                                                                                  |
|  [Step 5: Hidden Gems Discovery]          --> OpenTripMap Hidden Gems (rate <= 1) + Wikivoyage Summary            |
|                │                                                                                                  |
|  [Step 6: Travel Style Confirmation]      --> Budget, Balanced, Premium, Luxury (weights ranking algorithm)       |
|                │                                                                                                  |
|  [Step 7: Recommended Flights]            --> Ranked by Style Weights & Non-Stop Bonus; Budget Constrained        |
|                │                                                                                                  |
|  [Step 8: Recommended Stays & Timeline]   --> Composite Recommendation -> Renders Full Day-by-Day TripPlanTree    |
|                                                                                                                   |
+-------------------------------------------------------------------------------------------------------------------+
```

### Detailed Step-by-Step Implementation

#### Step 1: Where are you heading?
- **Departing From Input**: Defaults to traveler profile city (`AuthContext`), with placeholder "e.g. Mumbai".
- **Destination Autocomplete**: 300ms debounced input calling `/api/trip-wizard/destinations?query=`.
- **Instant Presets**: Pre-calibrated coordinates for major hubs (Goa, Manali, Kerala, Rajasthan, Meghalaya, Andaman, Kashmir, Sikkim).
- **Popular Activity Discovery**: As soon as destination coordinates are resolved, queries `/api/trip-wizard/activities?lat=&lon=&mode=popular`. Categorizes sights with `rate >= 2` as **"Iconic"** or **"Popular"**. Rendered using [ActivityCard.tsx](file:///Users/gauravchauhan/goflexi/GoFlexi/frontend/src/components/traveler/ActivityCard.tsx).

#### Step 2: When do you plan to travel?
- **Date Guards**: Departure date has `min={today}`, Return date has `min={startDate}`. Auto-advances if dates overlap.
- **Climate Outlook**: Calls `/api/trip-wizard/date-insight`:
  - If travel dates are within 16 days: Calls Open-Meteo Forecast API (`temperature_2m_max`, `temperature_2m_min`, `precipitation_probability_max`).
  - If further out: Averages historical daily climate data over the past 5 years and labels it **"Typical Seasonal Weather"**.
- **Public Holiday Overlap**: Queries `https://date.nager.at/api/v3/PublicHolidays/{year}/{country_code}` without keys. Flags holidays falling within `[start_date - 2 days, end_date + 2 days]`.
- **Deterministic Crowd Heuristic**:
  ```python
  def estimate_crowd(latitude: float, start_date: date, holiday_overlap: bool) -> tuple[int, str]:
      month = start_date.month
      hemisphere_summer = {6, 7, 8} if latitude >= 0 else {12, 1, 2}
      hemisphere_winter_break = {12, 1} if latitude >= 0 else {6, 7}
      base = 75 if month in hemisphere_summer or month in hemisphere_winter_break else \
             45 if month in {3, 4, 5, 9, 10, 11} else 55
      score = min(100, base + (20 if holiday_overlap else 0))
      label = "Low" if score < 45 else "Moderate" if score < 70 else "High"
      return score, label
  ```
- **Mandatory Disclaimer**: Always visible in muted type:
  `"Crowd level is a seasonal + public-holiday estimate, not live occupancy data."`

#### Step 3: Travelers & Party Sizing
- Preset selector: Solo (1), Couple (2), Small Group (3-4), Family / Party (5+).
- Dynamically controls required room counts: `rooms = max(1, (travelers + 1) // 2)`.

#### Step 4: Budget Range Selector
- Calls `/api/trip-wizard/budget-preview?destination=&start_date=&end_date=&travelers=&departure_city=`.
- Derives real market bounds from flight and accommodation queries.
- Presents an interactive slider bounded by actual market prices, alongside smart presets (Value, Comfort, Premium, Bespoke).

#### Step 5: Hidden Gems & Local Travel Guide
- **Wikivoyage Summary**: Queries `https://en.wikivoyage.org/api/rest_v1/page/summary/{destination}` without authentication. Displays a localized travel excerpt.
- **Hidden Gems Grid**: Queries `/api/trip-wizard/activities?lat=&lon=&mode=hidden`. Sights with `rate <= 1` or missing popularity signals are classified as **"Hidden Gems"**. Selections merge into the running `activities` context.

#### Step 6: Travel Style Weighting
- Selects from: **Budget**, **Balanced**, **Premium**, **Luxury**.
- Dictates algorithmic weightings used in Steps 7 & 8:
  ```python
  STYLE_WEIGHTS = {
      "Budget":   {"price": 0.60, "quality": 0.10, "cabin": "economy",         "min_star": 1},
      "Balanced": {"price": 0.35, "quality": 0.35, "cabin": "economy",         "min_star": 3},
      "Premium":  {"price": 0.20, "quality": 0.50, "cabin": "premium_economy", "min_star": 4},
      "Luxury":   {"price": 0.10, "quality": 0.60, "cabin": "business",        "min_star": 5},
  }
  ```

#### Step 7: Recommended Flights
- Calls flight search from `departureCity` to `destination` for `startDate` to `endDate`.
- Applies `STYLE_WEIGHTS` scoring:
  $$\text{Score} = (\text{weight}_{\text{quality}} \times \text{quality}) - (\text{weight}_{\text{price}} \times \text{norm\_price}) + (0.10 \text{ if non-stop})$$
- Top pick is highlighted with the badge: **"Recommended for you • Top {style} Pick"**. User can choose from alternates.

#### Step 8: Recommended Stays & Day-by-Day Itinerary Generation
- Displays hotel search results filtered by star tier and budget, highlighting the top match.
- Clicking **"Generate My Trip Plan"** dispatches `POST /api/trip-wizard/recommend`:
  - Reuses the traveler's chosen `selected_flight` and `selected_hotel` without redundant network round trips.
  - Distributes the traveler's selected activities evenly across each day of the journey.
  - Constructs a complete `TripPlanSchema` hierarchy.
  - Renders the interactive day-by-day plan using [TripPlanTree.tsx](file:///Users/gauravchauhan/goflexi/GoFlexi/frontend/src/components/traveler/TripPlanTree.tsx).
  - Clicking **"Save Trip"** persists the itinerary to `localStorage` (`goflexi_custom_trips`), immediately rendering it under **Upcoming Trips** on [TravelerTripsPage.tsx](file:///Users/gauravchauhan/goflexi/GoFlexi/frontend/src/pages/traveler/TravelerTripsPage.tsx).

---

## 8. AI Trip Co-Pilot & 3D Route Workspace

Located at [AiTripCopilotPage.tsx](file:///Users/gauravchauhan/goflexi/GoFlexi/frontend/src/pages/traveler/AiTripCopilotPage.tsx), this feature offers an interactive planning alternative:

```
+----------------------------------------------------------------------------------------------------+
|                                    AI TRIP CO-PILOT WORKSPACE                                      |
+-----------------------------------+--------------------------------+-------------------------------+
|    LEFT PANEL: TripPlanTree       |   CENTER PANEL: TripGlobe      |    RIGHT PANEL: AI Chat       |
|                                   |                                |                               |
| • Outbound Flight Node            | • 3D Interactive Route Map     | • Natural Language Prompts    |
| • Curated Resort & Concierge      | • Spherical Geodesic Flight    | • Style & Pacing Modification |
| • Day-by-day sightseeing schedule |   Arches                       | • Real-time Plan Modification |
| • Clickable Waypoints             | • Interactive Waypoint Pins    | • JSON Graph Generation       |
+-----------------------------------+--------------------------------+-------------------------------+
```

---

## 9. Travel Search Integration (Flights & Accommodations)

Located in [travel_search_service.py](file:///Users/gauravchauhan/goflexi/GoFlexi/backend/app/services/travel_search_service.py):
- **Provider**: Sky Scrapper API via RapidAPI (`https://sky-scrapper.p.rapidapi.com`).
- **Resilient Fallback Mechanism**:
  If the configured `RAPIDAPI_KEY` is missing, rate-limited, or encounters **HTTP 429 (Monthly Quota Exceeded)**, the client automatically falls back to an internal realistic dataset (`_get_demo_flights`, `_get_demo_hotels`). The application maintains full functionality without crashing.

---

## 10. Data Ingestion, Normalization & Enrichment Pipeline

GoFlexi includes a destination data processing pipeline located in `backend/scripts/`:

1. `ingest_destinations.py`: Loads curated Indian destinations from `backend/data/processed/voyara_destinations.json`.
2. `ingest_geonames.py`: Fetches administrative boundary regions, population counts, and coordinates from GeoNames.
3. `ingest_opentripmap.py`: Enriches points of interest using OpenTripMap APIs.
4. `normalize_destinations.py`: Deduplicates destination names, standardizes category tags, and validates coordinate bounding boxes.
5. `validate_destinations.py`: Verifies database constraints and ensures all destinations feature valid coordinates.

---

## 11. Complete REST API Reference

All protected endpoints require `Authorization: Bearer <jwt_token>`.

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user as `traveler` or `agent` |
| `POST` | `/api/auth/login` | Public | Authenticate with email/password; returns JWT access token |
| `GET` | `/api/auth/me` | User | Get profile details of current user |
| `GET` | `/api/auth/traveler/onboarding-status` | Traveler | Check if traveler completed preference onboarding |

### Agent Operations (`/api/agents`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/agents/me` | Agent | Get current tour operator profile & verification status |
| `GET` | `/api/agents/dashboard` | Agent | Get operational metrics (departures, passenger count, revenue) |
| `GET` | `/api/agents/tours` | Agent | Get list of tour packages managed by the agency |
| `GET` | `/api/agents/bookings` | Agent | Query traveler booking ledger and reservations |

### Preferences & Recommendations (`/api/preferences`, `/api/recommendations`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/preferences` | Traveler | Retrieve traveler travel pacing, budget & companion settings |
| `PUT` | `/api/preferences` | Traveler | Update traveler preferences & mark onboarding completed |
| `GET` | `/api/recommendations/destinations` | Traveler | Get content-filtered destination recommendations |

### AI Trip Co-Pilot (`/api/copilot`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/copilot/chat` | Traveler | Send prompt to AI co-pilot; returns message and `TripPlanSchema` |

### Travel Search (`/api/travel-search`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/travel-search/airports?query=` | Traveler | Search airports and transport hubs |
| `POST` | `/api/travel-search/flights` | Traveler | Search scheduled flights between origin and destination |
| `GET` | `/api/travel-search/hotels/destinations?query=` | Traveler | Resolve city name to hotel destination entity ID |
| `POST` | `/api/travel-search/hotels` | Traveler | Search hotel inventory and nightly rates |

### 8-Step Trip Wizard (`/api/trip-wizard`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/trip-wizard/destinations?query=` | Traveler | Live geocoding via Open-Meteo Geocoding API |
| `GET` | `/api/trip-wizard/activities?lat=&lon=&mode=` | Traveler | Search activities (mode: `popular` or `hidden`) via OpenTripMap |
| `GET` | `/api/trip-wizard/activities/{xid}` | Traveler | On-demand detail retrieval for single POI |
| `GET` | `/api/trip-wizard/date-insight` | Traveler | Weather forecast/archive, holiday overlap, and crowd estimate |
| `GET` | `/api/trip-wizard/budget-preview` | Traveler | Live market min/max budget bounds calculation |
| `POST` | `/api/trip-wizard/recommend` | Traveler | Composite trip recommendation generating day-by-day plan |

---

## 12. Environment Configuration Reference

### Backend Configuration (`backend/.env`)

```ini
# Database Connection (Neon Serverless PostgreSQL)
DATABASE_URL=postgresql+psycopg://YOUR_USER:YOUR_PASSWORD@ep-sample-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT Token Security (Must be 32+ bytes for production)
SECRET_KEY=GoFlexi-super-secret-key-phase1-production-jwt-token-security-32bytes
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS Allowed Origins
CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]

# Sky Scrapper Travel Search (RapidAPI)
# Note: If unset, expired, or rate-limited (HTTP 429), GoFlexi automatically uses realistic fallback data
RAPIDAPI_KEY=your-rapidapi-key
RAPIDAPI_HOST=sky-scrapper.p.rapidapi.com

# OpenTripMap API Key (Free tier key from opentripmap.com)
OPENTRIPMAP_API_KEY=your-opentripmap-key

# Optional GeoNames Username (For offline data ingestion scripts)
GEONAMES_USERNAME=your-geonames-username
```

### Frontend Configuration (`frontend/.env`)

```ini
# Base URL pointing to FastAPI Backend
VITE_API_URL=http://localhost:8000/api
```

---

## 13. Local Development & Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/Ranjit1401/GoFlexi.git
cd GoFlexi
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Neon connection string and secret key

# Apply database migrations
alembic upgrade head

# Start backend dev server (Runs on http://127.0.0.1:8000)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive OpenAPI Swagger UI is available at: **`http://127.0.0.1:8000/docs`**

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite development server (Runs on http://localhost:5174)
npm run dev
```

---

## 14. Automated Testing & Quality Assurance

### Running Backend Tests
GoFlexi maintains comprehensive unit and integration test coverage:

```bash
cd backend
.venv/bin/pytest
```

**Test Coverage Summary (99/99 Passing)**:
- `test_auth.py`: User registration, login, token refresh, duplicate email rejection.
- `test_copilot.py`: Itinerary schema validation, multi-day generation, location coordinates.
- `test_destinations.py`: Database query filters, category tags, unique constraints.
- `test_explore_recommendations.py`: Recommendation scoring algorithms.
- `test_ingestion_pipeline.py`: Normalization and deduplication pipeline tests.
- `test_preferences.py`: Traveler onboarding preference updates.
- `test_recommendations.py`: Personalized travel style matching.
- `test_travel_search.py`: Airport resolution, flight parsing, hotel suggestions, fallback handling.
- `test_trip_wizard.py`: Geocoding, activity classification, date insight weather fallbacks, budget bounds, and composite recommendation graph generation.

### Running Frontend Verification
```bash
cd frontend
npm run build
```
Executes `tsc -b && vite build` ensuring 100% strict TypeScript typing adherence and production-ready bundle output.
