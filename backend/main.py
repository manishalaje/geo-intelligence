# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import recommend, route, geocode  # 👈 add geocode here

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # OK for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommend.router, prefix="/recommend", tags=["Recommend"])
app.include_router(route.router, prefix="/route", tags=["Route"])        # real routes
app.include_router(geocode.router, prefix="/geocode", tags=["Geocode"])  # location search
