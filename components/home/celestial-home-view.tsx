"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BriefcaseBusiness,
  Heart,
  Clock3,
  Gem,
  CalendarDays,
  MoonStar,
  Sparkles,
  ChevronRight,
  History,
  Compass,
  Orbit,
} from "lucide-react";

import type { KundliReport } from "@/lib/astrology";
import WelcomeVoiceGreeting from "@/components/voice/welcome-voice-greeting";

interface CelestialHomeViewProps {
  language: "en" | "hi";
  savedBirth: { name?: string; date?: string; time?: string; place?: string } | null;
  chartReport: KundliReport | null;
  historyItems: Array<{
    id: string;
    title: string;
    updated_at?: string;
  }>;
  onOpenBirth: () => void;
  onSelectPrompt: (prompt: string, title?: string) => void;
  onLoadConversation: (id: string) => void;
}

export default function CelestialHomeView({
  language,
  savedBirth,
  chartReport,
  historyItems,
  onOpenBirth,
  onSelectPrompt,
  onLoadConversation,
}: CelestialHomeViewProps) {
  const isHi = language === "hi";
  const [showAllPresets, setShowAllPresets] = useState(false);

  const corePathways = [
    {
      id: "career",
      title: isHi ? "करियर एवं संपत्ति" : "Career & Wealth",
      subtitle: isHi
        ? "दशम भाव (कर्म भाव), द्वितीय भाव (धन भाव) और वित्तीय समृद्धि की संभावनाएं…"
        : "Analyze 10th house Karma Bhava, 2nd Dhana bhava, and financial growth…",
      prompt: isHi
        ? "मेरी गणना की गई कुंडली के आधार पर मेरे दशम भाव और द्वितीय/एकादश भाव का विश्लेषण कर करियर पथ और धन संभावनाओं को समझाएं।"
        : "Analyze my 10th house and 2nd/11th houses for career trajectory, profession indications, and wealth potential based on my calculated chart.",
      icon: BriefcaseBusiness,
      accent: "gold",
      tint: "radial-gradient(ellipse at top left, rgba(245,158,11,0.18), transparent 72%)",
      borderGlow: "group-hover:border-amber-400/50",
      iconWrap: "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:bg-amber-400/10 dark:border-amber-400/25 dark:text-amber-300 dark:shadow-[0_0_12px_rgba(245,158,11,0.18)]",
    },
    {
      id: "love",
      title: isHi ? "विवाह एवं संबंध" : "Love & Matchmaking",
      subtitle: isHi
        ? "सप्तम भाव, शुक्र की स्थिति और वैवाहिक सामंजस्य संकेतकों का विश्लेषण…"
        : "Explore 7th house dynamics, Venus placement and marital compatibility…",
      prompt: isHi
        ? "मेरी जन्म कुंडली से पारंपरिक संबंध संकेतकों का परीक्षण करें, जिसमें सप्तम भाव, शुक्र और वैवाहिक सौहार्द शामिल हैं।"
        : "Examine traditional relationship indicators from my chart including 7th house, Venus, and marital harmony themes.",
      icon: Heart,
      accent: "rose",
      tint: "radial-gradient(ellipse at top left, rgba(244,63,94,0.18), transparent 72%)",
      borderGlow: "group-hover:border-rose-400/50",
      iconWrap: "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:bg-rose-400/10 dark:border-rose-400/25 dark:text-rose-300 dark:shadow-[0_0_12px_rgba(244,63,94,0.18)]",
    },
    {
      id: "sade-sati",
      title: isHi ? "साढ़े साती एवं महादशा" : "Sade Sati & Dasha",
      subtitle: isHi
        ? "शनि के 7.5 वर्षीय चक्र और आपकी सक्रिय विंशोत्तरी महादशा कालखंड का मूल्यांकन…"
        : "Evaluate Saturn's 7.5-year cycle and your Vimshottari Mahadasha timeline…",
      prompt: isHi
        ? "मेरी वर्तमान विंशोत्तरी महादशा और अंतर्दशा का विश्लेषण करें और बताएं कि मैं शनि की साढ़े साती के किस चरण में हूँ।"
        : "Explain my current Vimshottari Mahadasha and Antardasha periods and evaluate where I stand regarding Saturn's Sade Sati cycle.",
      icon: Clock3,
      accent: "indigo",
      tint: "radial-gradient(ellipse at top left, rgba(129,140,248,0.18), transparent 72%)",
      borderGlow: "group-hover:border-indigo-400/50",
      iconWrap: "bg-indigo-500/10 border-indigo-500/25 text-indigo-700 dark:bg-indigo-400/10 dark:border-indigo-400/25 dark:text-indigo-300 dark:shadow-[0_0_12px_rgba(129,140,248,0.18)]",
    },
    {
      id: "remedies",
      title: isHi ? "वैदिक उपाय एवं रत्न" : "Vedic Remedies",
      subtitle: isHi
        ? "पारंपरिक पराशर उपाय, वैदिक मंत्र, दान और उपयुक्त रत्न मार्गदर्शन…"
        : "Explore traditional Parashara Upayas, mantras, charity (daan), and gemstones…",
      prompt: isHi
        ? "मेरी कुंडली के ग्रह योगों के अनुसार कौन से पारंपरिक वैदिक उपाय (मंत्र, सेवा, दान या रत्न सावधानियां) उपयुक्त हैं?"
        : "What traditional Vedic remedies (mantras, seva, gemstone precautions) are recommended for my planetary placements?",
      icon: Gem,
      accent: "emerald",
      tint: "radial-gradient(ellipse at top left, rgba(16,185,129,0.18), transparent 72%)",
      borderGlow: "group-hover:border-emerald-400/50",
      iconWrap: "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:bg-emerald-400/10 dark:border-emerald-400/25 dark:text-emerald-300 dark:shadow-[0_0_12px_rgba(16,185,129,0.18)]",
    },
  ];

  const secondaryPathways = [
    {
      id: "transit",
      title: isHi ? "दशम भाव गोचर" : "10th House Transit",
      subtitle: isHi
        ? "दशम भाव पर वर्तमान ग्रहीय गोचर और व्यावसायिक अवसरों का आंकलन…"
        : "Assess current planetary transits over the 10th house and upcoming professional shifts…",
      prompt: isHi
        ? "वर्तमान ग्रहीय गोचर मेरे करियर और आजीविका के दशम भाव को कैसे प्रभावित कर रहे हैं, इसका विश्लेषण करें।"
        : "Assess how current planetary transits affect my 10th house of career and professional opportunities.",
      icon: Orbit,
      tint: "radial-gradient(ellipse at top left, rgba(234,179,8,0.18), transparent 72%)",
      borderGlow: "group-hover:border-yellow-400/50",
      iconWrap: "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:bg-yellow-400/10 dark:border-yellow-400/25 dark:text-yellow-300",
    },
    {
      id: "navamsha",
      title: isHi ? "D9 नवांश भाग्य चक्र" : "D9 Navamsha Chart",
      subtitle: isHi
        ? "आत्मिक क्षमता और ग्रहीय बल के लिए D9 नवांश वर्ग कुंडली का निरीक्षण…"
        : "Inspect D9 Navamsha divisional chart for latent strengths and soul direction…",
      prompt: isHi
        ? "मेरी D9 नवांश वर्ग कुंडली, वर्गोत्तम ग्रहों और आंतरिक आध्यात्मिक संभावनाओं का विश्लेषण करें।"
        : "Analyze my D9 Navamsha divisional chart, vargottama planets, and inner spiritual potential.",
      icon: Compass,
      tint: "radial-gradient(ellipse at top left, rgba(168,85,247,0.18), transparent 72%)",
      borderGlow: "group-hover:border-purple-400/50",
      iconWrap: "bg-purple-500/10 border-purple-500/25 text-purple-700 dark:bg-purple-400/10 dark:border-purple-400/25 dark:text-purple-300",
    },
    {
      id: "saturn-sade-sati",
      title: isHi ? "शनि साढ़े साती विश्लेषण" : "Saturn Sade Sati",
      subtitle: isHi
        ? "जन्म चंद्र राशि के संदर्भ में शनि गोचर के उदय, शिखर और अस्त चरणों का विवरण…"
        : "Detailed breakdown of rising, peak, and setting phases relative to natal Moon…",
      prompt: isHi
        ? "मेरी जन्म चंद्र राशि के सापेक्ष शनि के गोचर (साढ़े साती की स्थिति और व्यावहारिक मार्गदर्शन) का गहन विश्लेषण प्रदान करें।"
        : "Provide an in-depth breakdown of Saturn's transit relative to my natal Moon (Sade Sati phase and guidance).",
      icon: Sparkles,
      tint: "radial-gradient(ellipse at top left, rgba(59,130,246,0.18), transparent 72%)",
      borderGlow: "group-hover:border-blue-400/50",
      iconWrap: "bg-blue-500/10 border-blue-500/25 text-blue-700 dark:bg-blue-400/10 dark:border-blue-400/25 dark:text-blue-300",
    },
    {
      id: "matchmaking",
      title: isHi ? "कुंडली मिलान एवं अष्टकूट" : "Kundli Matchmaking",
      subtitle: isHi
        ? "पारंपरिक 36 गुण मिलान, नाड़ी, भकूट और गण दोष का विश्लेषण…"
        : "Traditional 36 Guna Milan, Nadi, Bhakoot, and planetary harmony evaluation…",
      prompt: isHi
        ? "पारंपरिक अष्टकूट 36 गुण मिलान कैसे काम करता है और दीर्घकालिक वैवाहिक सामंजस्य के लिए कौन से कारक सबसे महत्वपूर्ण हैं, समझाएं।"
        : "Explain how traditional Ashta Koota 36 Guna matching operates and what placement factors matter most.",
      icon: Heart,
      tint: "radial-gradient(ellipse at top left, rgba(236,72,153,0.18), transparent 72%)",
      borderGlow: "group-hover:border-pink-400/50",
      iconWrap: "bg-pink-500/10 border-pink-500/25 text-pink-700 dark:bg-pink-400/10 dark:border-pink-400/25 dark:text-pink-300",
    },
  ];

  const displayedPathways = showAllPresets
    ? [...corePathways, ...secondaryPathways]
    : corePathways;

  return (
    <div className="w-full max-w-3xl mx-auto px-3.5 sm:px-6 pt-2 pb-10 flex flex-col gap-6 relative select-none">
      {/* Language-aware Welcome Voice Greeting for Home Screen only */}
      <WelcomeVoiceGreeting />

      {/* Background celestial ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(229,184,75,0.08),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/4 -right-40 w-[450px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.07),transparent_70%)] blur-3xl" />
      </div>

      {/* ========================================================
          1. ICONIC HERO CARD (Cosmic Glassmorphism + Luxury Gold CTA)
          ======================================================== */}
      <section
        className="relative group rounded-[26px] p-[1px] bg-gradient-to-b from-amber-500/20 via-black/[0.04] to-transparent dark:from-amber-400/30 dark:via-white/10 dark:to-transparent shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
      >
        {/* Animated aura behind card */}
        <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-amber-500/10 via-amber-200/20 to-amber-500/10 dark:from-amber-500/15 dark:via-violet-500/10 dark:to-amber-500/10 blur-xl opacity-75 pointer-events-none -z-10 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="relative rounded-[25px] bg-white border border-amber-900/10 shadow-sm dark:bg-[#0c0e18]/85 dark:border-white/[0.04] backdrop-blur-2xl p-5 sm:p-7 overflow-hidden">
          {/* Faint slowly rotating sacred geometry / mandala watermark */}
          <div
            className="absolute -right-20 -top-20 w-80 h-80 opacity-[0.04] dark:opacity-[0.06] pointer-events-none text-amber-600 dark:text-amber-300 animate-[spin_100s_linear_infinite]"
            aria-hidden="true"
          >
            <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.75" className="w-full h-full">
              <circle cx="100" cy="100" r="95" strokeDasharray="3,3" />
              <circle cx="100" cy="100" r="75" />
              <circle cx="100" cy="100" r="55" strokeDasharray="2,2" />
              <polygon points="100,10 180,150 20,150" />
              <polygon points="100,190 180,50 20,50" />
              <circle cx="100" cy="100" r="35" />
              <polygon points="100,30 170,140 30,140" strokeDasharray="2,2" />
              <polygon points="100,170 170,60 30,60" strokeDasharray="2,2" />
            </svg>
          </div>

          {/* Top Metadata Strip */}
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="inline-flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 shadow-[0_0_10px_rgba(217,119,6,0.12)] dark:bg-white/[0.04] dark:border-white/10 dark:text-amber-300/90 dark:shadow-[0_0_10px_rgba(251,191,36,0.15)] flex items-center justify-center">
                <MoonStar size={14} strokeWidth={2} />
              </span>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#B58525] dark:text-amber-300/90">
                VEDIC.AI <span className="text-black/25 dark:text-white/30">·</span> {isHi ? "ज्योतिष सहचर" : "ASTROLOGY COMPANION"}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>{isHi ? "तैयार" : "Ready to explore"}</span>
            </div>
          </div>

          {/* Warm Punchy Greeting in Luxury Display Serif */}
          <h2
            className="relative z-10 text-xl sm:text-[23px] font-medium text-[#18181B] dark:text-white tracking-tight leading-snug my-3.5 font-serif-luxury"
            style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
          >
            {isHi
              ? "नमस्ते! 🙏 आज मैं आपके जन्मांग और आकाशीय मानचित्र में क्या सहायता कर सकता हूँ?"
              : "Namaste! 🙏 How can I assist you with your cosmic chart today?"}
          </h2>

          {/* Inner Birth Coordinates Card */}
          <div className="relative z-10 rounded-2xl p-4 bg-[#F7F5F0] border border-black/[0.05] dark:bg-white/[0.025] dark:border-white/[0.06] backdrop-blur-md flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#B58525] dark:text-amber-300/95">
              <CalendarDays size={15} className="text-[#B58525] dark:text-amber-400 shrink-0" />
              <span>
                {savedBirth && chartReport
                  ? isHi ? "आपकी जन्म कुंडली तैयार है" : "Your birth chart is ready"
                  : isHi ? "जन्म निर्देशांक आवश्यक" : "Birth coordinates required"}
              </span>
            </div>

            <p className="text-xs text-[#52525B] dark:text-white/65 leading-relaxed m-0">
              {savedBirth && chartReport
                ? isHi
                  ? "आपकी कुंडली गणित हो चुकी है। व्यक्तिगत व्याख्याओं से पहले विवरण की समीक्षा के लिए अपना जन्म प्रोफ़ाइल खोलें।"
                  : "Your chart is calculated. Open your birth profile to review the details before exploring personal interpretations."
                : isHi
                  ? "अपनी व्यक्तिगत जन्म कुंडली की व्याख्या के लिए, अपनी जन्म तिथि, सटीक स्थानीय जन्म समय और जन्म स्थान जोड़ें।"
                  : "To interpret your personal Janam Kundli, add your date birth, exact local birth time, and birthplace."}
            </p>

            {/* Luxury Gold CTA Button */}
            <motion.button
              type="button"
              onClick={onOpenBirth}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className="mt-1 w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-[13px] tracking-wide text-[#18181B] flex items-center justify-between shadow-[0_0_25px_rgba(229,184,75,0.32)] transition-all cursor-pointer relative overflow-hidden group/btn border-t border-white/40"
              style={{
                background: "linear-gradient(90deg, #F6D365 0%, #E5B84B 50%, #C89B3C 100%)",
              }}
            >
              <div className="flex items-center gap-2 font-bold">
                <CalendarDays size={16} strokeWidth={2.2} />
                <span>
                  {savedBirth && chartReport
                    ? isHi ? "जन्म विवरण देखें" : "Review birth details"
                    : isHi ? "जन्म विवरण दर्ज करें" : "Enter birth details"}
                </span>
              </div>
              <span className="text-base font-bold leading-none select-none text-[#18181B]/90 group-hover/btn:translate-x-0.5 transition-transform">
                ✦
              </span>
            </motion.button>
          </div>
        </div>
      </section>

      {/* ========================================================
          Resume Previous Consultation (if conversation history exists)
          ======================================================== */}
      {historyItems.length > 0 && (
        <div
          className="p-3.5 sm:p-4 rounded-2xl bg-white border border-black/[0.06] shadow-sm dark:bg-white/[0.025] dark:border-white/[0.07] backdrop-blur-md flex items-center justify-between gap-3 dark:shadow-lg"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:bg-amber-400/10 dark:border-amber-400/25 dark:text-amber-300 flex items-center justify-center shrink-0">
              <History size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#B58525] dark:text-amber-300/90 tracking-wider block">
                {isHi ? "पिछला परामर्श पुनः आरंभ करें" : "Resume Previous Consultation"}
              </span>
              <strong className="block text-xs text-[#18181B] dark:text-white font-medium truncate max-w-[280px] sm:max-w-md mt-0.5">
                {historyItems[0].title}
              </strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onLoadConversation(historyItems[0].id)}
            className="px-3 py-1.5 rounded-lg bg-black/[0.04] hover:bg-amber-500/15 text-[#18181B] border border-black/10 hover:border-amber-500/30 dark:bg-white/10 dark:hover:bg-amber-400/20 dark:text-white dark:border-white/10 dark:hover:border-amber-400/30 transition-colors text-xs font-semibold cursor-pointer shrink-0"
          >
            {isHi ? "जारी रखें →" : "Resume →"}
          </button>
        </div>
      )}

      {/* ========================================================
          2. CHOOSE A PATHWAY TO EXPLORE (2x2 Bento Grid)
          ======================================================== */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between px-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#B58525] dark:text-amber-300/90">
            <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
            <span>{isHi ? "एक विषय चुनें" : "CHOOSE A PATHWAY TO EXPLORE"}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAllPresets(!showAllPresets)}
            className="text-[11px] font-semibold text-[#71717A] hover:text-[#B58525] hover:bg-black/[0.04] dark:text-white/50 dark:hover:text-amber-300 dark:hover:bg-white/[0.04] transition-colors flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg"
          >
            <span>
              {showAllPresets
                ? isHi ? "कम देखें ↑" : "Show less ↑"
                : isHi ? "सभी 8 विकल्प देखें →" : "View all 8 presets →"}
            </span>
          </button>
        </div>

        {/* 2x2 Bento Grid on Mobile & 4-col on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          <AnimatePresence>
            {displayedPathways.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectPrompt(item.prompt, item.title)}
                  className={`group relative text-left rounded-2xl p-4 sm:p-4.5 bg-white hover:bg-[#FAF8F4] border border-black/[0.06] shadow-sm hover:border-amber-500/40 dark:bg-white/[0.025] dark:hover:bg-white/[0.045] dark:border-white/[0.07] ${item.borderGlow} backdrop-blur-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer min-h-[148px] sm:min-h-[160px]`}
                >
                  {/* Category subtle top-left radial glow tint */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-30 group-hover:opacity-60 dark:opacity-60 dark:group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: item.tint }}
                  />

                  {/* Top Row: Icon Badge */}
                  <div className="w-full relative z-10 mb-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${item.iconWrap}`}
                    >
                      <Icon size={18} strokeWidth={1.9} />
                    </div>
                  </div>

                  {/* Bottom: Title & Subtitle with Chevron at bottom right */}
                  <div className="relative z-10 flex flex-col gap-1 w-full">
                    <h3 className="font-semibold text-sm sm:text-[15px] text-[#18181B] group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-200 tracking-tight leading-snug transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-end justify-between gap-1.5 w-full">
                      <p className="text-[11px] sm:text-xs text-[#52525B] dark:text-white/55 line-clamp-2 leading-relaxed m-0 flex-1">
                        {item.subtitle}
                      </p>
                      <ChevronRight
                        size={15}
                        className="text-[#71717A] group-hover:text-amber-600 group-hover:translate-x-0.5 dark:text-white/35 dark:group-hover:text-amber-300 transition-all shrink-0 mb-0.5"
                      />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Traditional Guidance Note */}
        <div className="mt-2 py-3 px-4 rounded-xl bg-black/[0.02] border border-black/[0.06] text-[#52525B] dark:bg-white/[0.015] dark:border-white/[0.05] dark:text-white/50 flex items-center gap-2.5 text-[11px] leading-relaxed">
          <Sparkles size={14} className="text-amber-600/80 dark:text-amber-400/80 shrink-0" />
          <span>
            {isHi
              ? "पारंपरिक ज्योतिषीय व्याख्याएं आत्म-चिंतन के लिए हैं। व्यक्तिगत चार्ट अंतर्दृष्टि के लिए सटीक जन्म विवरण और गणना किए गए चार्ट डेटा की आवश्यकता होती है।"
              : "Traditional Jyotish interpretations are for reflection. Personal chart insights require precise birth details and calculated chart data."}
          </span>
        </div>
      </section>
    </div>
  );
}
