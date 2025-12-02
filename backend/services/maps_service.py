# backend/services/maps_service.py
import requests
from typing import List, Dict, Any, Optional

API_KEY = "c258b9d80fe145b5bfef46cdc4f463d4"
BASE_URL = "https://api.geoapify.com/v2/places"

# Category presets tuned for India / Bengaluru
CATEGORY_MAP: Dict[str, str] = {
    "restaurants": "catering.restaurant",
    "cafes": "catering.cafe",
    "food": "catering.cafe,catering.restaurant,catering.fast_food",

    "hotels": (
        "accommodation.hotel,"
        "accommodation.hostel,"
        "accommodation.guest_house,"
        "accommodation.motel,"
        "accommodation.apartment"
    ),

    "bus": "public_transport.bus",
    "metro": "public_transport.subway,railway.subway,railway.light_rail",
    "train": "public_transport.train,railway.train",
    "transit": "public_transport",

    # Groceries / supermarkets / markets
    "groceries": (
        "commercial.supermarket,"
        "commercial.grocery,"
        "commercial.marketplace,"
        "commercial.food"
    ),

    # Hospitals / clinics
    "hospital": (
        "healthcare.hospital,"
        "healthcare.hospital.emergency,"
        "healthcare.clinic"
    ),
    "pharmacy": "healthcare.pharmacy",

    "mall": "commercial.shopping_mall,commercial.department_store",
    "atm": "service.atm",
    "gas": "service.fuel",
    "parking": "parking",
    "school": "education.school",
    "college": "education.university,education.college",
    "police": "service.police",
    "park": "leisure.park",
    "cinema": "entertainment.cinema",
}


def _categories_for_query(query: str, category: Optional[str]) -> str:
    """
    1) If a 'category' preset is passed from frontend, use that.
    2) Otherwise fall back to simple text-based detection.
    """
    if category:
        key = category.lower()
        if key in CATEGORY_MAP:
            return CATEGORY_MAP[key]

    q = (query or "").lower()

    # hotels
    if any(w in q for w in ["hotel", "stay", "room", "lodging", "hostel", "pg"]):
        return CATEGORY_MAP["hotels"]

    # metro / train / bus
    if "metro" in q:
        return CATEGORY_MAP["metro"]
    if "train" in q or "railway" in q:
        return CATEGORY_MAP["train"]
    if "bus" in q:
        return CATEGORY_MAP["bus"]

    # food
    if "cafe" in q or "coffee" in q:
        return CATEGORY_MAP["cafes"]
    if any(w in q for w in ["restaurant", "food", "eat", "dinner", "lunch"]):
        return CATEGORY_MAP["food"]

    # hospital / pharmacy
    if "hospital" in q:
        return CATEGORY_MAP["hospital"]
    if "pharmacy" in q or "medical" in q or "chemist" in q:
        return CATEGORY_MAP["pharmacy"]

    # grocery / supermarket
    if any(w in q for w in ["grocery", "supermarket", "mart", "hypermarket"]):
        return CATEGORY_MAP["groceries"]

    # generic interesting stuff
    return "catering,commercial,accommodation,tourism,public_transport"


def _build_label(props: Dict[str, Any]) -> Optional[str]:
    """
    Build a human-readable name and filter out junk like 'Unnamed road'.
    """
    name = props.get("name")
    formatted = props.get("formatted") or ""
    address1 = props.get("address_line1") or ""

    label = name or address1 or formatted

    if not label:
        return None

    low = label.lower()
    if "unnamed" in low:
        return None

    return label


def fetch_places(
    lat: float,
    lon: float,
    query: str,
    category: Optional[str] = None,
    radius: int = 4000,
    limit: int = 40,
) -> List[Dict[str, Any]]:
    """
    Fetch nearby places from Geoapify Places API with smart categories.
    """
    if not API_KEY:
        raise RuntimeError("GEOAPIFY_API_KEY not set")

    categories = _categories_for_query(query, category)

    params = {
        "categories": categories,
        "filter": f"circle:{lon},{lat},{radius}",  # lon,lat order per Geoapify
        "bias": f"proximity:{lon},{lat}",
        "limit": limit,
        "apiKey": API_KEY,
    }

    resp = requests.get(BASE_URL, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    cleaned: List[Dict[str, Any]] = []

    for feat in data.get("features", []):
        props = feat.get("properties", {}) or {}
        geom = feat.get("geometry", {}) or {}
        coords = geom.get("coordinates") or [None, None]
        lon_p, lat_p = coords[0], coords[1]

        if lat_p is None or lon_p is None:
            continue

        label = _build_label(props)
        if not label:
            continue

        rank = props.get("rank", {}) or {}
        datasource = props.get("datasource", {}) or {}
        raw = datasource.get("raw", {}) or {}

        opening_hours = props.get("opening_hours")
        open_now = None
        if isinstance(opening_hours, dict):
            open_now = opening_hours.get("open_now")

        website = props.get("website") or raw.get("website")
        phone = props.get("phone") or raw.get("contact:phone") or raw.get("phone")

        confidence = float(rank.get("confidence") or 0.0)
        popularity = float(rank.get("popularity") or 0.0)

        cleaned.append(
            {
                "name": label,
                "lat": lat_p,
                "lon": lon_p,
                "address": props.get("formatted"),
                "categories": props.get("categories", []),
                "distance_m": props.get("distance"),
                "rating": confidence,
                "user_ratings_total": popularity,
                "website": website,
                "phone": phone,
                "open_now": open_now,
                # slots for future Google data
                "google_rating": None,
                "google_reviews_count": None,
            }
        )

    return cleaned
