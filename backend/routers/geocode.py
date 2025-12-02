# backend/routers/geocode.py
from fastapi import APIRouter
import requests

API_KEY = "c258b9d80fe145b5bfef46cdc4f463d4"

router = APIRouter()


@router.get("/search")
def geocode_search(text: str, limit: int = 5):
    """
    Search for a location name (area, city, landmark) and return lat/lon options.
    Example: 'Majestic Bangalore', 'Whitefield', 'Bengaluru City Railway Station'.
    """
    if not text:
        return {"results": []}

    url = "https://api.geoapify.com/v1/geocode/search"
    params = {
        "text": text,
        "limit": limit,
        "apiKey": API_KEY,
    }

    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    results = []
    for feat in data.get("features", []):
        props = feat.get("properties", {})
        coords = feat.get("geometry", {}).get("coordinates", [None, None])

        results.append(
            {
                "label": props.get("formatted")
                or props.get("address_line1")
                or "Unnamed location",
                "lat": coords[1],
                "lon": coords[0],
            }
        )

    return {"results": results}
