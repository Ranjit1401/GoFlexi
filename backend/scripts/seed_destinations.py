"""
Voyara Destination Knowledge Base - Idempotent Seeding Script
Populates ~100 curated, realistic Indian destinations with comprehensive metadata:
- Places & Experiences (destination_tags)
- Travel Styles (destination_travel_styles)
- Companions (destination_companions)
- Transport Options (destination_transport)
- Paces (destination_paces)
- Best Months (destination_best_months)

Strictly matches Phase 3 traveler onboarding preferences vocabulary.
"""

import sys
import os
import uuid

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select, delete
from app.db.database import SessionLocal, engine
from app.models.destination import (
    Destination,
    DestinationTag,
    DestinationTravelStyle,
    DestinationCompanion,
    DestinationTransport,
    DestinationPace,
    DestinationBestMonth,
)

DESTINATIONS_DATA = [
    {
        "name": "Manali",
        "country": "India",
        "state": "Himachal Pradesh",
        "city": "Manali",
        "description": "High-altitude Himalayan resort town known for snow peaks, Solang Valley sports, Rohtang Pass, and old pine forests.",
        "short_description": "Himalayan resort town famous for snow valleys, adventure sports, and pine-clad slopes.",
        "latitude": 32.2432,
        "longitude": 77.1892,
        "budget_min": 15000,
        "budget_max": 45000,
        "popularity_score": 9.3,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Photography",
            "Relaxation",
            "Sports"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Solo",
            "Couple",
            "Friends",
            "Family"
        ],
        "transport_options": [
            "Bus",
            "Car",
            "Flight"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            3,
            4,
            5,
            6,
            9,
            10,
            11,
            12
        ]
    },
    {
        "name": "Shimla",
        "country": "India",
        "state": "Himachal Pradesh",
        "city": "Shimla",
        "description": "The capital of Himachal Pradesh, renowned for its colonial architecture, Mall Road, scenic Ridge, and heritage toy train.",
        "short_description": "Queen of Hills featuring Victorian architecture, scenic promenades, and mountain vistas.",
        "latitude": 31.1048,
        "longitude": 77.1734,
        "budget_min": 12000,
        "budget_max": 40000,
        "popularity_score": 8.9,
        "places": [
            "Mountains",
            "Historical"
        ],
        "experiences": [
            "Relaxation",
            "Shopping",
            "Food",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Bus",
            "Car"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            3,
            4,
            5,
            6,
            10,
            11,
            12
        ]
    },
    {
        "name": "Dharamshala",
        "country": "India",
        "state": "Himachal Pradesh",
        "city": "Dharamshala",
        "description": "Nestled in the Kangra Valley, Dharamshala and McLeod Ganj serve as the residence of the Dalai Lama, surrounded by cedar forests and Tibetan monasteries.",
        "short_description": "Spiritual Tibetan sanctuary and hillside haven framed by the majestic Dhauladhar range.",
        "latitude": 32.219,
        "longitude": 76.3234,
        "budget_min": 10000,
        "budget_max": 35000,
        "popularity_score": 8.7,
        "places": [
            "Mountains",
            "Cultural",
            "Nature"
        ],
        "experiences": [
            "Culture",
            "Relaxation",
            "Photography",
            "Food"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Flight",
            "Bus",
            "Car"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            3,
            4,
            5,
            6,
            9,
            10,
            11
        ]
    },
    {
        "name": "Spiti Valley",
        "country": "India",
        "state": "Himachal Pradesh",
        "city": "Kaza",
        "description": "Cold desert mountain valley perched high in the Himalayas, celebrated for ancient Buddhist monasteries, rugged terrain, and stargazing.",
        "short_description": "Enchanting cold desert mountain valley with ancient cliffside monasteries and celestial skies.",
        "latitude": 32.2461,
        "longitude": 78.0349,
        "budget_min": 20000,
        "budget_max": 50000,
        "popularity_score": 8.8,
        "places": [
            "Mountains",
            "Nature",
            "Cultural"
        ],
        "experiences": [
            "Adventure",
            "Photography",
            "Culture",
            "Wildlife"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Friends"
        ],
        "transport_options": [
            "Car",
            "Bus"
        ],
        "paces": [
            "Packed",
            "Balanced"
        ],
        "best_months": [
            5,
            6,
            7,
            8,
            9,
            10
        ]
    },
    {
        "name": "Kasol",
        "country": "India",
        "state": "Himachal Pradesh",
        "city": "Kasol",
        "description": "Scenic hamlet along the Parvati River, famous for backpacker culture, pine tree trails, Israeli cafes, and treks to Kheerganga.",
        "short_description": "Riverside backpacker retreat in Parvati Valley with alpine trails and bohemian cafes.",
        "latitude": 32.01,
        "longitude": 77.315,
        "budget_min": 8000,
        "budget_max": 25000,
        "popularity_score": 8.6,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Relaxation",
            "Food",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Friends"
        ],
        "transport_options": [
            "Bus",
            "Car"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            3,
            4,
            5,
            6,
            9,
            10,
            11
        ]
    },
    {
        "name": "Bir Billing",
        "country": "India",
        "state": "Himachal Pradesh",
        "city": "Bir",
        "description": "World-renowned paragliding destination in Kangra Valley, boasting Tibetan monasteries, tea gardens, and lush alpine panoramas.",
        "short_description": "Global paragliding capital surrounded by tranquil monasteries and tea estates.",
        "latitude": 32.051,
        "longitude": 76.716,
        "budget_min": 12000,
        "budget_max": 35000,
        "popularity_score": 8.5,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Sports",
            "Culture",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Bus",
            "Car",
            "Train"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            3,
            4,
            5,
            6,
            9,
            10,
            11
        ]
    },
    {
        "name": "Dalhousie",
        "country": "India",
        "state": "Himachal Pradesh",
        "city": "Dalhousie",
        "description": "High-altitude town built across five hills, noted for colonial-era churches, deodar forests, and proximity to Khajjiar.",
        "short_description": "Tranquil hill station draped with pine forests, colonial manors, and meadow views.",
        "latitude": 32.5387,
        "longitude": 75.971,
        "budget_min": 12000,
        "budget_max": 35000,
        "popularity_score": 8.2,
        "places": [
            "Mountains",
            "Nature",
            "Historical"
        ],
        "experiences": [
            "Relaxation",
            "Photography",
            "Relaxation"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Couple",
            "Family"
        ],
        "transport_options": [
            "Bus",
            "Car",
            "Train"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            3,
            4,
            5,
            6,
            9,
            10,
            11,
            12
        ]
    },
    {
        "name": "Jibhi",
        "country": "India",
        "state": "Himachal Pradesh",
        "city": "Jibhi",
        "description": "Unspoiled village in Tirthan Valley famous for traditional cedar wood cottages, freshwater streams, and quiet forest trails.",
        "short_description": "Offbeat wooden-hamlet sanctuary in Tirthan Valley surrounded by babbling brooks.",
        "latitude": 31.6369,
        "longitude": 77.3496,
        "budget_min": 10000,
        "budget_max": 30000,
        "popularity_score": 8.4,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Adventure",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Bus",
            "Car"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            3,
            4,
            5,
            6,
            9,
            10,
            11
        ]
    },
    {
        "name": "Kasauli",
        "country": "India",
        "state": "Himachal Pradesh",
        "city": "Kasauli",
        "description": "Peaceful cantonment town with cobbled paths, Victorian church spires, and sweeping views of the lower Shivalik hills.",
        "short_description": "Serene colonial cantonment with quiet walking tracks and pine-scented breezes.",
        "latitude": 30.9013,
        "longitude": 76.9649,
        "budget_min": 10000,
        "budget_max": 32000,
        "popularity_score": 8.0,
        "places": [
            "Mountains",
            "Historical"
        ],
        "experiences": [
            "Relaxation",
            "Photography"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Couple",
            "Family"
        ],
        "transport_options": [
            "Car",
            "Bus",
            "Train"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            3,
            4,
            5,
            6,
            7,
            9,
            10,
            11
        ]
    },
    {
        "name": "Rishikesh",
        "country": "India",
        "state": "Uttarakhand",
        "city": "Rishikesh",
        "description": "Spiritual center and yoga capital set where the holy Ganges emerges from the Himalayas, known for whitewater rafting and evening aarti.",
        "short_description": "World yoga capital blending Ganges river rafting with transcendent spiritual ghats.",
        "latitude": 30.0869,
        "longitude": 78.2676,
        "budget_min": 8000,
        "budget_max": 35000,
        "popularity_score": 9.2,
        "places": [
            "Mountains",
            "Cultural",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Culture",
            "Relaxation",
            "Sports"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Solo",
            "Friends",
            "Couple",
            "Family"
        ],
        "transport_options": [
            "Train",
            "Bus",
            "Car",
            "Flight"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            2,
            3,
            4,
            5,
            9,
            10,
            11
        ]
    },
    {
        "name": "Nainital",
        "country": "India",
        "state": "Uttarakhand",
        "city": "Nainital",
        "description": "Charming lake resort town in Kumaon hills centered around emerald Naini Lake, enveloped by oak and deodar mountains.",
        "short_description": "Picturesque hill town set around a shimmering crescent lake in the Kumaon hills.",
        "latitude": 29.3919,
        "longitude": 79.4542,
        "budget_min": 12000,
        "budget_max": 40000,
        "popularity_score": 8.8,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Shopping",
            "Food",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Bus",
            "Car"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            3,
            4,
            5,
            6,
            9,
            10,
            11,
            12
        ]
    },
    {
        "name": "Mussoorie",
        "country": "India",
        "state": "Uttarakhand",
        "city": "Mussoorie",
        "description": "Queen of the Hills in Garhwal overlooking the Doon Valley, famous for Kempty Falls, colonial-era heritage, and Camel's Back Road.",
        "short_description": "Classic Garhwal hill resort offering grand Doon Valley views and cascading waterfalls.",
        "latitude": 30.4598,
        "longitude": 78.0644,
        "budget_min": 12000,
        "budget_max": 42000,
        "popularity_score": 8.7,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Shopping",
            "Food",
            "Photography"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Family",
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            3,
            4,
            5,
            6,
            9,
            10,
            11
        ]
    },
    {
        "name": "Auli",
        "country": "India",
        "state": "Uttarakhand",
        "city": "Auli",
        "description": "Premier Indian skiing destination in Chamoli district featuring alpine meadows, coniferous forests, and stunning vistas of Nanda Devi peak.",
        "short_description": "High-altitude winter ski resort with sweeping views of India's tallest snow peaks.",
        "latitude": 30.5284,
        "longitude": 79.567,
        "budget_min": 20000,
        "budget_max": 60000,
        "popularity_score": 8.9,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Sports",
            "Photography",
            "Relaxation"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            12,
            1,
            2,
            3,
            5,
            6
        ]
    },
    {
        "name": "Jim Corbett National Park",
        "country": "India",
        "state": "Uttarakhand",
        "city": "Ramnagar",
        "description": "India's oldest national park on the Himalayan foothills, legendary for royal Bengal tiger safaris, rich birdlife, and jungle lodges.",
        "short_description": "Legendary tiger sanctuary in the Himalayan foothills featuring wilderness jeep safaris.",
        "latitude": 29.53,
        "longitude": 78.7747,
        "budget_min": 15000,
        "budget_max": 55000,
        "popularity_score": 9.0,
        "places": [
            "Nature"
        ],
        "experiences": [
            "Wildlife",
            "Adventure",
            "Photography",
            "Relaxation"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Family",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            11,
            12,
            1,
            2,
            3,
            4,
            5,
            6
        ]
    },
    {
        "name": "Haridwar",
        "country": "India",
        "state": "Uttarakhand",
        "city": "Haridwar",
        "description": "Ancient pilgrimage city where the sacred Ganges descends onto the northern plains, celebrated for Har Ki Pauri ghat and grand evening ceremonies.",
        "short_description": "Sacred gateway city on the Ganges famed for vibrant evening aartis and centuries of heritage.",
        "latitude": 29.9457,
        "longitude": 78.1642,
        "budget_min": 6000,
        "budget_max": 20000,
        "popularity_score": 8.4,
        "places": [
            "Cultural",
            "Historical"
        ],
        "experiences": [
            "Culture",
            "Photography",
            "Food"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Family",
            "Solo"
        ],
        "transport_options": [
            "Train",
            "Bus",
            "Car"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            2,
            3,
            4,
            10,
            11,
            12
        ]
    },
    {
        "name": "Chopta",
        "country": "India",
        "state": "Uttarakhand",
        "city": "Chopta",
        "description": "Known as the Mini Switzerland of Uttarakhand, an untouched meadow base for treks to the world's highest Shiva temple at Tungnath and Chandrashila.",
        "short_description": "Pristine alpine meadow and base camp for the scenic Tungnath-Chandrashila summit trek.",
        "latitude": 30.485,
        "longitude": 79.178,
        "budget_min": 10000,
        "budget_max": 30000,
        "popularity_score": 8.6,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Photography",
            "Culture"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            4,
            5,
            6,
            9,
            10,
            11
        ]
    },
    {
        "name": "Valley of Flowers",
        "country": "India",
        "state": "Uttarakhand",
        "city": "Govindghat",
        "description": "UNESCO World Heritage national park carpeted in hundreds of species of endemic alpine wildflowers against towering glaciers.",
        "short_description": "UNESCO botanical wonder with vibrant endemic blooms blossoming beneath snow summits.",
        "latitude": 30.728,
        "longitude": 79.6053,
        "budget_min": 18000,
        "budget_max": 45000,
        "popularity_score": 9.1,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Photography",
            "Relaxation"
        ],
        "travel_styles": [
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Car",
            "Bus"
        ],
        "paces": [
            "Packed"
        ],
        "best_months": [
            7,
            8,
            9
        ]
    },
    {
        "name": "Srinagar",
        "country": "India",
        "state": "Jammu and Kashmir",
        "city": "Srinagar",
        "description": "Summer capital famed for wooden houseboats on Dal Lake, vibrant floating markets, Mughal terrace gardens, and shikara rides.",
        "short_description": "Paradise valley haven of Dal Lake houseboats, Mughal gardens, and Kashmiri craftsmanship.",
        "latitude": 34.0837,
        "longitude": 74.7973,
        "budget_min": 18000,
        "budget_max": 65000,
        "popularity_score": 9.4,
        "places": [
            "Mountains",
            "Nature",
            "Cultural"
        ],
        "experiences": [
            "Relaxation",
            "Food",
            "Shopping",
            "Photography"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Couple",
            "Family"
        ],
        "transport_options": [
            "Flight",
            "Car"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10
        ]
    },
    {
        "name": "Gulmarg",
        "country": "India",
        "state": "Jammu and Kashmir",
        "city": "Gulmarg",
        "description": "Meadow of Flowers boasting one of the world's highest gondola cable cars, premier powder skiing, and rolling alpine golf greens.",
        "short_description": "Premier snow bowl with high-altitude gondola rides and spectacular Pir Panjal scenery.",
        "latitude": 34.0484,
        "longitude": 74.3805,
        "budget_min": 22000,
        "budget_max": 75000,
        "popularity_score": 9.3,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Sports",
            "Photography",
            "Relaxation"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Couple",
            "Family",
            "Friends"
        ],
        "transport_options": [
            "Car",
            "Flight"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            12,
            1,
            2,
            3,
            5,
            6,
            9,
            10
        ]
    },
    {
        "name": "Pahalgam",
        "country": "India",
        "state": "Jammu and Kashmir",
        "city": "Pahalgam",
        "description": "Valley of Shepherds surrounded by pine forests, the roaring Lidder River, Betaab Valley, and saffron fields.",
        "short_description": "Pine-scented mountain haven nestled along the crystal Lidder River.",
        "latitude": 34.015,
        "longitude": 75.3262,
        "budget_min": 18000,
        "budget_max": 60000,
        "popularity_score": 9.1,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Adventure",
            "Photography"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Family",
            "Couple"
        ],
        "transport_options": [
            "Car"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            3,
            4,
            5,
            6,
            9,
            10
        ]
    },
    {
        "name": "Leh",
        "country": "India",
        "state": "Ladakh",
        "city": "Leh",
        "description": "High desert capital of Ladakh with mudbrick palaces, ancient Tibetan gompas, vibrant mountain bazaars, and stark trans-Himalayan scenery.",
        "short_description": "High-altitude desert capital enriched with Tibetan gompas and moon-like mountains.",
        "latitude": 34.1526,
        "longitude": 77.5771,
        "budget_min": 25000,
        "budget_max": 75000,
        "popularity_score": 9.5,
        "places": [
            "Mountains",
            "Cultural",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Culture",
            "Photography"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Solo",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Flight",
            "Car"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            5,
            6,
            7,
            8,
            9
        ]
    },
    {
        "name": "Nubra Valley",
        "country": "India",
        "state": "Ladakh",
        "city": "Diskit",
        "description": "Dramatic valley across Khardung La pass featuring double-humped Bactrian camels on white sand dunes and giant Buddha statues.",
        "short_description": "Stunning high-altitude desert oasis with sand dunes and ancient cliff monasteries.",
        "latitude": 34.5422,
        "longitude": 77.5684,
        "budget_min": 20000,
        "budget_max": 55000,
        "popularity_score": 9.0,
        "places": [
            "Mountains",
            "Nature",
            "Cultural"
        ],
        "experiences": [
            "Adventure",
            "Photography",
            "Culture"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Friends",
            "Solo",
            "Couple"
        ],
        "transport_options": [
            "Car"
        ],
        "paces": [
            "Packed"
        ],
        "best_months": [
            6,
            7,
            8,
            9
        ]
    },
    {
        "name": "Pangong Tso",
        "country": "India",
        "state": "Ladakh",
        "city": "Spangmik",
        "description": "Hypnotic high-altitude endorheic lake extending from India to Tibet, renowned for shifting blue and turquoise colors surrounded by raw peaks.",
        "short_description": "Iconic high-altitude lake shifting through dramatic shades of deep sapphire and cyan.",
        "latitude": 33.7595,
        "longitude": 78.6674,
        "budget_min": 18000,
        "budget_max": 45000,
        "popularity_score": 9.4,
        "places": [
            "Nature",
            "Mountains"
        ],
        "experiences": [
            "Photography",
            "Adventure",
            "Relaxation"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Solo",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Car"
        ],
        "paces": [
            "Packed",
            "Balanced"
        ],
        "best_months": [
            5,
            6,
            7,
            8,
            9
        ]
    },
    {
        "name": "North Goa",
        "country": "India",
        "state": "Goa",
        "city": "Calangute",
        "description": "Vibrant coastal hub famous for bustling beaches like Baga and Anjuna, legendary beach clubs, flea markets, and water sports.",
        "short_description": "Electrifying seaside paradise featuring spirited beach shacks, water sports, and nightlife.",
        "latitude": 15.5439,
        "longitude": 73.7553,
        "budget_min": 15000,
        "budget_max": 65000,
        "popularity_score": 9.6,
        "places": [
            "Beaches",
            "Cities"
        ],
        "experiences": [
            "Nightlife",
            "Food",
            "Adventure",
            "Shopping",
            "Sports"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Friends",
            "Couple",
            "Solo"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Packed",
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "South Goa",
        "country": "India",
        "state": "Goa",
        "city": "Colva",
        "description": "Tranquil counterpart to the north, offering pristine white sand stretches like Palolem and Agonda, luxury seaside resorts, and Portuguese mansions.",
        "short_description": "Serene coastal haven with quiet white-sand bays, coconut groves, and luxury retreats.",
        "latitude": 15.2736,
        "longitude": 73.9582,
        "budget_min": 20000,
        "budget_max": 85000,
        "popularity_score": 9.2,
        "places": [
            "Beaches",
            "Nature",
            "Historical"
        ],
        "experiences": [
            "Relaxation",
            "Food",
            "Photography"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Couple",
            "Family",
            "Solo"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4
        ]
    },
    {
        "name": "Panaji",
        "country": "India",
        "state": "Goa",
        "city": "Panaji",
        "description": "Goa's riverside capital characterized by Latin Quarter Fontainhas with terracotta-roofed villas, riverside promenade, and baroque churches.",
        "short_description": "Portuguese-heritage river city with colorful colonial quarters and art-filled alleys.",
        "latitude": 15.4909,
        "longitude": 73.8278,
        "budget_min": 12000,
        "budget_max": 45000,
        "popularity_score": 8.7,
        "places": [
            "Cities",
            "Historical",
            "Cultural"
        ],
        "experiences": [
            "Culture",
            "Food",
            "Photography",
            "Shopping"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Couple",
            "Family",
            "Solo"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4
        ]
    },
    {
        "name": "Jaipur",
        "country": "India",
        "state": "Rajasthan",
        "city": "Jaipur",
        "description": "The Pink City, capital of Rajasthan, celebrated for magnificent Amer Fort, Hawa Mahal, City Palace, vibrant textile bazaars, and royal dining.",
        "short_description": "The regal Pink City adorned with monumental hill forts, palaces, and artisanal bazaars.",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "budget_min": 12000,
        "budget_max": 55000,
        "popularity_score": 9.5,
        "places": [
            "Historical",
            "Cultural",
            "Cities"
        ],
        "experiences": [
            "Culture",
            "Shopping",
            "Food",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Family",
            "Couple",
            "Friends",
            "Solo"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Bus",
            "Car"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Udaipur",
        "country": "India",
        "state": "Rajasthan",
        "city": "Udaipur",
        "description": "City of Lakes surrounded by Aravalli hills, home to Lake Pichola's white marble island palaces and majestic Rajput heritage.",
        "short_description": "Romantic City of Lakes with shimmering island palaces and Aravalli mountain backdrops.",
        "latitude": 24.5854,
        "longitude": 73.7125,
        "budget_min": 18000,
        "budget_max": 90000,
        "popularity_score": 9.4,
        "places": [
            "Historical",
            "Cultural",
            "Cities"
        ],
        "experiences": [
            "Relaxation",
            "Culture",
            "Photography",
            "Food"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Couple",
            "Family"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            9,
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Jodhpur",
        "country": "India",
        "state": "Rajasthan",
        "city": "Jodhpur",
        "description": "The Blue City overlooked by colossal Mehrangarh Fort, with azure old-town alleys, spicy culinary delicacies, and desert stepwells.",
        "short_description": "Sun City with indigo-painted alleys and the mighty Mehrangarh Fort towering above.",
        "latitude": 26.2389,
        "longitude": 73.0243,
        "budget_min": 12000,
        "budget_max": 45000,
        "popularity_score": 9.0,
        "places": [
            "Historical",
            "Cultural",
            "Cities"
        ],
        "experiences": [
            "Culture",
            "Photography",
            "Food",
            "Shopping"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Friends",
            "Couple",
            "Family",
            "Solo"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Jaisalmer",
        "country": "India",
        "state": "Rajasthan",
        "city": "Jaisalmer",
        "description": "The Golden City rising out of the Thar Desert, showcasing a living golden sandstone fort, intricately carved havelis, and desert dunes.",
        "short_description": "Golden Desert citadel featuring living sandstone ramparts and starry camel safaris.",
        "latitude": 26.9157,
        "longitude": 70.9083,
        "budget_min": 15000,
        "budget_max": 50000,
        "popularity_score": 9.1,
        "places": [
            "Historical",
            "Cultural",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Culture",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Friends",
            "Couple",
            "Solo"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Flight"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Pushkar",
        "country": "India",
        "state": "Rajasthan",
        "city": "Pushkar",
        "description": "Sacred lake town housing the rare Brahma Temple, 52 holy bathing ghats, and the world-famous annual Pushkar Camel Fair.",
        "short_description": "Sacred oasis town centered around a holy lake and lively cultural traditions.",
        "latitude": 26.4897,
        "longitude": 74.5511,
        "budget_min": 8000,
        "budget_max": 25000,
        "popularity_score": 8.6,
        "places": [
            "Cultural",
            "Historical"
        ],
        "experiences": [
            "Culture",
            "Photography",
            "Food"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Train",
            "Bus",
            "Car"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Ranthambore",
        "country": "India",
        "state": "Rajasthan",
        "city": "Sawai Madhopur",
        "description": "Famous tiger reserve set against ancient fortress ruins and banyan trees, offering world-class open-jeep tiger sightings.",
        "short_description": "Historic tiger reserve where royal predators roam among ancient ruined fortresses.",
        "latitude": 26.0173,
        "longitude": 76.5026,
        "budget_min": 18000,
        "budget_max": 65000,
        "popularity_score": 9.2,
        "places": [
            "Nature",
            "Historical"
        ],
        "experiences": [
            "Wildlife",
            "Photography",
            "Adventure"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Family",
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Car"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5,
            6
        ]
    },
    {
        "name": "Mount Abu",
        "country": "India",
        "state": "Rajasthan",
        "city": "Mount Abu",
        "description": "Rajasthan's sole hill station in the Aravalli range, famed for Nakki Lake and the exquisite marble carvings of Dilwara Jain Temples.",
        "short_description": "Cool desert hill station renowned for marble Dilwara Temples and scenic lakes.",
        "latitude": 24.5925,
        "longitude": 72.7156,
        "budget_min": 10000,
        "budget_max": 35000,
        "popularity_score": 8.3,
        "places": [
            "Mountains",
            "Historical",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Culture",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Family",
            "Couple"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4
        ]
    },
    {
        "name": "Chittorgarh",
        "country": "India",
        "state": "Rajasthan",
        "city": "Chittorgarh",
        "description": "Home to India's largest fort complex, representing Rajput valor, historic victory towers, and legend-soaked palaces.",
        "short_description": "Monumental fortress city symbolizing Rajput valor, grand bastions, and royal palaces.",
        "latitude": 24.8887,
        "longitude": 74.6269,
        "budget_min": 8000,
        "budget_max": 25000,
        "popularity_score": 8.5,
        "places": [
            "Historical",
            "Cultural"
        ],
        "experiences": [
            "Culture",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Family",
            "Solo",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Munnar",
        "country": "India",
        "state": "Kerala",
        "city": "Munnar",
        "description": "Sprawling tea garden hill station in the Western Ghats, famed for misty mountain valleys, Anamudi peak, and spice plantations.",
        "short_description": "Misty Western Ghats hill station blanketed by endless emerald tea estates.",
        "latitude": 10.0889,
        "longitude": 77.0595,
        "budget_min": 14000,
        "budget_max": 45000,
        "popularity_score": 9.3,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Photography",
            "Relaxation"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Couple",
            "Family"
        ],
        "transport_options": [
            "Car",
            "Bus"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            9,
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5
        ]
    },
    {
        "name": "Alleppey",
        "country": "India",
        "state": "Kerala",
        "city": "Alappuzha",
        "description": "Venice of the East, famous for tranquil backwater cruises on traditional kettuvallam houseboats, lagoons, and paddy fields.",
        "short_description": "Serene backwater capital of Kerala renowned for thatched luxury houseboat cruises.",
        "latitude": 9.4981,
        "longitude": 76.3388,
        "budget_min": 16000,
        "budget_max": 55000,
        "popularity_score": 9.4,
        "places": [
            "Nature",
            "Beaches"
        ],
        "experiences": [
            "Relaxation",
            "Food",
            "Photography"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Couple",
            "Family"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus",
            "Flight"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Kochi",
        "country": "India",
        "state": "Kerala",
        "city": "Kochi",
        "description": "Historic harbor city blending Portuguese, Dutch, British, and Jewish influences, famous for iconic Chinese fishing nets and spice markets.",
        "short_description": "Historic coastal melting pot of spice markets, art cafes, and iconic fishing nets.",
        "latitude": 9.9312,
        "longitude": 76.2673,
        "budget_min": 12000,
        "budget_max": 45000,
        "popularity_score": 9.0,
        "places": [
            "Historical",
            "Cultural",
            "Cities"
        ],
        "experiences": [
            "Culture",
            "Food",
            "Shopping",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Couple",
            "Solo",
            "Friends"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4
        ]
    },
    {
        "name": "Varkala",
        "country": "India",
        "state": "Kerala",
        "city": "Varkala",
        "description": "Dramatic red laterite cliffs bordering the Arabian Sea, known for pristine beaches, yoga retreats, and bohemian cliffside dining.",
        "short_description": "Stunning cliffside beach town combining yoga sanctuaries with ocean sunsets.",
        "latitude": 8.7379,
        "longitude": 76.7163,
        "budget_min": 10000,
        "budget_max": 35000,
        "popularity_score": 8.9,
        "places": [
            "Beaches",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Food",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Flight"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Wayanad",
        "country": "India",
        "state": "Kerala",
        "city": "Kalpetta",
        "description": "Forested mountainous district in northern Kerala featuring spice plantations, ancient Edakkal cave carvings, and wildlife sanctuaries.",
        "short_description": "Misty mountain district rich in spice groves, waterfalls, and prehistoric caves.",
        "latitude": 11.6854,
        "longitude": 76.132,
        "budget_min": 14000,
        "budget_max": 42000,
        "popularity_score": 8.8,
        "places": [
            "Mountains",
            "Nature",
            "Historical"
        ],
        "experiences": [
            "Adventure",
            "Relaxation",
            "Wildlife",
            "Photography"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced",
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5
        ]
    },
    {
        "name": "Thekkady",
        "country": "India",
        "state": "Kerala",
        "city": "Thekkady",
        "description": "Spice garden epicenter home to Periyar National Park, renowned for bamboo rafting, elephant sightings, and cardamom hills.",
        "short_description": "Wild cardamom hill country and Periyar lake tiger reserve sanctuary.",
        "latitude": 9.6031,
        "longitude": 77.1615,
        "budget_min": 12000,
        "budget_max": 38000,
        "popularity_score": 8.7,
        "places": [
            "Nature",
            "Mountains"
        ],
        "experiences": [
            "Wildlife",
            "Adventure",
            "Relaxation",
            "Culture"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Couple"
        ],
        "transport_options": [
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            9,
            10,
            11,
            12,
            1,
            2,
            3,
            4
        ]
    },
    {
        "name": "Kovalam",
        "country": "India",
        "state": "Kerala",
        "city": "Kovalam",
        "description": "Famed crescent-shaped beach town marked by its striped lighthouse, Ayurvedic wellness centers, and tranquil Arabian Sea surf.",
        "short_description": "Iconic lighthouse beach bay noted for warm waters and traditional Ayurvedic healing.",
        "latitude": 8.4004,
        "longitude": 76.9787,
        "budget_min": 15000,
        "budget_max": 50000,
        "popularity_score": 8.6,
        "places": [
            "Beaches"
        ],
        "experiences": [
            "Relaxation",
            "Food",
            "Photography"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Couple",
            "Family"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Hampi",
        "country": "India",
        "state": "Karnataka",
        "city": "Hampi",
        "description": "UNESCO World Heritage site with boulder-strewn landscapes and monumental ruins of the 14th-century Vijayanagara Empire.",
        "short_description": "Enchanting open-air museum of Vijayanagara ruins set among surreal boulder hills.",
        "latitude": 15.335,
        "longitude": 76.46,
        "budget_min": 10000,
        "budget_max": 32000,
        "popularity_score": 9.4,
        "places": [
            "Historical",
            "Cultural",
            "Nature"
        ],
        "experiences": [
            "Culture",
            "Photography",
            "Adventure"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Coorg",
        "country": "India",
        "state": "Karnataka",
        "city": "Madikeri",
        "description": "The Scotland of India, blanketed in fragrant coffee plantations, cascading waterfalls, and misty peaks of the Western Ghats.",
        "short_description": "Verdant coffee country featuring cascading waterfalls and mist-draped peaks.",
        "latitude": 12.4244,
        "longitude": 75.7382,
        "budget_min": 15000,
        "budget_max": 45000,
        "popularity_score": 9.1,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Food",
            "Photography",
            "Adventure"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Couple",
            "Family",
            "Friends"
        ],
        "transport_options": [
            "Car",
            "Bus"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            9,
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Gokarna",
        "country": "India",
        "state": "Karnataka",
        "city": "Gokarna",
        "description": "Laid-back pilgrimage and beach town featuring Om Beach and Kudle Beach, surrounded by cliff trails and palm-fringed bays.",
        "short_description": "Tranquil coastal haven with Om-shaped beaches, rocky cliff hikes, and peaceful vibes.",
        "latitude": 14.5479,
        "longitude": 74.3188,
        "budget_min": 8000,
        "budget_max": 25000,
        "popularity_score": 8.9,
        "places": [
            "Beaches",
            "Nature",
            "Cultural"
        ],
        "experiences": [
            "Relaxation",
            "Adventure",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Train",
            "Bus",
            "Car"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Mysore",
        "country": "India",
        "state": "Karnataka",
        "city": "Mysuru",
        "description": "Cultural capital of Karnataka, famous for the illuminated Mysore Palace, Chamundi Hills, silk sarees, and sandalwood.",
        "short_description": "Heritage royal capital renowned for the glittering Mysore Palace and rich cultural arts.",
        "latitude": 12.2958,
        "longitude": 76.6394,
        "budget_min": 10000,
        "budget_max": 35000,
        "popularity_score": 8.8,
        "places": [
            "Historical",
            "Cultural",
            "Cities"
        ],
        "experiences": [
            "Culture",
            "Shopping",
            "Food",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Couple"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus",
            "Flight"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            9,
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Bengaluru",
        "country": "India",
        "state": "Karnataka",
        "city": "Bengaluru",
        "description": "India's Silicon Valley and Garden City, celebrated for its craft brewery culture, pleasant year-round climate, parks, and dining.",
        "short_description": "Dynamic cosmopolitan metropolis famous for craft breweries, parks, and culinary scenes.",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "budget_min": 15000,
        "budget_max": 55000,
        "popularity_score": 9.0,
        "places": [
            "Cities"
        ],
        "experiences": [
            "Food",
            "Nightlife",
            "Shopping",
            "Culture"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Friends",
            "Solo",
            "Couple"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Chikmagalur",
        "country": "India",
        "state": "Karnataka",
        "city": "Chikmagalur",
        "description": "Birthplace of Indian coffee nestled in the Baba Budan Giri hills, featuring Mullayanagiri peak, the highest in Karnataka.",
        "short_description": "Lush coffee hill retreat with dramatic mountain peaks and sweeping Western Ghats views.",
        "latitude": 13.3161,
        "longitude": 75.772,
        "budget_min": 12000,
        "budget_max": 38000,
        "popularity_score": 8.7,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Adventure",
            "Photography"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Friends",
            "Couple",
            "Family"
        ],
        "transport_options": [
            "Car",
            "Bus"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            9,
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Kabini",
        "country": "India",
        "state": "Karnataka",
        "city": "Nagarhole",
        "description": "Pristine wildlife corridor along the Kabini River, world-famous for regular leopard, black panther, and Asian elephant sightings.",
        "short_description": "Exclusive river wildlife safari destination celebrated for leopards and elephant herds.",
        "latitude": 11.954,
        "longitude": 76.28,
        "budget_min": 25000,
        "budget_max": 90000,
        "popularity_score": 9.2,
        "places": [
            "Nature"
        ],
        "experiences": [
            "Wildlife",
            "Photography",
            "Relaxation"
        ],
        "travel_styles": [
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Family",
            "Couple"
        ],
        "transport_options": [
            "Car"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5
        ]
    },
    {
        "name": "Badami",
        "country": "India",
        "state": "Karnataka",
        "city": "Badami",
        "description": "Ancient Chalukya capital renowned for rock-cut cave temples chiseled into red sandstone cliffs around the Agastya Lake.",
        "short_description": "Red sandstone heritage wonder with rock-cut cave temples and lakeside monuments.",
        "latitude": 15.9187,
        "longitude": 75.6766,
        "budget_min": 8000,
        "budget_max": 25000,
        "popularity_score": 8.3,
        "places": [
            "Historical",
            "Cultural"
        ],
        "experiences": [
            "Culture",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Friends",
            "Family"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Mumbai",
        "country": "India",
        "state": "Maharashtra",
        "city": "Mumbai",
        "description": "India's financial heartbeat and Bollywood capital, celebrated for Marine Drive, colonial Gateway of India, street food, and vibrant nightlife.",
        "short_description": "High-octane coastal metropolis of cinema dreams, heritage architecture, and iconic street food.",
        "latitude": 18.922,
        "longitude": 72.8347,
        "budget_min": 15000,
        "budget_max": 75000,
        "popularity_score": 9.6,
        "places": [
            "Cities",
            "Historical",
            "Beaches"
        ],
        "experiences": [
            "Food",
            "Nightlife",
            "Shopping",
            "Culture",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Friends",
            "Solo",
            "Couple",
            "Family"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Packed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Lonavala",
        "country": "India",
        "state": "Maharashtra",
        "city": "Lonavala",
        "description": "Popular Sahyadri hill retreat famed for monsoon waterfalls, verdant valleys, Buddhist rock-cut caves, and chikki confectioneries.",
        "short_description": "Sahyadri weekend mountain getaway packed with waterfalls and misty fort viewpoints.",
        "latitude": 18.7557,
        "longitude": 73.4091,
        "budget_min": 8000,
        "budget_max": 28000,
        "popularity_score": 8.6,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Food",
            "Adventure"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Friends",
            "Family",
            "Couple"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            6,
            7,
            8,
            9,
            10,
            11,
            12
        ]
    },
    {
        "name": "Mahabaleshwar",
        "country": "India",
        "state": "Maharashtra",
        "city": "Mahabaleshwar",
        "description": "Hill station in the Western Ghats known for lush strawberry farms, panoramic Arthur's Seat cliff views, and Venna Lake.",
        "short_description": "Strawberry hill country with dramatic valley lookouts and fresh mountain breezes.",
        "latitude": 17.9237,
        "longitude": 73.6586,
        "budget_min": 12000,
        "budget_max": 40000,
        "popularity_score": 8.7,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Food",
            "Photography"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Car",
            "Bus"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5
        ]
    },
    {
        "name": "Alibaug",
        "country": "India",
        "state": "Maharashtra",
        "city": "Alibaug",
        "description": "Coastal town across Mumbai harbor noted for sea-facing Kolaba Fort, black sand beaches, and peaceful coastal homestays.",
        "short_description": "Coastal getaway featuring sea fortresses, coconut groves, and breezy shorelines.",
        "latitude": 18.6414,
        "longitude": 72.8722,
        "budget_min": 10000,
        "budget_max": 35000,
        "popularity_score": 8.4,
        "places": [
            "Beaches",
            "Historical"
        ],
        "experiences": [
            "Relaxation",
            "Food",
            "Adventure"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Friends",
            "Couple",
            "Family"
        ],
        "transport_options": [
            "Car",
            "Bus",
            "Flexible"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4
        ]
    },
    {
        "name": "Ajanta and Ellora",
        "country": "India",
        "state": "Maharashtra",
        "city": "Chhatrapati Sambhajinagar",
        "description": "UNESCO World Heritage rock-cut cave monuments showcasing masterworks of ancient Buddhist, Hindu, and Jain art including the Kailasa Temple.",
        "short_description": "Ancient monolithic rock-carved cave marvels of religious art and engineering.",
        "latitude": 20.0268,
        "longitude": 75.1792,
        "budget_min": 10000,
        "budget_max": 32000,
        "popularity_score": 9.2,
        "places": [
            "Historical",
            "Cultural"
        ],
        "experiences": [
            "Culture",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Family",
            "Solo",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Flight",
            "Car",
            "Bus"
        ],
        "paces": [
            "Packed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Tadoba",
        "country": "India",
        "state": "Maharashtra",
        "city": "Chandrapur",
        "description": "Maharashtra's oldest and largest tiger reserve, famous for exceptionally frequent open-jeep tiger encounters and teakwood forests.",
        "short_description": "High-density tiger sanctuary offering thrilling open-jeep forest safaris.",
        "latitude": 20.245,
        "longitude": 79.305,
        "budget_min": 18000,
        "budget_max": 55000,
        "popularity_score": 9.0,
        "places": [
            "Nature"
        ],
        "experiences": [
            "Wildlife",
            "Photography",
            "Adventure"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Friends",
            "Family"
        ],
        "transport_options": [
            "Train",
            "Car"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5
        ]
    },
    {
        "name": "Ooty",
        "country": "India",
        "state": "Tamil Nadu",
        "city": "Udhagamandalam",
        "description": "Nilgiri hill station celebrated for its heritage mountain railway, botanical gardens, tea estates, and Dodabetta peak.",
        "short_description": "Queen of the Nilgiris known for toy trains, eucalyptus groves, and rolling tea hills.",
        "latitude": 11.4102,
        "longitude": 76.695,
        "budget_min": 12000,
        "budget_max": 42000,
        "popularity_score": 9.0,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Food",
            "Shopping",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Couple"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            3,
            4,
            5,
            6,
            9,
            10,
            11
        ]
    },
    {
        "name": "Kodaikanal",
        "country": "India",
        "state": "Tamil Nadu",
        "city": "Kodaikanal",
        "description": "Princess of Hill Stations in the Palani Hills centered around a star-shaped lake, pine forests, and misty Pillar Rocks.",
        "short_description": "Mist-shrouded hill resort with pine trails, star-shaped lake, and cool mountain breezes.",
        "latitude": 10.2381,
        "longitude": 77.4892,
        "budget_min": 12000,
        "budget_max": 38000,
        "popularity_score": 8.9,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Photography",
            "Adventure"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Couple",
            "Family",
            "Friends"
        ],
        "transport_options": [
            "Bus",
            "Car"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            9,
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5
        ]
    },
    {
        "name": "Madurai",
        "country": "India",
        "state": "Tamil Nadu",
        "city": "Madurai",
        "description": "One of the oldest continuously inhabited cities on earth, dominated by the colossal gopurams of Meenakshi Amman Temple.",
        "short_description": "Legendary temple city crowned by the awe-inspiring Meenakshi Amman Temple.",
        "latitude": 9.9252,
        "longitude": 78.1198,
        "budget_min": 8000,
        "budget_max": 28000,
        "popularity_score": 8.9,
        "places": [
            "Historical",
            "Cultural",
            "Cities"
        ],
        "experiences": [
            "Culture",
            "Food",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Family",
            "Solo"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Mahabalipuram",
        "country": "India",
        "state": "Tamil Nadu",
        "city": "Mamallapuram",
        "description": "UNESCO World Heritage coastal town famous for 7th-century Pallava Shore Temple, monolithic rathas, and rock-carved reliefs.",
        "short_description": "Coastal archaeological wonder with 7th-century rock-cut temples facing the Bay of Bengal.",
        "latitude": 12.6269,
        "longitude": 80.1927,
        "budget_min": 10000,
        "budget_max": 35000,
        "popularity_score": 8.8,
        "places": [
            "Historical",
            "Cultural",
            "Beaches"
        ],
        "experiences": [
            "Culture",
            "Photography",
            "Relaxation"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Couple",
            "Solo"
        ],
        "transport_options": [
            "Car",
            "Bus"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Rameswaram",
        "country": "India",
        "state": "Tamil Nadu",
        "city": "Rameswaram",
        "description": "Pamban Island pilgrimage haven celebrated for Ramanathaswamy Temple's record corridors and the abandoned ghost town of Dhanushkodi.",
        "short_description": "Island pilgrimage destination connected by sea bridges, leading to Dhanushkodi's ghost sands.",
        "latitude": 9.2876,
        "longitude": 79.3129,
        "budget_min": 8000,
        "budget_max": 28000,
        "popularity_score": 8.7,
        "places": [
            "Cultural",
            "Historical",
            "Islands"
        ],
        "experiences": [
            "Culture",
            "Photography",
            "Relaxation"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Family",
            "Solo"
        ],
        "transport_options": [
            "Train",
            "Car"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Kanyakumari",
        "country": "India",
        "state": "Tamil Nadu",
        "city": "Kanyakumari",
        "description": "Southernmost tip of mainland India where the Indian Ocean, Arabian Sea, and Bay of Bengal converge, home to the Vivekananda Rock Memorial.",
        "short_description": "Mainland India's southern terminus where three oceans meet beneath spectacular sunrises.",
        "latitude": 8.0883,
        "longitude": 77.5385,
        "budget_min": 8000,
        "budget_max": 26000,
        "popularity_score": 8.6,
        "places": [
            "Cultural",
            "Nature",
            "Beaches"
        ],
        "experiences": [
            "Culture",
            "Photography",
            "Relaxation"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Family",
            "Solo",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Darjeeling",
        "country": "India",
        "state": "West Bengal",
        "city": "Darjeeling",
        "description": "World-famous tea garden mountain town in the lower Himalayas, offering sunrise over Mt. Kanchenjunga from Tiger Hill and the Toy Train.",
        "short_description": "Himalayan tea capital with sweeping views of Kanchenjunga and vintage steam railways.",
        "latitude": 27.041,
        "longitude": 88.2663,
        "budget_min": 14000,
        "budget_max": 45000,
        "popularity_score": 9.2,
        "places": [
            "Mountains",
            "Nature",
            "Cultural"
        ],
        "experiences": [
            "Relaxation",
            "Food",
            "Photography",
            "Culture"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Flight"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            3,
            4,
            5,
            9,
            10,
            11,
            12
        ]
    },
    {
        "name": "Kolkata",
        "country": "India",
        "state": "West Bengal",
        "city": "Kolkata",
        "description": "City of Joy, cultural epicenter of art, literature, Victoria Memorial, historic trams, Durga Puja celebrations, and mouthwatering sweets.",
        "short_description": "Cultural soul of eastern India brimming with colonial heritage, literature, and culinary pride.",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "budget_min": 10000,
        "budget_max": 45000,
        "popularity_score": 9.1,
        "places": [
            "Cities",
            "Historical",
            "Cultural"
        ],
        "experiences": [
            "Culture",
            "Food",
            "Shopping",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Solo",
            "Friends"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Packed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Sundarbans",
        "country": "India",
        "state": "West Bengal",
        "city": "Gosaba",
        "description": "The planet's largest coastal mangrove forest delta, inhabited by swimming Bengal tigers, estuarine crocodiles, and rare kingfishers.",
        "short_description": "Vast mangrove wilderness delta and biosphere reserve of the swimming Royal Bengal tiger.",
        "latitude": 21.9497,
        "longitude": 89.1833,
        "budget_min": 12000,
        "budget_max": 35000,
        "popularity_score": 8.8,
        "places": [
            "Nature",
            "Islands"
        ],
        "experiences": [
            "Wildlife",
            "Adventure",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Friends",
            "Solo"
        ],
        "transport_options": [
            "Car",
            "Flexible"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Kalimpong",
        "country": "India",
        "state": "West Bengal",
        "city": "Kalimpong",
        "description": "Tranquil hill ridge town overlooking the Teesta River, recognized for flower nurseries, colonial manors, and Buddhist monasteries.",
        "short_description": "Quiet Himalayan ridge haven famed for exotic orchid nurseries and monastery panoramas.",
        "latitude": 27.0667,
        "longitude": 88.4667,
        "budget_min": 10000,
        "budget_max": 32000,
        "popularity_score": 8.3,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Photography",
            "Culture"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Couple",
            "Family",
            "Solo"
        ],
        "transport_options": [
            "Car",
            "Bus"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            3,
            4,
            5,
            9,
            10,
            11,
            12
        ]
    },
    {
        "name": "Gangtok",
        "country": "India",
        "state": "Sikkim",
        "city": "Gangtok",
        "description": "Capital of Sikkim situated along cloud-kissed ridges, known for MG Marg, Rumtek Monastery, cable car views, and orchid parks.",
        "short_description": "Clean and vibrant hill capital with monastery culture and panoramic Kanchenjunga outlooks.",
        "latitude": 27.3389,
        "longitude": 88.6065,
        "budget_min": 15000,
        "budget_max": 50000,
        "popularity_score": 9.1,
        "places": [
            "Mountains",
            "Cultural",
            "Nature"
        ],
        "experiences": [
            "Culture",
            "Food",
            "Shopping",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Car",
            "Flight"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            3,
            4,
            5,
            9,
            10,
            11,
            12
        ]
    },
    {
        "name": "Pelling",
        "country": "India",
        "state": "Sikkim",
        "city": "Pelling",
        "description": "Quiet west Sikkim settlement offering the closest unhindered views of Mt. Kanchenjunga, ancient Pemayangtse Monastery, and glass skywalk.",
        "short_description": "Serene ridge village offering front-row views of Kanchenjunga and sacred monasteries.",
        "latitude": 27.3167,
        "longitude": 88.2333,
        "budget_min": 12000,
        "budget_max": 38000,
        "popularity_score": 8.7,
        "places": [
            "Mountains",
            "Nature",
            "Cultural"
        ],
        "experiences": [
            "Relaxation",
            "Photography",
            "Culture"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Couple",
            "Family"
        ],
        "transport_options": [
            "Car"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            3,
            4,
            5,
            9,
            10,
            11,
            12
        ]
    },
    {
        "name": "Lachung",
        "country": "India",
        "state": "Sikkim",
        "city": "Lachung",
        "description": "High-altitude mountain village in North Sikkim and gateway to the stunning Yumthang Valley of Flowers and Zero Point snow fields.",
        "short_description": "Subalpine mountain village gateway to Yumthang rhododendron valley and snow frontiers.",
        "latitude": 27.6891,
        "longitude": 88.743,
        "budget_min": 18000,
        "budget_max": 45000,
        "popularity_score": 8.9,
        "places": [
            "Mountains",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Photography",
            "Relaxation"
        ],
        "travel_styles": [
            "Balanced"
        ],
        "companions": [
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Car"
        ],
        "paces": [
            "Packed"
        ],
        "best_months": [
            3,
            4,
            5,
            10,
            11,
            12
        ]
    },
    {
        "name": "Shillong",
        "country": "India",
        "state": "Meghalaya",
        "city": "Shillong",
        "description": "Scotland of the East, known for rolling pine hills, rock music culture, Elephant Falls, and pleasant highland temperatures.",
        "short_description": "Pine-covered highland capital known for vibrant music culture and surrounding waterfalls.",
        "latitude": 25.5788,
        "longitude": 91.8933,
        "budget_min": 14000,
        "budget_max": 42000,
        "popularity_score": 9.0,
        "places": [
            "Mountains",
            "Nature",
            "Cities"
        ],
        "experiences": [
            "Culture",
            "Food",
            "Relaxation",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Friends",
            "Couple",
            "Family"
        ],
        "transport_options": [
            "Flight",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            9,
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5
        ]
    },
    {
        "name": "Cherrapunji",
        "country": "India",
        "state": "Meghalaya",
        "city": "Sohra",
        "description": "One of the wettest spots on earth, famed for bio-engineered living root bridges, deep gorges, and thunderous Nohkalikai waterfall.",
        "short_description": "Cradle of clouds famous for ancient living root bridges and monumental waterfalls.",
        "latitude": 25.2702,
        "longitude": 91.7323,
        "budget_min": 12000,
        "budget_max": 38000,
        "popularity_score": 9.2,
        "places": [
            "Nature",
            "Mountains"
        ],
        "experiences": [
            "Adventure",
            "Photography",
            "Relaxation"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Friends",
            "Solo",
            "Couple"
        ],
        "transport_options": [
            "Car"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            9,
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5
        ]
    },
    {
        "name": "Kaziranga National Park",
        "country": "India",
        "state": "Assam",
        "city": "Golaghat",
        "description": "UNESCO World Heritage floodplains along the Brahmaputra, harboring two-thirds of the world's great one-horned rhinoceroses.",
        "short_description": "Global sanctuary for the majestic great Indian one-horned rhinoceros.",
        "latitude": 26.5775,
        "longitude": 93.1711,
        "budget_min": 15000,
        "budget_max": 50000,
        "popularity_score": 9.3,
        "places": [
            "Nature"
        ],
        "experiences": [
            "Wildlife",
            "Photography",
            "Adventure"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Friends"
        ],
        "transport_options": [
            "Car",
            "Train",
            "Flight"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            11,
            12,
            1,
            2,
            3,
            4
        ]
    },
    {
        "name": "Majuli",
        "country": "India",
        "state": "Assam",
        "city": "Majuli",
        "description": "The world's largest river island on the Brahmaputra, center of Neo-Vaishnavite satras, mask-making, and riverine tranquility.",
        "short_description": "Vast Brahmaputra river island renowned for neo-Vaishnavite culture and mask craftsmanship.",
        "latitude": 26.95,
        "longitude": 94.2167,
        "budget_min": 8000,
        "budget_max": 25000,
        "popularity_score": 8.5,
        "places": [
            "Islands",
            "Cultural",
            "Nature"
        ],
        "experiences": [
            "Culture",
            "Relaxation",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Friends"
        ],
        "transport_options": [
            "Car",
            "Flexible"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Tawang",
        "country": "India",
        "state": "Arunachal Pradesh",
        "city": "Tawang",
        "description": "Perched at 10,000 feet, Tawang hosts India's largest Buddhist monastery, frozen Sela Pass, and glacial alpine lakes.",
        "short_description": "Spectacular high mountain frontier housing India's largest Tibetan Buddhist monastery.",
        "latitude": 27.5861,
        "longitude": 91.8594,
        "budget_min": 20000,
        "budget_max": 55000,
        "popularity_score": 9.1,
        "places": [
            "Mountains",
            "Cultural",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Culture",
            "Photography"
        ],
        "travel_styles": [
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Friends"
        ],
        "transport_options": [
            "Car"
        ],
        "paces": [
            "Packed"
        ],
        "best_months": [
            3,
            4,
            5,
            9,
            10,
            11
        ]
    },
    {
        "name": "Ziro Valley",
        "country": "India",
        "state": "Arunachal Pradesh",
        "city": "Ziro",
        "description": "Picturesque valley home to the Apatani tribe, paddy-cum-pisciculture farmlands, pine hills, and the outdoor Ziro Music Festival.",
        "short_description": "Idyllic plateau valley famous for unique indigenous Apatani culture and indie music festivals.",
        "latitude": 27.5333,
        "longitude": 93.8333,
        "budget_min": 14000,
        "budget_max": 38000,
        "popularity_score": 8.7,
        "places": [
            "Mountains",
            "Cultural",
            "Nature"
        ],
        "experiences": [
            "Culture",
            "Adventure",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Friends",
            "Solo"
        ],
        "transport_options": [
            "Car",
            "Train"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            3,
            4,
            5,
            9,
            10
        ]
    },
    {
        "name": "Havelock Island",
        "country": "India",
        "state": "Andaman and Nicobar Islands",
        "city": "Swaraj Dweep",
        "description": "Renowned for Radhanagar Beach (one of Asia's finest), Elephant Beach coral reefs, scuba diving, and glowing bioluminescent waters.",
        "short_description": "Tropical paradise of sugar-white sands, turquoise lagoons, and world-class scuba reefs.",
        "latitude": 11.9761,
        "longitude": 92.9876,
        "budget_min": 25000,
        "budget_max": 85000,
        "popularity_score": 9.6,
        "places": [
            "Islands",
            "Beaches",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Relaxation",
            "Photography",
            "Sports"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Couple",
            "Friends",
            "Family"
        ],
        "transport_options": [
            "Flight",
            "Flexible"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5
        ]
    },
    {
        "name": "Neil Island",
        "country": "India",
        "state": "Andaman and Nicobar Islands",
        "city": "Shaheed Dweep",
        "description": "Quiet and laid-back island noted for natural rock bridge formations, deserted beaches like Bharatpur, and rich shallow-water corals.",
        "short_description": "Serene coral island with natural limestone arches, cycling tracks, and sleepy beaches.",
        "latitude": 11.8324,
        "longitude": 93.0514,
        "budget_min": 18000,
        "budget_max": 55000,
        "popularity_score": 9.0,
        "places": [
            "Islands",
            "Beaches",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Photography"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Couple",
            "Solo"
        ],
        "transport_options": [
            "Flexible"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5
        ]
    },
    {
        "name": "Port Blair",
        "country": "India",
        "state": "Andaman and Nicobar Islands",
        "city": "Port Blair",
        "description": "Island territory capital housing the historic Cellular Jail monument, anthropological museums, and gateway to the Andaman archipelago.",
        "short_description": "Archipelago gateway featuring the solemn historic Cellular Jail and coastal promenades.",
        "latitude": 11.6234,
        "longitude": 92.7265,
        "budget_min": 15000,
        "budget_max": 45000,
        "popularity_score": 8.8,
        "places": [
            "Islands",
            "Historical",
            "Cities"
        ],
        "experiences": [
            "Culture",
            "Photography",
            "Food"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Couple"
        ],
        "transport_options": [
            "Flight",
            "Flexible"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5
        ]
    },
    {
        "name": "Agatti Island",
        "country": "India",
        "state": "Lakshadweep",
        "city": "Agatti",
        "description": "Awe-inspiring coral atoll with a scenic airstrip stretching over ocean waters, crystal clear lagoons, and pristine snorkeling reefs.",
        "short_description": "Breathtaking coral atoll surrounded by electric-blue lagoons and coconut palms.",
        "latitude": 10.8533,
        "longitude": 72.1931,
        "budget_min": 35000,
        "budget_max": 110000,
        "popularity_score": 9.3,
        "places": [
            "Islands",
            "Beaches",
            "Nature"
        ],
        "experiences": [
            "Adventure",
            "Relaxation",
            "Sports",
            "Photography"
        ],
        "travel_styles": [
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Flight"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4
        ]
    },
    {
        "name": "Bangaram Island",
        "country": "India",
        "state": "Lakshadweep",
        "city": "Bangaram",
        "description": "Uninhabited teardrop atoll surrounded by shallow turquoise lagoons and coral reefs, offering an exclusive Robinson Crusoe escape.",
        "short_description": "Exclusive uninhabited coral atoll offering ultimate private lagoon tranquility.",
        "latitude": 10.94,
        "longitude": 72.29,
        "budget_min": 40000,
        "budget_max": 120000,
        "popularity_score": 9.4,
        "places": [
            "Islands",
            "Beaches",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Adventure",
            "Sports"
        ],
        "travel_styles": [
            "Luxury",
            "Premium"
        ],
        "companions": [
            "Couple"
        ],
        "transport_options": [
            "Flexible"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4
        ]
    },
    {
        "name": "Puri",
        "country": "India",
        "state": "Odisha",
        "city": "Puri",
        "description": "Coastal Char Dham spiritual center famous for the Jagannath Temple, the annual Ratha Yatra, Golden Beach, and sand art.",
        "short_description": "Spiritual seaside Char Dham town famous for Jagannath Temple and Golden Beach surf.",
        "latitude": 19.8135,
        "longitude": 85.8312,
        "budget_min": 8000,
        "budget_max": 30000,
        "popularity_score": 8.9,
        "places": [
            "Cultural",
            "Beaches",
            "Historical"
        ],
        "experiences": [
            "Culture",
            "Food",
            "Relaxation"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Family",
            "Solo"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Konark",
        "country": "India",
        "state": "Odisha",
        "city": "Konark",
        "description": "UNESCO World Heritage 13th-century Sun Temple designed as a monumental 24-wheeled chariot of Surya carved out of stone.",
        "short_description": "Masterwork stone architectural chariot dedicated to the Sun God by the sea.",
        "latitude": 19.8876,
        "longitude": 86.0945,
        "budget_min": 8000,
        "budget_max": 25000,
        "popularity_score": 9.0,
        "places": [
            "Historical",
            "Cultural"
        ],
        "experiences": [
            "Culture",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Family",
            "Solo",
            "Friends"
        ],
        "transport_options": [
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Varanasi",
        "country": "India",
        "state": "Uttar Pradesh",
        "city": "Varanasi",
        "description": "One of the oldest continuously inhabited cities on earth, spiritual capital on the sacred Ganges known for Manikarnika and Dashashwamedh ghats.",
        "short_description": "The timeless spiritual heart of India where eternal rituals unfold along the Ganges ghats.",
        "latitude": 25.3176,
        "longitude": 82.9739,
        "budget_min": 8000,
        "budget_max": 40000,
        "popularity_score": 9.7,
        "places": [
            "Cultural",
            "Historical",
            "Cities"
        ],
        "experiences": [
            "Culture",
            "Photography",
            "Food"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Solo",
            "Family",
            "Couple"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Agra",
        "country": "India",
        "state": "Uttar Pradesh",
        "city": "Agra",
        "description": "Mughal capital on the Yamuna River, internationally renowned for the Taj Mahal, Agra Fort, and the deserted Mughal court of Fatehpur Sikri.",
        "short_description": "Home to the sublime ivory-white marble Taj Mahal and colossal Mughal fortresses.",
        "latitude": 27.1767,
        "longitude": 78.0081,
        "budget_min": 10000,
        "budget_max": 45000,
        "popularity_score": 9.7,
        "places": [
            "Historical",
            "Cultural",
            "Cities"
        ],
        "experiences": [
            "Culture",
            "Photography",
            "Food",
            "Shopping"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Couple",
            "Family",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus",
            "Flight"
        ],
        "paces": [
            "Packed",
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Lucknow",
        "country": "India",
        "state": "Uttar Pradesh",
        "city": "Lucknow",
        "description": "City of Nawabs, recognized for Awadhi culinary mastery, Chikankari embroidery, and architectural marvels like Bara Imambara.",
        "short_description": "Refined city of Nawabi heritage, exquisite Awadhi gastronomy, and architectural wonders.",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "budget_min": 10000,
        "budget_max": 38000,
        "popularity_score": 8.9,
        "places": [
            "Historical",
            "Cultural",
            "Cities"
        ],
        "experiences": [
            "Food",
            "Culture",
            "Shopping",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Friends",
            "Solo"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Mathura and Vrindavan",
        "country": "India",
        "state": "Uttar Pradesh",
        "city": "Mathura",
        "description": "Sacred twin cities on the Yamuna, the birthplace and childhood ground of Lord Krishna, famous for temple festivities and Holi celebrations.",
        "short_description": "Sacred Krishna heritage hub celebrated for vibrant temple rituals and festivals.",
        "latitude": 27.4924,
        "longitude": 77.6737,
        "budget_min": 6000,
        "budget_max": 22000,
        "popularity_score": 8.6,
        "places": [
            "Cultural",
            "Historical"
        ],
        "experiences": [
            "Culture",
            "Photography",
            "Food"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Family",
            "Solo"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Khajuraho",
        "country": "India",
        "state": "Madhya Pradesh",
        "city": "Khajuraho",
        "description": "UNESCO World Heritage group of Hindu and Jain temples dating to the Chandela dynasty, famed for intricate erotic sculptures and nagara stone craft.",
        "short_description": "UNESCO medieval temple complex celebrated for stone sculptures celebrating life and art.",
        "latitude": 24.8318,
        "longitude": 79.9199,
        "budget_min": 10000,
        "budget_max": 35000,
        "popularity_score": 9.1,
        "places": [
            "Historical",
            "Cultural"
        ],
        "experiences": [
            "Culture",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Couple",
            "Solo",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Flight",
            "Car"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Kanha National Park",
        "country": "India",
        "state": "Madhya Pradesh",
        "city": "Mandla",
        "description": "Vast sal and bamboo forest reserve that inspired Rudyard Kipling's Jungle Book, prime habitat for the Bengal tiger and rare barasingha deer.",
        "short_description": "Inspiration for The Jungle Book, famed for open meadows and majestic tiger populations.",
        "latitude": 22.3345,
        "longitude": 80.6115,
        "budget_min": 18000,
        "budget_max": 60000,
        "popularity_score": 9.2,
        "places": [
            "Nature"
        ],
        "experiences": [
            "Wildlife",
            "Photography",
            "Adventure"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Family",
            "Friends"
        ],
        "transport_options": [
            "Car",
            "Train"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5,
            6
        ]
    },
    {
        "name": "Bandhavgarh National Park",
        "country": "India",
        "state": "Madhya Pradesh",
        "city": "Umaria",
        "description": "High-density tiger habitat situated around a towering historic hill fort, offering some of the highest statistical chances of spotting a wild tiger.",
        "short_description": "World-famous tiger sanctuary boasting the highest density of wild Bengal tigers.",
        "latitude": 23.7027,
        "longitude": 80.999,
        "budget_min": 20000,
        "budget_max": 65000,
        "popularity_score": 9.3,
        "places": [
            "Nature",
            "Historical"
        ],
        "experiences": [
            "Wildlife",
            "Photography",
            "Adventure"
        ],
        "travel_styles": [
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Family",
            "Friends",
            "Solo"
        ],
        "transport_options": [
            "Train",
            "Car"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3,
            4,
            5,
            6
        ]
    },
    {
        "name": "Orchha",
        "country": "India",
        "state": "Madhya Pradesh",
        "city": "Orchha",
        "description": "Frozen-in-time Bundela capital on the banks of Betwa River, showcasing towering chhatris cenotaphs, Raja Mahal, and Jahangir Mahal.",
        "short_description": "Atmospheric riverside medieval kingdom adorned with grand palaces and river cenotaphs.",
        "latitude": 25.3514,
        "longitude": 78.6416,
        "budget_min": 8000,
        "budget_max": 25000,
        "popularity_score": 8.7,
        "places": [
            "Historical",
            "Cultural"
        ],
        "experiences": [
            "Culture",
            "Photography",
            "Relaxation"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Solo",
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Car"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Gwalior",
        "country": "India",
        "state": "Madhya Pradesh",
        "city": "Gwalior",
        "description": "Historic fortress city crowned by the 'pearl amongst fortresses in India', famous for blue-tiled Man Singh Palace and Scindia palace museum.",
        "short_description": "Impregnable hilltop fortress city rich in musical lineage and palace museums.",
        "latitude": 26.2183,
        "longitude": 78.1828,
        "budget_min": 9000,
        "budget_max": 30000,
        "popularity_score": 8.6,
        "places": [
            "Historical",
            "Cultural",
            "Cities"
        ],
        "experiences": [
            "Culture",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Family",
            "Solo"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus",
            "Flight"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Rann of Kutch",
        "country": "India",
        "state": "Gujarat",
        "city": "Dhordo",
        "description": "World's largest salt marsh desert, sparkling brilliant white beneath full moons and hosting the colorful winter cultural Rann Utsav.",
        "short_description": "Vast ethereal white salt desert glowing under moonlit skies and lively cultural tents.",
        "latitude": 23.834,
        "longitude": 69.837,
        "budget_min": 18000,
        "budget_max": 55000,
        "popularity_score": 9.3,
        "places": [
            "Nature",
            "Cultural"
        ],
        "experiences": [
            "Culture",
            "Photography",
            "Shopping"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Couple",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Flight"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            11,
            12,
            1,
            2
        ]
    },
    {
        "name": "Gir National Park",
        "country": "India",
        "state": "Gujarat",
        "city": "Sasan Gir",
        "description": "The sole natural refuge of the endangered Asiatic lion in the wild, surrounded by dry deciduous teak forest and scrublands.",
        "short_description": "The world's only natural sanctuary where Asiatic lions roam freely in the wild.",
        "latitude": 21.1243,
        "longitude": 70.8242,
        "budget_min": 15000,
        "budget_max": 45000,
        "popularity_score": 9.1,
        "places": [
            "Nature"
        ],
        "experiences": [
            "Wildlife",
            "Photography",
            "Adventure"
        ],
        "travel_styles": [
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Friends"
        ],
        "transport_options": [
            "Train",
            "Car"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            11,
            12,
            1,
            2,
            3,
            4,
            5
        ]
    },
    {
        "name": "Ahmedabad",
        "country": "India",
        "state": "Gujarat",
        "city": "Ahmedabad",
        "description": "India's first UNESCO World Heritage City, celebrated for historic pols, Sabarmati Ashram, intricate stepwells, and street food at Manek Chowk.",
        "short_description": "First UNESCO heritage city boasting pol communities, Gandhi's ashram, and bustling markets.",
        "latitude": 23.0225,
        "longitude": 72.5714,
        "budget_min": 10000,
        "budget_max": 38000,
        "popularity_score": 8.8,
        "places": [
            "Cities",
            "Historical",
            "Cultural"
        ],
        "experiences": [
            "Culture",
            "Food",
            "Shopping",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Solo",
            "Friends"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Amritsar",
        "country": "India",
        "state": "Punjab",
        "city": "Amritsar",
        "description": "Spiritual center of Sikhism housing the shimmering Golden Temple, community langar kitchen, historic Jallianwala Bagh, and Wagah Border ceremony.",
        "short_description": "Spiritual Sikh capital centered around the dazzling gold-gilded Harmandir Sahib.",
        "latitude": 31.62,
        "longitude": 74.8765,
        "budget_min": 8000,
        "budget_max": 32000,
        "popularity_score": 9.5,
        "places": [
            "Cultural",
            "Historical",
            "Cities"
        ],
        "experiences": [
            "Culture",
            "Food",
            "Shopping",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Solo",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced",
            "Packed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "New Delhi",
        "country": "India",
        "state": "Delhi",
        "city": "New Delhi",
        "description": "National capital spanning centuries of empire, combining Mughal wonders like Red Fort and Humayun's Tomb with Lutyens avenues, museums, and food lanes.",
        "short_description": "Grand historic capital connecting monumental Mughal tombs, street food bazaars, and modern culture.",
        "latitude": 28.6139,
        "longitude": 77.209,
        "budget_min": 12000,
        "budget_max": 65000,
        "popularity_score": 9.5,
        "places": [
            "Cities",
            "Historical",
            "Cultural"
        ],
        "experiences": [
            "Culture",
            "Food",
            "Shopping",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Family",
            "Solo",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Packed"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Hyderabad",
        "country": "India",
        "state": "Telangana",
        "city": "Hyderabad",
        "description": "City of Pearls, famous for 16th-century Charminar, Golconda Fort acoustic marvels, and authentic Hyderabadi dum biryani.",
        "short_description": "Historic pearl and tech metropolis legendary for royal Nizami cuisine and Golconda Fort.",
        "latitude": 17.385,
        "longitude": 78.4867,
        "budget_min": 12000,
        "budget_max": 48000,
        "popularity_score": 9.2,
        "places": [
            "Cities",
            "Historical",
            "Cultural"
        ],
        "experiences": [
            "Food",
            "Culture",
            "Shopping",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium",
            "Luxury"
        ],
        "companions": [
            "Family",
            "Friends",
            "Couple",
            "Solo"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Visakhapatnam",
        "country": "India",
        "state": "Andhra Pradesh",
        "city": "Visakhapatnam",
        "description": "Port city where Eastern Ghats mountain ridges kiss the Bay of Bengal, featuring submarine museums, Rishikonda beach, and scenic coastal drives.",
        "short_description": "Picturesque coastal port where green mountain ridges overlook long ocean beaches.",
        "latitude": 17.6868,
        "longitude": 83.2185,
        "budget_min": 10000,
        "budget_max": 35000,
        "popularity_score": 8.7,
        "places": [
            "Beaches",
            "Cities",
            "Nature"
        ],
        "experiences": [
            "Relaxation",
            "Food",
            "Adventure"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Family",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Flight",
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Araku Valley",
        "country": "India",
        "state": "Andhra Pradesh",
        "city": "Araku",
        "description": "Hill station in the Eastern Ghats famous for organic coffee plantations, indigenous tribal culture, Borra Caves, and train tunnels.",
        "short_description": "Eastern Ghats coffee valley with prehistoric limestone caves and tribal culture.",
        "latitude": 18.3273,
        "longitude": 82.8775,
        "budget_min": 8000,
        "budget_max": 25000,
        "popularity_score": 8.4,
        "places": [
            "Mountains",
            "Nature",
            "Cultural"
        ],
        "experiences": [
            "Food",
            "Relaxation",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Family",
            "Friends",
            "Couple"
        ],
        "transport_options": [
            "Train",
            "Car",
            "Bus"
        ],
        "paces": [
            "Relaxed"
        ],
        "best_months": [
            9,
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Puducherry",
        "country": "India",
        "state": "Puducherry",
        "city": "Puducherry",
        "description": "Coastal union territory famous for its French colonial heritage, pastel villas, seaside promenade, bohemian cafes, and the spiritual community of Auroville.",
        "short_description": "French colonial coastal haven known for serene promenades, yellow villas, and Auroville.",
        "latitude": 11.9416,
        "longitude": 79.8083,
        "budget_min": 10000,
        "budget_max": 35000,
        "popularity_score": 8.8,
        "places": [
            "Beaches",
            "Cultural",
            "Historical"
        ],
        "experiences": [
            "Relaxation",
            "Food",
            "Culture",
            "Photography",
            "Shopping"
        ],
        "travel_styles": [
            "Budget",
            "Balanced",
            "Premium"
        ],
        "companions": [
            "Solo",
            "Couple",
            "Friends",
            "Family"
        ],
        "transport_options": [
            "Bus",
            "Train",
            "Car",
            "Flight"
        ],
        "paces": [
            "Relaxed",
            "Balanced"
        ],
        "best_months": [
            10,
            11,
            12,
            1,
            2,
            3
        ]
    },
    {
        "name": "Tirupati",
        "country": "India",
        "state": "Andhra Pradesh",
        "city": "Tirupati",
        "description": "Ancient holy city located at the foot of Tirumala Hills, home to the revered Sri Venkateswara Temple, ancient rock gardens, and historic Vijayanagara shrines.",
        "short_description": "Spiritual sanctuary nestled in the Tirumala Hills, famed for sacred Dravidian temples.",
        "latitude": 13.6288,
        "longitude": 79.4192,
        "budget_min": 7000,
        "budget_max": 25000,
        "popularity_score": 9.0,
        "places": [
            "Historical",
            "Cultural",
            "Mountains"
        ],
        "experiences": [
            "Culture",
            "Relaxation",
            "Photography"
        ],
        "travel_styles": [
            "Budget",
            "Balanced"
        ],
        "companions": [
            "Family",
            "Couple",
            "Solo"
        ],
        "transport_options": [
            "Train",
            "Flight",
            "Bus",
            "Car"
        ],
        "paces": [
            "Balanced",
            "Relaxed"
        ],
        "best_months": [
            9,
            10,
            11,
            12,
            1,
            2
        ]
    }
]


def seed_destinations():
    print(f"Starting destination seeding: {len(DESTINATIONS_DATA)} destinations...")
    db = SessionLocal()
    try:
        # 1. Fetch all existing destinations in ONE query
        existing_stmt = select(Destination)
        existing_destinations = {
            (d.name, d.state): d for d in db.execute(existing_stmt).scalars().all()
        }

        created_count = 0
        updated_count = 0
        dest_ids_to_clean = []
        new_destinations = []

        tags_to_add = []
        styles_to_add = []
        companions_to_add = []
        transports_to_add = []
        paces_to_add = []
        months_to_add = []

        for item in DESTINATIONS_DATA:
            name = item["name"].strip()
            state = item["state"].strip()
            dest = existing_destinations.get((name, state))

            if not dest:
                dest_id = uuid.uuid4()
                dest = Destination(
                    id=dest_id,
                    name=name,
                    country=item.get("country", "India"),
                    state=state,
                    city=item.get("city", name),
                    description=item.get("description", ""),
                    short_description=item.get("short_description", ""),
                    latitude=item.get("latitude"),
                    longitude=item.get("longitude"),
                    budget_min=item.get("budget_min", 0),
                    budget_max=item.get("budget_max", 0),
                    popularity_score=item.get("popularity_score", 0.0),
                )
                new_destinations.append(dest)
                created_count += 1
            else:
                dest.country = item.get("country", "India")
                dest.city = item.get("city", name)
                dest.description = item.get("description", "")
                dest.short_description = item.get("short_description", "")
                dest.latitude = item.get("latitude")
                dest.longitude = item.get("longitude")
                dest.budget_min = item.get("budget_min", 0)
                dest.budget_max = item.get("budget_max", 0)
                dest.popularity_score = item.get("popularity_score", 0.0)
                dest_id = dest.id
                dest_ids_to_clean.append(dest_id)
                updated_count += 1

            # Prepare child records
            for place in set(item.get("places", [])):
                tags_to_add.append(DestinationTag(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    tag_type="place",
                    tag_value=place
                ))

            for exp in set(item.get("experiences", [])):
                tags_to_add.append(DestinationTag(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    tag_type="experience",
                    tag_value=exp
                ))

            for style in set(item.get("travel_styles", [])):
                styles_to_add.append(DestinationTravelStyle(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    travel_style=style
                ))

            for comp in set(item.get("companions", [])):
                companions_to_add.append(DestinationCompanion(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    companion_type=comp
                ))

            for trans in set(item.get("transport_options", [])):
                transports_to_add.append(DestinationTransport(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    transport_type=trans
                ))

            for pace in set(item.get("paces", [])):
                paces_to_add.append(DestinationPace(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    pace=pace
                ))

            for month in set(item.get("best_months", [])):
                months_to_add.append(DestinationBestMonth(
                    id=uuid.uuid4(),
                    destination_id=dest_id,
                    month=month
                ))

        # Clean existing child records if updating
        if dest_ids_to_clean:
            db.execute(delete(DestinationTag).where(DestinationTag.destination_id.in_(dest_ids_to_clean)))
            db.execute(delete(DestinationTravelStyle).where(DestinationTravelStyle.destination_id.in_(dest_ids_to_clean)))
            db.execute(delete(DestinationCompanion).where(DestinationCompanion.destination_id.in_(dest_ids_to_clean)))
            db.execute(delete(DestinationTransport).where(DestinationTransport.destination_id.in_(dest_ids_to_clean)))
            db.execute(delete(DestinationPace).where(DestinationPace.destination_id.in_(dest_ids_to_clean)))
            db.execute(delete(DestinationBestMonth).where(DestinationBestMonth.destination_id.in_(dest_ids_to_clean)))

        if new_destinations:
            db.add_all(new_destinations)

        db.add_all(tags_to_add)
        db.add_all(styles_to_add)
        db.add_all(companions_to_add)
        db.add_all(transports_to_add)
        db.add_all(paces_to_add)
        db.add_all(months_to_add)

        db.commit()
        print(f"Destination seeding completed successfully!")
        print(f"Created: {created_count}, Updated: {updated_count}, Total: {created_count + updated_count}")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_destinations()
