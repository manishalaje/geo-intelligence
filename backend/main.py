from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import places, geocode, reverse, route, distance, isochrone, recommend, analytics
from .utils.db import init_db

app = FastAPI(title="Geo-Intelligence Recommender System API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def root():
    return {
        "status": "ok",
        "app": "Geo-Intelligence API",
        "message": "Smart recommendations & routing online",
    }
# Routers
app.include_router(places.router, prefix="/places", tags=["Places"])
app.include_router(geocode.router, prefix="/geocode", tags=["Geocoding"])
app.include_router(reverse.router, prefix="/reverse", tags=["Reverse Geocoding"])
app.include_router(route.router, prefix="/route", tags=["Routing"])
app.include_router(distance.router, prefix="/distance", tags=["Distance Matrix"])
app.include_router(isochrone.router, prefix="/isochrone", tags=["Isochrones"])
app.include_router(recommend.router, prefix="/recommend", tags=["Recommend"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/")
def root():
    return {"status": "Geo-Intelligence Backend Running"}
