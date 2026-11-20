"use client";

import "./globals.css";
import React, { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { AskAerisModal } from "../components/AskAerisModal";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [activeCity, setActiveCity] = useState("Delhi");

  return (
    <html lang="en" className="dark">
      <head>
        <title>AERIS — Breathe Smarter | Urban Air Quality Intelligence</title>
        <meta
          name="description"
          content="Location-aware environmental intelligence and daily decision-making assistant for urban families navigating severe winter smog."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="flex min-h-screen flex-col bg-[#070C14] text-slate-100 antialiased selection:bg-[#149A86]/30 selection:text-[#75D9D0]">
        <Navbar
          onOpenAssistant={() => setIsAssistantOpen(true)}
          activeCity={activeCity}
        />
        <main className="flex-1">{children}</main>
        <Footer />
        <AskAerisModal
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          activeCity={activeCity}
        />
      </body>
    </html>
  );
}
