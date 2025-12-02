// frontend/src/api/client.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export async function getRecommendations({ lat, lon, query, limit, category }) {
  const res = await api.get("/recommend/top", {
    params: { lat, lon, query, limit, category },
  });
  return res.data.results || [];
}

export async function searchLocation(text) {
  const res = await api.get("/geocode/search", {
    params: { text, limit: 5 },
  });
  return res.data.results || [];
}

export async function getRoute(startLat, startLon, endLat, endLon, mode) {
  const res = await api.get("/route/road", {
    params: {
      start_lat: startLat,
      start_lon: startLon,
      end_lat: endLat,
      end_lon: endLon,
      mode,
    },
  });

  const points = res.data.points || [];
  const distanceKm =
    typeof res.data.distance_m === "number"
      ? (res.data.distance_m / 1000).toFixed(2)
      : null;
  const durationMin =
    typeof res.data.duration_s === "number"
      ? Math.round(res.data.duration_s / 60)
      : null;

  return { points, distanceKm, durationMin };
}
