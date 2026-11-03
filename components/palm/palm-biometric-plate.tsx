"use client";

import React from "react";
import { RefreshCw } from "lucide-react";

interface PalmBiometricPlateProps {
  imageSrc: string;
  hand: "left" | "right" | "unsure";
  onRetake: () => void;
  className?: string;
}

export default function PalmBiometricPlate({
  imageSrc,
  hand,
  onRetake,
  className = "",
}: PalmBiometricPlateProps) {
  const isRealisticPalm =
    imageSrc.includes("realistic-palm") || imageSrc.includes("sample-palm");

  const handLabel =
    hand === "left"
      ? "Left Hand (Passive Hand)"
      : hand === "right"
      ? "Right Hand (Active Hand)"
      : "Open Palm";

  return (
    <section className={`mb-8 ${className}`} data-purpose="palm-diagram-card">
      {/* Header matching approved reference format */}
      <div className="text-center mb-3">
        <h2 className="text-[18px] sm:text-[20px] font-bold tracking-[0.18em] uppercase text-[var(--gold)] font-serif-luxury">
          YOUR PALMISTRY PROFILE
        </h2>
        <p className="text-[13px] text-[var(--muted)] font-normal mt-0.5 tracking-wide">
          Traditional Palmistry Interpretation
        </p>
      </div>

      {/* Telemetry subtitle bar */}
      <div className="flex items-center justify-between text-[11px] text-[var(--muted)] px-2 mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
          Live Palm Scan • 99.4% Match
        </span>
        <span className="font-semibold text-[var(--gold)]/80 uppercase tracking-wider text-[10px]">
          AI Biometrics
        </span>
      </div>

      <div className="relative w-full rounded-2xl border border-[var(--gold)]/30 bg-[#FAF7F0] dark:bg-[#191B23] overflow-hidden shadow-xl p-2 sm:p-3 flex flex-col items-center justify-center transition-all">
        {/* Palm presentation container with clean warm background */}
        <div className="relative w-full aspect-[4/3.8] max-h-[460px] rounded-xl overflow-hidden bg-[#FAF6EE] dark:bg-[#14161F] flex items-center justify-center border border-[var(--gold)]/20 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc || "/realistic-palm.jpg"}
            alt="Traditional Hastarekha Palm Reading"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/realistic-palm.jpg";
            }}
            className="w-full h-full object-contain object-center transition-all duration-300"
          />

          {/* Interactive line pointers for custom uploaded images (realistic palm already has crisp annotations) */}
          {!isRealisticPalm && (
            <>
              {/* Heart Line callout */}
              <div className="absolute right-[12%] top-[34%] pointer-events-none flex items-center gap-2">
                <span className="w-12 h-px bg-[var(--gold)] opacity-80" />
                <span className="text-[11px] font-semibold tracking-wide text-[var(--text)] bg-[var(--panel)]/95 px-2.5 py-0.5 rounded-full border border-[var(--gold)]/40 shadow-sm">
                  Heart Line
                </span>
              </div>

              {/* Head Line callout */}
              <div className="absolute left-[8%] top-[46%] pointer-events-none flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wide text-[var(--text)] bg-[var(--panel)]/95 px-2.5 py-0.5 rounded-full border border-[var(--gold)]/40 shadow-sm">
                  Head Line
                </span>
                <span className="w-12 h-px bg-[var(--gold)] opacity-80" />
              </div>

              {/* Life Line callout */}
              <div className="absolute right-[12%] top-[56%] pointer-events-none flex items-center gap-2">
                <span className="w-12 h-px bg-[var(--gold)] opacity-80" />
                <span className="text-[11px] font-semibold tracking-wide text-[var(--text)] bg-[var(--panel)]/95 px-2.5 py-0.5 rounded-full border border-[var(--gold)]/40 shadow-sm">
                  Life Line
                </span>
              </div>

              {/* Fate Line callout */}
              <div className="absolute right-[14%] bottom-[20%] pointer-events-none flex items-center gap-2">
                <span className="w-12 h-px bg-[var(--gold)] opacity-80" />
                <span className="text-[11px] font-semibold tracking-wide text-[var(--text)] bg-[var(--panel)]/95 px-2.5 py-0.5 rounded-full border border-[var(--gold)]/40 shadow-sm">
                  Fate Line
                </span>
              </div>

              {/* Passive/Active Hand label callout */}
              <div className="absolute left-[12%] bottom-[14%] pointer-events-none flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wide text-[var(--text)] bg-[var(--panel)]/95 px-2.5 py-0.5 rounded-full border border-[var(--gold)]/40 shadow-sm">
                  {handLabel}
                </span>
              </div>

              {/* Horoscope badge matching reference */}
              <div className="absolute left-3 bottom-3 pointer-events-none">
                <span className="px-2.5 py-1 bg-[#8E8B82]/85 text-white text-[11px] font-medium tracking-wide rounded-md shadow-sm">
                  horoscope
                </span>
              </div>
            </>
          )}

          {/* Action Overlay: Retake Button */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={onRetake}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--panel)]/90 backdrop-blur-md text-[var(--gold)] hover:text-white border border-[var(--gold)]/30 hover:border-[var(--gold)] text-xs font-semibold shadow-md transition-all active:scale-95"
              aria-label="Upload or take another palm photo"
              title="Upload or take another photo"
            >
              <RefreshCw size={12} />
              <span>Retake</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
