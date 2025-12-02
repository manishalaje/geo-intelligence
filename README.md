🚀 SmartGeo — Geo-Intelligence Recommender System

React + FastAPI + AI-powered Maps + Real-time Routing

SmartGeo is a modern location intelligence platform that works like a mini Google Maps alternative — providing smart place recommendations, draggable location search, real-time routing, and travel mode comparison.

Built with:

🧠 Machine Learning + Smart Sorting

🌍 Map Intelligence (Leaflet + Geoapify)

⚡ Full-stack performance (React + FastAPI)

🎯 Real-world features: history, favorites, timing & more

✨ Key Features
Feature	Status
📌 Draggable Pin — Search anywhere instantly	✅
🗺 Light & Dark Map Themes	✅
🚦 Traffic Overlay (Demo)	✅
🧭 Real Directions — Drive / Walk / Cycle / Transit routes	✅
⭐ Save Places as Favorites	✅
🧩 Categories: Hotels, Metro, Restaurants, Malls, etc	✅
⏱ Travel time + distance for each mode	✅
⚡ Fast Search + Smooth UI Animations	✅
🔍 Search cities / landmarks globally	✅
🧭 Demo Usage Flow

1️⃣ Grant location or search for a place
2️⃣ Choose category — restaurant, hotel, bus stop…
3️⃣ Click any result → see routes, timing & popup details
4️⃣ Drag center pin → dynamic refresh of recommendations
5️⃣ Save favorite places ⭐

🖥 Tech Stack
Layer	Technologies
Frontend	React, Leaflet Maps, Vite, CSS
Backend	FastAPI, Python, Requests
Routing API	Geoapify Routing API
Search + Place Data	Geoapify Places API
ML / Ranking	Python + Scoring (extendable)
📂 Project Structure
geo-intelligence/
│
├── backend/
│   ├── main.py
│   ├── routers/
│   ├── services/
│   ├── data/
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
└── README.md

⚙️ Local Setup
📌 1️⃣ Backend Setup (FastAPI)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000


Make sure .env contains your Geoapify API key:

GEOAPIFY_API_KEY=your_key_here


➡ Backend will run at:
📍 http://localhost:8000

🌐 2️⃣ Frontend Setup (React)
cd frontend
npm install
npm run dev


➡ Open in browser:
📍 http://localhost:5173

🧪 Future Enhancements (Your Growth Roadmap)
Feature	Status
📍 Street View (static)	Coming soon
⭐ Recommendation improvement using ML	In progress
📊 Heatmaps + Insights	Planned
📝 User login + saved history cloud sync	Planned
🔍 Reviews & ratings from Google Places	Researching
🧑‍💻 Author

👤 Manish A M
📍 Bengaluru, India
🎓 Smart Geo-Spatial Intelligence Innovator
⭐ Will soon become Google SDE 😉

❤️ Acknowledgements

Geoapify Maps & Routing APIs

OpenStreetMap Data

Inspiration from Google Maps UI
