"use client";

import React, { useState, useEffect } from "react";
import {
  Wind,
  ShieldCheck,
  CalendarCheck2,
  Home,
  Flame,
  LineChart,
  ArrowRight,
  Compass,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { fetchAirQuality, fetchLocations } from "../lib/api";
import { AirQualityResponse, LocationItem } from "../lib/types";

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState<LocationItem>({
    name: "Delhi",
    country: "India",
    latitude: 28.6139,
    longitude: 77.209,
    timezone: "Asia/Kolkata",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [airData, setAirData] = useState<AirQualityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData(selectedCity);
  }, [selectedCity]);

  const loadData = async (loc: LocationItem) => {
    setLoading(true);
    try {
      const data = await fetchAirQuality(loc.latitude, loc.longitude, loc.name, loc.country, loc.timezone);
      setAirData(data);
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

  const getAQIBadge = (aqi: number) => {
    if (aqi <= 50) return { bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", label: "Good" };
    if (aqi <= 100) return { bg: "bg-amber-500/20 text-amber-400 border-amber-500/40", label: "Moderate" };
    if (aqi <= 150) return { bg: "bg-orange-500/20 text-orange-400 border-orange-500/40", label: "Unhealthy for Sensitive" };
    if (aqi <= 200) return { bg: "bg-red-500/20 text-red-400 border-red-500/40", label: "Unhealthy" };
    if (aqi <= 300) return { bg: "bg-purple-500/20 text-purple-400 border-purple-500/40", label: "Very Unhealthy" };
    return { bg: "bg-rose-950/60 text-rose-300 border-rose-500/50", label: "Hazardous" };
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-[#1B2B3E] bg-gradient-to-b from-[#0D1624] to-[#070C14] p-6 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#149A86]/40 bg-[#149A86]/10 px-3 py-1 text-xs font-semibold text-[#75D9D0]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Prompt Wars Challenge 6: Urban Air Quality Assistant</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-tight">
            Breathe Smarter. <br />
            <span className="bg-gradient-to-r from-[#75D9D0] to-[#149A86] bg-clip-text text-transparent">
              Clear choices for difficult air.
            </span>
          </h1>

          <p className="text-base text-slate-300 leading-relaxed sm:text-lg">
            AERIS translates complex atmospheric data into personalized daily decisions. Protect your family during
            severe winter smog, discover relatively cleaner activity windows, deploy low-cost indoor air hacks, and
            evaluate the real tradeoffs between emissions and personal exposure.
          </p>

          {/* Quick City Search Bar */}
          <div className="pt-2">
            <form onSubmit={handleSearch} className="flex max-w-md items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city (e.g., Delhi, Mumbai, Lahore, Beijing)..."
                  className="w-full rounded-xl border border-[#1B2B3E] bg-[#070C14] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-[#149A86] focus:outline-none focus:ring-1 focus:ring-[#75D9D0]"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-[#149A86] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0F7666]"
              >
                Search
              </button>
            </form>

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-w-md rounded-xl border border-[#1B2B3E] bg-[#0D1624] p-2 shadow-xl">
                {searchResults.map((loc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedCity(loc);
                      setSearchResults([]);
                      setSearchQuery("");
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-[#142336]"
                  >
                    <span>
                      {loc.name}, <span className="text-slate-400">{loc.country}</span>
                    </span>
                    <span className="text-xs text-slate-500">{loc.admin1}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Context Banner in Hero */}
        {airData && (
          <div className="mt-8 rounded-2xl border border-[#1B2B3E] bg-[#0B1220]/90 p-5 backdrop-blur-sm sm:flex sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#149A86]" />
                <span className="text-sm font-bold text-white">
                  {airData.location.name}, {airData.location.country}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    getAQIBadge(airData.current.aqi).bg
                  }`}
                >
                  {getAQIBadge(airData.current.aqi).label} (AQI {Math.round(airData.current.aqi)})
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl">{airData.current.summary_text}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <a
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-xl bg-[#149A86] px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-[#0F7666]"
              >
                <span>Command Center</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Core Product Promise Workflow */}
      <div className="mt-12 text-center">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#75D9D0]">The AERIS Workflow</h2>
        <p className="mt-1 text-xl font-bold text-white">
          Data → Interpretable Risk → Personal Decisions → Actionable Routines → Transparent Impact
        </p>
      </div>

      {/* 5 Core Feature Pillar Cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pillar 1: Command Center */}
        <a
          href="/dashboard"
          className="group relative flex flex-col justify-between rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-6 transition-all hover:border-[#149A86]/60 hover:bg-[#121D2F]"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#149A86]/20 text-[#75D9D0] mb-4">
              <Wind className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-[#75D9D0] transition-colors">
              Air Quality Command Center
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Full 48-hour interactive forecast scrubbing, dominant particulate breakdown, and automatic detection of
              relatively cleaner atmospheric dispersion windows.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#75D9D0]">
            <span>Explore Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </a>

        {/* Pillar 2: Cleaner Day Planner */}
        <a
          href="/planner"
          className="group relative flex flex-col justify-between rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-6 transition-all hover:border-[#149A86]/60 hover:bg-[#121D2F]"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8AD4A]/20 text-[#E8AD4A] mb-4">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-[#E8AD4A] transition-colors">
              The Cleaner Day Planner
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Flagship feature that dynamically reorganizes outdoor runs, school commutes, and errands around cleaner
              atmospheric windows to reduce personal particulate intake.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#E8AD4A]">
            <span>Reorganize Your Schedule</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </a>

        {/* Pillar 3: Indoor Air Playbook */}
        <a
          href="/home-air"
          className="group relative flex flex-col justify-between rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-6 transition-all hover:border-[#149A86]/60 hover:bg-[#121D2F]"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 mb-4">
              <Home className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
              Indoor Air Quality Playbook
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Actionable hacks for cooking smoke reduction, timed afternoon ventilation flushes, damp-dusting, and
              zero-cost strategies for renters and budget-conscious families.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-purple-400">
            <span>View Indoor Hacks</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </a>

        {/* Pillar 4: Low-Emission Optimizer */}
        <a
          href="/impact"
          className="group relative flex flex-col justify-between rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-6 transition-all hover:border-[#149A86]/60 hover:bg-[#121D2F]"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 mb-4">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
              Routine Impact & 2D Tradeoffs
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Calculates direct carbon savings vs personal inhalation exposure. Avoids naive assumptions by showing why
              Metro beats roadside cycling under severe winter smog.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-rose-400">
            <span>Compare Commute Impact</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </a>

        {/* Pillar 5: Forecast Lab */}
        <a
          href="/forecast-lab"
          className="group relative flex flex-col justify-between rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-6 transition-all hover:border-[#149A86]/60 hover:bg-[#121D2F]"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 mb-4">
              <LineChart className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
              AERIS Forecast Lab (Classical ML)
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Real scikit-learn regression model trained on 1,080 hours of verified Delhi winter data. 3-hour lead PM2.5
              prediction with honest persistence baseline comparison and permutation importances.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-cyan-400">
            <span>Inspect ML Model</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </a>

        {/* Pillar 6: Ask AERIS */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-[#1B2B3E] bg-gradient-to-br from-[#142336] to-[#0D1624] p-6">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#75D9D0]/20 text-[#75D9D0] mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Ask AERIS Assistant</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Context-grounded guidance powered by Gemini 2.5 Flash and robust deterministic expert fallbacks. Answers
              natural language questions without hallucinating data.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#75D9D0]">
            <span>Click 'Ask AERIS' at the top bar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
