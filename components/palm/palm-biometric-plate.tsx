"use client";

import React, { useState } from "react";
import { RefreshCw, Eye } from "lucide-react";

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
  const [showOverlay, setShowOverlay] = useState(false);

  const handLabel =
    hand === "left"
      ? "Passive Hand"
      : hand === "right"
      ? "Active Hand"
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
          Verified Hastarekha Scan
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOverlay((v) => !v)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border border-[var(--gold)]/30 hover:border-[var(--gold)] text-[var(--gold)] bg-[var(--panel)] transition-all cursor-pointer shadow-xs"
            title="Toggle classical reference guide overlay"
          >
            <Eye size={11} />
            <span>{showOverlay ? "Hide Reference Guide" : "Show Reference Guide"}</span>
          </button>
          <span className="font-semibold text-[var(--quiet)] uppercase tracking-wider text-[10px] hidden sm:inline">
            AI Biometrics
          </span>
        </div>
      </div>

      <div className="relative w-full rounded-2xl border border-[var(--gold)]/30 bg-[#FAF7F0] dark:bg-[#191B23] overflow-hidden shadow-xl p-2 sm:p-3 flex flex-col items-center justify-center transition-all">
        {/* Palm presentation container with clean warm parchment studio background */}
        <div className="relative w-full aspect-[4/3.8] max-h-[480px] rounded-xl overflow-hidden bg-[#FAF6EE] dark:bg-[#13151D] flex items-center justify-center border border-[var(--gold)]/20 shadow-inner">
          
          {/* Subtle warm studio backdrop lighting */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.45)_0%,rgba(240,233,219,0.75)_100%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(28,30,42,0.55)_0%,rgba(14,16,23,0.92)_100%)]" />

          {/* Subtle celestial compass watermark rings behind palm (matching reference plate) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none text-[var(--gold)]/20 dark:text-[var(--gold)]/15 z-0"
            viewBox="0 0 600 600"
            preserveAspectRatio="xMidYMid meet"
          >
            <circle cx="300" cy="300" r="250" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 4" />
            <circle cx="300" cy="300" r="195" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <circle cx="300" cy="300" r="140" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 3" />
            <line x1="40" y1="300" x2="560" y2="300" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
            <line x1="300" y1="40" x2="300" y2="560" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
          </svg>

          {/* User's Hand Photograph */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc || "/realistic-palm.jpg"}
            alt="User Palm Photograph for Hastarekha Analysis"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/realistic-palm.jpg";
            }}
            className="w-full h-full object-contain object-center filter contrast-[1.04] brightness-[1.02] transition-all duration-300 relative z-0"
          />

          {/* SVG Overlay: Highlighted Hastarekha lines & planetary mounts directly on the user's hand */}
          {showOverlay && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 800 700"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Heart Line (Hridaya Rekha) - Curved across upper palm */}
              <path
                d="M 620 330 C 510 335 410 310 340 240"
                fill="none"
                stroke="#FFE192"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#gold-glow)"
                opacity="0.92"
              />
              <line x1="480" y1="325" x2="690" y2="280" stroke="#FFE192" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />

              {/* 2. Head Line (Mastaka Rekha) - Flowing across center */}
              <path
                d="M 310 335 C 380 355 490 380 575 420"
                fill="none"
                stroke="#52FEB8"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#emerald-glow)"
                opacity="0.92"
              />
              <line x1="430" y1="365" x2="160" y2="350" stroke="#52FEB8" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />

              {/* 3. Life Line (Jeeva Rekha) - Sweeping around Venus mount */}
              <path
                d="M 310 330 C 350 375 360 460 330 550 C 315 585 295 615 280 635"
                fill="none"
                stroke="#E5C46B"
                strokeWidth="4.5"
                strokeLinecap="round"
                filter="url(#gold-glow)"
                opacity="0.95"
              />
              <line x1="345" y1="460" x2="690" y2="430" stroke="#E5C46B" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />

              {/* 4. Fate Line (Bhagya Rekha) - Ascending towards Saturn mount */}
              <path
                d="M 430 630 C 435 520 435 390 445 250"
                fill="none"
                stroke="#C4B5FD"
                strokeWidth="3.2"
                strokeDasharray="6 4"
                strokeLinecap="round"
                opacity="0.88"
              />
              <line x1="435" y1="520" x2="690" y2="570" stroke="#C4B5FD" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />

              {/* Planetary Mount Nodes (Parvat) */}
              {/* Jupiter Mount (Guru) */}
              <circle cx="350" cy="225" r="5" fill="#FFE192" stroke="#FAF7F0" strokeWidth="1.5" />
              {/* Saturn Mount (Shani) */}
              <circle cx="445" cy="205" r="4.5" fill="#C4B5FD" stroke="#FAF7F0" strokeWidth="1.5" />
              {/* Sun Mount (Surya) */}
              <circle cx="535" cy="220" r="4.5" fill="#FFE192" stroke="#FAF7F0" strokeWidth="1.5" />
              {/* Mercury Mount (Budha) */}
              <circle cx="615" cy="260" r="4.5" fill="#52FEB8" stroke="#FAF7F0" strokeWidth="1.5" />
              {/* Venus Mount (Shukra) */}
              <circle cx="280" cy="450" r="5.5" fill="#FBBF24" stroke="#FAF7F0" strokeWidth="1.5" />
              {/* Moon Mount (Chandra) */}
              <circle cx="575" cy="550" r="5.5" fill="#93C5FD" stroke="#FAF7F0" strokeWidth="1.5" />
            </svg>
          )}

          {/* Callout badges matching reference image composition */}
          {showOverlay && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Heart Line callout (Right upper) */}
              <div className="absolute right-[4%] sm:right-[7%] top-[37%] flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--text)] bg-[var(--panel)]/95 px-2.5 py-0.5 rounded-full border border-[var(--gold)]/40 shadow-sm whitespace-nowrap">
                  Heart Line
                </span>
              </div>

              {/* Head Line callout (Left middle) */}
              <div className="absolute left-[4%] sm:left-[7%] top-[48%] flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--text)] bg-[var(--panel)]/95 px-2.5 py-0.5 rounded-full border border-[#52FEB8]/40 shadow-sm whitespace-nowrap">
                  Head Line
                </span>
              </div>

              {/* Life Line callout (Right middle) */}
              <div className="absolute right-[4%] sm:right-[7%] top-[59%] flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--text)] bg-[var(--panel)]/95 px-2.5 py-0.5 rounded-full border border-[var(--gold)]/40 shadow-sm whitespace-nowrap">
                  Life Line
                </span>
              </div>

              {/* Fate Line callout (Right lower) */}
              <div className="absolute right-[4%] sm:right-[7%] bottom-[16%] flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--text)] bg-[var(--panel)]/95 px-2.5 py-0.5 rounded-full border border-[#C4B5FD]/40 shadow-sm whitespace-nowrap">
                  Fate Line
                </span>
              </div>

              {/* Passive/Active Hand label callout (Left lower) */}
              <div className="absolute left-[4%] sm:left-[7%] bottom-[16%] flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--text)] bg-[var(--panel)]/95 px-2.5 py-0.5 rounded-full border border-[var(--gold)]/40 shadow-sm whitespace-nowrap">
                  {handLabel}
                </span>
              </div>

              {/* Horoscope pill tag matching reference image */}
              <div className="absolute left-3 bottom-3">
                <span className="px-2.5 py-0.5 bg-[#8E8B82]/85 text-white text-[10px] font-medium tracking-wide rounded-md shadow-sm">
                  horoscope
                </span>
              </div>
            </div>
          )}

          {/* Top Right Retake Button */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
            <button
              type="button"
              onClick={onRetake}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--panel)]/90 backdrop-blur-md text-[var(--gold)] hover:text-white border border-[var(--gold)]/30 hover:border-[var(--gold)] text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
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
