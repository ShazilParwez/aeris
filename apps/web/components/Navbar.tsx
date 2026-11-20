"use client";

import React, { useState } from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import {
  Wind,
  LayoutDashboard,
  CalendarCheck2,
  Home,
  Flame,
  LineChart,
  Info,
  Sparkles,
  Menu,
  X,
  Compass,
} from "lucide-react";

interface NavbarProps {
  onOpenAssistant: () => void;
  activeCity?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAssistant, activeCity = "Delhi" }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Day Planner", href: "/planner", icon: CalendarCheck2 },
    { label: "Home Air", href: "/home-air", icon: Home },
    { label: "Impact", href: "/impact", icon: Flame },
    { label: "Forecast Lab", href: "/forecast-lab", icon: LineChart },
    { label: "About", href: "/about", icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1B2B3E] bg-[#070C14]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo and Tagline */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-90"
            aria-label="AERIS Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#149A86] to-[#75D9D0] text-[#070C14] shadow-md shadow-[#149A86]/20">
              <Wind className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">AERIS</span>
                <span className="rounded bg-[#149A86]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#75D9D0]">
                  Intelligence
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">Breathe Smarter.</p>
            </div>
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#142336] text-[#75D9D0] ring-1 ring-[#149A86]/40"
                    : "text-slate-300 hover:bg-[#101B2B] hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#75D9D0]" : "text-slate-400"}`} />
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Right Action: City indicator + Ask AERIS Assistant */}
        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-1.5 rounded-full border border-[#1B2B3E] bg-[#0D1624] px-3 py-1 text-xs text-slate-300 sm:flex">
            <Compass className="h-3.5 w-3.5 text-[#149A86]" />
            <span>{activeCity}</span>
          </div>

          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#149A86] to-[#0F7666] px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-[#149A86]/20 transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#75D9D0]"
            aria-label="Open Ask AERIS Intelligence Assistant"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#75D9D0]" />
            <span>Ask AERIS</span>
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-[#142336] hover:text-white md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-[#1B2B3E] bg-[#070C14] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-[#142336] text-[#75D9D0]"
                      : "text-slate-300 hover:bg-[#101B2B] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
