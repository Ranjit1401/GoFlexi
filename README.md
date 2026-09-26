# GoFlexi — Personalized Dynamic Tour Planning & Tour Operations Platform

GoFlexi is a modern, full-stack travel platform designed to bridge the gap between personalized travel experiences and high-efficiency tour operations. It provides a specialized dual-portal experience for **Travelers** and **Tour Agents**, powered by a React frontend, FastAPI backend, and Neon Serverless PostgreSQL database.

> 📖 **Comprehensive Project Documentation**: For the complete system architecture, data models, 8-step recommendation engine design, REST API reference, and deployment guide, see [`docs/PROJECT_DOCUMENTATION.md`](docs/PROJECT_DOCUMENTATION.md).

---

## 🌟 Key Features

### 🧳 Traveler Portal
- **AI-Tailored Itineraries**: Intelligent itinerary recommendations based on traveler style, companion preferences, and pacing.
- **Onboarding Flow**: Multi-step preference gathering covering attractions, pacing, transportation, budget, and travel companions.
- **Adaptive Trip Management**: Real-time status monitoring, weather-aware trip adjustments, and daily activity schedules.
- **Secure Authentication**: Dedicated signup and login with persistent session restoration.

### 🏢 Tour Operator Command (Agent Portal)
- **Operations Dashboard**: Centralized view of active departures, upcoming passenger rosters, and operational capacity.
- **Booking & Roster Ledger**: Manage reservations, monitor tour statuses, and dispatch updates to travelers.
- **Agency Profile Integration**: Linked agency details and verified operator accounts.
- **Role-Based Protection**: Strict route guards ensuring operator tools remain isolated from travelers.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/)
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/) + [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- **Security & Hashing**: [Argon2](https://github.com/hynek/argon2-cffi) (`argon2-cffi`)
- **Authentication**: JWT tokens via [PyJWT](https://pyjwt.readthedocs.io/)
- **Database Driver**: [Psycopg 3](https://www.psycopg.org/) (`psycopg[binary]`)

### Database
- **Provider**: [Neon](https://neon.tech/) Serverless PostgreSQL

---

## 📁 Project Structure

```text
Traveller/
├── frontend/                     # React + Vite TypeScript client
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── components/           # Reusable UI, traveler, and agent components
│   │   │   ├── agent/            # Agent dashboard and operations widgets
│   │   │   ├── traveler/         # Traveler dashboard and itinerary views
│   │   │   └── ui/               # Buttons, Inputs, Cards, Badges, Modals
│   │   ├── context/              # AuthContext (JWT session) and ToastContext
│   │   ├── layouts/              # AuthLayout, TravelerLayout, AgentLayout
│   │   ├── pages/                # LandingPage, RoleSelect, Auth pages, Dashboards
│   │   ├── routes/               # AppRoutes, ProtectedRoute, PublicRoute
│   │   ├── services/             # Axios API client, auth API services
│   │   └── types/                # TypeScript schemas for auth, trips, agents
│   ├── package.json
│   ├── vite.config.ts            # Vite config (configured for 0.0.0.0:5173)
│   └── tailwind.config.js
│
├── backend/                      # FastAPI Python REST backend
│   ├── app/
│   │   ├── api/                  # API endpoints and dependency injectors
│   │   │   ├── routes/           # /api/auth, /api/agents
│   │   │   └── deps.py           # JWT validation and DB session injection
│   │   ├── core/                 # App configuration and security utilities
│   │   │   ├── config.py         # CORS, secrets, and environment loading
│   │   │   └── security.py       # Argon2 password hashing and JWT encoding
│   │   ├── db/                   # Database engine and session factory
│   │   ├── models/               # SQLAlchemy ORM models (User, Agent)
│   │   ├── schemas/              # Pydantic request/response models
│   │   └── main.py               # FastAPI entry point
│   ├── alembic/                  # Database migration versions
│   ├── tests/                    # Pytest authentication test suite
│   ├── requirements.txt          # Python dependencies
│   └── alembic.ini               # Alembic configuration
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher) & **npm**
- **Python** (v3.11 or higher)
- **PostgreSQL Database** (e.g. Neon connection string)

---

### 1. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql+psycopg://<username>:<password>@<neon-hostname>/<dbname>?sslmode=require
   SECRET_KEY=your-super-secret-jwt-signing-key-minimum-32-characters
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
   ```

5. **Run database migrations**:
   ```bash
   alembic upgrade head
   ```

6. **Start the FastAPI backend server**:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - API Health check: `http://127.0.0.1:8000/api/health`
   - Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
   - ReDoc: `http://127.0.0.1:8000/redoc`

---

### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install node dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api
   ```

4. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173/`.

---

## 🔒 Authentication & API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/health` | Service health status | No |
| `POST` | `/api/auth/register` | Register new Traveler or Agent account | No |
| `POST` | `/api/auth/login` | Authenticate with email/password & receive JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Bearer JWT |
| `GET` | `/api/agents/me` | Fetch agent profile & agency details (Agent role only) | Bearer JWT |

---

## 🧪 Testing

### Backend Test Suite
Run the automated test suite verifying password hashing, registration, role constraints, and JWT validation:
```bash
cd backend
pytest
```

### Frontend Build & Lint Verification
Verify TypeScript type checking and production bundling:
```bash
cd frontend
npm run build
```

---

## 🛡️ Architecture & Security Highlights

- **Password Hashing**: Uses state-of-the-art **Argon2id** password hashing (`argon2-cffi`), protecting against GPU brute-force attacks.
- **Cross-Role Isolation**: Agents cannot access Traveler portals and Travelers cannot access Agent operator consoles. Cross-role logins are flagged and blocked at both the API and client routing levels.
- **Strict JWT Verification**: Protected endpoints validate token expiration and user existence on every request. Tokens are stored client-side in `localStorage` and sent via standard `Authorization: Bearer <token>` headers.
- **Database Schema Consistency**: PostgreSQL `CHAR(36)` UUID storage ensures high-performance platform-independent compatibility between SQLite (testing) and Neon PostgreSQL (production).
