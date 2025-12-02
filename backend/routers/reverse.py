from fastapi import APIRouter
import requests, os

router = APIRouter()
API_KEY = os.getenv("GEOAPIFY_API_KEY")


@router.get("/")
def reverse(lat: float, lon: float):
    url = "https://api.geoapify.com/v1/geocode/reverse"
    params = {"lat": lat, "lon": lon, "format": "json", "apiKey": API_KEY}
    return requests.get(url, params=params).json()
