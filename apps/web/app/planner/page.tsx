"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck2,
  Clock,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Share2,
  RotateCcw,
  AlertCircle,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { optimizeSchedule } from "../../lib/api";
import { ActivityItem, OptimizedActivity, PlannerOptimizeResponse } from "../../lib/types";

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    title: "Morning Cardio Run",
    preferred_time: "07:00",
    duration_minutes: 45,
    is_outdoor: true,
    is_fixed: false,
    priority: "high",
  },
  {
    id: "act-2",
    title: "School Drop-off",
    preferred_time: "08:15",
    duration_minutes: 30,
    is_outdoor: true,
    is_fixed: true,
    priority: "high",
  },
  {
    id: "act-3",
    title: "Office Transit Commute",
    preferred_time: "09:00",
    duration_minutes: 45,
    is_outdoor: true,
    is_fixed: true,
    priority: "high",
  },
  {
    id: "act-4",
    title: "Evening Neighborhood Walk",
    preferred_time: "18:30",
    duration_minutes: 40,
    is_outdoor: true,
    is_fixed: false,
    priority: "medium",
  },
  {
    id: "act-5",
    title: "Grocery Shopping",
    preferred_time: "17:00",
    duration_minutes: 30,
    is_outdoor: true,
    is_fixed: false,
    priority: "low",
  },
];

export default function PlannerPage() {
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [optimization, setOptimization] = useState<PlannerOptimizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

  // Form state for adding new activity
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("14:00");
  const [newDuration, setNewDuration] = useState(30);
  const [newIsOutdoor, setNewIsOutdoor] = useState(true);
  const [newIsFixed, setNewIsFixed] = useState(false);

  // Load saved plan from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem("aeris_saved_plan");
    if (saved) {
      try {
        setActivities(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSaveToLocal = (acts: ActivityItem[]) => {
    localStorage.setItem("aeris_saved_plan", JSON.stringify(acts));
  };

  const handleToggleFixed = (id: string) => {
    const updated = activities.map((a) => (a.id === id ? { ...a, is_fixed: !a.is_fixed } : a));
    setActivities(updated);
    handleSaveToLocal(updated);
  };

  const handleDeleteActivity = (id: string) => {
    const updated = activities.filter((a) => a.id !== id);
    setActivities(updated);
    handleSaveToLocal(updated);
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const item: ActivityItem = {
      id: `act-${Date.now()}`,
      title: newTitle.trim(),
      preferred_time: newTime,
      duration_minutes: Number(newDuration),
      is_outdoor: newIsOutdoor,
      is_fixed: newIsFixed,
      priority: "medium",
    };
    const updated = [...activities, item];
    setActivities(updated);
    handleSaveToLocal(updated);
    setShowAddModal(false);
    setNewTitle("");
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await optimizeSchedule(activities, 28.6139, 77.209);
      setOptimization(res);
      // Auto-accept suggestions initially
      setAcceptedIds(new Set(res.suggested_activities.map((s) => s.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccept = (id: string) => {
    const next = new Set(acceptedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setAcceptedIds(next);
  };

  const handleExportSummary = () => {
    if (!optimization) return;
    const lines = [
      "AERIS CLEANER DAY PLAN SUMMARY",
      `Estimated Daily Personal Exposure Reduction: ${optimization.total_exposure_reduction_pct}%`,
      `Best Cleaner Window Used: ${optimization.best_cleaner_window || "Early Afternoon"}`,
      "",
      "OPTIMIZED SCHEDULE:",
      ...optimization.suggested_activities.map(
        (a) =>
          `- ${a.title}: ${a.suggested_time} (${a.status.toUpperCase()}) | Original: ${a.original_time} | Rationale: ${a.change_rationale}`
      ),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[#1B2B3E] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="h-6 w-6 text-[#149A86]" />
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              The Cleaner Day Planner
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            Reorganize your routine around real atmospheric dispersion peaks. Fixed commitments (school, office) are
            strictly respected while flexible activities are shifted to reduce particulate inhalation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[#1B2B3E] bg-[#0D1624] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-[#142336] transition-colors"
          >
            <Plus className="h-4 w-4 text-[#149A86]" />
            <span>Add Activity</span>
          </button>
          <button
            onClick={handleOptimize}
            disabled={loading || activities.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#149A86] to-[#0F7666] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#149A86]/20 transition-all hover:brightness-110 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-[#75D9D0]" />
            <span>{loading ? "Analyzing Forecast..." : "Optimize Schedule"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Current Routine vs Optimization Result */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Activity List & Constraints (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Your Planned Schedule</span>
              <span className="rounded-full bg-[#1B2B3E] px-2 py-0.5 text-[11px] text-slate-400">
                {activities.length} activities
              </span>
            </h2>
            <button
              onClick={() => {
                setActivities(INITIAL_ACTIVITIES);
                handleSaveToLocal(INITIAL_ACTIVITIES);
                setOptimization(null);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>

          <div className="space-y-2.5">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between rounded-xl border border-[#1B2B3E] bg-[#0D1624] p-3.5 shadow-sm transition-all hover:border-[#149A86]/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{act.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        act.is_outdoor
                          ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                      }`}
                    >
                      {act.is_outdoor ? "Outdoor" : "Indoor"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {act.preferred_time}
                    </span>
                    <span>• {act.duration_minutes} min</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleFixed(act.id)}
                    title={act.is_fixed ? "Fixed constraint (cannot reschedule)" : "Flexible time (can reschedule)"}
                    className={`rounded-lg p-2 text-xs transition-colors ${
                      act.is_fixed
                        ? "bg-[#142336] text-[#75D9D0] ring-1 ring-[#149A86]"
                        : "text-slate-500 hover:bg-[#142336] hover:text-slate-300"
                    }`}
                  >
                    {act.is_fixed ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteActivity(act.id)}
                    title="Remove activity"
                    className="rounded-lg p-2 text-slate-500 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Suggested Plan & Impact Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {optimization ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Impact Banner */}
              <div className="rounded-2xl border border-[#149A86]/40 bg-gradient-to-br from-[#0D1624] to-[#121D2F] p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#75D9D0]">
                    <ShieldCheck className="h-5 w-5 text-[#149A86]" />
                    <span className="text-xs font-bold uppercase tracking-wider">Estimated Inhalation Impact</span>
                  </div>
                  <p className="text-2xl font-black text-white">
                    -{optimization.total_exposure_reduction_pct}% Personal Exposure Reduction
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                    {optimization.overall_rationale}
                  </p>
                </div>

                <button
                  onClick={handleExportSummary}
                  className="flex items-center gap-1.5 rounded-xl border border-[#1B2B3E] bg-[#142336] px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1B2B3E] transition-colors flex-shrink-0"
                >
                  <Share2 className="h-3.5 w-3.5 text-[#149A86]" />
                  <span>{copied ? "Copied to Clipboard!" : "Export Summary"}</span>
                </button>
              </div>

              {/* Side-by-side comparison table / cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Original Plan vs AERIS Suggested Schedule
                </h3>

                <div className="space-y-3">
                  {optimization.suggested_activities.map((sug) => {
                    const isAccepted = acceptedIds.has(sug.id);
                    return (
                      <div
                        key={sug.id}
                        className={`rounded-xl border p-4 transition-all ${
                          isAccepted
                            ? "border-[#1B2B3E] bg-[#0D1624]"
                            : "border-slate-800 bg-[#070C14] opacity-50"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{sug.title}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  sug.status === "shifted"
                                    ? "bg-[#E8AD4A]/20 text-[#E8AD4A]"
                                    : sug.status === "moved_indoors"
                                    ? "bg-purple-500/20 text-purple-300"
                                    : "bg-slate-700/30 text-slate-400"
                                }`}
                              >
                                {sug.status.replace("_", " ")}
                              </span>
                              {sug.relative_exposure_delta_pct > 0 && (
                                <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
                                  -{sug.relative_exposure_delta_pct}% dose
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                              <span className="line-through text-slate-500">{sug.original_time} (AQI {Math.round(sug.original_aqi)})</span>
                              <ArrowRight className="h-3 w-3 text-[#149A86]" />
                              <span className="font-bold text-[#75D9D0]">
                                {sug.suggested_time} (AQI {Math.round(sug.suggested_aqi)})
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleAccept(sug.id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                              isAccepted
                                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                                : "bg-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {isAccepted ? "✓ Accepted" : "Rejected"}
                          </button>
                        </div>

                        <p className="mt-2.5 text-xs text-slate-300 leading-relaxed bg-[#070C14] p-2.5 rounded-lg border border-[#1B2B3E]/60">
                          <span className="font-semibold text-[#75D9D0]">Scientific Reason: </span>
                          {sug.change_rationale}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#1B2B3E] bg-[#0D1624]/40 p-12 text-center space-y-4">
              <Sun className="h-10 w-10 text-slate-600" />
              <div>
                <h3 className="text-sm font-bold text-white">No Schedule Optimized Yet</h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  Click 'Optimize Schedule' above to evaluate today's forecast and reorganize your activities around
                  cleaner atmospheric dispersion windows.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1B2B3E] bg-[#0B1220] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add New Routine Activity</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Activity Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Dog walking, Grocery trip, Yoga"
                  className="w-full rounded-xl border border-[#1B2B3E] bg-[#070C14] px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-[#149A86] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-xl border border-[#1B2B3E] bg-[#070C14] px-3.5 py-2 text-sm text-white focus:border-[#149A86] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (min)</label>
                  <input
                    type="number"
                    min="10"
                    max="360"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#1B2B3E] bg-[#070C14] px-3.5 py-2 text-sm text-white focus:border-[#149A86] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsOutdoor}
                    onChange={(e) => setNewIsOutdoor(e.target.checked)}
                    className="rounded border-[#1B2B3E] bg-[#070C14] text-[#149A86]"
                  />
                  <span>Outdoor Activity</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsFixed}
                    onChange={(e) => setNewIsFixed(e.target.checked)}
                    className="rounded border-[#1B2B3E] bg-[#070C14] text-[#149A86]"
                  />
                  <span>Fixed Constraint (Cannot Reschedule)</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#149A86] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F7666]"
                >
                  Add to Planner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
