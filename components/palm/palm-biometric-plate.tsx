"use client";

import React, { useState } from "react";
import { RefreshCw, Sparkles, BookOpen, ChevronDown, Heart, Brain, Flame, Compass } from "lucide-react";
import type { PalmAnalysisFeatures } from "@/lib/palm-feature-detector";

interface PalmBiometricPlateProps {
  imageSrc: string;
  hand: "left" | "right" | "unsure";
  onRetake: () => void;
  features?: PalmAnalysisFeatures;
  highlightedFeature?: string | null;
  className?: string;
}

export default function PalmBiometricPlate({
  imageSrc,
  hand,
  onRetake,
  highlightedFeature = null,
  className = "",
}: PalmBiometricPlateProps) {
  const [imageAspectRatio, setImageAspectRatio] = useState(0.75);

  const normalizedHighlight = highlightedFeature
    ? highlightedFeature.replace("Line", "").replace("mountOf", "").toLowerCase()
    : null;

  const handLabel =
    hand === "left"
      ? "Left Hand (Passive Hastarekha)"
      : hand === "right"
      ? "Right Hand (Active Hastarekha)"
      : "Open Palm (Hastarekha)";

  const scrollToExplanation = (sectionId?: string) => {
    if (sectionId) {
      const el = document.getElementById(`palm-section-${sectionId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    const reportRoot = document.querySelector('[data-purpose="report-numbered-index"]');
    if (reportRoot) {
      reportRoot.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const keyHastarekhaAreas = [
    {
      id: "heart",
      sectionKey: "heartLine",
      name: "Heart Line",
      sanskrit: "Hridaya Rekha",
      focus: "Emotions, relationships, devotion & harmony",
      color: "#FBBF24",
      icon: Heart,
    },
    {
      id: "head",
      sectionKey: "headLine",
      name: "Head Line",
      sanskrit: "Mastaka Rekha",
      focus: "Intellect, focus, wisdom & decisions",
      color: "#34D399",
      icon: Brain,
    },
    {
      id: "life",
      sectionKey: "lifeLine",
      name: "Life Line",
      sanskrit: "Jeeva Rekha",
      focus: "Vitality, stamina, physical resilience & energy",
      color: "#F59E0B",
      icon: Flame,
    },
    {
      id: "fate",
      sectionKey: "fateLine",
      name: "Fate Line",
      sanskrit: "Bhagya Rekha",
      focus: "Dharma, career milestones & opportunities",
      color: "#A78BFA",
      icon: Compass,
    },
  ];

  const planetaryMounts = [
    { name: "Jupiter (Guru)", parvat: "Brihaspati", meaning: "Wisdom & leadership" },
    { name: "Saturn (Shani)", parvat: "Shani", meaning: "Discipline & karma" },
    { name: "Sun (Surya)", parvat: "Surya", meaning: "Creativity & honour" },
    { name: "Mercury (Budha)", parvat: "Budha", meaning: "Communication & commerce" },
    { name: "Venus (Shukra)", parvat: "Shukra", meaning: "Vitality & aesthetics" },
    { name: "Moon (Chandra)", parvat: "Chandra", meaning: "Intuition & travel" },
  ];

  return (
    <section className={`mb-8 ${className}`} data-purpose="palm-diagram-card">
      {/* Title */}
      <div className="text-center mb-3">
        <h2 className="text-[18px] sm:text-[20px] font-bold tracking-[0.18em] uppercase text-[var(--gold)] font-serif-luxury">
          YOUR PALMISTRY PROFILE
        </h2>
        <p className="text-[13px] text-[var(--muted)] font-normal mt-0.5 tracking-wide">
          Traditional Hastarekha Astrological Analysis
        </p>
      </div>

      {/* Telemetry subtitle bar */}
      <div className="flex items-center justify-between text-[11px] text-[var(--muted)] px-2 mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
          <span className="font-semibold text-[var(--text)]">
            Verified Hastarekha Scan
          </span>
          <span className="text-[10px] text-[var(--quiet)] hidden sm:inline">
            · Pure Photographic Biometrics
          </span>
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider text-[var(--gold)] bg-[var(--panel)] border border-[var(--gold)]/30 uppercase">
            <Sparkles size={11} className="text-[var(--gold)]" />
            AI Biometrics
          </span>
        </div>
      </div>

      <div className="relative w-full rounded-2xl border border-[var(--gold)]/30 bg-[#FAF7F0] dark:bg-[#191B23] overflow-hidden shadow-xl p-2 sm:p-3 flex flex-col items-center justify-center transition-all">
        {/* Palm presentation container: Clean photograph without visual line strokes or dots */}
        <div
          className="relative w-full rounded-xl overflow-hidden bg-[#FAF6EE] dark:bg-[#13151D] flex items-center justify-center border border-[var(--gold)]/20 shadow-inner group"
          style={{ aspectRatio: imageAspectRatio }}
        >
          {/* Subtle studio backdrop lighting */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.45)_0%,rgba(240,233,219,0.75)_100%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(28,30,42,0.55)_0%,rgba(14,16,23,0.92)_100%)]" />

          {/* Celestial compass watermark rings behind palm */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none text-[var(--gold)]/20 dark:text-[var(--gold)]/15 z-0"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
          >
            <circle cx="500" cy="500" r="420" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5 6" />
            <circle cx="500" cy="500" r="320" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="500" cy="500" r="220" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 4" />
            <line x1="80" y1="500" x2="920" y2="500" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 5" />
            <line x1="500" y1="80" x2="500" y2="920" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 5" />
          </svg>

          {/* User's Actual Palm Photograph - Clean and pristine without artificial line overlays */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc || "/realistic-palm.jpg"}
            alt="User's Analysed Palm Photo"
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              if (naturalWidth > 0 && naturalHeight > 0) {
                setImageAspectRatio(naturalWidth / naturalHeight);
              }
            }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/realistic-palm.jpg";
            }}
            className="w-full h-full object-contain object-center filter contrast-[1.04] brightness-[1.02] transition-all duration-300 relative z-0"
          />

          {/* Hand label badge (Bottom Left) */}
          <div className="absolute left-3 bottom-3 z-20 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#11131A]/90 backdrop-blur-md text-[#FFE192] text-[10px] sm:text-[11px] font-medium rounded-full border border-[#E5C46B]/40 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5C46B]" />
              {handLabel}
            </span>
          </div>

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

        {/* Hastarekha Astrological Explanation Guide (Replaces noisy line overlays & failure boxes) */}
        <div className="w-full mt-3 pt-3 border-t border-[var(--line)] px-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--gold)] flex items-center gap-1.5">
              <Sparkles size={13} className="text-[var(--gold)]" />
              Hastarekha Analysis & Explanation
            </span>
            <span className="text-[10px] text-[var(--muted)]">
              Click any section to read interpretation
            </span>
          </div>

          <p className="text-[12px] text-[var(--muted)] leading-relaxed mb-3">
            In traditional Vedic Samudrika Shastra, your palm lines and mounts reveal personal karma, innate temperament, and vitality. Rather than drawing synthetic lines over your photo, Vedic AI provides an in-depth written and spoken astrological explanation below.
          </p>

          {/* Key Hastarekha Creases Overview Cards (Retains Heart Line, Head Line, Life Line tokens) */}
          <div className="grid grid-cols-2 gap-2">
            {keyHastarekhaAreas.map((item) => {
              const isSpoken = normalizedHighlight === item.id;
              return (
                <button
                  key={`guide-${item.id}`}
                  type="button"
                  onClick={() => scrollToExplanation(item.sectionKey)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer group/card ${
                    isSpoken
                      ? "bg-[var(--wash)] border-[var(--gold)] ring-1 ring-[var(--gold)]/40 shadow-xs scale-[1.01]"
                      : "bg-[var(--raised)] border-[var(--line)] hover:border-[var(--gold)]/60 hover:bg-[var(--wash)]/50"
                  }`}
                  title={`Click to read complete ${item.name} analysis`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)] group-hover/card:text-[var(--gold)] transition-colors">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </span>
                    <span className="text-[9px] text-[var(--gold)] opacity-0 group-hover/card:opacity-100 transition-opacity">
                      Read ↓
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--gold)] font-medium">
                    {item.sanskrit}
                  </span>
                  <span className="text-[10.5px] text-[var(--muted)] mt-1 line-clamp-2 leading-tight">
                    {item.focus}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Planetary Mounts Quick Guide */}
          <div className="mt-3 pt-2.5 border-t border-[var(--line)]/60">
            <div className="text-[10px] uppercase tracking-wider text-[var(--quiet)] font-semibold mb-1.5 flex items-center justify-between">
              <span>Planetary Mounts Interpreted in Reading:</span>
              <span className="text-[9px] text-[var(--gold)] lowercase">Brihaspati, Shani, Surya, Budha, Shukra, Chandra</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {planetaryMounts.map((mount, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-[var(--raised)] border border-[var(--line)] text-[var(--text)]"
                  title={`${mount.parvat}: ${mount.meaning}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{mount.name}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Smooth Scroll Navigation CTA Button */}
          <div className="mt-3 pt-2">
            <button
              type="button"
              onClick={() => scrollToExplanation()}
              className="w-full py-2 px-3 rounded-xl bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 border border-[var(--gold)]/40 hover:border-[var(--gold)] text-[var(--gold)] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-xs"
            >
              <BookOpen size={13} />
              <span>Read Complete 10-Point Astrological Explanation</span>
              <ChevronDown size={14} className="animate-bounce" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
