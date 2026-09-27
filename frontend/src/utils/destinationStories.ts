/**
 * GoFlexi — Destination Stories, Travel Blogs & Pinterest-Style Discovery Engine
 * 
 * Provides authentic, first-person traveler journals, on-the-ground experiences,
 * and intelligent visual recommendations for related places worldwide.
 */

import { getDestinationImage } from './placeImages';

export interface DestinationBlogStory {
  title: string;
  subtitle: string;
  author: {
    name: string;
    handle: string;
    avatarUrl: string;
    readTime: string;
    date: string;
  };
  heroQuote: string;
  leadParagraph: string;
  sections: Array<{
    heading: string;
    content: string[];
    highlightBox?: string;
  }>;
  proTips: string[];
  localDishes: Array<{
    name: string;
    description: string;
    mustTryAt?: string;
  }>;
  ratings: {
    scenery: number;
    culture: number;
    food: number;
    adventure: number;
    overall: number;
  };
}

export interface RelatedDestinationPin {
  id: string;
  name: string;
  country: string;
  region: string;
  aspectRatio: 'tall' | 'standard' | 'wide';
  imageUrl: string;
  vibeBadge: string;
  twinType: 'worldwide_twin' | 'regional_sister' | 'hidden_counterpart';
  matchScore: number; // e.g. 98%
  reason: string;
  estimatedBudget: string;
  bestMonths: string;
  tags: string[];
}

// -------------------------------------------------------------
// Curated Authentic Travel Blogs for Flagship Destinations
// -------------------------------------------------------------
const CURATED_STORIES: Record<string, DestinationBlogStory> = {
  Goa: {
    title: 'Salt Spray, Portuguese Chapels & Susegad: The Unhurried Soul of Goa',
    subtitle: 'Beyond the crowded shacks lies a coastal haven of red laterite cliffs, secret estuaries, and slow living.',
    author: {
      name: 'Rohan Mehra',
      handle: '@rohanwanders',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      readTime: '6 min read',
      date: 'Updated September 2026',
    },
    heroQuote:
      '"Goa is not a place you visit on a checklist. It is a slow, sun-warmed rhythm you surrender to—between the clink of feni glasses and the salt breeze whispering through coconut groves."',
    leadParagraph:
      'Most travelers arrive in Goa looking for loud beach parties and midnight neon. But if you take a battered scooter and steer inland at dawn along the Chapora river, Goa rewards you with something far more magical: the fragrance of petrichor on red soil, ancient Portuguese villas with oyster-shell windowpanes, and fishermen untangling hand-woven nets on quiet golden strands.',
    sections: [
      {
        heading: '1. The Morning Ritual: Cycling Through Fontainhas & Divar Island',
        content: [
          'Wake up before the tropical heat builds. In Panaji’s Latin Quarter of Fontainhas, pastel-yellow and indigo facades glow under the early sun. Bakeries here still fire up wood-burning ovens at 6:30 AM to churn out warm poee bread with melted salted butter and spiced chorizo.',
          'Take the free vehicle ferry across the Mandovi river to Divar Island. Here, time has stood completely still. Narrow roads wind past sleepy paddy fields and whitewashed baroque churches with nobody in sight except egrets gliding over the mangroves.',
        ],
        highlightBox:
          'Local Secret: Head to Divar Island around 4:30 PM. The ferry crossing during sunset turns the water into liquid amber, with zero commercial tourist bustle.',
      },
      {
        heading: '2. The Coastline: From Morjim Sand Dunes to Cabo de Rama',
        content: [
          'In North Goa, escape the Baga-Calangute traffic by riding further north towards Ashwem and Mandrem. Here, the sands are vast and uncluttered, perfect for barefoot runs and cold tender coconut water.',
          'In South Goa, Cabo de Rama fort perches atop a dramatic cliff plunging into turquoise waves. Sitting on the ramparts while the Arabian Sea crashes below gives you the sense of standing at the very edge of the subcontinent.',
        ],
      },
      {
        heading: '3. What It Actually Feels Like on the Ground',
        content: [
          'The real luxury of Goa is "Susegad"—the cultural philosophy of relaxed contentment. You sit under a thatched shack, listen to vintage jazz or acoustic Konkani melodies, watch the tides turn, and realize that checking emails can wait another day.',
        ],
      },
    ],
    proTips: [
      'Rent a standard 125cc scooter (₹350–₹500/day) for maximum freedom through village backroads.',
      'Skip the crowded daytime boat cruises on the Mandovi; instead, rent a kayak in the Nerul backwaters at sunrise.',
      'Always carry cash or UPI; beach shacks and village bakeries occasionally experience spotty cellular card machines.',
      'Best travel window is October through March for breezy evenings and clear blue skies.',
    ],
    localDishes: [
      {
        name: 'Prawn Balchão with Poee',
        description: 'Fiery, tangy shrimp cooked in toddy vinegar, dried red chilies, and aromatic spices stuffed into warm Goan bread.',
        mustTryAt: 'Vinayak Family Restaurant, Assagao',
      },
      {
        name: 'Fish Thali with Kingfish Rava Fry',
        description: 'Crisp semolina-crusted fresh catch served with sol kadhi, kismoor, and red rice.',
        mustTryAt: 'Ritz Classic, Panaji',
      },
      {
        name: 'Bebinca & Feni Cocktails',
        description: 'Layered coconut milk pudding alongside cashew feni infused with lime and Limca.',
        mustTryAt: 'Joseph Bar, Fontainhas',
      },
    ],
    ratings: {
      scenery: 4.8,
      culture: 4.9,
      food: 5.0,
      adventure: 4.5,
      overall: 4.8,
    },
  },

  Manali: {
    title: 'Pine Whispers & Snowy Passes: An Explorer’s Guide to the Beas Valley',
    subtitle: 'From bohemian cedar-wood cafes in Old Manali to the high-altitude solitude of Rohtang and Solang.',
    author: {
      name: 'Aanya Sharma',
      handle: '@aanya_peaks',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      readTime: '5 min read',
      date: 'Updated September 2026',
    },
    heroQuote:
      '"Standing on the ridges above Old Manali with a mug of steaming ginger-lemon honey tea, watching the clouds part to reveal the Pir Panjal glaciated peaks—that is where the noise of the world stops."',
    leadParagraph:
      'Manali is often labeled merely as a honeymoon hill station, but step across the cobblestone bridge into Old Manali and the atmosphere transforms completely. Surrounded by century-old deodar trees, traditional Himachali stone houses, and rushing glacial streams, this mountain valley offers a potent mix of quiet alpine solitude and thrilling Himalayan adventure.',
    sections: [
      {
        heading: '1. Old Manali & The Hidden Trail to Jogini Falls',
        content: [
          'Ditch the congested Mall Road. Instead, wake up early and hike from Vashisht village through apple orchards and pine woods toward Jogini Waterfall. The trail is gentle, fragrant with wild sage, and rewards you with cascading glacial water crashing down mossy boulders.',
          'After the hike, stop at a hillside cafe in Old Manali for fresh trout sizzlers, apple crumble, and freshly brewed French press coffee while listening to the Beas river thunder below.',
        ],
        highlightBox:
          'Pro Trekker Tip: Hike to Jogini Falls between 7:30 AM and 9:00 AM before the daytime day-tripper crowds arrive. You will have the entire waterfall basin to yourself.',
      },
      {
        heading: '2. Across the Atal Tunnel into Lahaul Solitude',
        content: [
          'The modern Atal Tunnel has revolutionized access to the trans-Himalayan desert of Lahaul. In just 15 minutes of driving under the Rohtang ridge, you emerge from lush green deodar valleys into a dramatic, windswept lunar landscape of Sissu and Khoksar.',
          'In Sissu, the majestic Palden Lhamo waterfall drops hundreds of feet from hanging glaciers right across a serene weeping-willow meadow.',
        ],
      },
    ],
    proTips: [
      'Stay in Old Manali or Vashisht rather than New Manali for genuine tranquility and bohemian mountain cafes.',
      'Book your Rohtang Pass permit at least 3 days in advance if you plan to ascend during summer peak months.',
      'Pack layered clothing: mornings can be 8°C while afternoons in the sun easily reach 22°C.',
    ],
    localDishes: [
      {
        name: 'Himachali Siddu with Ghee',
        description: 'Steamed wheat flour dough stuffed with spiced walnuts, poppy seeds, and dipped in piping hot clarified butter.',
        mustTryAt: 'Café 1947, Old Manali',
      },
      {
        name: 'Himalayan River Trout',
        description: 'Pan-fried fresh trout with mountain herbs and butter lemon glaze.',
        mustTryAt: 'Johnson’s Café, Circuit House Road',
      },
      {
        name: 'Thukpa & Steamed Tingmo',
        description: 'Tibetan vegetable broth loaded with handmade pulled noodles and fluffy steamed bread.',
        mustTryAt: 'Tenzin Dhaba, Vashisht',
      },
    ],
    ratings: {
      scenery: 4.9,
      culture: 4.6,
      food: 4.7,
      adventure: 5.0,
      overall: 4.8,
    },
  },

  Kerala: {
    title: 'Drifting Through Emerald Waters: The Slow Magic of God’s Own Country',
    subtitle: 'Waking up on a wooden houseboat to mist over lotus leaves, spice-laden hills, and ayurvedic calm.',
    author: {
      name: 'Dr. Siddharth Nair',
      handle: '@siddharth_travels',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      readTime: '7 min read',
      date: 'Updated September 2026',
    },
    heroQuote:
      '"The rhythm of Kerala is the gentle stroke of an oarsman on still green water, accompanied by the fragrance of cardamom and roasted coconut sizzling in clay pots."',
    leadParagraph:
      'Nowhere else in the world does water and life intertwine as poetically as the Kerala backwaters. In Alleppey and Kumarakom, an intricate maze of canals, lakes, and palm-shaded lagoons creates an ecosystem where children take canoes to school and postal carriers deliver letters by boat. Combine this with the cool, rolling tea estates of Munnar, and Kerala is an antidote to modern frenzy.',
    sections: [
      {
        heading: '1. Life Along the Canal Banks: The Real Houseboat Experience',
        content: [
          'Choose a traditional thatched Kettuvallam crafted without a single iron nail, lashed together with coir rope. As your boat glides past duck farms and village landings, the crew prepares lunch: Karimeen Pollichathu (pearl spot fish marinated in shallots, ginger, and curry leaves, wrapped in a charred banana leaf).',
          'At dusk, when the engines are switched off and the boat moors near a quiet paddy field, a million fireflies illuminate the water.',
        ],
      },
      {
        heading: '2. Munnar: The High Mountain Mist & Tea Horizons',
        content: [
          'Drive three hours inland and the humid tropical air yields to cool mountain fog. Munnar’s endless velvet-green tea carpets roll across slopes reaching up to Anamudi, South India’s highest peak. Wandering through the plantations at dawn while tea pickers sing folk rhythms is unforgettable.',
        ],
      },
    ],
    proTips: [
      'Book a private government-licensed green-palm houseboat rather than day ferries for an authentic overnight stay.',
      'Visit a spice plantation in Thekkady to witness real vanilla, nutmeg, cinnamon, and black pepper growing on vines.',
      'Keep lightweight rain gear handy regardless of season—coastal tropical showers can roll in delightfully unannounced.',
    ],
    localDishes: [
      {
        name: 'Karimeen Pollichathu',
        description: 'Freshwater pearl spot fish roasted inside a banana leaf with fiery coconut-shallot masala.',
        mustTryAt: 'Heritage Houseboat Kitchen, Vembanad Lake',
      },
      {
        name: 'Appam with Vegetable Stew',
        description: 'Lacy, fermented rice crepes with a soft pillowy center dipped in rich coconut milk broth infused with whole spices.',
        mustTryAt: 'Dhe Puttu, Kochi',
      },
    ],
    ratings: {
      scenery: 5.0,
      culture: 4.8,
      food: 4.9,
      adventure: 4.4,
      overall: 4.9,
    },
  },

  Rajasthan: {
    title: 'Fortresses of Sandstone & Gold: Walking Through Royal Legends',
    subtitle: 'Desert starlight in Jaisalmer, blue alleys in Jodhpur, and pink royal courtyards in Jaipur.',
    author: {
      name: 'Priyanka Rathore',
      handle: '@priyanka_explores',
      avatarUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=150&q=80',
      readTime: '6 min read',
      date: 'Updated September 2026',
    },
    heroQuote:
      '"Every stone in Rajasthan holds a song, a sword, or a love story. You do not merely see these forts—they command you to pause and listen to centuries of echo."',
    leadParagraph:
      'Rajasthan is visual drama on an epic scale. Here, colossal hill forts rise like natural rock outcroppings, lake palaces float miraculously on mirrored waters, and brightly dyed turbans and mirror-work dupattas stand out against golden desert sands.',
    sections: [
      {
        heading: '1. The Golden Citadel of Jaisalmer',
        content: [
          'Unlike any other fortress in Asia, the Sonar Qila (Golden Fort) of Jaisalmer is a living citadel where a quarter of the old city still resides inside its 99 bastions. Walk through the labyrinth of carved jharokha balconies, stop for saffron lassi in terracotta kulhads, and watch the yellow sandstone turn amber at sundown.',
        ],
      },
    ],
    proTips: [
      'Travel between October and March when desert days are sunny and nights are crisply cool.',
      'Hire a licensed local storyteller guide at Mehrangarh Fort and Amber Fort; the oral history brings every hall to life.',
    ],
    localDishes: [
      {
        name: 'Dal Baati Churma',
        description: 'Hard wheat flour dumplings baked over embers, broken into piping hot spiced lentils, and smothered in pure desi ghee.',
      },
      {
        name: 'Laal Maas',
        description: 'Royal lamb curry slow-cooked with fiery Mathania red chilies and smoked charcoal.',
      },
    ],
    ratings: {
      scenery: 4.8,
      culture: 5.0,
      food: 4.8,
      adventure: 4.7,
      overall: 4.9,
    },
  },
};

// Generic Fallback Story Generator for any destination from database
export function generateGenericBlogStory(destName: string, tagline?: string, desc?: string): DestinationBlogStory {
  const cleanName = destName || 'This Destination';
  const cleanTagline = tagline || 'A breathtaking sanctuary waiting to be experienced.';
  const cleanDesc = desc || `Discover the vibrant culture, awe-inspiring landmarks, and unforgettable hospitality of ${cleanName}.`;

  return {
    title: `Journeys into ${cleanName}: Sights, Soul & Authentic Ground Truths`,
    subtitle: cleanTagline,
    author: {
      name: 'GoFlexi Field Collective',
      handle: '@goflexi_dispatch',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      readTime: '5 min read',
      date: 'Season 2026 Guide',
    },
    heroQuote: `"${cleanName} has a way of lingering in your mind long after your luggage is unpacked. The sights stir your senses, but it is the warmth of the people and the unscripted moments that truly captivate you."`,
    leadParagraph: `${cleanDesc} Whether you are wandering through morning bazaars, exploring centuries-old viewpoints, or conversing with local craftsmen over fresh tea, this region offers an authentic escape from routine.`,
    sections: [
      {
        heading: `1. The Sights & Morning Mood in ${cleanName}`,
        content: [
          `The best time to experience ${cleanName} is during the early morning golden hour. As mist or sunlight sweeps across the landscape, neighborhood tea stalls open their shutters and the genuine rhythm of everyday life begins.`,
          `Strolling through historic avenues before peak tourist hours reveals intricate architecture and quiet vantage points that casual weekend visitors often overlook entirely.`,
        ],
        highlightBox: `Curator Note: Allow yourself at least half a day with zero itinerary. The most memorable encounters in ${cleanName} happen when you wander down a side alley without a map.`,
      },
      {
        heading: '2. Experiencing the Culture on the Ground',
        content: [
          `Engaging with local shopkeepers, guides, and artisans offers far deeper perspective than viewing landmarks from afar. The traditions here are passed down through generations, visible in everything from street cuisine to courtyard music.`,
        ],
      },
    ],
    proTips: [
      'Rise early to visit iconic scenic viewpoints before tourist buses arrive.',
      'Support local family-run eateries and sustainable homestays wherever possible.',
      'Check local seasonal weather patterns to pack appropriate lightweight or insulated layers.',
    ],
    localDishes: [
      {
        name: `Signature Regional Delicacies of ${cleanName}`,
        description: 'Traditional slow-cooked preparations seasoned with heirloom spices and locally harvested seasonal ingredients.',
      },
      {
        name: 'Street Corner Chai & Artisanal Snacks',
        description: 'Freshly brewed spice tea paired with hot local savories served in traditional clay cups.',
      },
    ],
    ratings: {
      scenery: 4.8,
      culture: 4.7,
      food: 4.6,
      adventure: 4.5,
      overall: 4.7,
    },
  };
}

export function getDestinationBlog(name: string, fallbackDesc?: string, tagline?: string): DestinationBlogStory {
  const key = Object.keys(CURATED_STORIES).find(
    (k) => k.toLowerCase() === name.trim().toLowerCase()
  );

  if (key && CURATED_STORIES[key]) {
    return CURATED_STORIES[key];
  }

  return generateGenericBlogStory(name, tagline, fallbackDesc);
}

// -------------------------------------------------------------
// Pinterest-Style Visual Recommender & Worldwide Twins Engine
// -------------------------------------------------------------
export function getRelatedDestinations(currentDestName: string): RelatedDestinationPin[] {
  const norm = currentDestName.toLowerCase().trim();

  // 1. Coastal / Beach Archetype (Goa, Gokarna, Varkala, Kovalam, Andaman, etc.)
  if (
    norm.includes('goa') ||
    norm.includes('beach') ||
    norm.includes('coast') ||
    norm.includes('gokarna') ||
    norm.includes('varkala') ||
    norm.includes('andaman') ||
    norm.includes('puri') ||
    norm.includes('pondicherry')
  ) {
    return [
      {
        id: 'pin-bali',
        name: 'Bali',
        country: 'Indonesia',
        region: 'Southeast Asia',
        aspectRatio: 'tall',
        imageUrl: getDestinationImage('bali'),
        vibeBadge: 'Tropical Bohemian & Surf',
        twinType: 'worldwide_twin',
        matchScore: 98,
        reason: 'Shares Goa’s laid-back beach shack culture, cliffside temples, world-class sunsets, and coastal cafes.',
        estimatedBudget: '₹45,000 – ₹75,000',
        bestMonths: 'Apr - Oct',
        tags: ['Beaches', 'Nightlife', 'Surfing', 'Cafes'],
      },
      {
        id: 'pin-gokarna',
        name: 'Gokarna',
        country: 'India',
        region: 'Karnataka',
        aspectRatio: 'standard',
        imageUrl: getDestinationImage('gokarna'),
        vibeBadge: 'Untamed Coastal Solitude',
        twinType: 'regional_sister',
        matchScore: 95,
        reason: 'The quieter sister of Goa with pristine Om Beach, cliffside trekking trails, and serene coastal sunsets.',
        estimatedBudget: '₹12,000 – ₹28,000',
        bestMonths: 'Oct - Mar',
        tags: ['Trekking', 'Beaches', 'Temples', 'Relaxation'],
      },
      {
        id: 'pin-amalfi',
        name: 'Amalfi Coast',
        country: 'Italy',
        region: 'Mediterranean',
        aspectRatio: 'tall',
        imageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
        vibeBadge: 'Cliffside Mediterranean Dream',
        twinType: 'worldwide_twin',
        matchScore: 92,
        reason: 'Pastel cliff villages overlooking azure waters—the European Mediterranean counterpart to tropical coastal vistas.',
        estimatedBudget: '₹1,20,000 – ₹2,40,000',
        bestMonths: 'May - Sep',
        tags: ['Scenic Coast', 'Luxury', 'Seafood', 'Architecture'],
      },
      {
        id: 'pin-varkala',
        name: 'Varkala',
        country: 'India',
        region: 'Kerala',
        aspectRatio: 'wide',
        imageUrl: getDestinationImage('varkala'),
        vibeBadge: 'Red Laterite Cliffs & Shacks',
        twinType: 'regional_sister',
        matchScore: 94,
        reason: 'Dramatic red sandstone cliffs towering directly over the Arabian Sea with bohemian rooftop cafes.',
        estimatedBudget: '₹15,000 – ₹32,000',
        bestMonths: 'Nov - Feb',
        tags: ['Cliffside', 'Ayurveda', 'Sunset', 'Beaches'],
      },
      {
        id: 'pin-phuket',
        name: 'Phuket & Krabi',
        country: 'Thailand',
        region: 'Andaman Sea',
        aspectRatio: 'tall',
        imageUrl: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80',
        vibeBadge: 'Emerald Bays & Island Hopping',
        twinType: 'worldwide_twin',
        matchScore: 96,
        reason: 'Limestone karsts jutting out of turquoise seas, vibrant night markets, and vibrant beach lifestyle.',
        estimatedBudget: '₹35,000 – ₹65,000',
        bestMonths: 'Nov - Apr',
        tags: ['Islands', 'Snorkeling', 'Nightlife', 'Boat Tours'],
      },
      {
        id: 'pin-andaman',
        name: 'Havelock (Andaman)',
        country: 'India',
        region: 'Bay of Bengal',
        aspectRatio: 'standard',
        imageUrl: getDestinationImage('andaman'),
        vibeBadge: 'Pristine Coral Lagoons',
        twinType: 'hidden_counterpart',
        matchScore: 93,
        reason: 'Radhanagar Beach’s powdery white sand, bioluminescent night kayaking, and world-class scuba diving.',
        estimatedBudget: '₹35,000 – ₹68,000',
        bestMonths: 'Oct - May',
        tags: ['Coral Reefs', 'Scuba', 'Rainforest', 'Islands'],
      },
    ];
  }

  // 2. Alpine / Mountain Archetype (Manali, Shimla, Kashmir, Spiti, Ladakh, etc.)
  if (
    norm.includes('manali') ||
    norm.includes('kashmir') ||
    norm.includes('shimla') ||
    norm.includes('ladakh') ||
    norm.includes('spiti') ||
    norm.includes('sikkim') ||
    norm.includes('auli') ||
    norm.includes('mountain') ||
    norm.includes('snow') ||
    norm.includes('himalaya')
  ) {
    return [
      {
        id: 'pin-switzerland',
        name: 'Swiss Alps (Zermatt)',
        country: 'Switzerland',
        region: 'Central Europe',
        aspectRatio: 'tall',
        imageUrl: getDestinationImage('switzerland'),
        vibeBadge: 'Matterhorn Alpine Majesty',
        twinType: 'worldwide_twin',
        matchScore: 97,
        reason: 'The global standard for snow-capped peaks, alpine wooden chalets, scenic mountain trains, and pristine air.',
        estimatedBudget: '₹1,50,000 – ₹3,20,000',
        bestMonths: 'Dec - Mar / Jun - Sep',
        tags: ['Snow Peaks', 'Skiing', 'Alpine Lakes', 'Glaciers'],
      },
      {
        id: 'pin-kashmir',
        name: 'Gulmarg & Pahalgam',
        country: 'India',
        region: 'Kashmir',
        aspectRatio: 'standard',
        imageUrl: getDestinationImage('kashmir'),
        vibeBadge: 'Meadow of Flowers & Gondola',
        twinType: 'regional_sister',
        matchScore: 98,
        reason: 'Often heralded as "Paradise on Earth"—pine-scented valleys, world’s highest cable cars, and Shikara houseboats.',
        estimatedBudget: '₹28,000 – ₹55,000',
        bestMonths: 'Dec - Apr (Snow) / May - Sep (Green)',
        tags: ['Gondola', 'Snow', 'Houseboats', 'Valleys'],
      },
      {
        id: 'pin-queenstown',
        name: 'Queenstown',
        country: 'New Zealand',
        region: 'Southern Alps',
        aspectRatio: 'tall',
        imageUrl: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80',
        vibeBadge: 'Adventure Capital of the World',
        twinType: 'worldwide_twin',
        matchScore: 94,
        reason: 'Dramatic glacier-carved lakes surrounded by rugged peaks, offering bungee jumping, skiing, and hiking.',
        estimatedBudget: '₹1,80,000 – ₹3,50,000',
        bestMonths: 'Dec - Feb (Summer) / Jun - Aug (Snow)',
        tags: ['Adventure', 'Lakes', 'Skyline', 'Hiking'],
      },
      {
        id: 'pin-spiti',
        name: 'Spiti Valley',
        country: 'India',
        region: 'Himachal Pradesh',
        aspectRatio: 'wide',
        imageUrl: getDestinationImage('spiti'),
        vibeBadge: 'High-Altitude Cold Desert',
        twinType: 'hidden_counterpart',
        matchScore: 93,
        reason: '1000-year-old cliffside monasteries, lunar valleys, and the most crystal-clear stargazing skies in Asia.',
        estimatedBudget: '₹22,000 – ₹42,000',
        bestMonths: 'Jun - Sep',
        tags: ['Monasteries', 'Stargazing', 'Biking', 'Adventure'],
      },
      {
        id: 'pin-banff',
        name: 'Banff National Park',
        country: 'Canada',
        region: 'Canadian Rockies',
        aspectRatio: 'tall',
        imageUrl: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=800&q=80',
        vibeBadge: 'Turquoise Glacial Lakes',
        twinType: 'worldwide_twin',
        matchScore: 95,
        reason: 'Towering limestone pinnacles reflecting into mirror-like turquoise waters of Lake Louise and Moraine Lake.',
        estimatedBudget: '₹1,60,000 – ₹3,00,000',
        bestMonths: 'Jun - Sep',
        tags: ['National Parks', 'Glaciers', 'Wildlife', 'Canoeing'],
      },
      {
        id: 'pin-sikkim',
        name: 'Sikkim & Pelling',
        country: 'India',
        region: 'Eastern Himalayas',
        aspectRatio: 'standard',
        imageUrl: getDestinationImage('sikkim'),
        vibeBadge: 'Kangchenjunga Horizons',
        twinType: 'regional_sister',
        matchScore: 92,
        reason: 'Unobstructed morning views of the world’s third-highest peak, ancient Buddhist chortens, and rhododendron forests.',
        estimatedBudget: '₹24,000 – ₹48,000',
        bestMonths: 'Mar - May / Oct - Dec',
        tags: ['Monasteries', 'Trekking', 'Scenic Passes', 'Peace'],
      },
    ];
  }

  // 3. Heritage / Royal / Desert / Culture Archetype (Rajasthan, Jaipur, Udaipur, Varanasi, Hampi, etc.)
  if (
    norm.includes('rajasthan') ||
    norm.includes('jaipur') ||
    norm.includes('udaipur') ||
    norm.includes('jodhpur') ||
    norm.includes('jaisalmer') ||
    norm.includes('varanasi') ||
    norm.includes('hampi') ||
    norm.includes('heritage') ||
    norm.includes('fort') ||
    norm.includes('palace')
  ) {
    return [
      {
        id: 'pin-marrakech',
        name: 'Marrakech & Sahara',
        country: 'Morocco',
        region: 'North Africa',
        aspectRatio: 'tall',
        imageUrl: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=800&q=80',
        vibeBadge: 'Ochre Palaces & Desert Dunes',
        twinType: 'worldwide_twin',
        matchScore: 97,
        reason: 'Mirrors Jaisalmer and Jaipur with sand-hued Medina walls, lantern-lit riads, spice bazaars, and starlit camel camps.',
        estimatedBudget: '₹95,000 – ₹1,80,000',
        bestMonths: 'Oct - Apr',
        tags: ['Desert', 'Souks', 'Palaces', 'Architecture'],
      },
      {
        id: 'pin-udaipur',
        name: 'Udaipur',
        country: 'India',
        region: 'Rajasthan',
        aspectRatio: 'standard',
        imageUrl: getDestinationImage('udaipur'),
        vibeBadge: 'City of Lakes & White Marble',
        twinType: 'regional_sister',
        matchScore: 99,
        reason: 'Float past Lake Pichola’s floating palaces under the dramatic Aravalli mountain backdrops.',
        estimatedBudget: '₹22,000 – ₹55,000',
        bestMonths: 'Oct - Mar',
        tags: ['Lakes', 'Romance', 'Palaces', 'History'],
      },
      {
        id: 'pin-kyoto',
        name: 'Kyoto',
        country: 'Japan',
        region: 'Kansai',
        aspectRatio: 'tall',
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
        vibeBadge: 'Ancient Shrines & Zen Gardens',
        twinType: 'worldwide_twin',
        matchScore: 91,
        reason: 'Thousands of preserved wooden temples, peaceful bamboo groves, and rich imperial ceremonial heritage.',
        estimatedBudget: '₹1,20,000 – ₹2,40,000',
        bestMonths: 'Mar - May / Oct - Nov',
        tags: ['Shrines', 'Culture', 'Gardens', 'Culinary'],
      },
      {
        id: 'pin-hampi',
        name: 'Hampi',
        country: 'India',
        region: 'Karnataka',
        aspectRatio: 'wide',
        imageUrl: getDestinationImage('hampi'),
        vibeBadge: 'Surreal Boulder Empire',
        twinType: 'hidden_counterpart',
        matchScore: 94,
        reason: 'A UNESCO World Heritage marvel where grand 15th-century Vijayanagara ruins rise from giant volcanic boulder hills.',
        estimatedBudget: '₹14,000 – ₹30,000',
        bestMonths: 'Nov - Feb',
        tags: ['Ruins', 'Architecture', 'Sunsets', 'History'],
      },
      {
        id: 'pin-varanasi',
        name: 'Varanasi',
        country: 'India',
        region: 'Uttar Pradesh',
        aspectRatio: 'standard',
        imageUrl: getDestinationImage('varanasi'),
        vibeBadge: 'Eternal Spiritual Riverbank',
        twinType: 'regional_sister',
        matchScore: 92,
        reason: 'Dawn boat rides along the sacred Ganges ghats with evening aarti bells ringing through millennia of continuous history.',
        estimatedBudget: '₹12,000 – ₹26,000',
        bestMonths: 'Oct - Mar',
        tags: ['Spiritual', 'Ghats', 'Boat Rides', 'Culture'],
      },
    ];
  }

  // 4. Lush Nature / Rainforest / Backwaters Archetype (Kerala, Meghalaya, Coorg, Wayanad, Munnar, etc.)
  return [
    {
      id: 'pin-halong',
      name: 'Ha Long Bay',
      country: 'Vietnam',
      region: 'Gulf of Tonkin',
      aspectRatio: 'tall',
      imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
      vibeBadge: 'Emerald Waters & Limestone Towers',
      twinType: 'worldwide_twin',
      matchScore: 96,
      reason: 'Drift on wooden junk boats through calm emerald waters beneath ancient karst islands—the global twin to peaceful waterways.',
      estimatedBudget: '₹40,000 – ₹72,000',
      bestMonths: 'Oct - Apr',
      tags: ['Cruises', 'Caves', 'Emerald Water', 'Nature'],
    },
    {
      id: 'pin-meghalaya',
      name: 'Meghalaya (Cherrapunji)',
      country: 'India',
      region: 'Northeast India',
      aspectRatio: 'standard',
      imageUrl: getDestinationImage('meghalaya'),
      vibeBadge: 'Abode of Clouds & Living Bridges',
      twinType: 'regional_sister',
      matchScore: 97,
      reason: 'Dense rainforests, biological double-decker living root bridges, and crystal-clear Umngot river in Dawki.',
      estimatedBudget: '₹22,000 – ₹45,000',
      bestMonths: 'Oct - Apr',
      tags: ['Waterfalls', 'Living Bridges', 'Caves', 'Trekking'],
    },
    {
      id: 'pin-bali-ubud',
      name: 'Ubud (Bali)',
      country: 'Indonesia',
      region: 'Central Bali',
      aspectRatio: 'tall',
      imageUrl: getDestinationImage('bali'),
      vibeBadge: 'Lush Jungle & Stepped Rice Terraces',
      twinType: 'worldwide_twin',
      matchScore: 95,
      reason: 'Cascading Tegallalang green rice terraces, sacred monkey forests, artisan workshops, and morning yoga shalas.',
      estimatedBudget: '₹42,000 – ₹78,000',
      bestMonths: 'Apr - Oct',
      tags: ['Jungle', 'Rice Terraces', 'Wellness', 'Culture'],
    },
    {
      id: 'pin-coorg',
      name: 'Coorg (Madikeri)',
      country: 'India',
      region: 'Western Ghats',
      aspectRatio: 'wide',
      imageUrl: getDestinationImage('coorg'),
      vibeBadge: 'Coffee Plantations & Mist',
      twinType: 'regional_sister',
      matchScore: 93,
      reason: 'Aromas of freshly roasted arabica, emerald misty hills, cascading Abbey Falls, and rich Kodava heritage.',
      estimatedBudget: '₹14,000 – ₹32,000',
      bestMonths: 'Oct - Mar',
      tags: ['Coffee', 'Plantations', 'Mist', 'Waterfalls'],
    },
    {
      id: 'pin-kerala-backwaters',
      name: 'Alleppey & Kumarakom',
      country: 'India',
      region: 'Kerala',
      aspectRatio: 'standard',
      imageUrl: getDestinationImage('kerala'),
      vibeBadge: 'Venice of the East',
      twinType: 'regional_sister',
      matchScore: 98,
      reason: 'Slumber on traditional thatched houseboats as egrets take flight over vast backwater canals and coconut groves.',
      estimatedBudget: '₹18,000 – ₹38,000',
      bestMonths: 'Sep - Mar',
      tags: ['Houseboats', 'Backwaters', 'Ayurveda', 'Food'],
    },
  ];
}
