"use client";

import React from "react";
import { ShieldCheck, Database } from "lucide-react";

export default function PalmDisclaimerMeta() {
  return (
    <footer className="mt-8 pt-6 border-t border-[var(--line)] text-xs text-[var(--quiet)] font-sans-luxury" data-purpose="report-metadata">
      <div className="flex flex-wrap items-center justify-between gap-y-2 pb-4">
        <div className="flex items-center gap-2">
          <Database size={13} className="text-[var(--gold)]" />
          <span><strong>EPHEMERIS:</strong> Astronomy Engine Sidereal</span>
          <span className="text-[var(--line2)]">•</span>
          <span><strong>AYANAMSHA:</strong> Lahiri 24°11&apos;32&quot;</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={13} className="text-[#52FEB8]" />
          <span>Verified Jyotish Hastarekha Methodology</span>
        </div>
      </div>
      
      <p className="text-[11px] leading-relaxed text-[var(--quiet)] opacity-85">
        Hastarekha is a traditional reflective practice originating from sacred Vedic texts. 
        It illustrates inherent tendencies and energy balance rather than deterministic destiny. 
        Individual conscience, dedicated efforts (Purushartha), and mindful choices always remain supreme.
      </p>
    </footer>
  );
}

