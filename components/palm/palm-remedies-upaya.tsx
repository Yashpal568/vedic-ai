"use client";

import React from "react";
import { Compass, Sparkles, Sun, Moon } from "lucide-react";

interface PalmRemediesUpayaProps {
  remedies: string[];
}

export default function PalmRemediesUpaya({ remedies }: PalmRemediesUpayaProps) {
  if (!remedies || remedies.length === 0) return null;

  return (
    <section className="border-t border-[var(--line)] pt-8 pb-6 font-sans-luxury" data-purpose="remedies-upaya">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-[var(--gold)]" />
        <h2 className="text-[20px] font-semibold text-[var(--gold)] font-serif-luxury">
          Part C: Prescribed Karmic Harmonization & Remedies (Upaya)
        </h2>
      </div>
      <p className="text-[14px] text-[var(--muted)] mb-5">
        Actionable traditional rituals and mindfulness habits to balance indicated planetary energies.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {remedies.map((remedy, idx) => {
          const parts = remedy.split(":");
          const title = parts.length > 1 ? parts[0].trim() : `Upaya ${idx + 1}`;
          const desc = parts.length > 1 ? parts.slice(1).join(":").trim() : remedy;

          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--gold)]/50 transition-colors shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-[var(--gold)] mb-2">
                  {idx === 0 ? <Sun size={16} /> : idx === 1 ? <Compass size={16} /> : <Moon size={16} />}
                  <span className="font-semibold text-xs tracking-wide uppercase font-serif-luxury">
                    {title}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

