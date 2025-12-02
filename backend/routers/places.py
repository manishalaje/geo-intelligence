from fastapi import APIRouter
from ..services.maps_service import fetch_places

router = APIRouter()


@router.get("/search")
def search_places(lat: float, lon: float, query: str):
    """Basic place search using Geoapify (unranked)."""
    raw = fetch_places(lat, lon, query)
    return {"results": raw}
