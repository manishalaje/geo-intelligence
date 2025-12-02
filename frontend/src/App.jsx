import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { getRecommendations, searchLocation, getRoute } from "./api/client";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icons (CDN icons)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 🔮 Draggable center pin – electric purple glow
const draggablePinIcon = L.divIcon({
  className: "draggable-pin",
  html: `
    <div class="pin-glow"></div>
    <div class="pin-core"></div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 38], // bottom center
});

// 🌊 Place pins – cyan with dark outline
const placePinIcon = L.divIcon({
  className: "place-marker-icon",
  html: `
    <div class="place-marker">
      <div class="place-marker-inner"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const DEFAULT_LAT = 12.9716;
const DEFAULT_LON = 77.5946;

const CATEGORY_PRESETS = [
  { id: "restaurants", label: "Restaurants", icon: "🍽" },
  { id: "hotels", label: "Hotels", icon: "🏨" },
  { id: "food", label: "Food", icon: "🍔" },
  { id: "cafes", label: "Cafes", icon: "☕" },
  { id: "transit", label: "Transit", icon: "🚉" },
  { id: "bus", label: "Bus Stops", icon: "🚌" },
  { id: "metro", label: "Metro", icon: "🚇" },
  { id: "train", label: "Train", icon: "🚆" },
  { id: "mall", label: "Malls", icon: "🛍" },
  { id: "hospital", label: "Hospitals", icon: "🏥" },
  { id: "pharmacy", label: "Pharmacy", icon: "💊" },
  { id: "groceries", label: "Groceries", icon: "🧺" },
];

function RecenterOnLocation({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 14);
    }
  }, [lat, lon, map]);
  return null;
}

// Draggable center marker using purple glow icon
function DraggableCenterMarker({ position, onDragEnd }) {
  return (
    <Marker
      position={position}
      icon={draggablePinIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onDragEnd({ lat, lng });
        },
      }}
    >
      <Popup>Drag to set search area</Popup>
    </Marker>
  );
}

// Simple haversine distance in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function App() {
  const [centerLat, setCenterLat] = useState(DEFAULT_LAT);
  const [centerLon, setCenterLon] = useState(DEFAULT_LON);

  const [locationQuery, setLocationQuery] = useState("Bengaluru");
  const [locationResults, setLocationResults] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locStatus, setLocStatus] = useState("");

  const [locationHistory, setLocationHistory] = useState(() => {
    const raw = localStorage.getItem("geo_location_history");
    return raw ? JSON.parse(raw) : [];
  });

  const [activeCategory, setActiveCategory] = useState("restaurants");
  const [query, setQuery] = useState("restaurants");
  const [limit, setLimit] = useState(15);

  const [mode, setMode] = useState("drive"); // drive | walk | bicycle | transit
  const [mapStyle, setMapStyle] = useState("light"); // light | dark
  const [showTraffic, setShowTraffic] = useState(false);

  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sortBy, setSortBy] = useState("score"); // score | distance | popularity

  const [results, setResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [routePoints, setRoutePoints] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null); // current mode summary
  const [travelTimes, setTravelTimes] = useState(null); // all modes summary

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [savedPlaces, setSavedPlaces] = useState(() => {
    const raw = localStorage.getItem("geo_saved_places");
    return raw ? JSON.parse(raw) : [];
  });

  const modeLabel = {
    drive: "Driving",
    walk: "Walking",
    bicycle: "Cycling",
    transit: "Transit",
  }[mode];

  const distanceFor = (p) => {
    if (!p?.lat || !p?.lon) return null;
    return haversineKm(centerLat, centerLon, p.lat, p.lon).toFixed(2);
  };

  const addLocationHistory = (label, lat, lon) => {
    const key = `${lat},${lon}`;
    const existing = locationHistory.filter((x) => x.key !== key);
    const updated = [{ key, label, lat, lon }, ...existing].slice(0, 6);
    setLocationHistory(updated);
    localStorage.setItem("geo_location_history", JSON.stringify(updated));
  };

  const searchPlaces = async (overrideLat, overrideLon, categoryOverride) => {
    const lat = overrideLat ?? centerLat;
    const lon = overrideLon ?? centerLon;
    const cat = categoryOverride ?? activeCategory;

    setLoading(true);
    setError("");
    setRoutePoints([]);
    setRouteInfo(null);
    setSelectedPlace(null);

    try {
      const data = await getRecommendations({
        lat,
        lon,
        query,
        limit,
        category: cat,
      });
      setResults(data);
    } catch (e) {
      console.error(e);
      setError("Backend not reachable on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    setLocStatus("Detecting your location…");
    if (!("geolocation" in navigator)) {
      setLocStatus("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenterLat(latitude);
        setCenterLon(longitude);
        setLocationQuery("My location");
        setLocStatus("Location set ✅");
        addLocationHistory("My location", latitude, longitude);
        searchPlaces(latitude, longitude);
      },
      (err) => {
        console.error(err);
        setLocStatus("Failed to get location: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleLocationSearch = async () => {
    if (!locationQuery.trim()) return;
    setLocationLoading(true);
    setLocationResults([]);

    try {
      const res = await searchLocation(locationQuery.trim());
      setLocationResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLocationLoading(false);
    }
  };

  const pickLocation = (loc) => {
    setCenterLat(loc.lat);
    setCenterLon(loc.lon);
    setLocationQuery(loc.label);
    setLocationResults([]);
    addLocationHistory(loc.label, loc.lat, loc.lon);
    searchPlaces(loc.lat, loc.lon);
  };

  const fetchRouteForPlace = async (place) => {
    if (!place) return;
    try {
      const route = await getRoute(
        centerLat,
        centerLon,
        place.lat,
        place.lon,
        mode
      );
      setRoutePoints(route.points || []);
      if (route.distanceKm || route.durationMin) {
        setRouteInfo({
          distanceKm: route.distanceKm,
          durationMin: route.durationMin,
        });
      } else {
        setRouteInfo(null);
      }
    } catch (e) {
      console.error("Route error", e);
      setRoutePoints([]);
      setRouteInfo(null);
    }
  };

  // fetch all modes (drive/walk/cycle/transit) for flyout
  const fetchAllTravelTimes = async (place) => {
    if (!place) return;

    const modes = ["drive", "walk", "bicycle", "transit"];
    const summary = {};

    try {
      for (const m of modes) {
        try {
          const r = await getRoute(
            centerLat,
            centerLon,
            place.lat,
            place.lon,
            m
          );
          if (r && (r.distanceKm || r.durationMin)) {
            summary[m] = {
              distanceKm: r.distanceKm ?? null,
              durationMin: r.durationMin ?? null,
            };
          } else {
            summary[m] = null;
          }
        } catch (e) {
          console.error("Route error for mode", m, e);
          summary[m] = null;
        }
      }
      setTravelTimes(summary);
    } catch (e) {
      console.error("fetchAllTravelTimes error", e);
      setTravelTimes(null);
    }
  };

  const handleSelectPlace = (p) => {
    setSelectedPlace(p);
    setTravelTimes(null);
    fetchRouteForPlace(p);
    fetchAllTravelTimes(p);
  };

  // When mode changes, recompute route for current selected place
  useEffect(() => {
    if (selectedPlace) {
      fetchRouteForPlace(selectedPlace);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const onClickCategory = (cat) => {
    setActiveCategory(cat.id);
    setQuery(cat.id);
    searchPlaces(undefined, undefined, cat.id);
  };

  const toggleSavePlace = (p) => {
    const key = `${p.lat},${p.lon},${p.name}`;
    let updated;
    if (savedPlaces.some((x) => x.key === key)) {
      updated = savedPlaces.filter((x) => x.key !== key);
    } else {
      updated = [...savedPlaces, { key, name: p.name, lat: p.lat, lon: p.lon }];
    }
    setSavedPlaces(updated);
    localStorage.setItem("geo_saved_places", JSON.stringify(updated));
  };

  const isSaved = (p) => {
    const key = `${p.lat},${p.lon},${p.name}`;
    return savedPlaces.some((x) => x.key === key);
  };

  const getDistanceNum = (p) => {
    const d =
      typeof p.distance_km === "number"
        ? p.distance_km
        : parseFloat(distanceFor(p));
    return isNaN(d) ? 1e9 : d;
  };

  // Apply open-now filter + sort on client
  const displayResults = (() => {
    let arr = [...results];

    if (openNowOnly) {
      arr = arr.filter((p) => p.open_now === true);
    }

    if (sortBy === "distance") {
      arr.sort((a, b) => getDistanceNum(a) - getDistanceNum(b));
    } else if (sortBy === "popularity") {
      arr.sort(
        (a, b) =>
          (b.user_ratings_total || 0) - (a.user_ratings_total || 0)
      );
    } else {
      arr.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    return arr;
  })();

  const tileUrlLight = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileUrlDark =
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="app-shell">
      {/* TOP BAR */}
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-button">☰</button>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLocationSearch()}
              placeholder="Search area, landmark, city…"
            />
          </div>
          <button className="pill-button" onClick={useMyLocation}>
            📍 Use my location
          </button>
        </div>
        <div className="topbar-right">
          <span className="avatar">M</span>
        </div>
      </header>

      {/* LOCATION HISTORY */}
      {locationHistory.length > 0 && (
        <div className="history-row">
          {locationHistory.map((loc) => (
            <button
              key={loc.key}
              className="history-chip"
              onClick={() => pickLocation(loc)}
            >
              📍 {loc.label}
            </button>
          ))}
        </div>
      )}

      {/* CATEGORY TABS */}
      <div className="category-row">
        {CATEGORY_PRESETS.map((cat) => (
          <button
            key={cat.id}
            className={
              "category-chip" +
              (activeCategory === cat.id ? " category-chip-active" : "")
            }
            onClick={() => onClickCategory(cat)}
          >
            <span className="chip-icon">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="app-body">
        {/* LEFT PANEL */}
        <aside className="left-panel">
          <div className="left-panel-controls">
            <h3>Explore nearby</h3>
            <p className="subtitle">
              {activeCategory.toUpperCase()} · {mode.toUpperCase()}
            </p>

            <div className="mode-row">
              {["drive", "walk", "bicycle", "transit"].map((m) => (
                <button
                  key={m}
                  className={mode === m ? "mode-btn active" : "mode-btn"}
                  onClick={() => setMode(m)}
                >
                  {m === "drive" && "🚗 Drive"}
                  {m === "walk" && "🚶 Walk"}
                  {m === "bicycle" && "🚴 Cycle"}
                  {m === "transit" && "🚆 Transit"}
                </button>
              ))}
            </div>

            {locStatus && <p className="status">{locStatus}</p>}
            {locationLoading && <p className="status">Searching location…</p>}

            {locationResults.length > 0 && (
              <ul className="location-suggestions">
                {locationResults.map((loc, i) => (
                  <li key={i} onClick={() => pickLocation(loc)}>
                    📍 {loc.label}
                  </li>
                ))}
              </ul>
            )}

            <div className="options-row">
              <div>
                <label className="small-label">Results (1–20)</label>
                <input
                  className="small-input"
                  type="number"
                  min="1"
                  max="20"
                  value={limit}
                  onChange={(e) =>
                    setLimit(
                      Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                    )
                  }
                />
              </div>

              <div>
                <label className="small-label">Sort by</label>
                <select
                  className="small-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="score">Best match</option>
                  <option value="distance">Distance</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={openNowOnly}
                onChange={(e) => setOpenNowOnly(e.target.checked)}
              />
              <span>Open now (where data available)</span>
            </label>

            <button
              className="primary-button"
              onClick={() => searchPlaces()}
              disabled={loading}
            >
              {loading ? "Searching…" : "Search this area"}
            </button>

            {error && <p className="error">{error}</p>}
          </div>

          {/* LISTS: saved + results */}
          <div className="left-panel-lists">
            {savedPlaces.length > 0 && (
              <>
                <h4 className="section-title">Saved</h4>
                <ul className="results-list">
                  {savedPlaces.map((p) => (
                    <li
                      key={p.key}
                      className="result-item"
                      onClick={() =>
                        handleSelectPlace({
                          name: p.name,
                          lat: p.lat,
                          lon: p.lon,
                        })
                      }
                    >
                      ⭐ {p.name}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h4 className="section-title">Results</h4>
            <ul className="results-list">
              {displayResults.map((p, i) => {
                const d =
                  typeof p.distance_km === "number"
                    ? p.distance_km.toFixed(2)
                    : distanceFor(p);
                return (
                  <li
                    key={i}
                    className={
                      selectedPlace && selectedPlace.name === p.name
                        ? "result-item selected"
                        : "result-item"
                    }
                    onClick={() => handleSelectPlace(p)}
                  >
                    <div className="result-header">
                      <strong>{p.name}</strong>
                      <button
                        className="star-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSavePlace(p);
                        }}
                      >
                        {isSaved(p) ? "★" : "☆"}
                      </button>
                    </div>
                    {p.address && (
                      <div className="result-address">{p.address}</div>
                    )}
                    <div className="result-meta">
                      {d && <span>~{d} km</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* MAP AREA */}
        <main className="map-panel">
          <div className="map-wrapper">
            <MapContainer
              center={[centerLat, centerLon]}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
              zoomAnimation={true}
              markerZoomAnimation={true}
            >
              <RecenterOnLocation lat={centerLat} lon={centerLon} />

              <TileLayer
                url={mapStyle === "light" ? tileUrlLight : tileUrlDark}
              />

              {/* DRAGGABLE CENTER PIN */}
              <DraggableCenterMarker
                position={[centerLat, centerLon]}
                onDragEnd={({ lat, lng }) => {
                  setCenterLat(lat);
                  setCenterLon(lng);
                  setLocationQuery("Dropped pin");
                  addLocationHistory("Dropped pin", lat, lng);
                  searchPlaces(lat, lng);
                }}
              />

              {routePoints.length > 1 && (
                <Polyline
                  positions={routePoints.map((pt) => [pt.lat, pt.lon])}
                  pathOptions={{
                    color: "#22d3ee", // cyan – matches place pins
                    weight: 5,
                    opacity: 0.95,
                    dashArray: "6 6",
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              )}

              {displayResults.map((p, i) => (
                <Marker
                  key={i}
                  position={[p.lat, p.lon]}
                  icon={placePinIcon}
                  eventHandlers={{
                    click: () => handleSelectPlace(p),
                  }}
                >
                  <Popup>
                    <b>{p.name}</b>
                    {p.address && (
                      <>
                        <br />
                        {p.address}
                      </>
                    )}
                    {p.distance_km && (
                      <>
                        <br />
                        ~{p.distance_km.toFixed(2)} km away
                      </>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Right-side floating detail panel */}
            {selectedPlace && (
              <div className="place-flyout">
                <h3 className="place-flyout-title">{selectedPlace.name}</h3>
                {selectedPlace.address && (
                  <p className="place-flyout-address">
                    {selectedPlace.address}
                  </p>
                )}

                {travelTimes && (
                  <div className="place-flyout-times">
                    <h4>Travel time</h4>
                    <ul>
                      <li>
                        🚗 Drive:{" "}
                        {travelTimes.drive
                          ? `${travelTimes.drive.durationMin ?? "?"} min · ${
                              travelTimes.drive.distanceKm ?? "?"
                            } km`
                          : "n/a"}
                      </li>
                      <li>
                        🚶 Walk:{" "}
                        {travelTimes.walk
                          ? `${travelTimes.walk.durationMin ?? "?"} min · ${
                              travelTimes.walk.distanceKm ?? "?"
                            } km`
                          : "n/a"}
                      </li>
                      <li>
                        🚴 Cycle:{" "}
                        {travelTimes.bicycle
                          ? `${
                              travelTimes.bicycle.durationMin ?? "?"
                            } min · ${
                              travelTimes.bicycle.distanceKm ?? "?"
                            } km`
                          : "n/a"}
                      </li>
                      <li>
                        🚆 Transit:{" "}
                        {travelTimes.transit
                          ? `${
                              travelTimes.transit.durationMin ?? "?"
                            } min · ${
                              travelTimes.transit.distanceKm ?? "?"
                            } km`
                          : "n/a"}
                      </li>
                    </ul>
                  </div>
                )}

                <button
                  className="secondary-button"
                  onClick={() => toggleSavePlace(selectedPlace)}
                >
                  {isSaved(selectedPlace) ? "★ Saved" : "☆ Save"}
                </button>
              </div>
            )}

            {/* Map controls (style + traffic) */}
            <div className="map-controls">
              <button
                className={
                  mapStyle === "light" ? "map-btn active" : "map-btn"
                }
                onClick={() => setMapStyle("light")}
              >
                🗺 Map
              </button>
              <button
                className={mapStyle === "dark" ? "map-btn active" : "map-btn"}
                onClick={() => setMapStyle("dark")}
              >
                🌃 Dark
              </button>
              <button
                className={showTraffic ? "map-btn active" : "map-btn"}
                onClick={() => setShowTraffic((v) => !v)}
              >
                🚦 Traffic (demo)
              </button>
            </div>

            {showTraffic && <div className="traffic-overlay" />}

            {/* Bottom mini card */}
            {selectedPlace && routeInfo && (
              <div className="bottom-card">
                <div className="bottom-card-title">
                  {selectedPlace.name}
                </div>
                <div className="bottom-card-meta">
                  {routeInfo.distanceKm && (
                    <span>{routeInfo.distanceKm} km</span>
                  )}
                  {routeInfo.durationMin != null && (
                    <span>
                      {" "}
                      · {routeInfo.durationMin} min · {modeLabel}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
