"use client";

import React, { useState, useEffect } from "react";
import {
  Home,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Flame,
  Wind,
  ShieldCheck,
  Tag,
  DollarSign,
  Info,
} from "lucide-react";

interface PlaybookTask {
  id: string;
  category: "cooking" | "cleaning" | "ventilation" | "purification" | "protection";
  room: "kitchen" | "bedroom" | "living" | "entry";
  title: string;
  action: string;
  scientific_reason: string;
  expected_benefit: string;
  cost_tier: "zero_cost" | "low_cost" | "equipment_required";
  equipment?: string;
  renter_friendly: boolean;
}

const PLAYBOOK_TASKS: PlaybookTask[] = [
  {
    id: "cook-1",
    category: "cooking",
    room: "kitchen",
    title: "The 2-Minute Pre-Exhaust Protocol",
    action: "Turn on the kitchen exhaust fan or range hood 2 minutes BEFORE lighting stoves and leave it on 5 minutes after cooking completes.",
    scientific_reason: "Initial oil heating and spice frying release peak ultrafine particle numbers (<100 nm). Pre-running exhaust establishes convective airflow patterns before plumes disperse into living areas.",
    expected_benefit: "Reduces peak kitchen-to-living room particle migration by up to 50%.",
    cost_tier: "zero_cost",
    renter_friendly: true,
  },
  {
    id: "cook-2",
    category: "cooking",
    room: "kitchen",
    title: "Isolate Living Areas During High-Heat Cooking",
    action: "Close internal doors separating the kitchen from bedrooms and living rooms during frying, searing, or roasting.",
    scientific_reason: "Frying oils generate particulate concentrations often exceeding 300 µg/m³. Without physical compartment doors, these settle into soft fabrics and mattresses, becoming secondary emission reservoirs.",
    expected_benefit: "Protects sleeping quarters from elevated cooking aerosol deposition.",
    cost_tier: "zero_cost",
    renter_friendly: true,
  },
  {
    id: "clean-1",
    category: "cleaning",
    room: "living",
    title: "Damp-Dusting Over Dry Brooming",
    action: "Always use damp microfiber cloths and wet mopping instead of dry feather dusters or traditional straw brooms.",
    scientific_reason: "Dry brooming generates shear forces that resuspend settled coarse particles (PM10) and biological allergens into the breathing zone for 2 to 4 hours.",
    expected_benefit: "Captures and locks settled particulates without aerodynamic resuspension.",
    cost_tier: "zero_cost",
    renter_friendly: true,
  },
  {
    id: "vent-1",
    category: "ventilation",
    room: "living",
    title: "Timed Afternoon Cross-Ventilation Flush",
    action: "Do not open windows in the morning (06:00–10:00). Conduct a single 10–15 minute cross-ventilation flush between 13:30 and 15:00, then seal immediately.",
    scientific_reason: "Ground-level nocturnal temperature inversions trap smog near windows until midday. Solar heating breaks the inversion by 13:00, creating a temporary cleaner outdoor dilution window to flush indoor CO2.",
    expected_benefit: "Prevents hazardous morning particulate infiltration while relieving indoor CO2 and moisture buildup.",
    cost_tier: "zero_cost",
    renter_friendly: true,
  },
  {
    id: "purif-1",
    category: "purification",
    room: "bedroom",
    title: "CADR-Matched HEPA Bedroom Priority",
    action: "If you own only one air purifier, place it in the smallest bedroom where family members sleep for 8 continuous hours, rather than a large open living room.",
    scientific_reason: "Clean Air Delivery Rate (CADR) determines air changes per hour (ACH). A 250 m³/h purifier achieves 4–5 ACH in a closed 150 sq ft bedroom, achieving 90%+ PM2.5 reduction, whereas in a 600 sq ft open space ACH drops below 1.5.",
    expected_benefit: "Ensures 8 uninterrupted hours of low-exposure recovery sleep for lungs.",
    cost_tier: "equipment_required",
    equipment: "True HEPA Air Purifier (CADR ~200-300 m³/h)",
    renter_friendly: true,
  },
  {
    id: "prot-1",
    category: "protection",
    room: "entry",
    title: "Airtight Seal Check on Particulate Respirators",
    action: "Wear certified N95, FFP2, or KF94 respirators for outdoor transit. Perform a negative pressure seal check (inhale gently to ensure mask collapses inward without edge leakage).",
    scientific_reason: "Cloth and standard surgical masks filter coarse droplets but allow up to 80% of fine submicron PM2.5 particles to bypass through facial edge gaps.",
    expected_benefit: "Filters >95% of fine particulate matter when correctly sealed.",
    cost_tier: "low_cost",
    equipment: "Certified N95 / FFP2 Respirator",
    renter_friendly: true,
  },
];

export default function HomeAirPage() {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeRoom, setActiveRoom] = useState<string>("all");

  useEffect(() => {
    const saved = localStorage.getItem("aeris_home_air_tasks");
    if (saved) {
      try {
        setCompletedIds(new Set(JSON.parse(saved)));
      } catch (e) {}
    }
  }, []);

  const handleToggle = (id: string) => {
    const next = new Set(completedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCompletedIds(next);
    localStorage.setItem("aeris_home_air_tasks", JSON.stringify(Array.from(next)));
  };

  const handleReset = () => {
    setCompletedIds(new Set());
    localStorage.removeItem("aeris_home_air_tasks");
  };

  const filteredTasks = PLAYBOOK_TASKS.filter((task) => {
    if (activeCategory !== "all" && task.category !== activeCategory) return false;
    if (activeRoom !== "all" && task.room !== activeRoom) return false;
    return true;
  });

  const getCostBadge = (tier: string) => {
    if (tier === "zero_cost") return { text: "Zero Cost Behavior", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    if (tier === "low_cost") return { text: "Low Cost (<$5)", bg: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
    return { text: "Equipment", bg: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
  };

  const completionPct = Math.round((completedIds.size / PLAYBOOK_TASKS.length) * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[#1B2B3E] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-[#149A86]" />
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Indoor Air Quality Playbook
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            Evidence-based exposure reduction hacks for households navigating severe winter smog. Focuses on zero-cost
            behavior modifications, cooking ventilation, timed window flushes, and practical renter solutions.
          </p>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-[#1B2B3E] bg-[#0D1624] px-4 py-2 text-xs">
            <CheckCircle2 className="h-4 w-4 text-[#149A86]" />
            <span className="text-white font-bold">{completedIds.size} / {PLAYBOOK_TASKS.length} Protected</span>
            <span className="text-slate-400">({completionPct}%)</span>
          </div>
          {completedIds.size > 0 && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Scientific Integrity Notice on Indoor Sensors */}
      <div className="rounded-xl border border-[#1B2B3E] bg-[#0D1624] p-4 text-xs text-slate-300 flex items-start gap-3">
        <Info className="h-4 w-4 text-[#149A86] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Scientific Measurement Disclosure: </span>
          Without a calibrated physical indoor PM2.5 monitor in your home, AERIS strictly refuses to display fabricated
          or fake indoor AQI numbers. All guidance below reflects validated aerosol physics, room ventilation dynamics,
          and filtration science.
        </div>
      </div>

      {/* Category & Room Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1B2B3E] pb-4">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: "all", label: "All Protocols" },
            { id: "cooking", label: "Cooking Smoke" },
            { id: "cleaning", label: "Cleaning & Dust" },
            { id: "ventilation", label: "Ventilation" },
            { id: "purification", label: "Air Purifiers" },
            { id: "protection", label: "Respirator Masks" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-[#149A86] text-white"
                  : "bg-[#0D1624] text-slate-400 hover:bg-[#142336] hover:text-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Room Filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Room:</span>
          <select
            value={activeRoom}
            onChange={(e) => setActiveRoom(e.target.value)}
            className="rounded-lg border border-[#1B2B3E] bg-[#0D1624] px-2.5 py-1 text-slate-200 focus:outline-none"
          >
            <option value="all">All Rooms</option>
            <option value="kitchen">Kitchen</option>
            <option value="bedroom">Bedroom</option>
            <option value="living">Living Room</option>
            <option value="entry">Entryway</option>
          </select>
        </div>
      </div>

      {/* Checklist Tasks Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredTasks.map((task) => {
          const isDone = completedIds.has(task.id);
          const cost = getCostBadge(task.cost_tier);
          return (
            <div
              key={task.id}
              onClick={() => handleToggle(task.id)}
              className={`cursor-pointer rounded-2xl border p-5 transition-all shadow-md flex flex-col justify-between ${
                isDone
                  ? "border-[#149A86]/50 bg-[#0B1522]"
                  : "border-[#1B2B3E] bg-[#0D1624] hover:border-[#149A86]/30 hover:bg-[#121D2F]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                        isDone
                          ? "border-[#149A86] bg-[#149A86] text-white"
                          : "border-slate-600 bg-[#070C14]"
                      }`}
                    >
                      {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <h3 className={`text-sm font-bold ${isDone ? "text-[#75D9D0]" : "text-white"}`}>
                      {task.title}
                    </h3>
                  </div>

                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cost.bg}`}>
                    {cost.text}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-300 leading-relaxed font-medium">
                  {task.action}
                </p>

                <div className="mt-3 rounded-xl bg-[#070C14] p-3 text-[11px] text-slate-400 space-y-1.5 border border-[#1B2B3E]/60">
                  <p>
                    <span className="font-semibold text-[#75D9D0]">Aerosol Science: </span>
                    {task.scientific_reason}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Expected Benefit: </span>
                    {task.expected_benefit}
                  </p>
                  {task.equipment && (
                    <p className="text-slate-500">
                      Required Item: {task.equipment}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#1B2B3E] pt-3 text-[11px] text-slate-400">
                <span className="capitalize">Room: {task.room}</span>
                <span className="text-[#149A86] font-semibold">
                  {isDone ? "✓ Implemented" : "Click to mark implemented"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Common Scientific Myths Debunked Box */}
      <div className="rounded-2xl border border-[#1B2B3E] bg-[#0D1624] p-6 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#E8AD4A]" />
          Science Truths: What Does NOT Work Against Severe Winter Smog
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-xs text-slate-300">
          <div className="rounded-xl border border-[#1B2B3E] bg-[#070C14] p-3.5">
            <span className="font-bold text-rose-400">Indoor Houseplants: </span>
            Common indoor plants (e.g. Snake plants, Areca palms) cannot filter hazardous outdoor PM2.5 smog. To match a
            single basic air purifier's clean air delivery, a room would require over 600 densely packed plants.
          </div>
          <div className="rounded-xl border border-[#1B2B3E] bg-[#070C14] p-3.5">
            <span className="font-bold text-rose-400">Cloth Masks & Bandanas: </span>
            Ordinary cotton bandanas and single-ply cloth masks only filter ~15–20% of submicron particles due to weave porosity
            and lack of electrostatically charged meltblown polypropylene fiber layers.
          </div>
        </div>
      </div>
    </div>
  );
}
