"""
GoFlexi Personalized Destination Recommendation Engine (Phase 5)
Deterministic, content-based recommendation service matching traveler preferences
against the Destination Knowledge Base stored in Neon PostgreSQL.

Pipeline:
1. Traveler Preferences & Candidate Retrieval
2. Hard Compatibility Filtering (transport, companion, extreme budget/style mismatches)
3. Normalized Feature Matching (Places, Experiences, Budget, Style, Companion, Transport, Pace, Season)
4. Centralized Weighted Scoring
5. Diversity Handling & Deterministic Ranking
6. Hallucination-free Natural-Language Explanation Generation
"""

import uuid
from datetime import datetime
from typing import List, Dict, Set, Optional, Tuple

from app.models.traveler_profile import TravelerProfile
from app.models.destination import Destination
from app.schemas.recommendation import RecommendationItem, RecommendationResponse

# ==============================================================================
# 1. CENTRALIZED WEIGHTING CONFIGURATION (Must sum to 1.00)
# ==============================================================================
FEATURE_WEIGHTS: Dict[str, float] = {
    "place": 0.35,          # 35% Interest / Place Tag Match
    "experience": 0.20,     # 20% Experience Match
    "budget": 0.15,         # 15% Budget Compatibility
    "travel_style": 0.10,   # 10% Travel Style Match
    "companion": 0.07,      #  7% Companion Match
    "transport": 0.05,      #  5% Transport Match
    "pace": 0.03,           #  3% Itinerary Pace Match
    "season": 0.05,         #  5% Season Match
}

# ==============================================================================
# 2. VOCABULARY & TIER MAPPINGS
# ==============================================================================
BUDGET_TIERS: Dict[str, int] = {
    "under ₹10,000": 1,
    "under ₹10k": 1,
    "₹10,000 – ₹25,000": 2,
    "₹10,000 - ₹25,000": 2,
    "₹10k–₹25k": 2,
    "₹10k-₹25k": 2,
    "₹25,000 – ₹50,000": 3,
    "₹25,000 - ₹50,000": 3,
    "₹25k–₹50k": 3,
    "₹25k-₹50k": 3,
    "₹50,000 – ₹1,00,000": 4,
    "₹50,000 - ₹1,00,000": 4,
    "₹50k–₹1l": 4,
    "₹50k-₹1l": 4,
    "₹1,00,000+": 5,
    "₹1l+": 5,
}

STYLE_TIERS: Dict[str, int] = {
    "budget": 1,
    "balanced": 2,
    "premium": 3,
    "luxury": 4,
}

PACE_TIERS: Dict[str, int] = {
    "relaxed": 1,
    "balanced": 2,
    "packed": 3,
}


def get_budget_tier(budget_str: Optional[str]) -> Optional[int]:
    if not budget_str:
        return None
    cleaned = budget_str.strip().lower()
    return BUDGET_TIERS.get(cleaned)


def get_destination_budget_tier(dest: Destination) -> int:
    """Estimates budget tier from destination budget_min, budget_max, and travel styles."""
    avg_budget = (dest.budget_min + dest.budget_max) / 2.0
    if avg_budget <= 12000:
        return 1
    elif avg_budget <= 25000:
        return 2
    elif avg_budget <= 45000:
        return 3
    elif avg_budget <= 70000:
        return 4
    else:
        return 5


# ==============================================================================
# 3. HARD COMPATIBILITY FILTERING
# ==============================================================================
def is_destination_compatible(
    dest: Destination,
    user_transports: Set[str],
    user_companion: str,
    user_style: str,
    user_budget_tier: Optional[int],
) -> bool:
    """
    Performs hard compatibility filtering.
    Does not aggressively eliminate destinations if metadata is missing (missing = neutral).
    Returns True if compatible, False if incompatible.
    """
    # 1. Transport Compatibility
    # If user selected Flexible (or empty), always compatible
    if user_transports and "Flexible" not in user_transports:
        dest_transports = {t.transport_type for t in dest.transport_options}
        if dest_transports and not (user_transports & dest_transports):
            # Destination has transport metadata, but NONE match user's chosen transports
            return False

    # 2. Companion Compatibility
    if user_companion:
        dest_companions = {c.companion_type for c in dest.companions}
        if dest_companions and user_companion not in dest_companions:
            return False

    # 3. Extreme Budget / Style Mismatch
    # If user is strict Budget (Tier 1) and destination only supports Luxury with min budget >= 40000
    if user_budget_tier == 1 and dest.budget_min >= 40000:
        dest_styles = {s.travel_style for s in dest.travel_styles}
        if dest_styles and "Budget" not in dest_styles and "Balanced" not in dest_styles:
            return False

    # If user is Luxury (Tier 5) and destination has maximum budget under 8000 with only Budget style
    if user_budget_tier == 5 and dest.budget_max > 0 and dest.budget_max <= 8000:
        dest_styles = {s.travel_style for s in dest.travel_styles}
        if dest_styles and "Luxury" not in dest_styles and "Premium" not in dest_styles:
            return False

    return True


# ==============================================================================
# 4. NORMALIZED FEATURE MATCHING & SCORING
# ==============================================================================
def calculate_place_score(user_places: Set[str], dest_places: Set[str]) -> Tuple[float, List[str]]:
    """Calculates place overlap score (0.0 to 1.0) and lists matched place names."""
    if not user_places:
        return 0.5, []  # Neutral
    if not dest_places:
        return 0.5, []  # Missing metadata = neutral

    matched = sorted(list(user_places & dest_places))
    if not matched:
        return 0.0, []

    # Score rewards overlap percentage with a strong baseline for any match
    overlap_ratio = len(matched) / len(user_places)
    score = 0.5 + (0.5 * overlap_ratio)
    return score, matched


def calculate_experience_score(user_experiences: Set[str], dest_experiences: Set[str]) -> Tuple[float, List[str]]:
    """Calculates experience overlap score (0.0 to 1.0) and lists matched experience names."""
    if not user_experiences:
        return 0.5, []
    if not dest_experiences:
        return 0.5, []

    matched = sorted(list(user_experiences & dest_experiences))
    if not matched:
        return 0.0, []

    overlap_ratio = len(matched) / len(user_experiences)
    score = 0.5 + (0.5 * overlap_ratio)
    return score, matched


def calculate_budget_score(user_budget_tier: Optional[int], dest: Destination) -> float:
    """Calculates budget score based on tier distance."""
    if user_budget_tier is None:
        return 0.5

    dest_tier = get_destination_budget_tier(dest)
    distance = abs(user_budget_tier - dest_tier)

    if distance == 0:
        return 1.0
    elif distance == 1:
        return 0.8
    elif distance == 2:
        return 0.5
    elif distance == 3:
        return 0.2
    else:
        return 0.0


def calculate_travel_style_score(user_style: str, dest_styles: Set[str]) -> Tuple[float, Optional[str]]:
    """Calculates travel style score (0.0 to 1.0)."""
    if not user_style:
        return 0.5, None
    if not dest_styles:
        return 0.5, None

    if user_style in dest_styles:
        return 1.0, user_style

    user_tier = STYLE_TIERS.get(user_style.lower(), 2)
    min_distance = 10
    for s in dest_styles:
        st_tier = STYLE_TIERS.get(s.lower(), 2)
        min_distance = min(min_distance, abs(user_tier - st_tier))

    if min_distance == 1:
        return 0.7, None
    elif min_distance == 2:
        return 0.4, None
    else:
        return 0.1, None


def calculate_companion_score(user_companion: str, dest_companions: Set[str]) -> Tuple[float, Optional[str]]:
    """Calculates companion score (0.0 to 1.0)."""
    if not user_companion:
        return 0.5, None
    if not dest_companions:
        return 0.5, None

    if user_companion in dest_companions:
        return 1.0, user_companion
    return 0.2, None


def calculate_transport_score(user_transports: Set[str], dest_transports: Set[str]) -> Tuple[float, List[str]]:
    """Calculates transport score (0.0 to 1.0)."""
    if not user_transports or "Flexible" in user_transports:
        return 1.0, ["Flexible Transport"]
    if not dest_transports:
        return 0.5, []

    matched = sorted(list(user_transports & dest_transports))
    if matched:
        ratio = len(matched) / len(user_transports)
        score = 0.7 + (0.3 * ratio)
        return score, matched
    return 0.2, []


def calculate_pace_score(user_pace: str, dest_paces: Set[str]) -> Tuple[float, Optional[str]]:
    """Calculates itinerary pace score (0.0 to 1.0)."""
    if not user_pace:
        return 0.5, None
    if not dest_paces:
        return 0.5, None

    if user_pace in dest_paces:
        return 1.0, user_pace

    user_tier = PACE_TIERS.get(user_pace.lower(), 2)
    min_dist = 10
    for p in dest_paces:
        pt_tier = PACE_TIERS.get(p.lower(), 2)
        min_dist = min(min_dist, abs(user_tier - pt_tier))

    if min_dist == 1:
        return 0.6, None
    return 0.2, None


def calculate_season_score(dest: Destination) -> float:
    """
    Calculates season score (0.0 to 1.0).
    In Phase 5, the traveler profile does not yet record travel dates/months.
    Per PART 14 specification:
    Season score is neutral (0.5) until specific travel dates are added in a future phase.
    """
    return 0.5


# ==============================================================================
# 5. DETERMINISTIC EXPLANATION GENERATION
# ==============================================================================
def generate_explanation(
    dest_name: str,
    matched_places: List[str],
    matched_experiences: List[str],
    matched_style: Optional[str],
    matched_companion: Optional[str],
    matched_transports: List[str],
    matched_pace: Optional[str],
) -> str:
    """
    Generates a natural-language, deterministic explanation constructed
    strictly from genuinely matched traveler preferences. Never hallucinates.
    """
    clauses = []

    if matched_places and matched_experiences:
        places_str = " and ".join(matched_places)
        exp_str = ", ".join(matched_experiences)
        clauses.append(f"matches your {places_str} landscape preferences with {exp_str} experiences")
    elif matched_places:
        places_str = " and ".join(matched_places)
        clauses.append(f"aligns with your {places_str} landscape preferences")
    elif matched_experiences:
        exp_str = ", ".join(matched_experiences)
        clauses.append(f"features your favored {exp_str} activities")

    if matched_style:
        clauses.append(f"fits your {matched_style} travel style")

    if matched_companion:
        clauses.append(f"ideal for {matched_companion} trips")

    if matched_transports and "Flexible Transport" not in matched_transports:
        tr_str = " or ".join(matched_transports)
        clauses.append(f"accessible via your preferred {tr_str} transit")

    if matched_pace:
        clauses.append(f"complements a {matched_pace} itinerary pace")

    if not clauses:
        return f"A top-rated Indian destination well-suited for your upcoming trip."

    # Join clauses naturally
    explanation = f"Great match: {dest_name} " + ", and ".join(clauses[:3]) + "."
    return explanation


# ==============================================================================
# 6. DIVERSITY HANDLING & FINAL RECOMMENDATION ENGINE
# ==============================================================================
def get_personalized_recommendations(
    profile: Optional[TravelerProfile],
    destinations: List[Destination],
    limit: int = 10,
) -> RecommendationResponse:
    """
    Main entrypoint: executes candidate filtering, feature matching,
    weighted scoring, diversity capping, and explanation generation.
    """
    if not destinations:
        return RecommendationResponse(recommendations=[], total=0, generated_at=datetime.utcnow())

    # Extract user preferences
    user_places: Set[str] = set()
    user_experiences: Set[str] = set()
    user_style: str = ""
    user_companion: str = ""
    user_transports: Set[str] = set()
    user_pace: str = ""
    user_budget_tier: Optional[int] = None

    if profile:
        for interest in profile.interests:
            if interest.interest_type == "place":
                user_places.add(interest.interest_value)
            elif interest.interest_type == "experience":
                user_experiences.add(interest.interest_value)

        user_style = profile.travel_style.strip() if profile.travel_style else ""
        user_companion = profile.companions.strip() if profile.companions else ""
        if profile.transport:
            user_transports = {t.strip() for t in profile.transport.split(",") if t.strip()}
        user_pace = profile.itinerary_pace.strip() if profile.itinerary_pace else ""
        user_budget_tier = get_budget_tier(profile.budget_range)

    # 1. Hard Compatibility Filtering
    compatible_destinations = [
        d for d in destinations
        if is_destination_compatible(
            dest=d,
            user_transports=user_transports,
            user_companion=user_companion,
            user_style=user_style,
            user_budget_tier=user_budget_tier,
        )
    ]

    # Non-aggressive fallback: if hard filtering eliminated everything, fall back to all destinations
    candidates = compatible_destinations if compatible_destinations else destinations

    # 2. Score Candidates
    scored_items: List[Tuple[float, RecommendationItem]] = []

    for dest in candidates:
        dest_places = {t.tag_value for t in dest.tags if t.tag_type == "place"}
        dest_experiences = {t.tag_value for t in dest.tags if t.tag_type == "experience"}
        dest_styles = {s.travel_style for s in dest.travel_styles}
        dest_companions = {c.companion_type for c in dest.companions}
        dest_transports = {t.transport_type for t in dest.transport_options}
        dest_paces = {p.pace for p in dest.paces}

        # Calculate individual feature scores and matches
        place_score, matched_places = calculate_place_score(user_places, dest_places)
        exp_score, matched_exp = calculate_experience_score(user_experiences, dest_experiences)
        budget_score = calculate_budget_score(user_budget_tier, dest)
        style_score, matched_style = calculate_travel_style_score(user_style, dest_styles)
        comp_score, matched_comp = calculate_companion_score(user_companion, dest_companions)
        trans_score, matched_trans = calculate_transport_score(user_transports, dest_transports)
        pace_score, matched_pace = calculate_pace_score(user_pace, dest_paces)
        season_score = calculate_season_score(dest)

        # Weighted final score
        raw_score = (
            place_score * FEATURE_WEIGHTS["place"]
            + exp_score * FEATURE_WEIGHTS["experience"]
            + budget_score * FEATURE_WEIGHTS["budget"]
            + style_score * FEATURE_WEIGHTS["travel_style"]
            + comp_score * FEATURE_WEIGHTS["companion"]
            + trans_score * FEATURE_WEIGHTS["transport"]
            + pace_score * FEATURE_WEIGHTS["pace"]
            + season_score * FEATURE_WEIGHTS["season"]
        )

        final_score = round(min(1.0, max(0.0, raw_score)), 4)
        match_percentage = min(100, max(0, int(round(final_score * 100))))

        # Collect matched preference tags for UI
        matched_prefs: List[str] = []
        matched_prefs.extend(matched_places)
        matched_prefs.extend(matched_exp)
        if matched_style:
            matched_prefs.append(f"{matched_style} Style")
        if matched_comp:
            matched_prefs.append(f"{matched_comp} Friendly")
        if matched_trans and "Flexible Transport" not in matched_trans:
            matched_prefs.extend(matched_trans)
        if matched_pace:
            matched_prefs.append(f"{matched_pace} Pace")

        # Key tags for destination card
        relevant_tags = [t.tag_value for t in dest.tags][:4]

        explanation = generate_explanation(
            dest_name=dest.name,
            matched_places=matched_places,
            matched_experiences=matched_exp,
            matched_style=matched_style,
            matched_companion=matched_comp,
            matched_transports=matched_trans,
            matched_pace=matched_pace,
        )

        rec_item = RecommendationItem(
            destination_id=dest.id,
            name=dest.name,
            city=dest.city,
            state=dest.state,
            country=dest.country,
            short_description=dest.short_description,
            description=dest.description,
            score=final_score,
            match_percentage=match_percentage,
            matched_preferences=matched_prefs,
            explanation=explanation,
            relevant_tags=relevant_tags,
            budget_min=dest.budget_min,
            budget_max=dest.budget_max,
            popularity_score=dest.popularity_score,
        )

        scored_items.append((final_score, rec_item))

    # 3. Deterministic Sorting:
    # Primary: final_score descending
    # Secondary: popularity_score descending
    # Tertiary: name ascending
    scored_items.sort(
        key=lambda x: (x[0], x[1].popularity_score, -ord(x[1].name[0])),
        reverse=True
    )

    # 4. Diversity Handling:
    # Cap destinations from any single state to max 2 in top-K, to ensure geographical diversity
    final_recommendations: List[RecommendationItem] = []
    state_counts: Dict[str, int] = {}
    overflow: List[RecommendationItem] = []

    for _, item in scored_items:
        current_state_count = state_counts.get(item.state, 0)
        if current_state_count < 2:
            final_recommendations.append(item)
            state_counts[item.state] = current_state_count + 1
            if len(final_recommendations) >= limit:
                break
        else:
            overflow.append(item)

    # If we haven't reached limit due to diversity capping, fill from overflow
    if len(final_recommendations) < limit:
        for item in overflow:
            final_recommendations.append(item)
            if len(final_recommendations) >= limit:
                break

    return RecommendationResponse(
        recommendations=final_recommendations,
        total=len(final_recommendations),
        generated_at=datetime.utcnow()
    )
