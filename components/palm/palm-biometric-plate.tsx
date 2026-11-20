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
  language?: "en" | "hi" | "hinglish";
}

export default function PalmBiometricPlate({
  imageSrc,
  hand,
  onRetake,
  highlightedFeature = null,
  className = "",
  language = "en",
}: PalmBiometricPlateProps) {
  const [imageAspectRatio, setImageAspectRatio] = useState(0.75);
  const isHi = language === "hi";

  const normalizedHighlight = highlightedFeature
    ? highlightedFeature.replace("Line", "").replace("mountOf", "").toLowerCase()
    : null;

  const handLabel = isHi
    ? hand === "left"
      ? "बायां हाथ (अव्यक्त हस्तरेखा)"
      : hand === "right"
      ? "दायां हाथ (सक्रिय हस्तरेखा)"
      : "हथेली (हस्तरेखा)"
    : hand === "left"
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
      name: isHi ? "हृदय रेखा" : "Heart Line",
      sanskrit: "Hridaya Rekha",
      focus: isHi ? "भावनाएं, संबंध, समर्पण व सौहार्द" : "Emotions, relationships, devotion & harmony",
      color: "#FBBF24",
      icon: Heart,
    },
    {
      id: "head",
      sectionKey: "headLine",
      name: isHi ? "मस्तिष्क रेखा" : "Head Line",
      sanskrit: "Mastaka Rekha",
      focus: isHi ? "बुद्धि, एकाग्रता, विवेक व निर्णय-क्षमता" : "Intellect, focus, wisdom & decisions",
      color: "#34D399",
      icon: Brain,
    },
    {
      id: "life",
      sectionKey: "lifeLine",
      name: isHi ? "जीवन रेखा" : "Life Line",
      sanskrit: "Jeeva Rekha",
      focus: isHi ? "प्राणशक्ति, शारीरिक सहनशीलता व जीवन-ऊर्जा" : "Vitality, stamina, physical resilience & energy",
      color: "#F59E0B",
      icon: Flame,
    },
    {
      id: "fate",
      sectionKey: "fateLine",
      name: isHi ? "भाग्य रेखा" : "Fate Line",
      sanskrit: "Bhagya Rekha",
      focus: isHi ? "धर्म, करियर प्रगति व अवसर" : "Dharma, career milestones & opportunities",
      color: "#A78BFA",
      icon: Compass,
    },
  ];

  const planetaryMounts = [
    { name: isHi ? "बृहस्पति (गुरु)" : "Jupiter (Guru)", parvat: "Brihaspati", meaning: isHi ? "ज्ञान व नेतृत्व" : "Wisdom & leadership" },
    { name: isHi ? "शनि पर्वत" : "Saturn (Shani)", parvat: "Shani", meaning: isHi ? "अनुशासन व कर्म" : "Discipline & karma" },
    { name: isHi ? "सूर्य पर्वत" : "Sun (Surya)", parvat: "Surya", meaning: isHi ? "रचनात्मकता व सम्मान" : "Creativity & honour" },
    { name: isHi ? "बुध पर्वत" : "Mercury (Budha)", parvat: "Budha", meaning: isHi ? "संवाद व व्यापार" : "Communication & commerce" },
    { name: isHi ? "शुक्र पर्वत" : "Venus (Shukra)", parvat: "Shukra", meaning: isHi ? "जीवन-ऊर्जा व सौंदर्य" : "Vitality & aesthetics" },
    { name: isHi ? "चंद्र पर्वत" : "Moon (Chandra)", parvat: "Chandra", meaning: isHi ? "अंतर्ज्ञान व शांति" : "Intuition & travel" },
  ];

  return (
    <section className={`mb-8 ${className}`} data-purpose="palm-diagram-card">
      {/* Title */}
      <div className="text-center mb-3">
        <h2 className="text-[18px] sm:text-[20px] font-bold tracking-[0.18em] uppercase text-[var(--gold)] font-serif-luxury">
          {isHi ? "आपकी हस्तरेखा प्रोफ़ाइल" : "YOUR PALMISTRY PROFILE"}
        </h2>
        <p className="text-[13px] text-[var(--muted)] font-normal mt-0.5 tracking-wide">
          {isHi ? "पारंपरिक हस्तरेखा ज्योतिषीय विश्लेषण" : "Traditional Hastarekha Astrological Analysis"}
        </p>
      </div>

      {/* Telemetry subtitle bar */}
      <div className="flex items-center justify-between text-[11px] text-[var(--muted)] px-2 mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
          <span className="font-semibold text-[var(--text)]">
            {isHi ? "सत्यापित हस्तरेखा स्कैन" : "Verified Hastarekha Scan"}
          </span>
          <span className="text-[10px] text-[var(--quiet)] hidden sm:inline">
            {isHi ? "· वास्तविक फोटोग्राफिक बायोमेट्रिक्स" : "· Pure Photographic Biometrics"}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider text-[var(--gold)] bg-[var(--panel)] border border-[var(--gold)]/30 uppercase">
            <Sparkles size={11} className="text-[var(--gold)]" />
            {isHi ? "एआई बायोमेट्रिक्स" : "AI Biometrics"}
          </span>
        </div>
      </div>

      <div className="relative w-full rounded-2xl border border-[var(--gold)]/30 bg-[#FAF7F0] dark:bg-[#191B23] overflow-hidden shadow-xl p-2 sm:p-3 flex flex-col items-center justify-center transition-all">
        {/* Palm presentation container: Clean photograph without visual line strokes or dots */}
        <div
          className="relative w-full rounded-xl overflow-hidden bg-black/60 border border-[var(--line2)] shadow-inner flex items-center justify-center max-h-[480px]"
          style={{ aspectRatio: imageAspectRatio }}
        >
          {imageSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageSrc}
              alt={isHi ? "विश्लेषित हस्त चित्र" : "Analyzed palm photo"}
              className="w-full h-full object-contain select-none"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  setImageAspectRatio(img.naturalWidth / img.naturalHeight);
                }
              }}
            />
          ) : (
            <div className="p-8 text-center text-xs text-[var(--muted)]">
              {isHi ? "कोई हस्त चित्र लोड नहीं हुआ" : "No palm photo loaded"}
            </div>
          )}

          {/* Bottom Left Hand Indicator Pill */}
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
              aria-label={isHi ? "पुनः हस्त चित्र लें" : "Upload or take another palm photo"}
              title={isHi ? "पुनः हस्त चित्र लें" : "Upload or take another photo"}
            >
              <RefreshCw size={12} />
              <span>{isHi ? "पुनः फोटो लें" : "Retake"}</span>
            </button>
          </div>
        </div>

        {/* Hastarekha Astrological Explanation Guide (Replaces noisy line overlays & failure boxes) */}
        <div className="w-full mt-3 pt-3 border-t border-[var(--line)] px-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--gold)] flex items-center gap-1.5">
              <Sparkles size={13} className="text-[var(--gold)]" />
              {isHi ? "हस्तरेखा विश्लेषण एवं व्याख्या" : "Hastarekha Analysis & Explanation"}
            </span>
            <span className="text-[10px] text-[var(--muted)]">
              {isHi ? "व्याख्या पढ़ने हेतु क्लिक करें" : "Click any section to read interpretation"}
            </span>
          </div>

          <p className="text-[12px] text-[var(--muted)] leading-relaxed mb-3">
            {isHi
              ? "पारंपरिक वैदिक सामुद्रिक शास्त्र में आपकी हस्तरेखाएं और पर्वत व्यक्तिगत कर्म, स्वाभाविक स्वभाव और जीवन-ऊर्जा को प्रकट करते हैं। कृत्रिम रेखाएं खींचने के बजाय वैदिक एआई नीचे विस्तृत लिखित व मौखिक ज्योतिषीय व्याख्या प्रस्तुत करता है।"
              : "In traditional Vedic Samudrika Shastra, your palm lines and mounts reveal personal karma, innate temperament, and vitality. Rather than drawing synthetic lines over your photo, Vedic AI provides an in-depth written and spoken astrological explanation below."}
          </p>

          {/* Key Hastarekha Creases Overview Cards */}
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
                  title={isHi ? `सम्पूर्ण ${item.name} विश्लेषण पढ़ें` : `Click to read complete ${item.name} analysis`}
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
                      {isHi ? "पढ़ें ↓" : "Read ↓"}
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
              <span>{isHi ? "विश्लेषण में शामिल प्रमुख ग्रह पर्वत:" : "Planetary Mounts Interpreted in Reading:"}</span>
              <span className="text-[9px] text-[var(--gold)] lowercase">
                {isHi ? "बृहस्पति, शनि, सूर्य, बुध, शुक्र, चंद्र" : "Brihaspati, Shani, Surya, Budha, Shukra, Chandra"}
              </span>
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
              <span>{isHi ? "सम्पूर्ण 10-सूत्रीय हस्तरेखा विश्लेषण पढ़ें" : "Read Complete 10-Point Astrological Explanation"}</span>
              <ChevronDown size={14} className="animate-bounce" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
