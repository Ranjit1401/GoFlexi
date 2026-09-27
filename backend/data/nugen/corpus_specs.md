# GoFlexi — Domain Intelligence & Travel Intent Taxonomy

> **Domain Corpus Specification:** Travel Intent Classification & Structured Constraint Parsing  
> **Target System:** Nugen Domain-Aligned AI™ Platform  
> **Role in GoFlexi Architecture:** Linguistic Parsing & Intent Decomposition  
> **Invariant:** This corpus trains structural language understanding, entity extraction, and constraint parsing. It does **not** teach static factual knowledge about tourist attractions (which is dynamically queried via SerpAPI).

---

## 1. GoFlexi Purpose & Architectural Role

GoFlexi is an intelligent, dynamic travel planning and itinerary management platform. Travelers interact with GoFlexi using varied, conversational natural language—ranging from casual colloquialisms (*"chill weekend with my girl"*, *"don't make it hectic"*, *"drop the fort"*) to specific logistical commands (*"budget under 30k"*, *"swap day 2 afternoon with shopping"*).

### Architectural Invariant
- **Nugen Domain-Aligned Model:** Analyzes user natural language, classifies intent into GoFlexi's 10 operational travel intents, and extracts structured travel constraints into normalized JSON schemas.
- **SerpAPI:** External real-time search engine retrieving live points of interest, geographic coordinates, ratings, reviews, flight schedules, and hotel availability.
- **Neon PostgreSQL:** Persistent relational storage for traveler profiles, preferences, saved trips, and curated destination catalogs.
- **Groq (`llama-3.3-70b-versatile`):** Conversational AI layer generating warm conversational responses, recommendations, and synthesising day-by-day itineraries.

The Nugen model operates as the **linguistic gateway**:
$$\text{Natural Language Input} \xrightarrow[\text{Domain Model}]{\text{Nugen Aligned}} \text{Travel Intent} + \text{Structured Constraints} \xrightarrow{} \text{GoFlexi TripState Engine}$$

---

## 2. GoFlexi Controlled Travel Vocabulary

To guarantee deterministic behavior downstream across the GoFlexi Trip Wizard, AI Trip Co-Pilot, and Cesium 3D Globe, all extracted entities must map into GoFlexi's standardized vocabulary tokens:

### A. Travel Styles
- `Budget`: Cost-conscious travel, public transit, hostels, homestays, economical dining.
- `Balanced`: Optimal balance of comfort, value, curated sightseeing, and moderate dining.
- `Premium`: Upmarket hotels, guided private excursions, comfort transport, fine dining.
- `Luxury`: 5-star heritage resorts, luxury private transfers, exclusive VIP experiences.

### B. Companions
- `Solo`: Independent traveler, flexible schedule, single occupancy.
- `Couple`: Two adult travelers, romance/leisure focus, double occupancy (*"with my girlfriend"*, *"with my husband"*, *"honeymoon"*, *"partner"*).
- `Family`: Multi-generational group or travelers with children/seniors, requiring accessible pacing and family-friendly sights.
- `Friends`: Group of peers seeking shared adventures, nightlife, road trips, or social activities.

### C. Transport Modes
- `Flight`: Commercial air travel between airport hubs.
- `Train`: Rail travel (express, sleeper, scenic railways).
- `Bus`: Intercity coach or state transport.
- `Car`: Self-drive rental, private cab, or road trip.
- `Flexible`: Open to any viable route suggested by GoFlexi.

### D. Itinerary Pace
- `Relaxed`: 1 to 2 relaxed activities per day, late mornings, ample leisure and café downtime (*"chill"*, *"slow pace"*, *"peaceful"*, *"not hectic"*).
- `Balanced`: 2 to 3 well-spaced activities per day with structured lunch and rest intervals.
- `Packed`: 4+ sights per day, early starts, high energy, maximizing sightseeing coverage (*"see everything"*, *"fast-paced"*, *"action-packed"*).

### E. Interest Categories
- `Adventure`: Trekking, water sports, paragliding, hiking, camping.
- `Food`: Culinary tours, street food, cooking classes, local gastronomy.
- `Nightlife`: Clubs, beach lounges, pubs, live music venues.
- `Shopping`: Local bazaars, artisan handicraft markets, malls, souvenirs.
- `Relaxation`: Spas, beaches, wellness retreats, quiet nature walks.
- `Wildlife`: National parks, safaris, bird sanctuaries, marine life.
- `Photography`: Scenic viewpoints, heritage architecture, golden hour spots.
- `Culture`: Temples, forts, palaces, museums, historical monuments, local traditions.
- `Sports`: Surfing, diving, skiing, golf, cycling.

---

## 3. Structured Travel Constraints Schema

When extracting travel constraints from natural language, the aligned model outputs a JSON object with the following potential attributes:

| Field Name | Type | Description | Example Values |
|---|---|---|---|
| `intent` | `string` | One of the 10 GoFlexi intent tokens | `"TRIP_PLANNING"`, `"ADD_PLACE"` |
| `destination` | `string` | Resolved city, state, or region | `"Kochi"`, `"Jaipur"`, `"Goa"`, `"Manali"` |
| `origin` | `string` | Departure city or airport | `"Mumbai"`, `"Delhi"`, `"Bengaluru"` |
| `duration_days` | `integer` | Number of trip days | `3`, `5`, `7` |
| `budget` | `number` | Numeric budget target | `25000`, `50000`, `1500` |
| `currency` | `string` | Currency code (default: INR) | `"INR"`, `"USD"`, `"EUR"` |
| `companion` | `string` | Companion category token | `"Solo"`, `"Couple"`, `"Family"`, `"Friends"` |
| `pace` | `string` | Daily scheduling pace | `"Relaxed"`, `"Balanced"`, `"Packed"` |
| `travel_style` | `string` | Quality and budget tier | `"Budget"`, `"Balanced"`, `"Premium"`, `"Luxury"` |
| `transport` | `string` | Preferred transit mode | `"Flight"`, `"Train"`, `"Car"`, `"Flexible"` |
| `travel_date` | `string` | Stated start date or timeframe | `"2026-10-15"`, `"next weekend"`, `"November"` |
| `interests` | `list[string]`| Extracted interest tags | `["Culture", "Food"]`, `["Relaxation"]` |
| `place_name` | `string` | Specific landmark or POI | `"Fort Kochi"`, `"Amber Palace"`, `"Baga Beach"` |
| `day_number` | `integer` | Target day in itinerary | `1`, `2`, `3` |
| `time_block` | `string` | Target portion of day | `"morning"`, `"afternoon"`, `"evening"` |
| `modification_type` | `string`| Nature of itinerary edit | `"make_relaxed"`, `"swap"`, `"reschedule"` |
| `disruption_type` | `string`| External event causing change | `"rain"`, `"flight_delayed"`, `"attraction_closed"` |
| `optimization_goal` | `string`| Objective function for trip | `"minimize_travel_time"`, `"budget_efficiency"` |
| `query_topic` | `string` | Subject of informational query | `"weather"`, `"visa"`, `"best_season"`, `"clothing"` |

---

## 4. The 10 Travel Intents: Comprehensive Definitions

### 1. `TRIP_PLANNING`
- **Meaning:** Traveler requests end-to-end trip planning or initiation, specifying destination, duration, budget, companions, or travel style.
- **When Selected:** User says *"Plan a trip"*, *"I want a 4 day trip to Jaipur"*, *"Make an itinerary for Goa"*, or provides initial trip setup parameters.
- **Required Fields:** `intent` (`"TRIP_PLANNING"`), `destination`.
- **Optional Fields:** `duration_days`, `companion`, `pace`, `budget`, `currency`, `travel_style`, `transport`, `travel_date`, `interests`.
- **Examples:**
  - *"Plan a 3 day trip to Cochin with my family under 40000"* &rarr; `{"intent": "TRIP_PLANNING", "destination": "Cochin", "duration_days": 3, "companion": "Family", "budget": 40000, "currency": "INR"}`
  - *"I want a relaxed weekend getaway to Manali alone"* &rarr; `{"intent": "TRIP_PLANNING", "destination": "Manali", "duration_days": 2, "companion": "Solo", "pace": "Relaxed"}`
- **Counterexamples:**
  - *"What are good places to visit in Cochin?"* &rarr; `DESTINATION_DISCOVERY` (User is exploring sights, not initiating a trip).
  - *"Add Fort Kochi to my trip"* &rarr; `ADD_PLACE` (Targeted POI addition).

---

### 2. `DESTINATION_DISCOVERY`
- **Meaning:** Traveler is exploring potential destinations, asking for destination ideas based on vibe/interests, or seeking top attractions within a known city before planning.
- **When Selected:** User asks *"Where should I travel in December?"*, *"Show me places in Visakhapatnam"*, *"Suggest beach destinations in India"*, *"What can I see in Jaipur?"*.
- **Required Fields:** `intent` (`"DESTINATION_DISCOVERY"`).
- **Optional Fields:** `destination`, `interests`, `travel_style`, `region`, `travel_date`.
- **Examples:**
  - *"Show me top attractions in Visakhapatnam"* &rarr; `{"intent": "DESTINATION_DISCOVERY", "destination": "Visakhapatnam"}`
  - *"Recommend some peaceful mountain places for couples"* &rarr; `{"intent": "DESTINATION_DISCOVERY", "companion": "Couple", "interests": ["Relaxation"], "pace": "Relaxed"}`
- **Counterexamples:**
  - *"Plan a 5 day journey to Visakhapatnam"* &rarr; `TRIP_PLANNING` (Explicit trip commitment).
  - *"Is October rainy in Goa?"* &rarr; `GENERAL_TRAVEL_QUERY` (Informational weather query).

---

### 3. `ADD_PLACE`
- **Meaning:** Traveler instructs the system to add a specific landmark, sight, restaurant, or activity to their active trip or selected places list.
- **When Selected:** User says *"Add Fort Kochi"*, *"Include City Palace in Day 1"*, *"Put Amber Fort into my schedule"*, *"I also want to visit Baga Beach"*.
- **Required Fields:** `intent` (`"ADD_PLACE"`), `place_name`.
- **Optional Fields:** `destination`, `day_number`, `time_block`.
- **Examples:**
  - *"Add Fort Kochi to my trip"* &rarr; `{"intent": "ADD_PLACE", "place_name": "Fort Kochi"}`
  - *"Put Mattancherry Palace in Day 2 morning"* &rarr; `{"intent": "ADD_PLACE", "place_name": "Mattancherry Palace", "day_number": 2, "time_block": "morning"}`
- **Counterexamples:**
  - *"Remove Fort Kochi"* &rarr; `REMOVE_PLACE` (Opposite action).
  - *"Tell me about Fort Kochi"* &rarr; `GENERAL_TRAVEL_QUERY` (Informational query).

---

### 4. `REMOVE_PLACE`
- **Meaning:** Traveler instructs the system to remove, delete, or exclude a specific place from their trip, selected places, or schedule.
- **When Selected:** User says *"Remove Amber Fort"*, *"Drop Mattancherry Palace"*, *"Delete the beach from Day 3"*, *"I don't want to visit City Palace anymore"*.
- **Required Fields:** `intent` (`"REMOVE_PLACE"`), `place_name`.
- **Optional Fields:** `day_number`.
- **Examples:**
  - *"Remove Amber Fort from my schedule"* &rarr; `{"intent": "REMOVE_PLACE", "place_name": "Amber Fort"}`
  - *"Drop that palace from Day 2"* &rarr; `{"intent": "REMOVE_PLACE", "place_name": "palace", "day_number": 2}`
- **Counterexamples:**
  - *"Don't make day 2 so busy"* &rarr; `MODIFY_ITINERARY` (Pacing change, not removing a named place).
  - *"Add Amber Fort instead"* &rarr; `ADD_PLACE`.

---

### 5. `MODIFY_ITINERARY`
- **Meaning:** Traveler requests changes to an existing itinerary's schedule, pacing, order of days, or timing structure.
- **When Selected:** User says *"Make Day 2 more relaxed"*, *"Swap Day 1 and Day 3"*, *"Move afternoon sightseeing to morning"*, *"Give us more free time on Sunday"*.
- **Required Fields:** `intent` (`"MODIFY_ITINERARY"`).
- **Optional Fields:** `day_number`, `time_block`, `modification_type`, `pace`.
- **Examples:**
  - *"Make Day 2 more relaxed, it feels too rushed"* &rarr; `{"intent": "MODIFY_ITINERARY", "day_number": 2, "modification_type": "make_relaxed", "pace": "Relaxed"}`
  - *"Swap Day 1 and Day 2 activities"* &rarr; `{"intent": "MODIFY_ITINERARY", "modification_type": "swap_days", "day_number": 1}`
- **Counterexamples:**
  - *"Create a 3 day itinerary"* &rarr; `TRIP_PLANNING` (Generating a new itinerary).
  - *"Cut my budget by 5000"* &rarr; `UPDATE_BUDGET` (Budget revision).

---

### 6. `UPDATE_BUDGET`
- **Meaning:** Traveler explicitly updates financial constraints, budget limits, or accommodation spending preferences for the trip.
- **When Selected:** User says *"Increase my budget to 50k"*, *"Make this trip cheaper"*, *"My budget is strictly ₹20,000"*, *"Switch to luxury hotels"*.
- **Required Fields:** `intent` (`"UPDATE_BUDGET"`).
- **Optional Fields:** `budget`, `currency`, `travel_style`.
- **Examples:**
  - *"Increase our total budget to ₹60,000"* &rarr; `{"intent": "UPDATE_BUDGET", "budget": 60000, "currency": "INR"}`
  - *"This looks too expensive, make it budget friendly"* &rarr; `{"intent": "UPDATE_BUDGET", "travel_style": "Budget"}`
- **Counterexamples:**
  - *"Plan a trip under 30k to Goa"* &rarr; `TRIP_PLANNING` (Initial trip setup containing budget constraint).

---

### 7. `UPDATE_PREFERENCES`
- **Meaning:** Traveler updates their traveler profile, personal preferences, dietary needs, or activity focus without modifying a specific day's schedule.
- **When Selected:** User says *"We love street food and local art"*, *"Focus more on outdoor adventures"*, *"We don't like crowded tourist spots"*, *"I prefer vegetarian dining"*.
- **Required Fields:** `intent` (`"UPDATE_PREFERENCES"`).
- **Optional Fields:** `interests`, `travel_style`, `pace`.
- **Examples:**
  - *"We are huge foodies and love historical culture"* &rarr; `{"intent": "UPDATE_PREFERENCES", "interests": ["Food", "Culture"]}`
  - *"Focus on wildlife and nature photography instead of shopping"* &rarr; `{"intent": "UPDATE_PREFERENCES", "interests": ["Wildlife", "Photography"]}`
- **Counterexamples:**
  - *"Add Chinese Fishing Nets"* &rarr; `ADD_PLACE` (Targeted landmark addition).

---

### 8. `OPTIMIZE_TRIP`
- **Meaning:** Traveler requests algorithmic optimization of the trip—such as clustering geographically close sights, minimizing cab travel time, or reorganizing stops by energy levels.
- **When Selected:** User says *"Optimize the route to minimize driving"*, *"Cluster nearby places together"*, *"Reorder Day 1 stops so we don't backtrack"*, *"Make the route more efficient"*.
- **Required Fields:** `intent` (`"OPTIMIZE_TRIP"`).
- **Optional Fields:** `optimization_goal`, `day_number`.
- **Examples:**
  - *"Reorganize the stops on Day 2 to minimize travel time"* &rarr; `{"intent": "OPTIMIZE_TRIP", "day_number": 2, "optimization_goal": "minimize_travel_time"}`
  - *"Cluster my selected places geographically"* &rarr; `{"intent": "OPTIMIZE_TRIP", "optimization_goal": "cluster_geographic"}`
- **Counterexamples:**
  - *"Make day 2 more relaxed"* &rarr; `MODIFY_ITINERARY` (Pacing change, not route optimization).

---

### 9. `HANDLE_DISRUPTION`
- **Meaning:** Traveler reports an unforeseen disruption (rain, storm, flight delay, closed landmark, illness) and requests contingency adjustments.
- **When Selected:** User says *"It is raining heavily today, what should we do?"*, *"Our flight got delayed by 4 hours"*, *"The fort is closed today"*, *"My friend is feeling unwell"*.
- **Required Fields:** `intent` (`"HANDLE_DISRUPTION"`), `disruption_type`.
- **Optional Fields:** `day_number`, `time_block`, `place_name`.
- **Examples:**
  - *"It's pouring rain outside right now, replace outdoor sights with indoor activities"* &rarr; `{"intent": "HANDLE_DISRUPTION", "disruption_type": "rain", "time_block": "morning"}`
  - *"Our flight is delayed by 3 hours, adjust today's schedule"* &rarr; `{"intent": "HANDLE_DISRUPTION", "disruption_type": "flight_delayed", "day_number": 1}`
- **Counterexamples:**
  - *"Is it going to rain in Goa next week?"* &rarr; `GENERAL_TRAVEL_QUERY` (Forecast inquiry, not an active disruption).

---

### 10. `GENERAL_TRAVEL_QUERY`
- **Meaning:** Informational travel question regarding weather, visa rules, packing tips, best seasons, local customs, or currency exchange.
- **When Selected:** User asks *"What is the best time to visit Manali?"*, *"Do I need cash in Kochi?"*, *"What clothes should I pack for Jaipur in January?"*, *"Is Goa safe for solo travelers?"*.
- **Required Fields:** `intent` (`"GENERAL_TRAVEL_QUERY"`).
- **Optional Fields:** `destination`, `query_topic`, `travel_date`.
- **Examples:**
  - *"What is the best time of year to visit Kochi?"* &rarr; `{"intent": "GENERAL_TRAVEL_QUERY", "destination": "Kochi", "query_topic": "best_season"}`
  - *"What should I pack for Jaipur in December?"* &rarr; `{"intent": "GENERAL_TRAVEL_QUERY", "destination": "Jaipur", "query_topic": "clothing"}`
- **Counterexamples:**
  - *"Where should I go for my holiday?"* &rarr; `DESTINATION_DISCOVERY` (Recommendation search).
  - *"Plan a trip to Kochi in December"* &rarr; `TRIP_PLANNING`.

---

## 5. Domain Invariant Summary

1. **Zero Hallucination of Tourist Facts:** The model does not memorize coordinates, ticket prices, opening hours, or historical essays.
2. **Reliable JSON Output:** Every response represents an unadorned JSON object containing `intent` and verified travel constraint key-value pairs.
3. **Graceful Handling of Colloquialisms:** Slang (*"chill"*, *"with my girl"*, *"super hectic"*, *"drop that"*) maps reliably to canonical GoFlexi vocabulary tokens (`Relaxed`, `Couple`, `Packed`, `REMOVE_PLACE`).
