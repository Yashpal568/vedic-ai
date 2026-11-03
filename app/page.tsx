"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppDesktopSidebar from "@/components/app-desktop-sidebar";
import SiteHeader from "@/components/site-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import {
  Sparkles,
  Compass,
  Heart,
  Briefcase,
  Sun,
  Moon,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Orbit,
} from "lucide-react";

export default function VedicAIDashboard() {
  const router = useRouter();
  const [promptInput, setPromptInput] = useState("");
  const [hasBirthData, setHasBirthData] = useState(false);
  const [nativeName, setNativeName] = useState("");
  const [natalLagna, setNatalLagna] = useState<string | null>(null);
  const [natalMoon, setNatalMoon] = useState<string | null>(null);
  const [natalDasha, setNatalDasha] = useState<string | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  useEffect(() => {
    // Check if birth profile exists in localStorage
    try {
      const saved = window.localStorage.getItem("vedic_birth_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date && parsed.place) {
          setHasBirthData(true);
          setNativeName(parsed.name || "Explorer");
          setNatalLagna(parsed.lagna || "Aries");
          setNatalMoon(parsed.nakshatra ? `${parsed.nakshatra} (Pada ${parsed.pada || 1})` : "Rohini");
          setNatalDasha(parsed.dasha || "Jupiter Mahadasha");
        }
      }
    } catch {}

    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  function handlePromptSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!promptInput.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(promptInput.trim())}`);
  }

  const pathwayCards = [
    {
      id: "kundli",
      title: "1. Generate Your Birth Chart",
      subtitle: "Full calculation of the 12 houses. Ascendant and Graha placements.",
      actionLabel: "Examine",
      href: "/chat?openBirth=1",
      icon: Compass,
      accent: "var(--gold)",
    },
    {
      id: "synastry",
      title: "2. Relationship & Marriage Compatibility",
      subtitle: "Ashtakoota / 36 Guna compatibility. Nadi, Bhakoot, Tara, Yoni, Maitri.",
      actionLabel: "Match",
      href: "/reports?filter=synastry",
      icon: Heart,
      accent: "#FF7597",
    },
    {
      id: "career",
      title: "3. Career & 10th House Direction",
      subtitle: "Career indications, D-10 Dasamsa, Karma Bhava, and relevant planetary factors.",
      actionLabel: "Forecast",
      href: "/chat?prompt=career",
      icon: Briefcase,
      accent: "#52FEB8",
    },
    {
      id: "remedies",
      title: "4. Current Mahadasha & Vedic Remedies",
      subtitle: "Vimshottari periods, Antardasha, and traditional Parashari Upayas.",
      actionLabel: "Remedies",
      href: "/chat?prompt=dasha",
      icon: Sparkles,
      accent: "#FFE192",
    },
    {
      id: "almanac",
      title: "5. Today's Auspicious Timings & Panchang",
      subtitle: "Tithi, Vara, Nakshatra, Yoga, Karana, and Shubh Muhuratas.",
      actionLabel: "Almanac",
      href: "/panchang",
      icon: Calendar,
      accent: "#93C5FD",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans-luxury">
      {/* 280px Left Navigation Sidebar for Desktop PC */}
      <AppDesktopSidebar />

      {/* Main Panel Offset for 280px Sidebar on Large Screens */}
      <div className="flex-1 flex flex-col app-sidebar-offset min-w-0">
        <SiteHeader section="Vedic AI Dashboard" />

        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-28">
          {/* Header / Engine Status Bar */}
          <section className="mb-8 p-4 rounded-xl bg-[var(--panel)] border border-[var(--line2)] shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--wash)] border border-[var(--line2)] flex items-center justify-center text-[var(--gold)]">
                <Orbit size={18} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                    Vedic Chart Engine · Sidereal Calculation
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
                </div>
                <p className="text-[11px] text-[var(--quiet)] mt-0.5">
                  Epoch 2026.0 · Lahiri Chitrapaksha Ayanamsha (24°09′) Synchronized
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--raised)] border border-[var(--line)]">
                <Clock size={13} className="text-[var(--gold)]" />
                <span className="font-mono text-[11px]">{currentTimeStr || "Live"}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--raised)] border border-[var(--line)]">
                <Sun size={13} className="text-[#FBBF24]" />
                <span className="text-[11px]">Rahu Kaal: Verified Safe Window</span>
              </div>
            </div>
          </section>

          {/* Hero Section */}
          <section className="mb-10 text-center max-w-[860px] mx-auto pt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--wash)] border border-[var(--line2)] text-[var(--gold)] text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles size={13} />
              <span>Ancient Wisdom · Mathematical Precision</span>
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif-luxury tracking-tight leading-tight text-[var(--text)]">
              Namaste! How can I assist you with your cosmic chart today?
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[var(--muted)] leading-relaxed max-w-[700px] mx-auto font-normal">
              Explore classical Jyotish principles, planetary alignments, and situational Prashna inquiries using your configured birth information.
            </p>
          </section>

          {/* Birth-Coordinate Requirement Panel */}
          <section className="mb-10">
            {!hasBirthData ? (
              <div className="p-5 sm:p-6 rounded-2xl bg-[var(--panel)] border-2 border-[var(--gold)]/40 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text)] font-serif-luxury">
                      Birth Coordinates Required
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 leading-relaxed max-w-[620px]">
                      To calculate your Janam Kundli, ascendant degree, planetary placements, and dashas accurately, provide your exact birth date, local birth time, and birthplace.
                    </p>
                  </div>
                </div>
                <Link
                  href="/chat?openBirth=1"
                  className="px-5 py-2.5 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold2)] text-[#11131A] text-xs font-bold transition-all shadow-md flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <span>Enter Birth Details</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--green)]/10 border border-[var(--green)]/30 flex items-center justify-center text-[var(--green)] shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text)]">
                      Chart Configured for {nativeName}
                    </h2>
                    <p className="text-xs text-[var(--quiet)] mt-0.5">
                      {natalLagna} Lagna · {natalMoon} · {natalDasha}
                    </p>
                  </div>
                </div>
                <Link
                  href="/chat?openBirth=1"
                  className="text-xs font-semibold text-[var(--gold)] hover:text-[var(--gold2)] underline underline-offset-4"
                >
                  Update Birth Profile →
                </Link>
              </div>
            )}
          </section>

          {/* Live Celestial Rhythms */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] flex items-center gap-2">
                <Moon size={14} />
                <span>Live Celestial Rhythms (Current Sky)</span>
              </h2>
              <span className="text-[11px] text-[var(--quiet)]">Lahiri Sidereal</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-xs">
                <span className="text-[10px] text-[var(--quiet)] uppercase font-semibold block">
                  Moon Nakshatra
                </span>
                <span className="text-sm font-bold text-[var(--text)] mt-1 block">
                  Rohini
                </span>
                <span className="text-[10px] text-[var(--gold)]">Pada 2 · Taurus Rashi</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-xs">
                <span className="text-[10px] text-[var(--quiet)] uppercase font-semibold block">
                  Current Hora
                </span>
                <span className="text-sm font-bold text-[var(--text)] mt-1 block">
                  Guru (Jupiter)
                </span>
                <span className="text-[10px] text-[#52FEB8]">Auspicious for Wisdom</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-xs">
                <span className="text-[10px] text-[var(--quiet)] uppercase font-semibold block">
                  Auspicious Window
                </span>
                <span className="text-sm font-bold text-[var(--text)] mt-1 block">
                  Abhijit Muhurta
                </span>
                <span className="text-[10px] text-[var(--gold)]">11:48 AM – 12:36 PM</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-xs">
                <span className="text-[10px] text-[var(--quiet)] uppercase font-semibold block">
                  Ayanamsha
                </span>
                <span className="text-sm font-bold text-[var(--text)] mt-1 block">
                  24°09′14″
                </span>
                <span className="text-[10px] text-[var(--quiet)]">Chitrapaksha Lahiri</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-xs col-span-2 sm:col-span-1">
                <span className="text-[10px] text-[var(--quiet)] uppercase font-semibold block">
                  Engine Synchrony
                </span>
                <span className="text-sm font-bold text-[#52FEB8] mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52FEB8]" />
                  Ephemeris Live
                </span>
                <span className="text-[10px] text-[var(--quiet)]">Swiss/Lahiri Sidereal</span>
              </div>
            </div>
          </section>

          {/* Five Pathway Cards */}
          <section className="mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] mb-4 flex items-center gap-2">
              <Compass size={14} />
              <span>Choose a Pathway to Explore</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pathwayCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.id}
                    href={card.href}
                    className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--gold)]/60 transition-all duration-200 group flex flex-col justify-between shadow-sm hover:shadow-md"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[var(--wash)] border border-[var(--line2)] flex items-center justify-center mb-3.5 text-[var(--gold)] group-hover:scale-105 transition-transform">
                        <Icon size={20} style={{ color: card.accent }} />
                      </div>
                      <h3 className="text-base font-bold text-[var(--text)] group-hover:text-[var(--gold)] transition-colors font-serif-luxury">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
                        {card.subtitle}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[var(--line)] flex items-center justify-between text-xs font-semibold text-[var(--gold)]">
                      <span>Action: {card.actionLabel}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* AI Consultation Prompt Composer */}
          <section className="mb-12 p-6 rounded-2xl bg-[var(--panel)] border border-[var(--gold)]/30 shadow-lg">
            <div className="max-w-[760px] mx-auto">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-[var(--gold)] font-serif-luxury">
                  Ask Vedic AI a Specific Jyotish Question
                </h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Inquire about planetary transits, Sade Sati, career transitions, relationship dynamics, or Parashara Upayas.
                </p>
              </div>

              <form onSubmit={handlePromptSubmit} className="relative mt-4">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. Analyze my 10th House career indications and current Mahadasha period..."
                  className="w-full pl-4 pr-12 py-3.5 rounded-xl bg-[var(--raised)] border border-[var(--line2)] text-sm text-[var(--text)] placeholder-[var(--quiet)] outline-none focus:border-[var(--gold)] shadow-inner transition-colors"
                />
                <button
                  type="submit"
                  disabled={!promptInput.trim()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[var(--gold)] text-[#11131A] hover:bg-[var(--gold2)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Submit Consultation Prompt"
                >
                  <Send size={16} />
                </button>
              </form>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
                <span className="text-[11px] text-[var(--quiet)]">Suggestions:</span>
                {[
                  "What does my Moon Nakshatra reveal?",
                  "Explain my current Mahadasha cycle",
                  "Are there upcoming transit challenges?",
                  "Traditional Parashara remedies for peace",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setPromptInput(chip);
                      router.push(`/chat?q=${encodeURIComponent(chip)}`);
                    }}
                    className="px-2.5 py-1 rounded-full bg-[var(--raised)] hover:bg-[var(--wash)] text-[var(--muted)] hover:text-[var(--gold)] border border-[var(--line)] text-[11px] transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-8 border-t border-[var(--line)] text-center text-xs text-[var(--quiet)] space-y-2">
            <div className="flex items-center justify-center gap-4 text-[11px]">
              <span>Vedic Sidereal Methodology</span>
              <span>•</span>
              <span>Lahiri Chitrapaksha Ayanamsha</span>
              <span>•</span>
              <Link href="/privacy" className="hover:text-[var(--gold)]">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-[var(--gold)]">
                Terms
              </Link>
            </div>
            <p className="text-[10px] max-w-[620px] mx-auto leading-relaxed">
              <ShieldCheck size={12} className="inline mr-1 text-[var(--gold)]" />
              Traditional Jyotish interpretations are cultural and symbolic lenses for reflection and personal contemplation—not deterministic guarantees of future events. Personal effort and conscious choices always shape your destiny.
            </p>
          </footer>
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
