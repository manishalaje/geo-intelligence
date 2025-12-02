# backend/routers/recommend.py
from fastapi import APIRouter
from ..services.maps_service import fetch_places
from ..ml.ranking import rank_places

router = APIRouter()


@router.get("/top")
def recommend(
    lat: float,
    lon: float,
    query: str = "cafe",
    limit: int = 10,
    category: str | None = None,
):
    raw_places = fetch_places(lat, lon, query=query, category=category, limit=limit * 2)
    ranked = rank_places(raw_places, lat, lon)
    return {"results": ranked[:limit]}
