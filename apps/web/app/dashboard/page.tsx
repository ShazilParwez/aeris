"use client";

import React, { useState, useEffect } from "react";
import {
  Wind,
  Compass,
  Clock,
  Thermometer,
  Droplets,
  Gauge,
  Sun,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { fetchAirQuality, fetchLocations, fetchRecommendations } from "../../lib/api";
import { AirQualityResponse, LocationItem, RecommendationItem } from "../../lib/types";

export default function DashboardPage() {
  const [selectedCity, setSelectedCity] = useState<LocationItem>({
    name: "Delhi",
    country: "India",
    latitude: 28.6139,
    longitude: 77.209,
    timezone: "Asia/Kolkata",
  });
  const [airData, setAirData] = useState<AirQualityResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricView, setMetricView] = useState<"aqi" | "pm2_5" | "pm10">("aqi");
  const [horizonView, setHorizonView] = useState<24 | 48>(24);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [appliedAction, setAppliedAction] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard(selectedCity);
  }, [selectedCity]);

  const loadDashboard = async (loc: LocationItem) => {
    setLoading(true);
    try {
      const data = await fetchAirQuality(loc.latitude, loc.longitude, loc.name, loc.country, loc.timezone);
      setAirData(data);
      const recs = await fetchRecommendations(data);
      setRecommendations(recs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const res = await fetchLocations(searchQuery);
    setSearchResults(res);
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "#10B981"; // Emerald
    if (aqi <= 100) return "#F59E0B"; // Amber
    if (aqi <= 150) return "#F97316"; // Orange
    if (aqi <= 200) return "#EF4444"; // Red
    if (aqi <= 300) return "#8B5CF6"; // Purple
    return "#E11D48"; // Rose/Maroon Hazardous
  };

  const getAQIBadge = (aqi: number) => {
    if (aqi <= 50) return { bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", label: "Good" };
    if (aqi <= 100) return { bg: "bg-amber-500/20 text-amber-300 border-amber-500/40", label: "Moderate" };
    if (aqi <= 150) return { bg: "bg-orange-500/20 text-orange-300 border-orange-500/40", label: "Unhealthy for Sensitive" };
    if (aqi <= 200) return { bg: "bg-red-500/20 text-red-300 border-red-500/40", label: "Unhealthy" };
    if (aqi <= 300) return { bg: "bg-purple-500/20 text-purple-300 border-purple-500/40", label: "Very Unhealthy" };
    return { bg: "bg-rose-950/70 text-rose-300 border-rose-500/60", label: "Hazardous" };
  };

  const formatChartData = () => {
    if (!airData) return [];
    const points = airData.hourly_forecast.slice(0, horizonView);
    return points.map((pt) => {
      let timeLabel = pt.time_iso.slice(11, 16);
      return {
        time: timeLabel,
        aqi: Math.round(pt.aqi),
        pm2_5: pt.pm2_5 ? Math.round(pt.pm2_5) : 0,
        pm10: pt.pm10 ? Math.round(pt.pm10) : 0,
        category: pt.category,
      };
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-8">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col gap-4 border-b border-[#1B2B3E] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Air Quality Command Center
            </h1>
            <span className="rounded-full bg-[#149A86]/20 px-2.5 py-0.5 text-xs font-semibold text-[#75D9D0]">
              Real Environmental Intelligence
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Monitoring {selectedCity.name}, {selectedCity.country} • Updated from Open-Meteo Atmospheric Forecast
          </p>
        </div>

        {/* Location Search Bar */}
        <div className="relative">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Change city..."
                className="rounded-xl border border-[#1B2B3E] bg-[#0D1624] py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-[#149A86] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl border border-[#1B2B3E] bg-[#142336] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1B2B3E]"
            >
              Search
            </button>
            <button
              onClick={() => loadDashboard(selectedCity)}
              className="rounded-xl border border-[#1B2B3E] bg-[#142336] p-2 text-slate-300 hover:text-white"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#149A86]" : ""}`} />
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-[#1B2B3E] bg-[#0D1624] p-1.5 shadow-2xl">
              {searchResults.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedCity(loc);
                    setSearchResults([]);
                    setSearchQuery("");
                  }}
                  className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-[#142336] flex justify-between"
                >
                  <span>{loc.name}, {loc.country}</span>
                  <span className="text-slate-500">{loc.admin1}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {airData && (
        <>
          {/* Hero Conditions & Metric Cards Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main AQI Hero Card */}
            <div className="rounded-2xl border border-[#1B2B3E] bg-gradient-to-br from-[#0D1624] to-[#121D2F] p-6 lg:col-span-2 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-[#149A86]" />
                    <span className="text-sm font-bold text-white">
                      {airData.location.name}, {airData.location.country}
                    </span>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      getAQIBadge(airData.current.aqi).bg
                    }`}
                  >
                    {airData.current.category}
                  </span>
                </div>

                <div className="mt-6 flex items-baseline gap-4">
                  <span
                    className="text-6xl font-black tracking-tight"
                    style={{ color: getAQIColor(airData.current.aqi) }}
                  >
                    {Math.round(airData.current.aqi)}
                  </span>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      U.S. AQI (Model-Based)
                    </span>
                    <p className="text-xs text-slate-300">
                      Dominant Pollutant: <span className="font-bold text-white">{airData.current.dominant_pollutant}</span>
                    </p>
                  </div>
                </div>

                {/* Plain-Language Interpretation */}
                <div className="mt-5 rounded-xl border border-[#1B2B3E] bg-[#070C14]/80 p-3.5">
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {airData.current.summary_text}
                  </p>
                </div>
              </div>

              {/* Weather & Meteorological Context Row */}
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#1B2B3E] pt-4 sm:grid-cols-4 text-xs">
                <div>
                  <span className="text-slate-400">PM2.5 Conc.</span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {airData.current.pollutants.pm2_5 ? `${airData.current.pollutants.pm2_5} µg/m³` : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">PM10 Conc.</span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {airData.current.pollutants.pm10 ? `${airData.current.pollutants.pm10} µg/m³` : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Temperature</span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {airData.current.weather.temperature_c !== null ? `${airData.current.weather.temperature_c} °C` : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Wind Speed</span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {airData.current.weather.wind_speed_kmh !== null ? `${airData.current.weather.wind_speed_kmh} km/h` : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Cleaner Window Card (Flagship algorithm insight) */}
            <div className="rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#E8AD4A]">
                  <Sun className="h-4 w-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Relatively Cleaner Window</h3>
                </div>

                {airData.cleaner_windows.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-[#E8AD4A]/30 bg-[#E8AD4A]/10 p-3.5">
                      <span className="text-xs text-[#E8AD4A] font-semibold">Optimal Atmospheric Dispersion</span>
                      <p className="text-2xl font-extrabold text-white mt-1">
                        {airData.cleaner_windows[0].start_time} - {airData.cleaner_windows[0].end_time}
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        Average AQI: {airData.cleaner_windows[0].avg_aqi} ({airData.cleaner_windows[0].category})
                      </p>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {airData.cleaner_windows[0].guidance}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-slate-400">
                    No significantly cleaner window detected in the upcoming 24 hours. Consider shifting all exercise indoors.
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-[#1B2B3E] pt-3">
                <a
                  href="/planner"
                  className="flex items-center justify-between text-xs font-semibold text-[#75D9D0] hover:underline"
                >
                  <span>Reorganize daily activities around this window</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Timeline Chart Section */}
          <div className="rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-6 shadow-xl space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#149A86]" />
                  Hourly Air Quality Forecast Timeline
                </h3>
                <p className="text-xs text-slate-400">
                  Scrub across the upcoming hours to inspect diurnal winter smog trends and solar dispersion peaks.
                </p>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-2">
                {/* Metric Selector */}
                <div className="flex rounded-lg border border-[#1B2B3E] bg-[#070C14] p-0.5 text-xs font-medium">
                  <button
                    onClick={() => setMetricView("aqi")}
                    className={`rounded-md px-2.5 py-1 ${metricView === "aqi" ? "bg-[#149A86] text-white" : "text-slate-400"}`}
                  >
                    AQI
                  </button>
                  <button
                    onClick={() => setMetricView("pm2_5")}
                    className={`rounded-md px-2.5 py-1 ${metricView === "pm2_5" ? "bg-[#149A86] text-white" : "text-slate-400"}`}
                  >
                    PM2.5
                  </button>
                  <button
                    onClick={() => setMetricView("pm10")}
                    className={`rounded-md px-2.5 py-1 ${metricView === "pm10" ? "bg-[#149A86] text-white" : "text-slate-400"}`}
                  >
                    PM10
                  </button>
                </div>

                {/* Horizon Selector */}
                <div className="flex rounded-lg border border-[#1B2B3E] bg-[#070C14] p-0.5 text-xs font-medium">
                  <button
                    onClick={() => setHorizonView(24)}
                    className={`rounded-md px-2.5 py-1 ${horizonView === 24 ? "bg-[#142336] text-[#75D9D0]" : "text-slate-400"}`}
                  >
                    24h
                  </button>
                  <button
                    onClick={() => setHorizonView(48)}
                    className={`rounded-md px-2.5 py-1 ${horizonView === 48 ? "bg-[#142336] text-[#75D9D0]" : "text-slate-400"}`}
                  >
                    48h
                  </button>
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formatChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#149A86" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#149A86" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-[#1B2B3E] bg-[#0B1220] p-3 text-xs shadow-xl">
                            <span className="font-bold text-white">{d.time}</span>
                            <p className="mt-1 text-slate-300">
                              {metricView.toUpperCase()}: <span className="font-bold text-[#75D9D0]">{d[metricView]}</span>
                            </p>
                            <p className="text-slate-400">{d.category}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Reference threshold lines */}
                  {metricView === "aqi" && (
                    <>
                      <ReferenceLine y={100} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: "Moderate (100)", fill: "#F59E0B", fontSize: 10 }} />
                      <ReferenceLine y={200} stroke="#EF4444" strokeDasharray="3 3" label={{ value: "Unhealthy (200)", fill: "#EF4444", fontSize: 10 }} />
                      <ReferenceLine y={300} stroke="#E11D48" strokeDasharray="3 3" label={{ value: "Hazardous (300)", fill: "#E11D48", fontSize: 10 }} />
                    </>
                  )}
                  <Area
                    type="monotone"
                    dataKey={metricView}
                    stroke="#149A86"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#metricGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Accessible Tabular Forecast Alternative for Screen Readers */}
            <div className="border-t border-[#1B2B3E] pt-3">
              <details className="group">
                <summary className="cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-200 focus:outline-none focus:underline">
                  View accessible tabular forecast data ({horizonView} hours)
                </summary>
                <div className="mt-2.5 max-h-48 overflow-y-auto rounded-xl border border-[#1B2B3E] bg-[#070C14]">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <caption className="sr-only">Hourly Air Quality Forecast Table</caption>
                    <thead className="sticky top-0 bg-[#0D1624] text-slate-400 border-b border-[#1B2B3E]">
                      <tr>
                        <th scope="col" className="px-3 py-1.5 font-semibold">Time</th>
                        <th scope="col" className="px-3 py-1.5 font-semibold">AQI</th>
                        <th scope="col" className="px-3 py-1.5 font-semibold">PM2.5 (µg/m³)</th>
                        <th scope="col" className="px-3 py-1.5 font-semibold">PM10 (µg/m³)</th>
                        <th scope="col" className="px-3 py-1.5 font-semibold">Health Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B2B3E]">
                      {formatChartData().map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#142336]/40">
                          <td className="px-3 py-1 font-mono text-slate-200">{row.time}</td>
                          <td className="px-3 py-1 font-semibold">{row.aqi}</td>
                          <td className="px-3 py-1">{row.pm2_5}</td>
                          <td className="px-3 py-1">{row.pm10}</td>
                          <td className="px-3 py-1">{row.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          </div>

          {/* Priority Action Cards (Deterministic Rule Engine Output) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#149A86]" />
                  Priority Actions for Today
                </h3>
                <p className="text-xs text-slate-400">
                  Data-driven actions prioritized by environmental risk, household vulnerability, and feasibility.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-5 shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#149A86]/20 px-2 py-0.5 text-[10px] font-semibold text-[#75D9D0] uppercase">
                        {rec.category.replace("_", " ")}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          rec.priority === "high"
                            ? "bg-rose-500/20 text-rose-300"
                            : rec.priority === "medium"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-blue-500/20 text-blue-300"
                        }`}
                      >
                        {rec.priority} Priority
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">{rec.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{rec.action}</p>

                    <div className="rounded-lg bg-[#070C14] p-2.5 text-[11px] text-slate-400 leading-relaxed border border-[#1B2B3E]/60">
                      <span className="font-semibold text-slate-300">Why this matters: </span>
                      {rec.explanation}
                    </div>

                    {rec.caveat && (
                      <p className="text-[10px] text-slate-500 italic">Caveat: {rec.caveat}</p>
                    )}
                  </div>

                  <button
                    onClick={() => setAppliedAction(rec.id)}
                    className={`w-full rounded-xl py-2 text-xs font-semibold transition-all ${
                      appliedAction === rec.id
                        ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50"
                        : "bg-[#142336] text-slate-200 hover:bg-[#1B2B3E]"
                    }`}
                  >
                    {appliedAction === rec.id ? "✓ Action Noted in Routine" : rec.action_label}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Educational Explanations Section ("Why the air feels different") */}
          <div className="rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#75D9D0]" />
              Why the Air Feels Different: Atmospheric Mechanics
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-xs">
              <div className="rounded-xl border border-[#1B2B3E] bg-[#070C14] p-4 space-y-2">
                <span className="font-bold text-[#E8AD4A]">Winter Thermal Inversion</span>
                <p className="text-slate-300 leading-relaxed">
                  During clear winter nights, ground radiative cooling creates a layer of cold, dense air near the surface
                  trapped beneath warmer air aloft. This acts as a lid, preventing vertical smoke dispersion until afternoon solar warming.
                </p>
              </div>
              <div className="rounded-xl border border-[#1B2B3E] bg-[#070C14] p-4 space-y-2">
                <span className="font-bold text-[#75D9D0]">Atmospheric Stagnation</span>
                <p className="text-slate-300 leading-relaxed">
                  Surface wind speeds below 5 km/h limit horizontal advection. Without ventilation, local emissions from vehicles,
                  cooking, and industry accumulate hour-after-hour directly within living zones.
                </p>
              </div>
              <div className="rounded-xl border border-[#1B2B3E] bg-[#070C14] p-4 space-y-2">
                <span className="font-bold text-rose-400">Secondary Particulate Aerosols</span>
                <p className="text-slate-300 leading-relaxed">
                  High nocturnal humidity ({airData.current.weather.relative_humidity_pct || 80}%) facilitates chemical gas-to-particle
                  conversion, transforming gaseous NO2 and SO2 into ultrafine secondary ammonium nitrate and sulfate particulates.
                </p>
              </div>
            </div>
          </div>

          {/* Provenance & Scientific Integrity Disclosure */}
          <div className="rounded-xl border border-[#1B2B3E] bg-[#0B1220] p-4 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <ShieldAlert className="h-3.5 w-3.5 text-[#149A86]" />
              <span>Scientific Data Provenance & Methodology Integrity</span>
            </div>
            <p>
              Provider: {airData.provenance.provider} • Standard: {airData.provenance.standard_label} • Timestamp: {airData.provenance.timestamp_utc}
            </p>
            <p className="text-slate-500">
              {airData.provenance.indian_standard_note}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
