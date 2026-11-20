import {
  AirQualityResponse,
  LocationItem,
  RecommendationItem,
  PlannerOptimizeResponse,
  ActivityItem,
  TransportComparisonResponse,
  AssistantChatResponse,
  MLStatusResponse,
  MLPredictionResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function fetchLocations(query: string): Promise<LocationItem[]> {
  try {
    const res = await fetch(`${API_BASE}/locations/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Search failed");
    return await res.json();
  } catch (err) {
    return [
      {
        name: "Delhi",
        country: "India",
        latitude: 28.6139,
        longitude: 77.209,
        timezone: "Asia/Kolkata",
      },
    ];
  }
}

export async function fetchAirQuality(
  lat: number,
  lon: number,
  city = "Delhi",
  country = "India",
  tz = "auto"
): Promise<AirQualityResponse> {
  const url = `${API_BASE}/air-quality?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&tz=${encodeURIComponent(tz)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Air quality fetch failed: ${res.statusText}`);
  return await res.json();
}

export async function fetchRecommendations(
  airQuality: AirQualityResponse,
  profile?: any
): Promise<RecommendationItem[]> {
  const res = await fetch(`${API_BASE}/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ air_quality: airQuality, profile }),
  });
  if (!res.ok) throw new Error("Recommendations fetch failed");
  return await res.json();
}

export async function optimizeSchedule(
  activities: ActivityItem[],
  latitude: number,
  longitude: number
): Promise<PlannerOptimizeResponse> {
  const res = await fetch(`${API_BASE}/planner/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activities, latitude, longitude }),
  });
  if (!res.ok) throw new Error("Planner optimization failed");
  return await res.json();
}

export async function compareTransport(
  baselineMode: string,
  alternativeMode: string,
  distanceKm: number,
  currentPm25: number
): Promise<TransportComparisonResponse> {
  const res = await fetch(`${API_BASE}/impact/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      baseline_mode: baselineMode,
      alternative_mode: alternativeMode,
      distance_km: distanceKm,
      current_pm2_5: currentPm25,
    }),
  });
  if (!res.ok) throw new Error("Transport comparison failed");
  return await res.json();
}

export async function askAssistant(
  question: string,
  locationName = "Delhi",
  currentAqi?: number,
  currentPm25?: number
): Promise<AssistantChatResponse> {
  const res = await fetch(`${API_BASE}/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      location_name: locationName,
      current_aqi: currentAqi,
      current_pm2_5: currentPm25,
    }),
  });
  if (!res.ok) throw new Error("Assistant request failed");
  return await res.json();
}

export async function fetchMLStatus(): Promise<MLStatusResponse> {
  const res = await fetch(`${API_BASE}/ml/status`);
  if (!res.ok) throw new Error("ML status fetch failed");
  return await res.json();
}

export async function fetchMLPrediction(
  city: string,
  recentPm25History: number[]
): Promise<MLPredictionResponse> {
  const res = await fetch(`${API_BASE}/ml/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city,
      recent_pm2_5_history: recentPm25History,
    }),
  });
  if (!res.ok) throw new Error("ML prediction fetch failed");
  return await res.json();
}
