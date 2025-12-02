# backend/ml/ranking.py
import math
from typing import List, Dict, Any


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def rank_places(places: List[Dict[str, Any]], center_lat: float, center_lon: float):
    ranked = []

    for p in places:
        lat = p.get("lat")
        lon = p.get("lon")

        if lat is None or lon is None:
            continue

        # distance
        if p.get("distance_m") is not None:
            d_km = p["distance_m"] / 1000.0
        else:
            d_km = _haversine_km(center_lat, center_lon, lat, lon)

        rating = float(p.get("rating") or 0.0)
        popularity = float(p.get("user_ratings_total") or 0.0)

        # Simple weighted score – you can tune these
        score = 0.6 * rating
        score += 0.2 * min(popularity / 1000.0, 1.0)  # cap
        score += 0.2 * max(0.0, 1.0 - d_km / 10.0)    # closer is better

        enriched = dict(p)
        enriched["distance_km"] = round(d_km, 2)
        enriched["score"] = round(score, 4)
        ranked.append(enriched)

    ranked.sort(key=lambda x: x.get("score", 0), reverse=True)
    return ranked
