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
  const handLabel =
    hand === "left"
      ? "Left Hand (Passive Hastarekha)"
      : hand === "right"
      ? "Right Hand (Active Hastarekha)"
      : "Open Palm (Hastarekha)";

  return (
    <section className={`mb-7 ${className}`} data-purpose="palm-diagram-card">
      <div className="relative w-full rounded-2xl border border-[var(--line2)] bg-[var(--panel)] overflow-hidden shadow-2xl p-2.5 flex flex-col items-center justify-center group">
        <div className="relative w-full aspect-[4/3.5] rounded-xl overflow-hidden bg-[#0C0E15] border border-[var(--line)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt="Authentic AI Biometric Palmistry Scan"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/sample-palm.svg";
            }}
            className="w-full h-full object-cover object-center filter brightness-[1.05] contrast-[1.08] transition-transform duration-500"
          />

          {/* Vignettes and Radiative Starlight Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0E15]/85 via-transparent to-[#0C0E15]/35 pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_45%,rgba(11,13,20,0.5)_100%)]" />

          {/* Biometric Reticle Corner Markers */}
          <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t-2 border-l-2 border-[#52FEB8] pointer-events-none rounded-tl-sm" />
          <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t-2 border-r-2 border-[#52FEB8] pointer-events-none rounded-tr-sm" />
          <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b-2 border-l-2 border-[#52FEB8] pointer-events-none rounded-bl-sm" />
          <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b-2 border-r-2 border-[#52FEB8] pointer-events-none rounded-br-sm" />

          {/* Live Scan Telemetry Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#11131A]/90 backdrop-blur-md border border-[#52FEB8]/30 shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#52FEB8] animate-pulse" />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[#52FEB8]">
              Live Palm Scan • 99.4% Match
            </span>
          </div>

          {/* AI Biometrics Tag */}
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <span className="px-2.5 py-0.5 bg-[#191B23]/90 backdrop-blur-md text-[var(--gold)] text-[10px] font-semibold tracking-wider uppercase rounded border border-[var(--gold)]/30">
              AI Biometrics
            </span>
          </div>

          {/* Line Annotation Pins on Palm Surface */}
          <div className="absolute left-[42%] top-[38%] pointer-events-none -translate-x-1/2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--gold)] shadow-[0_0_8px_#FFE192]" />
            <span className="text-[9px] font-semibold tracking-wide text-[var(--gold2)] bg-[#11131A]/85 px-1.5 py-0.5 rounded border border-[var(--gold)]/40 backdrop-blur-sm">
              Heart Line
            </span>
          </div>

          <div className="absolute left-[45%] top-[50%] pointer-events-none -translate-x-1/2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#52FEB8] shadow-[0_0_8px_#52FEB8]" />
            <span className="text-[9px] font-semibold tracking-wide text-[#52FEB8] bg-[#11131A]/85 px-1.5 py-0.5 rounded border border-[#52FEB8]/40 backdrop-blur-sm">
              Head Line
            </span>
          </div>

          <div className="absolute left-[34%] top-[62%] pointer-events-none -translate-x-1/2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--gold)] shadow-[0_0_8px_#FFE192]" />
            <span className="text-[9px] font-semibold tracking-wide text-[var(--gold2)] bg-[#11131A]/85 px-1.5 py-0.5 rounded border border-[var(--gold)]/40 backdrop-blur-sm">
              Life Line
            </span>
          </div>

          {/* Bottom Left Hand Tag */}
          <div className="absolute left-3 bottom-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#11131A]/90 backdrop-blur-md text-[var(--gold2)] text-[11px] font-medium rounded-full border border-[var(--gold)]/40 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
              {handLabel}
            </span>
          </div>

          {/* Bottom Right Retake Action */}
          <div className="absolute right-3 bottom-3">
            <button
              type="button"
              onClick={onRetake}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--raised)]/90 hover:bg-[var(--raised)] backdrop-blur-md text-[var(--text)] hover:text-[var(--gold)] text-[11px] font-medium rounded-full border border-[var(--line2)] transition-colors shadow-md"
            >
              <RefreshCw size={12} className="text-[var(--gold)]" />
              <span>Retake photo</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
