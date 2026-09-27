"""
GoFlexi — Phase N2 Dataset Generator
Generates exactly 100 high-quality instruction/response pairs across all 10 GoFlexi travel intents.
"""
import json
import os

SAMPLES = [
    # -------------------------------------------------------------------------
    # 1. TRIP_PLANNING (15 samples, #1 - #15)
    # -------------------------------------------------------------------------
    {
        "sample_num": 1,
        "instruction": "I want a relaxed 4 day trip to Kochi with my girlfriend under 30k",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Kochi",
            "duration_days": 4,
            "companion": "Couple",
            "pace": "Relaxed",
            "budget": 30000,
            "currency": "INR"
        }, indent=2)
    },
    {
        "sample_num": 2,
        "instruction": "plan a 5 day journey to Goa with college friends for party and beaches",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Goa",
            "duration_days": 5,
            "companion": "Friends",
            "interests": ["Nightlife", "Relaxation"]
        }, indent=2)
    },
    {
        "sample_num": 3,
        "instruction": "Plan a 3-day family trip to Jaipur starting next Friday with budget around 45000",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Jaipur",
            "duration_days": 3,
            "companion": "Family",
            "budget": 45000,
            "currency": "INR",
            "travel_date": "next Friday"
        }, indent=2)
    },
    {
        "sample_num": 4,
        "instruction": "I need a solo budget backpacking trip to Manali for 6 days",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Manali",
            "duration_days": 6,
            "companion": "Solo",
            "travel_style": "Budget",
            "pace": "Balanced"
        }, indent=2)
    },
    {
        "sample_num": 5,
        "instruction": "Can you organize a quick weekend getaway to Udaipur for me and my wife? Keep it luxury.",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Udaipur",
            "duration_days": 2,
            "companion": "Couple",
            "travel_style": "Luxury",
            "pace": "Relaxed"
        }, indent=2)
    },
    {
        "sample_num": 6,
        "instruction": "make a 7 days travel plan to Visakhapatnam departing from Mumbai by flight",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Visakhapatnam",
            "origin": "Mumbai",
            "duration_days": 7,
            "transport": "Flight"
        }, indent=2)
    },
    {
        "sample_num": 7,
        "instruction": "chill 3 days in Munnar with my girl",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Munnar",
            "duration_days": 3,
            "companion": "Couple",
            "pace": "Relaxed"
        }, indent=2)
    },
    {
        "sample_num": 8,
        "instruction": "trip to Varanasi for 4 days focusing on culture and photography with parents",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Varanasi",
            "duration_days": 4,
            "companion": "Family",
            "interests": ["Culture", "Photography"]
        }, indent=2)
    },
    {
        "sample_num": 9,
        "instruction": "plan a trip for cochin",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Cochin"
        }, indent=2)
    },
    {
        "sample_num": 10,
        "instruction": "I want to visit Jaipur for 3 days",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Jaipur",
            "duration_days": 3
        }, indent=2)
    },
    {
        "sample_num": 11,
        "instruction": "make plan trip for visakhapatnam",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Visakhapatnam"
        }, indent=2)
    },
    {
        "sample_num": 12,
        "instruction": "Plan an action packed 4 day adventure trip to Rishikesh with buddies",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Rishikesh",
            "duration_days": 4,
            "companion": "Friends",
            "pace": "Packed",
            "interests": ["Adventure", "Sports"]
        }, indent=2)
    },
    {
        "sample_num": 13,
        "instruction": "Create a balanced 5-day holiday in Ooty with my husband under 50,000 INR",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Ooty",
            "duration_days": 5,
            "companion": "Couple",
            "pace": "Balanced",
            "budget": 50000,
            "currency": "INR"
        }, indent=2)
    },
    {
        "sample_num": 14,
        "instruction": "looking for a 2 day road trip to Pondicherry by car with friends",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Pondicherry",
            "duration_days": 2,
            "companion": "Friends",
            "transport": "Car"
        }, indent=2)
    },
    {
        "sample_num": 15,
        "instruction": "I have 10 days and 1 lakh budget for Kashmir honeymoon",
        "response": json.dumps({
            "intent": "TRIP_PLANNING",
            "destination": "Kashmir",
            "duration_days": 10,
            "companion": "Couple",
            "budget": 100000,
            "currency": "INR",
            "travel_style": "Premium"
        }, indent=2)
    },

    # -------------------------------------------------------------------------
    # 2. DESTINATION_DISCOVERY (10 samples, #16 - #25)
    # -------------------------------------------------------------------------
    {
        "sample_num": 16,
        "instruction": "Where should I go for a relaxing vacation in October?",
        "response": json.dumps({
            "intent": "DESTINATION_DISCOVERY",
            "interests": ["Relaxation"],
            "travel_date": "October"
        }, indent=2)
    },
    {
        "sample_num": 17,
        "instruction": "Show me places to visit in Kochi",
        "response": json.dumps({
            "intent": "DESTINATION_DISCOVERY",
            "destination": "Kochi"
        }, indent=2)
    },
    {
        "sample_num": 18,
        "instruction": "what can I see and do in Jaipur?",
        "response": json.dumps({
            "intent": "DESTINATION_DISCOVERY",
            "destination": "Jaipur"
        }, indent=2)
    },
    {
        "sample_num": 19,
        "instruction": "Suggest some cool beach destinations in South India",
        "response": json.dumps({
            "intent": "DESTINATION_DISCOVERY",
            "interests": ["Relaxation"],
            "region": "South India"
        }, indent=2)
    },
    {
        "sample_num": 20,
        "instruction": "show me places there",
        "response": json.dumps({
            "intent": "DESTINATION_DISCOVERY"
        }, indent=2)
    },
    {
        "sample_num": 21,
        "instruction": "Where can I go with family for heritage and historical monuments?",
        "response": json.dumps({
            "intent": "DESTINATION_DISCOVERY",
            "companion": "Family",
            "interests": ["Culture"]
        }, indent=2)
    },
    {
        "sample_num": 22,
        "instruction": "Recommend top sights in Visakhapatnam",
        "response": json.dumps({
            "intent": "DESTINATION_DISCOVERY",
            "destination": "Visakhapatnam"
        }, indent=2)
    },
    {
        "sample_num": 23,
        "instruction": "I want to explore hill stations near Delhi for a weekend",
        "response": json.dumps({
            "intent": "DESTINATION_DISCOVERY",
            "origin": "Delhi",
            "duration_days": 2
        }, indent=2)
    },
    {
        "sample_num": 24,
        "instruction": "what are the best adventure hotspots in India right now?",
        "response": json.dumps({
            "intent": "DESTINATION_DISCOVERY",
            "interests": ["Adventure"]
        }, indent=2)
    },
    {
        "sample_num": 25,
        "instruction": "give me some hidden gems in Kerala for quiet photography",
        "response": json.dumps({
            "intent": "DESTINATION_DISCOVERY",
            "region": "Kerala",
            "interests": ["Photography", "Relaxation"]
        }, indent=2)
    },

    # -------------------------------------------------------------------------
    # 3. ADD_PLACE (10 samples, #26 - #35)
    # -------------------------------------------------------------------------
    {
        "sample_num": 26,
        "instruction": "Add Fort Kochi to my trip",
        "response": json.dumps({
            "intent": "ADD_PLACE",
            "place_name": "Fort Kochi"
        }, indent=2)
    },
    {
        "sample_num": 27,
        "instruction": "add Mattancherry Palace",
        "response": json.dumps({
            "intent": "ADD_PLACE",
            "place_name": "Mattancherry Palace"
        }, indent=2)
    },
    {
        "sample_num": 28,
        "instruction": "Put Amber Fort into Day 2 morning",
        "response": json.dumps({
            "intent": "ADD_PLACE",
            "place_name": "Amber Fort",
            "day_number": 2,
            "time_block": "morning"
        }, indent=2)
    },
    {
        "sample_num": 29,
        "instruction": "add the palace",
        "response": json.dumps({
            "intent": "ADD_PLACE",
            "place_name": "palace"
        }, indent=2)
    },
    {
        "sample_num": 30,
        "instruction": "Include Hawa Mahal in our Jaipur schedule",
        "response": json.dumps({
            "intent": "ADD_PLACE",
            "place_name": "Hawa Mahal",
            "destination": "Jaipur"
        }, indent=2)
    },
    {
        "sample_num": 31,
        "instruction": "Can you add Baga Beach to evening of Day 1?",
        "response": json.dumps({
            "intent": "ADD_PLACE",
            "place_name": "Baga Beach",
            "day_number": 1,
            "time_block": "evening"
        }, indent=2)
    },
    {
        "sample_num": 32,
        "instruction": "I definitely want to check out Subhash Bose Park",
        "response": json.dumps({
            "intent": "ADD_PLACE",
            "place_name": "Subhash Bose Park"
        }, indent=2)
    },
    {
        "sample_num": 33,
        "instruction": "Add Kailasagiri ropeway for our afternoon activity",
        "response": json.dumps({
            "intent": "ADD_PLACE",
            "place_name": "Kailasagiri ropeway",
            "time_block": "afternoon"
        }, indent=2)
    },
    {
        "sample_num": 34,
        "instruction": "Please insert City Palace into our plan",
        "response": json.dumps({
            "intent": "ADD_PLACE",
            "place_name": "City Palace"
        }, indent=2)
    },
    {
        "sample_num": 35,
        "instruction": "add Chinese Fishing Nets to tomorrow morning",
        "response": json.dumps({
            "intent": "ADD_PLACE",
            "place_name": "Chinese Fishing Nets",
            "day_number": 2,
            "time_block": "morning"
        }, indent=2)
    },

    # -------------------------------------------------------------------------
    # 4. REMOVE_PLACE (8 samples, #36 - #43)
    # -------------------------------------------------------------------------
    {
        "sample_num": 36,
        "instruction": "Remove Amber Fort from my schedule",
        "response": json.dumps({
            "intent": "REMOVE_PLACE",
            "place_name": "Amber Fort"
        }, indent=2)
    },
    {
        "sample_num": 37,
        "instruction": "drop Mattancherry Palace",
        "response": json.dumps({
            "intent": "REMOVE_PLACE",
            "place_name": "Mattancherry Palace"
        }, indent=2)
    },
    {
        "sample_num": 38,
        "instruction": "remove that fort",
        "response": json.dumps({
            "intent": "REMOVE_PLACE",
            "place_name": "fort"
        }, indent=2)
    },
    {
        "sample_num": 39,
        "instruction": "Delete City Palace from Day 2",
        "response": json.dumps({
            "intent": "REMOVE_PLACE",
            "place_name": "City Palace",
            "day_number": 2
        }, indent=2)
    },
    {
        "sample_num": 40,
        "instruction": "I don't want to go to Baga Beach anymore, take it off",
        "response": json.dumps({
            "intent": "REMOVE_PLACE",
            "place_name": "Baga Beach"
        }, indent=2)
    },
    {
        "sample_num": 41,
        "instruction": "exclude the crowded market from Sunday",
        "response": json.dumps({
            "intent": "REMOVE_PLACE",
            "place_name": "crowded market"
        }, indent=2)
    },
    {
        "sample_num": 42,
        "instruction": "remove Fort Kochi Beach from my selected places",
        "response": json.dumps({
            "intent": "REMOVE_PLACE",
            "place_name": "Fort Kochi Beach"
        }, indent=2)
    },
    {
        "sample_num": 43,
        "instruction": "drop the museum on Day 3",
        "response": json.dumps({
            "intent": "REMOVE_PLACE",
            "place_name": "museum",
            "day_number": 3
        }, indent=2)
    },

    # -------------------------------------------------------------------------
    # 5. MODIFY_ITINERARY (12 samples, #44 - #55)
    # -------------------------------------------------------------------------
    {
        "sample_num": 44,
        "instruction": "make day 2 more relaxed",
        "response": json.dumps({
            "intent": "MODIFY_ITINERARY",
            "day_number": 2,
            "modification_type": "make_relaxed",
            "pace": "Relaxed"
        }, indent=2)
    },
    {
        "sample_num": 45,
        "instruction": "don't make it hectic",
        "response": json.dumps({
            "intent": "MODIFY_ITINERARY",
            "modification_type": "make_relaxed",
            "pace": "Relaxed"
        }, indent=2)
    },
    {
        "sample_num": 46,
        "instruction": "keep the itinerary relaxed",
        "response": json.dumps({
            "intent": "MODIFY_ITINERARY",
            "modification_type": "make_relaxed",
            "pace": "Relaxed"
        }, indent=2)
    },
    {
        "sample_num": 47,
        "instruction": "make day 2 less hectic",
        "response": json.dumps({
            "intent": "MODIFY_ITINERARY",
            "day_number": 2,
            "modification_type": "make_relaxed",
            "pace": "Relaxed"
        }, indent=2)
    },
    {
        "sample_num": 48,
        "instruction": "Swap Day 1 and Day 3 plans",
        "response": json.dumps({
            "intent": "MODIFY_ITINERARY",
            "day_number": 1,
            "modification_type": "swap_days"
        }, indent=2)
    },
    {
        "sample_num": 49,
        "instruction": "Move afternoon sightseeing on Day 2 to the morning",
        "response": json.dumps({
            "intent": "MODIFY_ITINERARY",
            "day_number": 2,
            "time_block": "morning",
            "modification_type": "reschedule_time_block"
        }, indent=2)
    },
    {
        "sample_num": 50,
        "instruction": "We want more free time in the evenings for rest",
        "response": json.dumps({
            "intent": "MODIFY_ITINERARY",
            "time_block": "evening",
            "modification_type": "increase_leisure_time",
            "pace": "Relaxed"
        }, indent=2)
    },
    {
        "sample_num": 51,
        "instruction": "Compress the schedule on Day 1 so we can finish by 4 PM",
        "response": json.dumps({
            "intent": "MODIFY_ITINERARY",
            "day_number": 1,
            "modification_type": "early_finish"
        }, indent=2)
    },
    {
        "sample_num": 52,
        "instruction": "Can we pack more sights into Day 3? We have plenty of energy.",
        "response": json.dumps({
            "intent": "MODIFY_ITINERARY",
            "day_number": 3,
            "modification_type": "make_packed",
            "pace": "Packed"
        }, indent=2)
    },
    {
        "sample_num": 53,
        "instruction": "Push morning start time on Day 2 to 11 AM",
        "response": json.dumps({
            "intent": "MODIFY_ITINERARY",
            "day_number": 2,
            "time_block": "morning",
            "modification_type": "late_start"
        }, indent=2)
    },
    {
        "sample_num": 54,
        "instruction": "Rearrange Day 1 to have an easy afternoon",
        "response": json.dumps({
            "intent": "MODIFY_ITINERARY",
            "day_number": 1,
            "time_block": "afternoon",
            "modification_type": "make_relaxed",
            "pace": "Relaxed"
        }, indent=2)
    },
    {
        "sample_num": 55,
        "instruction": "Give us an extra rest break between sights on Day 2",
        "response": json.dumps({
            "intent": "MODIFY_ITINERARY",
            "day_number": 2,
            "modification_type": "add_break"
        }, indent=2)
    },

    # -------------------------------------------------------------------------
    # 6. UPDATE_BUDGET (8 samples, #56 - #63)
    # -------------------------------------------------------------------------
    {
        "sample_num": 56,
        "instruction": "increase my budget to 50k",
        "response": json.dumps({
            "intent": "UPDATE_BUDGET",
            "budget": 50000,
            "currency": "INR"
        }, indent=2)
    },
    {
        "sample_num": 57,
        "instruction": "make this cheaper",
        "response": json.dumps({
            "intent": "UPDATE_BUDGET",
            "travel_style": "Budget"
        }, indent=2)
    },
    {
        "sample_num": 58,
        "instruction": "not too expensive",
        "response": json.dumps({
            "intent": "UPDATE_BUDGET",
            "travel_style": "Budget"
        }, indent=2)
    },
    {
        "sample_num": 59,
        "instruction": "Our maximum limit is strictly 35000 INR total",
        "response": json.dumps({
            "intent": "UPDATE_BUDGET",
            "budget": 35000,
            "currency": "INR"
        }, indent=2)
    },
    {
        "sample_num": 60,
        "instruction": "Upgrade our stay preference to luxury resorts, budget is flexible",
        "response": json.dumps({
            "intent": "UPDATE_BUDGET",
            "travel_style": "Luxury"
        }, indent=2)
    },
    {
        "sample_num": 61,
        "instruction": "Cut down hotel expenses to fit under 20k",
        "response": json.dumps({
            "intent": "UPDATE_BUDGET",
            "budget": 20000,
            "currency": "INR",
            "travel_style": "Budget"
        }, indent=2)
    },
    {
        "sample_num": 62,
        "instruction": "We can spend up to 80,000 for this anniversary trip",
        "response": json.dumps({
            "intent": "UPDATE_BUDGET",
            "budget": 80000,
            "currency": "INR",
            "travel_style": "Premium"
        }, indent=2)
    },
    {
        "sample_num": 63,
        "instruction": "Switch to balanced midrange budget options",
        "response": json.dumps({
            "intent": "UPDATE_BUDGET",
            "travel_style": "Balanced"
        }, indent=2)
    },

    # -------------------------------------------------------------------------
    # 7. UPDATE_PREFERENCES (12 samples, #64 - #75)
    # -------------------------------------------------------------------------
    {
        "sample_num": 64,
        "instruction": "something chill",
        "response": json.dumps({
            "intent": "UPDATE_PREFERENCES",
            "pace": "Relaxed",
            "travel_style": "Balanced"
        }, indent=2)
    },
    {
        "sample_num": 65,
        "instruction": "trip with my girl",
        "response": json.dumps({
            "intent": "UPDATE_PREFERENCES",
            "companion": "Couple"
        }, indent=2)
    },
    {
        "sample_num": 66,
        "instruction": "We love street food and local culinary experiences",
        "response": json.dumps({
            "intent": "UPDATE_PREFERENCES",
            "interests": ["Food"]
        }, indent=2)
    },
    {
        "sample_num": 67,
        "instruction": "Focus more on outdoor hiking and adventure",
        "response": json.dumps({
            "intent": "UPDATE_PREFERENCES",
            "interests": ["Adventure", "Sports"]
        }, indent=2)
    },
    {
        "sample_num": 68,
        "instruction": "We want heritage forts, art museums and cultural sites",
        "response": json.dumps({
            "intent": "UPDATE_PREFERENCES",
            "interests": ["Culture"]
        }, indent=2)
    },
    {
        "sample_num": 69,
        "instruction": "Avoid loud clubs, we prefer peaceful nature and sunset photography",
        "response": json.dumps({
            "intent": "UPDATE_PREFERENCES",
            "interests": ["Relaxation", "Photography"]
        }, indent=2)
    },
    {
        "sample_num": 70,
        "instruction": "We are traveling with two small kids so keep activities child-friendly",
        "response": json.dumps({
            "intent": "UPDATE_PREFERENCES",
            "companion": "Family"
        }, indent=2)
    },
    {
        "sample_num": 71,
        "instruction": "Prioritize local shopping bazaars and handicraft markets",
        "response": json.dumps({
            "intent": "UPDATE_PREFERENCES",
            "interests": ["Shopping"]
        }, indent=2)
    },
    {
        "sample_num": 72,
        "instruction": "Interested in tiger safaris and bird watching",
        "response": json.dumps({
            "intent": "UPDATE_PREFERENCES",
            "interests": ["Wildlife"]
        }, indent=2)
    },
    {
        "sample_num": 73,
        "instruction": "We are high energy college buddies looking for vibrant nightlife",
        "response": json.dumps({
            "intent": "UPDATE_PREFERENCES",
            "companion": "Friends",
            "interests": ["Nightlife"],
            "pace": "Packed"
        }, indent=2)
    },
    {
        "sample_num": 74,
        "instruction": "Prefer calm spiritual places and ancient temples",
        "response": json.dumps({
            "intent": "UPDATE_PREFERENCES",
            "interests": ["Culture", "Relaxation"]
        }, indent=2)
    },
    {
        "sample_num": 75,
        "instruction": "I am a solo traveler who loves street photography and café hopping",
        "response": json.dumps({
            "intent": "UPDATE_PREFERENCES",
            "companion": "Solo",
            "interests": ["Photography", "Food"]
        }, indent=2)
    },

    # -------------------------------------------------------------------------
    # 8. OPTIMIZE_TRIP (8 samples, #76 - #83)
    # -------------------------------------------------------------------------
    {
        "sample_num": 76,
        "instruction": "Optimize the route to minimize driving between stops",
        "response": json.dumps({
            "intent": "OPTIMIZE_TRIP",
            "optimization_goal": "minimize_travel_time"
        }, indent=2)
    },
    {
        "sample_num": 77,
        "instruction": "Cluster nearby places together on Day 1",
        "response": json.dumps({
            "intent": "OPTIMIZE_TRIP",
            "day_number": 1,
            "optimization_goal": "cluster_geographic"
        }, indent=2)
    },
    {
        "sample_num": 78,
        "instruction": "Reorder Day 2 sights so we don't have to backtrack across town",
        "response": json.dumps({
            "intent": "OPTIMIZE_TRIP",
            "day_number": 2,
            "optimization_goal": "prevent_backtracking"
        }, indent=2)
    },
    {
        "sample_num": 79,
        "instruction": "Make this route as time-efficient as possible",
        "response": json.dumps({
            "intent": "OPTIMIZE_TRIP",
            "optimization_goal": "minimize_travel_time"
        }, indent=2)
    },
    {
        "sample_num": 80,
        "instruction": "Organize the stops geographically to reduce cab fare",
        "response": json.dumps({
            "intent": "OPTIMIZE_TRIP",
            "optimization_goal": "budget_efficiency"
        }, indent=2)
    },
    {
        "sample_num": 81,
        "instruction": "Re-sequence Day 3 places from North to South",
        "response": json.dumps({
            "intent": "OPTIMIZE_TRIP",
            "day_number": 3,
            "optimization_goal": "directional_sequence"
        }, indent=2)
    },
    {
        "sample_num": 82,
        "instruction": "Optimize our daily transit schedule for lower fatigue",
        "response": json.dumps({
            "intent": "OPTIMIZE_TRIP",
            "optimization_goal": "minimize_fatigue",
            "pace": "Relaxed"
        }, indent=2)
    },
    {
        "sample_num": 83,
        "instruction": "Find the fastest driving order for my selected places",
        "response": json.dumps({
            "intent": "OPTIMIZE_TRIP",
            "optimization_goal": "minimize_travel_time"
        }, indent=2)
    },

    # -------------------------------------------------------------------------
    # 9. HANDLE_DISRUPTION (10 samples, #84 - #93)
    # -------------------------------------------------------------------------
    {
        "sample_num": 84,
        "instruction": "It's raining heavily today, what should we do instead?",
        "response": json.dumps({
            "intent": "HANDLE_DISRUPTION",
            "disruption_type": "rain"
        }, indent=2)
    },
    {
        "sample_num": 85,
        "instruction": "hotel got cancelled",
        "response": json.dumps({
            "intent": "HANDLE_DISRUPTION",
            "disruption_type": "hotel_cancelled"
        }, indent=2)
    },
    {
        "sample_num": 86,
        "instruction": "Our flight got delayed by 4 hours, please adjust Day 1",
        "response": json.dumps({
            "intent": "HANDLE_DISRUPTION",
            "disruption_type": "flight_delayed",
            "day_number": 1
        }, indent=2)
    },
    {
        "sample_num": 87,
        "instruction": "The palace is closed today for a private event, replace it",
        "response": json.dumps({
            "intent": "HANDLE_DISRUPTION",
            "disruption_type": "attraction_closed",
            "place_name": "palace"
        }, indent=2)
    },
    {
        "sample_num": 88,
        "instruction": "Heavy storm forecast for tomorrow afternoon, can we reschedule beach visits?",
        "response": json.dumps({
            "intent": "HANDLE_DISRUPTION",
            "disruption_type": "storm",
            "time_block": "afternoon"
        }, indent=2)
    },
    {
        "sample_num": 89,
        "instruction": "My partner is feeling sick today, we need to cancel active plans",
        "response": json.dumps({
            "intent": "HANDLE_DISRUPTION",
            "disruption_type": "illness",
            "pace": "Relaxed"
        }, indent=2)
    },
    {
        "sample_num": 90,
        "instruction": "Massive traffic jam near the monument, give us an alternative nearby",
        "response": json.dumps({
            "intent": "HANDLE_DISRUPTION",
            "disruption_type": "traffic_delay"
        }, indent=2)
    },
    {
        "sample_num": 91,
        "instruction": "Train got rescheduled to late evening, reorganize our morning",
        "response": json.dumps({
            "intent": "HANDLE_DISRUPTION",
            "disruption_type": "train_delayed",
            "time_block": "morning"
        }, indent=2)
    },
    {
        "sample_num": 92,
        "instruction": "Ferry service is suspended due to rough sea, what are our options?",
        "response": json.dumps({
            "intent": "HANDLE_DISRUPTION",
            "disruption_type": "transit_cancellation"
        }, indent=2)
    },
    {
        "sample_num": 93,
        "instruction": "Key museum is under renovation, find an alternative cultural spot",
        "response": json.dumps({
            "intent": "HANDLE_DISRUPTION",
            "disruption_type": "attraction_closed",
            "interests": ["Culture"]
        }, indent=2)
    },

    # -------------------------------------------------------------------------
    # 10. GENERAL_TRAVEL_QUERY (7 samples, #94 - #100)
    # -------------------------------------------------------------------------
    {
        "sample_num": 94,
        "instruction": "what else can I do?",
        "response": json.dumps({
            "intent": "GENERAL_TRAVEL_QUERY",
            "query_topic": "activity_suggestions"
        }, indent=2)
    },
    {
        "sample_num": 95,
        "instruction": "What is the best season to visit Kochi?",
        "response": json.dumps({
            "intent": "GENERAL_TRAVEL_QUERY",
            "destination": "Kochi",
            "query_topic": "best_season"
        }, indent=2)
    },
    {
        "sample_num": 96,
        "instruction": "What clothes should I pack for Jaipur in December?",
        "response": json.dumps({
            "intent": "GENERAL_TRAVEL_QUERY",
            "destination": "Jaipur",
            "query_topic": "clothing",
            "travel_date": "December"
        }, indent=2)
    },
    {
        "sample_num": 97,
        "instruction": "Is Goa safe for solo female travelers at night?",
        "response": json.dumps({
            "intent": "GENERAL_TRAVEL_QUERY",
            "destination": "Goa",
            "companion": "Solo",
            "query_topic": "safety"
        }, indent=2)
    },
    {
        "sample_num": 98,
        "instruction": "Do local vendors in Manali accept UPI payments or should I carry cash?",
        "response": json.dumps({
            "intent": "GENERAL_TRAVEL_QUERY",
            "destination": "Manali",
            "query_topic": "payments_and_cash"
        }, indent=2)
    },
    {
        "sample_num": 99,
        "instruction": "How many days are ideal to explore Visakhapatnam properly?",
        "response": json.dumps({
            "intent": "GENERAL_TRAVEL_QUERY",
            "destination": "Visakhapatnam",
            "query_topic": "ideal_duration"
        }, indent=2)
    },
    {
        "sample_num": 100,
        "instruction": "What are the common local transport options available in Udaipur?",
        "response": json.dumps({
            "intent": "GENERAL_TRAVEL_QUERY",
            "destination": "Udaipur",
            "query_topic": "local_transport"
        }, indent=2)
    }
]

def main():
    target_path = os.path.join(os.path.dirname(__file__), "benchmark_samples.json")
    with open(target_path, "w", encoding="utf-8") as f:
        json.dump(SAMPLES, f, indent=2, ensure_ascii=False)
    print(f"Successfully generated {len(SAMPLES)} samples in {target_path}")

if __name__ == "__main__":
    main()
