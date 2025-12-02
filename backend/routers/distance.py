from fastapi import APIRouter
import requests, os

router = APIRouter()
API_KEY = os.getenv("GEOAPIFY_API_KEY")


@router.get("/matrix")
def distance_matrix(origins: str, destinations: str, mode: str = "drive"):
    """Call Geoapify distance matrix and return index->distance/time mapping."""
    url = "https://api.geoapify.com/v1/routing/matrix"
    params = {
        "origins": origins,
        "destinations": destinations,
        "mode": mode,
        "apiKey": API_KEY,
    }
    res = requests.get(url, params=params).json()
    mapping = {}
    distances = res.get("distances", [])
    times = res.get("times", [])
    if distances and len(distances) > 0 and times and len(times) > 0:
        for j, (d, t) in enumerate(zip(distances[0], times[0])):
            mapping[str(j)] = {"distance_m": d, "time_s": t}
    return mapping
