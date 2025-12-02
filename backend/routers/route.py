# backend/routers/route.py
from fastapi import APIRouter
import requests

API_KEY = "c258b9d80fe145b5bfef46cdc4f463d4"

router = APIRouter()


@router.get("/road")
def road_route(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
    mode: str = "drive",  # drive | walk | bicycle | transit
):
    """
    Returns a road-following polyline + distance + time using Geoapify Routing API.
    """
    if not API_KEY:
        return {"points": [], "distance_m": None, "duration_s": None}

    url = "https://api.geoapify.com/v1/routing"
    params = {
        "waypoints": f"{start_lat},{start_lon}|{end_lat},{end_lon}",
        "mode": mode,
        "apiKey": API_KEY,
    }

    resp = requests.get(url, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    points = []
    distance_m = None
    duration_s = None

    features = data.get("features", [])
    if features:
        props = features[0].get("properties", {})
        distance_m = props.get("distance")  # meters
        duration_s = props.get("time")      # seconds

        geometry = features[0].get("geometry", {})
        coords = geometry.get("coordinates", [])

        # LineString or MultiLineString
        if geometry.get("type") == "LineString":
            for lon, lat in coords:
                points.append({"lat": lat, "lon": lon})
        elif geometry.get("type") == "MultiLineString":
            for segment in coords:
                for lon, lat in segment:
                    points.append({"lat": lat, "lon": lon})

    return {
        "points": points,
        "distance_m": distance_m,
        "duration_s": duration_s,
    }
