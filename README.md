<<<<<<< HEAD
# geo-intelligence
AI-powered location intelligence + smart navigation
=======
# Geo-Intelligence Recommender System (Geoapify Version)

A smart location-based recommendation system using:

- FastAPI backend
- Geoapify Places / Geocoding / Routing APIs
- ML-based ranking (rating + popularity + distance/time)
- Streamlit frontend with map visualization

## Quickstart

1. Create a virtualenv and install deps:

```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the project root with:

```bash
GEOAPIFY_API_KEY=your_geoapify_key_here
```

3. Start the backend:

```bash
uvicorn backend.main:app --reload --port 8000
```

4. Start the frontend:

```bash
streamlit run frontend/app.py
```

Default location is **Bengaluru** (12.9716, 77.5946).
>>>>>>> 5900cca (SmartGeo: initial commit React + FastAPI + routing + map UI)
