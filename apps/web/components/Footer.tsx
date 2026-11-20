"use client";

import React from "react";
import { ShieldCheck, Info, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-[#1B2B3E] bg-[#070C14] text-xs text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white">
              <span className="text-base font-bold">AERIS</span>
              <span className="rounded bg-[#149A86]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#75D9D0]">
                Breathe Smarter
              </span>
            </div>
            <p className="mt-2 text-slate-400 leading-relaxed max-w-md">
              A location-aware environmental intelligence and daily decision-making assistant designed to help urban
              families navigate severe winter smog and urban air pollution with actionable routines and transparent impact models.
            </p>
            <div className="mt-4 flex items-center gap-2 text-slate-500">
              <ShieldCheck className="h-4 w-4 text-[#149A86]" />
              <span>Prompt Wars Challenge 6: Urban Air Quality Assistant • Google for Developers & Hack2Skill</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200">Scientific Provenance</h4>
            <ul className="mt-2 space-y-1.5 text-slate-400">
              <li>
                <span className="text-slate-300">Air Quality API:</span> Open-Meteo (CAMS / Copernicus)
              </li>
              <li>
                <span className="text-slate-300">AQI Standard:</span> U.S. EPA AQI Model-Based Estimate
              </li>
              <li>
                <span className="text-slate-300">Classical ML:</span> scikit-learn (Hist/RF Regressor, 3h lead)
              </li>
              <li>
                <span className="text-slate-300">GenAI:</span> Google Gen AI SDK (Grounded Assistance)
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200">Important Disclosures</h4>
            <p className="mt-2 text-slate-400 leading-relaxed">
              Advisories are educational and behavioral risk estimates. Not medical diagnostic advice. U.S. AQI values
              differ from Indian CPCB NAQI methodology. Do not substitute for emergency medical care.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between border-t border-[#1B2B3E] pt-6 sm:flex-row">
          <p>© 2026 AERIS Environmental Intelligence. Built for Prompt Wars Challenge 6.</p>
          <div className="mt-2 flex gap-4 sm:mt-0">
            <a href="/about" className="hover:text-white transition-colors">
              Methodology & Standards
            </a>
            <a href="/forecast-lab" className="hover:text-white transition-colors">
              Forecast Lab
            </a>
            <a
              href="https://open-meteo.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              Open-Meteo Attribution <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
