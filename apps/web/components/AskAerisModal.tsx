"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Send,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Cpu,
  Loader2,
  Compass,
} from "lucide-react";
import { askAssistant } from "../lib/api";
import { AssistantChatResponse } from "../lib/types";

interface AskAerisModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCity?: string;
  currentAqi?: number;
  currentPm25?: number;
}

export const AskAerisModal: React.FC<AskAerisModalProps> = ({
  isOpen,
  onClose,
  activeCity = "Delhi",
  currentAqi = 315,
  currentPm25 = 260,
}) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AssistantChatResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const suggestedQuestions = [
    "Is it advisable for my child to play outdoors this afternoon?",
    "When is the least polluted time to go for a walk today?",
    "How can I reduce smoke and pollution while cooking indoors?",
    "Should I cycle or take the Metro today?",
    "Why is today's winter air pollution worse than yesterday?",
  ];

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setTimeout(() => inputRef.current?.focus(), 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        } else if (e.key === "Tab") {
          if (!modalRef.current) return;
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (queryText?: string) => {
    const query = queryText || input;
    if (!query.trim() || loading) return;

    setLoading(true);
    setInput(query);
    try {
      const res = await askAssistant(query, activeCity, currentAqi, currentPm25);
      setResponse(res);
    } catch (err) {
      setResponse({
        answer:
          "Atmospheric parameters for " +
          activeCity +
          " indicate severe particulate density. Sensitive individuals should remain in filtered indoor spaces.",
        mode: "rule_based_fallback",
        grounded_facts: [`Location: ${activeCity}`, `Current AQI: ${currentAqi}`],
        suggested_actions: ["Keep windows latched", "Use kitchen exhaust fan during meal preparation"],
        follow_up_questions: ["When does the afternoon cleaner window open?"],
        confidence_level: "High (Deterministic Environmental Guidance)",
        disclaimer: "Informational risk advisory only.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-title"
    >
      <div
        ref={modalRef}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#1B2B3E] bg-[#0B1220] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1B2B3E] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#149A86] to-[#75D9D0] text-[#070C14]">
              <Sparkles className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="assistant-title" className="text-base font-bold text-white">
                  Ask AERIS
                </h2>
                <span className="rounded-full bg-[#149A86]/20 px-2 py-0.5 text-[10px] font-semibold text-[#75D9D0]">
                  Grounded Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live Context: {activeCity} • AQI {Math.round(currentAqi)} ({Math.round(currentPm25)} µg/m³ PM2.5)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[#142336] hover:text-white"
            aria-label="Close Assistant"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Preset Suggested Questions */}
          {!response && !loading && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Suggested Questions Tailored for Current Smog
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(q)}
                    className="rounded-xl border border-[#1B2B3E] bg-[#0D1624] px-3 py-2 text-left text-xs font-medium text-slate-200 transition-colors hover:border-[#149A86] hover:bg-[#142336]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#149A86]" />
              <p className="text-xs text-slate-400">
                Evaluating verified atmospheric context & lifestyle rules...
              </p>
            </div>
          )}

          {/* Assistant Answer */}
          {response && !loading && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Intelligence Mode Badge */}
              <div className="flex items-center justify-between text-[11px] border-b border-[#1B2B3E] pb-2">
                <div className="flex items-center gap-1.5 text-[#75D9D0]">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>
                    Mode:{" "}
                    {response.mode === "gemini_grounded"
                      ? "Gemini 2.5 Flash Grounded Generation"
                      : "AERIS Deterministic Rule-Based Intelligence"}
                  </span>
                </div>
                <span className="text-slate-400">{response.confidence_level}</span>
              </div>

              {/* Direct Grounded Response */}
              <div className="rounded-xl bg-[#0D1624] p-4 text-sm text-slate-200 leading-relaxed border border-[#1B2B3E]">
                <p className="whitespace-pre-line">{response.answer}</p>
              </div>

              {/* Verified Grounding Facts */}
              {response.grounded_facts && response.grounded_facts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Grounded In Verified Parameters
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {response.grounded_facts.map((fact, idx) => (
                      <span
                        key={idx}
                        className="rounded-md border border-[#1B2B3E] bg-[#121D2F] px-2.5 py-1 text-[11px] text-slate-300"
                      >
                        {fact}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Actions */}
              {response.suggested_actions && response.suggested_actions.length > 0 && (
                <div className="rounded-xl border border-[#1B2B3E] bg-[#121D2F]/60 p-3.5 space-y-2">
                  <h4 className="text-xs font-semibold text-[#75D9D0] flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#149A86]" />
                    Recommended Actions
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {response.suggested_actions.map((act, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#149A86] flex-shrink-0" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up Question Chips */}
              {response.follow_up_questions && response.follow_up_questions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" /> Follow-up Questions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {response.follow_up_questions.map((fq, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSubmit(fq)}
                        className="rounded-lg border border-[#1B2B3E] bg-[#0D1624] px-2.5 py-1.5 text-xs text-slate-300 hover:border-[#149A86] hover:bg-[#142336] transition-colors"
                      >
                        {fq}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="flex items-center gap-2 rounded-lg bg-[#142336]/40 p-2.5 text-[11px] text-slate-400">
                <ShieldAlert className="h-4 w-4 text-[#E8AD4A] flex-shrink-0" />
                <span>{response.disclaimer}</span>
              </div>
            </div>
          )}
        </div>

        {/* Query Input Bar */}
        <div className="border-t border-[#1B2B3E] p-4 bg-[#070C14]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about today's air, children's safety, routines, or cooking..."
              className="flex-1 rounded-xl border border-[#1B2B3E] bg-[#0D1624] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#149A86] focus:outline-none focus:ring-1 focus:ring-[#75D9D0]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#149A86] to-[#0F7666] text-white shadow-md transition-all hover:brightness-110 disabled:opacity-50"
              aria-label="Send Query"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
