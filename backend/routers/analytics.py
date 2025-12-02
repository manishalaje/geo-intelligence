from fastapi import APIRouter
from sklearn.cluster import KMeans
import pandas as pd
from pathlib import Path

router = APIRouter()


@router.get("/heatmap")
def heatmap(query: str, lat: float, lon: float, radius: int = 3000, clusters: int = 5):
    """Return cluster centroids as GeoJSON FeatureCollection.

    Expects cached data/places.json generated from previous searches.
    """
    data_path = Path("data/places.json")
    if not data_path.exists():
        return {"error": "No cached data. Save places to data/places.json first."}

    df = pd.read_json(data_path)
    coords = df[["lat", "lon"]]
    kmeans = KMeans(n_clusters=clusters, random_state=42).fit(coords)
    df["cluster"] = kmeans.labels_

    features = []
    for c in range(clusters):
        sub = df[df.cluster == c]
        if sub.empty:
            continue
        centroid = {"lat": sub.lat.mean(), "lon": sub.lon.mean()}
        features.append(
            {
                "type": "Feature",
                "properties": {"cluster": int(c), "count": int(len(sub))},
                "geometry": {
                    "type": "Point",
                    "coordinates": [centroid["lon"], centroid["lat"]],
                },
            }
        )

    return {"type": "FeatureCollection", "features": features}
