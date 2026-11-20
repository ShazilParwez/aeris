export type AQICategory =
  | "Good"
  | "Moderate"
  | "Unhealthy for Sensitive Groups"
  | "Unhealthy"
  | "Very Unhealthy"
  | "Hazardous";

export interface LocationItem {
  id?: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface PollutantBreakdown {
  pm2_5?: number | null;
  pm10?: number | null;
  nitrogen_dioxide?: number | null;
  sulphur_dioxide?: number | null;
  ozone?: number | null;
  carbon_monoxide?: number | null;
}

export interface WeatherSummary {
  temperature_c?: number | null;
  relative_humidity_pct?: number | null;
  wind_speed_kmh?: number | null;
  wind_direction_deg?: number | null;
  precipitation_mm?: number | null;
  weather_code?: number | null;
}

export interface DataProvenance {
  provider: string;
  model_or_measured: string;
  standard_label: string;
  indian_standard_note: string;
  timestamp_utc: string;
  fetch_time_utc: string;
  is_demo_fixture: boolean;
  disclaimer: string;
}

export interface CurrentConditions {
  aqi: number;
  category: AQICategory;
  dominant_pollutant: string;
  pollutants: PollutantBreakdown;
  weather: WeatherSummary;
  summary_text: string;
}

export interface HourlyForecastPoint {
  time_iso: string;
  aqi: number;
  category: AQICategory;
  pm2_5?: number | null;
  pm10?: number | null;
  temperature_c?: number | null;
  relative_humidity_pct?: number | null;
  wind_speed_kmh?: number | null;
  is_cleaner_window: boolean;
}

export interface CleanerWindow {
  start_time: string;
  end_time: string;
  avg_aqi: number;
  avg_pm2_5: number;
  category: AQICategory;
  suitability: string;
  guidance: string;
}

export interface AirQualityResponse {
  location: LocationItem;
  current: CurrentConditions;
  hourly_forecast: HourlyForecastPoint[];
  cleaner_windows: CleanerWindow[];
  provenance: DataProvenance;
}

export interface RecommendationItem {
  id: string;
  category: string;
  priority: "high" | "medium" | "low";
  title: string;
  action: string;
  explanation: string;
  triggering_rule: string;
  impact_dimension: "exposure_reduction" | "emission_reduction" | "dual_benefit";
  qualitative_benefit: string;
  caveat?: string | null;
  action_label: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  preferred_time: string;
  duration_minutes: number;
  is_outdoor: boolean;
  is_fixed: boolean;
  priority: string;
}

export interface OptimizedActivity {
  id: string;
  title: string;
  original_time: string;
  suggested_time: string;
  duration_minutes: number;
  is_outdoor: boolean;
  is_fixed: boolean;
  status: "unchanged" | "shifted" | "moved_indoors" | "cancelled";
  change_rationale: string;
  original_aqi: number;
  suggested_aqi: number;
  relative_exposure_delta_pct: number;
}

export interface PlannerOptimizeResponse {
  original_activities: ActivityItem[];
  suggested_activities: OptimizedActivity[];
  total_exposure_reduction_pct: number;
  overall_rationale: string;
  best_cleaner_window?: string | null;
}

export interface TransportImpactDetail {
  mode: string;
  mode_label: string;
  distance_km: number;
  estimated_co2_kg: number;
  relative_exposure_index: number;
  estimated_duration_min: number;
  methodology: string;
  tradeoff_summary: string;
}

export interface TransportComparisonResponse {
  baseline: TransportImpactDetail;
  alternative: TransportImpactDetail;
  co2_saved_kg: number;
  co2_reduction_pct: number;
  exposure_comparison_text: string;
  reconciliation_advice: string;
  data_assumptions: string[];
}

export interface AssistantChatResponse {
  answer: string;
  mode: "gemini_grounded" | "rule_based_fallback";
  grounded_facts: string[];
  suggested_actions: string[];
  follow_up_questions: string[];
  confidence_level: string;
  disclaimer: string;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
  description: string;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  r2: number;
  persistence_mae: number;
  persistence_rmse: number;
  persistence_r2: number;
  samples_count: number;
  test_period: string;
  model_name: string;
}

export interface MLStatusResponse {
  is_available: boolean;
  model_type: string;
  target_horizon_hours: number;
  trained_city: string;
  metrics?: ModelMetrics;
  feature_importances: FeatureImportanceItem[];
  limitations: string[];
  last_trained: string;
}

export interface MLPredictionPoint {
  forecast_time_iso: string;
  horizon_hours: number;
  predicted_pm2_5: number;
  persistence_pm2_5: number;
  lower_bound_pm2_5: number;
  upper_bound_pm2_5: number;
  risk_category: string;
  uncertainty_method: string;
}

export interface MLPredictionResponse {
  city: string;
  origin_time_iso: string;
  target_horizon_hours: number;
  predictions: MLPredictionPoint[];
  model_used: string;
  status: string;
  provenance_note: string;
}
