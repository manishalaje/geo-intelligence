from fastapi import APIRouter
import requests, os

router = APIRouter()
API_KEY = os.getenv("GEOAPIFY_API_KEY")


@router.get("/")
def isochrone(lat: float, lon: float, mode: str = "drive", time: int = 600):
    url = "https://api.geoapify.com/v1/isoline"
    params = {
        "lat": lat,
        "lon": lon,
        "type": "time",
        "mode": mode,
        "range": time,
        "apiKey": API_KEY,
    }
    return requests.get(url, params=params).json()
