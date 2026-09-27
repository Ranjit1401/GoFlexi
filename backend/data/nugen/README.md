# GoFlexi — Nugen Intelligence Alignment Architecture & Workflow

> **Phase N1:** Nugen Alignment Workflow Discovery & Planning Document  
> **Status:** Discovery & Planning Complete (No model trained or live code modified)  
> **Target Requirement:** HackCelestial 3.0 Mandatory Nugen Intelligence Domain Alignment  
> **API Server:** `https://api.nugen.in` (OpenAPI v25.4.20)  
> **Documentation Source:** [Nugen API Reference](https://docs.nugen.in) / `https://docs.nugen.in/llms-full.txt`

---

## 1. Executive Summary & Purpose

In the GoFlexi architecture:
- **SerpAPI:** The real-time discovery engine for verified geographical facts, live coordinates, landmarks, attractions, hotels, and flight schedules.
- **Groq (`llama-3.3-70b-versatile`):** The conversational reasoning model and itinerary synthesis engine.
- **Neon PostgreSQL:** The persistence layer for traveler profiles, preferences, saved trips, and curated destination metadata.
- **Nugen Domain-Aligned Model:** The specialized travel intent & constraint extraction model trained on GoFlexi's proprietary travel taxonomy.

### The Role of the Nugen Model in GoFlexi
The Nugen model will **NOT** learn or memorize static destination facts (e.g., historical descriptions or hotel rates). Instead, its dedicated responsibility is:

$$\text{User Natural Language} \longrightarrow \text{Travel Intent} \longrightarrow \text{Structured Constraints Schema}$$

#### Example Target Behavior:
**Input:**
> *"I want a relaxed 4 day trip to Kochi with my girlfriend on a budget under ₹30,000"*

**Aligned Model Output:**
```json
{
  "intent": "TRIP_PLANNING",
  "destination": "Kochi",
  "duration_days": 4,
  "companion": "couple",
  "pace": "relaxed",
  "budget_max": 30000,
  "travel_style": "Relaxed",
  "interests": ["sightseeing", "romance", "leisure"]
}
```

This output is then consumed downstream by SerpAPI (to fetch real Kochi attractions matching "relaxed") and Groq (to assemble the day-by-day schedule).

---

## 2. Official Nugen Alignment Workflow

Based on the verified OpenAPI spec (`https://api.nugen.in/openapi-public.json`) and developer documentation (`https://docs.nugen.in`), the end-to-end Nugen alignment lifecycle consists of 6 sequential stages:

```
┌─────────────────────────────────┐
│ 1. Select Base Model            │
│    GET /api/v3/models/base      │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 2. Prepare & Upload Data        │
│    - Documents (Corpus)         │
│      POST /api/v3/documents/    │
│      create                     │
│    - Benchmark (Eval Samples)   │
│      POST /api/v3/benchmarks/   │
│      upload                     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 3. Create Alignment Project     │
│    POST /api/v3/alignment-      │
│    projects/create              │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 4. Monitor Alignment Lifecycle  │
│    GET /api/v3/alignment-       │
│    projects/{id}/status         │
│    (QUEUED → PROCESSING → READY)│
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 5. Retrieve Model & Deploy      │
│    GET /api/v3/models/aligned   │
│    POST /api/v3/models/         │
│    {model_id}/deployment        │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 6. Run Real Inference           │
│    POST /api/v3/inference/chat/ │
│    completions                  │
│    (Includes confidence_score)  │
└─────────────────────────────────┘
```

---

## 3. Exact Dataset Formats Required by Nugen

Nugen's domain alignment architecture utilizes two complementary datasets:

### A. Domain Corpus Documents (Training Dataset)
Used for architecture-level representation alignment and domain adaptation.
- **Endpoint:** `POST /api/v3/documents/create`
- **Content-Type:** `multipart/form-data`
- **Supported Formats (Developer Edition):** Plain text (`.txt`), Markdown (`.md`), or JSON (`.json`) files. (Enterprise supports `.pdf` and cloud object storage `s3://`, `gs://`).
- **File Limit:** Up to 100 MB per file.
- **Structure for GoFlexi:**
  - `goflexi_intent_taxonomy.md`: Detailed specification of the 10 travel intents and entity schemas.
  - `goflexi_constraint_rules.md`: Rules for extracting dates, durations, budget ranges, companions, and pace.
  - `goflexi_dialogue_flows.md`: Multi-turn conversational patterns for travel coordination.

### B. Evaluation Benchmark Dataset (Supervised Validation & Guidance)
Used to evaluate model quality, verify alignment, and calculate target scores.
- **Endpoint:** `POST /api/v3/benchmarks/upload`
- **Content-Type:** `multipart/form-data`
- **File Format:** A single JSON file containing an array of objects.
- **Exact Schema:**
```json
[
  {
    "sample_num": 1,
    "instruction": "I want a relaxed 4 day trip to Kochi with my girlfriend",
    "response": "{\n  \"intent\": \"TRIP_PLANNING\",\n  \"destination\": \"Kochi\",\n  \"duration_days\": 4,\n  \"companion\": \"couple\",\n  \"pace\": \"relaxed\"\n}"
  },
  {
    "sample_num": 2,
    "instruction": "Can you add Fort Kochi to our itinerary?",
    "response": "{\n  \"intent\": \"ADD_PLACE\",\n  \"place_name\": \"Fort Kochi\"\n}"
  },
  {
    "sample_num": 3,
    "instruction": "Drop Mattancherry Palace from the schedule",
    "response": "{\n  \"intent\": \"REMOVE_PLACE\",\n  \"place_name\": \"Mattancherry Palace\"\n}"
  }
]
```

### C. Minimum Practical Dataset Size for GoFlexi
- **Corpus Documents:** 3 to 5 domain documents (totaling 50 KB – 200 KB) containing the GoFlexi intent taxonomy, constraint extraction grammar, and dialogue state machine.
- **Benchmark Evaluation Samples:** 50 to 100 high-quality instruction-response pairs (5 to 10 representative variations across all 10 GoFlexi travel categories).

---

## 4. Selected Base Model & Rationale

- **Selected Model ID:** `qwen-v2p5-0p5b-instruct`
- **Parameters:** `0.5B`
- **Type:** `llm`
- **Verification Status in Nugen API:**
  - `alignment_ready: true`
  - `available_on_request: false` (immediately available without enterprise access request or waitlist)

### Why this model is optimal for GoFlexi:
1. **Low Latency & Instant Response:** The 0.5B parameter architecture processes input tokens in tens of milliseconds, ensuring real-time response inside the GoFlexi Co-Pilot chat loop.
2. **Specialized Structured Task:** Intent classification and JSON constraint extraction do not require 70B parameter general knowledge (which Groq already handles for complex creative reasoning); they require tight structural adherence.
3. **Fast Alignment Convergence:** Small parameter count allows Nugen's alignment pipeline to reach high domain confidence scores rapidly with minimal compute credit consumption.
4. **Availability:** Explicitly supported out-of-the-box on Nugen's public API without custom approvals.

*(Alternative for larger deployments: `qwen-v2p5-7b-instruct` or importing Hugging Face models via `"base_model_id": "hf://..."` if approved by Nugen).*

---

## 5. Required Environment Variables

Add the following to `backend/.env` (strictly server-side; NEVER exposed to the frontend):

```env
# Nugen Intelligence Platform Configuration
NUGEN_API_KEY=nugen_live_your_api_key_here
NUGEN_BASE_URL=https://api.nugen.in
NUGEN_BASE_MODEL_ID=qwen-v2p5-0p5b-instruct
NUGEN_ALIGNED_MODEL_ID=model_pending_alignment_run
```

---

## 6. Exact API Endpoints & Request / Response Specifications

### Step 1: Query Base Models
```http
GET /api/v3/models/base
Host: api.nugen.in
Authorization: Bearer <NUGEN_API_KEY>
```
**Response:**
```json
{
  "models": [
    {
      "model_id": "qwen-v2p5-0p5b-instruct",
      "model_name": "Qwen-v2p5-0p5b-instruct",
      "parameters": "0.5B",
      "alignment_ready": true,
      "available_on_request": false,
      "type": "llm"
    }
  ]
}
```

---

### Step 2: Upload Corpus Documents
```http
POST /api/v3/documents/create
Host: api.nugen.in
Authorization: Bearer <NUGEN_API_KEY>
Content-Type: multipart/form-data

files: [goflexi_domain_specs.md]
categories: ["travel_planning", "go_flexi"]
names: ["GoFlexi Travel Domain Specifications"]
```
**Response:**
```json
{
  "document_ids": ["document_01k4x9m2p7q3r5s8"]
}
```
*Poll `GET /api/v3/documents/{document_id}/status` until status is `READY`.*

---

### Step 3: Upload Evaluation Benchmark
```http
POST /api/v3/benchmarks/upload
Host: api.nugen.in
Authorization: Bearer <NUGEN_API_KEY>
Content-Type: multipart/form-data

file: goflexi_benchmark_samples.json
name: "GoFlexi Intent Benchmark"
document_id: "document_01k4x9m2p7q3r5s8"
description: "Validation benchmark for GoFlexi intent and constraint parsing"
```
**Response:**
```json
{
  "benchmark_id": "benchmark_01k4x9m2p7q3r6a1",
  "benchmark_name": "GoFlexi Intent Benchmark",
  "status": "READY",
  "n_samples": 60
}
```

---

### Step 4: Create Alignment Project
```http
POST /api/v3/alignment-projects/create
Host: api.nugen.in
Authorization: Bearer <NUGEN_API_KEY>
Content-Type: application/json

{
  "alignment_name": "GoFlexi Travel Intent Alignment",
  "base_model_id": "qwen-v2p5-0p5b-instruct",
  "document_ids": ["document_01k4x9m2p7q3r5s8"],
  "benchmark_id": "benchmark_01k4x9m2p7q3r6a1",
  "description": "Aligning Qwen-0.5B to GoFlexi travel intent and constraint extraction"
}
```
**Response:**
```json
{
  "alignment_id": "alignment_01k4x9m2p7q3r8c1",
  "status": "PROCESSING"
}
```

---

### Step 5: Poll Alignment Status
```http
GET /api/v3/alignment-projects/alignment_01k4x9m2p7q3r8c1/status
Host: api.nugen.in
Authorization: Bearer <NUGEN_API_KEY>
```
**Response (while running):**
```json
{
  "alignment_id": "alignment_01k4x9m2p7q3r8c1",
  "status": "PROCESSING",
  "queue_position": null,
  "early_deployable": false
}
```
**Response (completed):**
```json
{
  "alignment_id": "alignment_01k4x9m2p7q3r8c1",
  "status": "READY",
  "completed_at": "2026-09-27T12:00:00Z"
}
```

---

### Step 6: Retrieve Aligned Model ID & Deploy
Fetch project details to obtain the deployed model ID:
```http
GET /api/v3/alignment-projects/alignment_01k4x9m2p7q3r8c1
Host: api.nugen.in
Authorization: Bearer <NUGEN_API_KEY>
```
Or list all aligned models:
```http
GET /api/v3/models/aligned
Host: api.nugen.in
Authorization: Bearer <NUGEN_API_KEY>
```
**Response:**
```json
{
  "domain_aligned_models": [
    {
      "model_id": "model_01kmqm4nrn9fw6r",
      "model_name": "GoFlexi Travel Intent Alignment",
      "base_model_id": "qwen-v2p5-0p5b-instruct",
      "deployment_status": "READY"
    }
  ]
}
```

Deploy the model for live serving:
```http
POST /api/v3/models/model_01kmqm4nrn9fw6r/deployment
Host: api.nugen.in
Authorization: Bearer <NUGEN_API_KEY>
```
*Poll `GET /api/v3/models/model_01kmqm4nrn9fw6r/deployment/status` until `deployment_status == "DEPLOYED"`.*

---

### Step 7: Real Inference
```http
POST /api/v3/inference/chat/completions
Host: api.nugen.in
Authorization: Bearer <NUGEN_API_KEY>
Content-Type: application/json

{
  "model": "model_01kmqm4nrn9fw6r",
  "messages": [
    {
      "role": "system",
      "content": "You are the GoFlexi Travel Intent Engine. Extract travel intent and structured constraints as JSON."
    },
    {
      "role": "user",
      "content": "I want a relaxed 4 day trip to Kochi with my girlfriend"
    }
  ],
  "temperature": 0.1,
  "max_tokens": 250
}
```
**Response:**
```json
{
  "id": "nugen-comp-789xyz",
  "object": "chat.completion",
  "created": 1758960000,
  "model": "model_01kmqm4nrn9fw6r",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\n  \"intent\": \"TRIP_PLANNING\",\n  \"destination\": \"Kochi\",\n  \"duration_days\": 4,\n  \"companion\": \"couple\",\n  \"pace\": \"relaxed\"\n}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 42,
    "completion_tokens": 36,
    "total_tokens": 78
  },
  "confidence_score": 94.28
}
```
*Notice `confidence_score: 94.28`: Nugen's unique domain alignment certainty score.*

---

## 7. Expected Alignment Project Lifecycle & Status Transitions

```
[QUEUED]
   │
   ▼
[PROCESSING]  ──(Checkpoint written)──> [early_deployable: true]
   │                                           │ (Optional early deployment)
   ▼                                           ▼
[EVALUATING] (Evaluates against benchmark_id)
   │
   ├───> [READY]  (Alignment succeeded with performance_metrics)
   ├───> [FAILED] (Check result.error)
   └───> [STOPPED] (If cancelled via /stop)
```

---

## 8. Proposed GoFlexi Dataset Categories (The 10 Categories)

The training corpus and benchmark will provide coverage across these 10 distinct operational categories:

| # | Category | User Intent & Scope | Expected JSON Output Structure |
|---|---|---|---|
| 1 | `TRIP_PLANNING` | New trip creation with destination, duration, companions, and pace | `{"intent": "TRIP_PLANNING", "destination": str, "duration_days": int, "companion": str, "pace": str}` |
| 2 | `DESTINATION_DISCOVERY` | User searching for where to go or exploring a city | `{"intent": "DESTINATION_DISCOVERY", "destination_query": str, "region": str, "interests": [...]}` |
| 3 | `ADD_PLACE` | Adding a landmark, museum, or sight to the itinerary | `{"intent": "ADD_PLACE", "place_name": str, "target_day": Optional[int]}` |
| 4 | `REMOVE_PLACE` | Deleting a place from the selected list or schedule | `{"intent": "REMOVE_PLACE", "place_name": str}` |
| 5 | `MODIFY_ITINERARY` | Pacing adjustment, swapping days, or re-ordering | `{"intent": "MODIFY_ITINERARY", "day": int, "modification_type": "relaxed"\|"packed"\|"swap"}` |
| 6 | `UPDATE_BUDGET` | Modifying spending limits or accommodation category | `{"intent": "UPDATE_BUDGET", "budget_max": float, "budget_tier": "budget"\|"balanced"\|"luxury"}` |
| 7 | `UPDATE_PREFERENCES` | Changing traveler interests (culture, food, beaches) | `{"intent": "UPDATE_PREFERENCES", "tags": [...], "travel_style": str}` |
| 8 | `OPTIMIZE_TRIP` | Minimizing commute distance or clustering POIs geographically | `{"intent": "OPTIMIZE_TRIP", "strategy": "commute_time"\|"energy_level"}` |
| 9 | `HANDLE_DISRUPTION` | Weather, delays, or attraction closure workarounds | `{"intent": "HANDLE_DISRUPTION", "disruption_type": "weather"\|"delay", "day": int}` |
| 10 | `GENERAL_TRAVEL_QUERY` | Visa, weather, best season, or packing questions | `{"intent": "GENERAL_TRAVEL_QUERY", "topic": str, "destination": Optional[str]}` |

---

## 9. Phase N4 — Integration Adapter

> **Status:** Complete  
> **HackCelestial Nugen Requirement:** PENDING (aligned model not yet deployed due to Nugen 502 infrastructure outage)

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| **Nugen (aligned model)** | `USER LANGUAGE → TRAVEL INTENT → STRUCTURED CONSTRAINTS` (TravelIntentResult) |
| **SerpAPI** | Real-world destination/place discovery. Nugen does NOT search for places. |
| **Groq** | Conversational response generation and itinerary synthesis. |
| **Neon** | Persistent traveler profiles, preferences, and destination metadata. |
| **Recommendation Engine** | Destination ranking based on traveler preferences. |

### Configuration Variables

```env
# Feature flag — default: false (existing pipeline untouched)
NUGEN_ENABLED=false

# Nugen API credentials (server-side only, NEVER exposed to frontend)
NUGEN_API_KEY=<your-nugen-api-key>

# Deployed aligned model ID (required when NUGEN_ENABLED=true)
NUGEN_MODEL_ID=<aligned-model-id-from-nugen>

# Nugen API server (optional, defaults to https://api.nugen.in)
NUGEN_BASE_URL=https://api.nugen.in
```

### Feature Flag Behavior

| `NUGEN_ENABLED` | Behavior |
|-----------------|----------|
| `false` (default) | NugenService raises `NugenDisabledError`. Zero HTTP calls. Existing GoFlexi pipeline (regex intent → SerpAPI → Groq) runs unchanged. |
| `true` | NugenService calls `POST /api/v3/inference/chat/completions` with the configured `NUGEN_MODEL_ID`. If `NUGEN_MODEL_ID` is missing, raises `NugenConfigurationError`. |

### Internal TravelIntentResult Schema

Defined in `backend/app/schemas/nugen.py`:

```python
class TravelIntentResult(BaseModel):
    intent: NugenTravelIntent          # Required — one of 10 intents
    confidence: Optional[float]         # Nugen confidence_score (0.0–100.0)
    destination: Optional[str]
    origin: Optional[str]
    duration_days: Optional[int]
    budget: Optional[float]
    currency: Optional[str]
    companion: Optional[str]
    interests: Optional[List[str]]
    travel_style: Optional[str]
    transport: Optional[str]
    itinerary_pace: Optional[str]
    travel_date: Optional[str]
    place_name: Optional[str]
    day_number: Optional[int]
    modification: Optional[str]
    disruption_type: Optional[str]
    optimization_goal: Optional[str]
```

### Intent Mapping (Nugen → Co-Pilot)

| Nugen Intent (10-taxonomy) | Existing Co-Pilot Intent |
|---------------------------|-------------------------|
| `TRIP_PLANNING` | `ITINERARY_REQUEST` |
| `DESTINATION_DISCOVERY` | `DESTINATION_DISCOVERY` |
| `ADD_PLACE` | `ADD_PLACE` |
| `REMOVE_PLACE` | `REMOVE_PLACE` |
| `MODIFY_ITINERARY` | `ITINERARY_MODIFICATION` |
| `UPDATE_BUDGET` | `ITINERARY_MODIFICATION` |
| `UPDATE_PREFERENCES` | `ITINERARY_MODIFICATION` |
| `OPTIMIZE_TRIP` | `ITINERARY_MODIFICATION` |
| `HANDLE_DISRUPTION` | `ITINERARY_MODIFICATION` |
| `GENERAL_TRAVEL_QUERY` | `CASUAL_CHAT` |

### Future Activation Process

Once the Nugen aligned model is successfully deployed:

1. Set `NUGEN_MODEL_ID=<deployed-model-id>` in `backend/.env`
2. Set `NUGEN_ENABLED=true` in `backend/.env`
3. Run `py -3.14 scripts/test_nugen_inference.py` to verify inference
4. Wire `nugen_service.extract_travel_intent()` into `copilot_service.copilot_chat()` as a pre-processing step before the existing intent classifier
5. Run full test suite: `py -3.14 -m pytest tests/ -v`

> **The HackCelestial Nugen requirement remains pending until a successfully aligned Nugen model is deployed and used for real inference.**
