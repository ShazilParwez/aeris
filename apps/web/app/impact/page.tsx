"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  Wind,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info,
  Car,
  Bus,
  Train,
  Bike,
  Footprints,
  Laptop,
} from "lucide-react";
import { compareTransport } from "../../lib/api";
import { TransportComparisonResponse } from "../../lib/types";

export default function ImpactPage() {
  const [distance, setDistance] = useState<number>(14);
  const [baselineMode, setBaselineMode] = useState<string>("private_car");
  const [alternativeMode, setAlternativeMode] = useState<string>("metro_train");
  const [ambientPm25, setAmbientPm25] = useState<number>(180);
  const [comparison, setComparison] = useState<TransportComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const modes = [
    { id: "private_car", label: "Private Car", icon: Car },
    { id: "public_bus", label: "Public Bus", icon: Bus },
    { id: "metro_train", label: "Electric Metro", icon: Train },
    { id: "cycling", label: "Cycling", icon: Bike },
    { id: "walking", label: "Walking", icon: Footprints },
    { id: "work_from_home", label: "Remote Work (WFH)", icon: Laptop },
  ];

  useEffect(() => {
    runComparison();
  }, [distance, baselineMode, alternativeMode, ambientPm25]);

  const runComparison = async () => {
    setLoading(true);
    try {
      const res = await compareTransport(baselineMode, alternativeMode, distance, ambientPm25);
      setComparison(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="border-b border-[#1B2B3E] pb-6">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-rose-400" />
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Low-Emission Routine Optimizer
          </h1>
        </div>
        <p className="mt-1 text-xs text-slate-400 max-w-2xl">
          Evaluate sustainable commute alternatives using our Two-Dimensional Decision Model. AERIS balances carbon
          reduction against personal respiratory particulate intake to prevent unsafe choices during severe winter smog.
        </p>
      </div>

      {/* Interactive Controls Panel */}
      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-6 shadow-xl lg:grid-cols-3">
        {/* Distance Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">Trip Distance</span>
            <span className="text-[#75D9D0] font-bold">{distance} km</span>
          </div>
          <input
            type="range"
            min="2"
            max="40"
            step="1"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="w-full accent-[#149A86] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Short (2 km)</span>
            <span>Typical Commute (15 km)</span>
            <span>Regional (40 km)</span>
          </div>
        </div>

        {/* Ambient PM2.5 Scenario Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">Ambient PM2.5 Scenario</span>
            <span className="text-[#E8AD4A] font-bold">{ambientPm25} µg/m³</span>
          </div>
          <input
            type="range"
            min="30"
            max="350"
            step="10"
            value={ambientPm25}
            onChange={(e) => setAmbientPm25(Number(e.target.value))}
            className="w-full accent-[#E8AD4A] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Moderate (50)</span>
            <span>Severe Smog (180)</span>
            <span>Hazardous (300+)</span>
          </div>
        </div>

        {/* Mode Selector Dropdowns */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Baseline Routine</label>
            <select
              value={baselineMode}
              onChange={(e) => setBaselineMode(e.target.value)}
              className="w-full rounded-xl border border-[#1B2B3E] bg-[#070C14] px-3 py-2 text-white focus:outline-none"
            >
              {modes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#75D9D0] font-semibold mb-1">Green Alternative</label>
            <select
              value={alternativeMode}
              onChange={(e) => setAlternativeMode(e.target.value)}
              className="w-full rounded-xl border border-[#149A86] bg-[#070C14] px-3 py-2 text-white focus:outline-none"
            >
              {modes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Two-Dimensional Model Output Cards */}
      {comparison && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Dimension 1: Environmental Carbon Emissions */}
            <div className="rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1B2B3E] pb-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <TrendingDown className="h-5 w-5" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Dimension 1: Carbon Emissions</h3>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                  -{comparison.co2_reduction_pct}% CO2
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400">Baseline ({comparison.baseline.mode_label})</span>
                  <p className="text-xl font-extrabold text-slate-200">
                    {comparison.baseline.estimated_co2_kg} kg CO2
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-400">Alternative ({comparison.alternative.mode_label})</span>
                  <p className="text-2xl font-black text-emerald-400">
                    {comparison.alternative.estimated_co2_kg} kg CO2
                  </p>
                </div>

                <div className="rounded-xl bg-[#070C14] p-3 text-xs text-slate-300 border border-[#1B2B3E]/60">
                  Net Climate Benefit: Saves <span className="font-bold text-white">{comparison.co2_saved_kg} kg CO2</span> per single commute leg.
                </div>
              </div>
            </div>

            {/* Dimension 2: Personal Inhalation Exposure Index */}
            <div className="rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1B2B3E] pb-3">
                <div className="flex items-center gap-2 text-[#E8AD4A]">
                  <Wind className="h-5 w-5" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Dimension 2: Personal Inhaled Dose</h3>
                </div>
                <span className="rounded-full bg-[#E8AD4A]/20 px-2.5 py-0.5 text-xs font-bold text-[#E8AD4A]">
                  Exposure Index
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400">Baseline Inhaled Dose Index</span>
                  <p className="text-xl font-extrabold text-slate-200">
                    {comparison.baseline.relative_exposure_index} pts ({comparison.baseline.estimated_duration_min} min)
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-400">Alternative Inhaled Dose Index</span>
                  <p className="text-2xl font-black text-[#75D9D0]">
                    {comparison.alternative.relative_exposure_index} pts ({comparison.alternative.estimated_duration_min} min)
                  </p>
                </div>

                <div className="rounded-xl bg-[#070C14] p-3 text-xs text-slate-300 border border-[#1B2B3E]/60">
                  {comparison.exposure_comparison_text}
                </div>
              </div>
            </div>
          </div>

          {/* 2D Reconciliation Card */}
          <div className="rounded-2xl border border-[#149A86]/50 bg-gradient-to-r from-[#0D1624] to-[#121D2F] p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-[#75D9D0]">
              <ShieldCheck className="h-5 w-5 text-[#149A86]" />
              <h3 className="text-sm font-bold uppercase tracking-wider">AERIS Reconciliation Guidance</h3>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {comparison.reconciliation_advice}
            </p>
          </div>

          {/* Transparent Methodology & Assumptions Disclosures */}
          <div className="rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-400" />
              Documented Emission & Exposure Modeling Assumptions
            </h4>
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 text-xs text-slate-400">
              {comparison.data_assumptions.map((assump, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-[#149A86] flex-shrink-0" />
                  <span>{assump}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
