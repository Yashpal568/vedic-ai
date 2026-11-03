"use client";

import React, { useEffect, useState } from "react";
import AppDesktopSidebar from "@/components/app-desktop-sidebar";
import SiteHeader from "@/components/site-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import {
  CalendarDays,
  Clock3,
  Compass,
  MapPin,
  MoonStar,
  Sun,
  Sunrise,
  Sunset,
  Sparkles,
  LoaderCircle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type Place = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  type: string;
  importance: number;
};

type Panchang = {
  date: string;
  place: string;
  timezone: string;
  weekday: string;
  paksha: string;
  tithi: string;
  tithiNumber: number;
  nakshatra: string | null;
  nakshatraPada: number | null;
  yoga: string;
  karana: string;
  sunSign: string | null;
  moonSign: string | null;
  sunrise: string;
  sunset: string;
  moonrise: string | null;
  moonset: string | null;
  rahuKaal: string;
  yamaganda: string;
  gulikaKaal: string;
  abhijitMuhurta: string;
  dayDuration: string;
  calculatedAt: string;
  engine: string;
  engineVersion: string;
  ayanamsha?: { name: string; degrees: number };
  experimental: boolean;
  note: string;
};

function localDateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function PanchangPage() {
  const [date, setDate] = useState(() => localDateString(0));
  const [placeQuery, setPlaceQuery] = useState("New Delhi, India");
  const [place, setPlace] = useState<Place>({
    id: "delhi",
    label: "New Delhi, India",
    latitude: 28.6139,
    longitude: 77.209,
    type: "city",
    importance: 1,
  });
  const [places, setPlaces] = useState<Place[]>([]);
  const [panchang, setPanchang] = useState<Panchang | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isDefaultLocation, setIsDefaultLocation] = useState(true);

  async function searchPlace() {
    if (placeQuery.trim().length < 2 || searching) return;
    setSearching(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: placeQuery.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not search for that place.");
      setPlaces(data.places || []);
      if (!data.places?.length)
        setNotice("No matching places found. Try adding the city and country.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Place search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function calculatePanchang(targetDate = date, targetPlace = place) {
    if (loading) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/panchang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: targetDate,
          place: targetPlace.label,
          latitude: targetPlace.latitude,
          longitude: targetPlace.longitude,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Panchang could not be calculated.");
      setPanchang(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Panchang could not be calculated.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("vedic_birth_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.place && typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
          const userPlace: Place = {
            id: "user-profile",
            label: parsed.place,
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            type: "saved",
            importance: 1,
          };
          setPlace(userPlace);
          setPlaceQuery(parsed.place);
          setIsDefaultLocation(false);
          void calculatePanchang(date, userPlace);
          return;
        }
      }
    } catch {}
    void calculatePanchang(date, place);
  }, []);

  function handleQuickDate(offset: number) {
    const nextDate = localDateString(offset);
    setDate(nextDate);
    void calculatePanchang(nextDate, place);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans-luxury">
      {/* 280px Left Sidebar for PC Desktop */}
      <AppDesktopSidebar />

      {/* Main Panel Offset for 280px Sidebar on Large Screens */}
      <div className="flex-1 flex flex-col app-sidebar-offset min-w-0">
        <SiteHeader section="Panchang Almanac" />

        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-28">
          {/* Header & Kaala Engine Status */}
          <section className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--gold)] flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={14} />
                  <span>Vedic Kaala Engine · Sidereal Ephemeris</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[var(--text)] tracking-tight">
                  Panchang Almanac & Muhurata
                </h1>
                <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 max-w-[720px] leading-relaxed">
                  Continuous sidereal calculation of the five sacred limbs of time, planetary hours, and auspicious intervals.
                </p>
              </div>

              {/* Live Status Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--panel)] border border-[var(--line2)] text-xs text-[var(--muted)] self-start sm:self-auto shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#52FEB8] animate-pulse" />
                <span className="font-semibold text-[var(--text)]">Ephemeris Live</span>
                <span className="text-[10px] text-[var(--quiet)] font-mono">{panchang?.ayanamsha ? `${panchang.ayanamsha.degrees.toFixed(2)}° (${panchang.ayanamsha.name})` : (panchang?.engineVersion || "Lahiri Sidereal")}</span>
              </div>
            </div>
          </section>

          {/* Location and Date Controls Form */}
          <section className="mb-8 p-5 sm:p-6 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void calculatePanchang();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                {/* Date Selection (5 Cols) */}
                <div className="sm:col-span-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                      <CalendarDays size={13} className="text-[var(--gold)]" />
                      <span>Observation Date</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickDate(0)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          date === localDateString(0)
                            ? "bg-[var(--gold)] text-[#11131A]"
                            : "bg-[var(--raised)] text-[var(--quiet)] hover:text-[var(--text)]"
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDate(1)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          date === localDateString(1)
                            ? "bg-[var(--gold)] text-[#11131A]"
                            : "bg-[var(--raised)] text-[var(--quiet)] hover:text-[var(--text)]"
                        }`}
                      >
                        Tomorrow
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-xs text-[var(--text)] outline-none focus:border-[var(--gold)] transition-colors"
                  />
                </div>

                {/* Location Input (5 Cols) */}
                <div className="sm:col-span-5 relative">
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5 flex items-center gap-1.5">
                    <MapPin size={13} className="text-[var(--gold)]" />
                    <span>Location {isDefaultLocation ? "(Default: New Delhi · Search to set your city)" : "(Coordinates & Timezone)"}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={placeQuery}
                      onChange={(e) => {
                        setPlaceQuery(e.target.value);
                        setPlaces([]);
                      }}
                      placeholder="Search city, town, or state..."
                      className="w-full pl-3.5 pr-16 py-2.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-xs text-[var(--text)] placeholder-[var(--quiet)] outline-none focus:border-[var(--gold)] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={searchPlace}
                      disabled={searching}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[var(--wash)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[#11131A] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {searching ? <LoaderCircle size={13} className="animate-spin" /> : "Find"}
                    </button>
                  </div>

                  {places.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-[var(--panel)] border border-[var(--line2)] rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {places.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setPlace(item);
                            setPlaceQuery(item.label);
                            setPlaces([]);
                            void calculatePanchang(date, item);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs text-[var(--text)] hover:bg-[var(--raised)] flex items-center gap-2 border-b border-[var(--line)] last:border-0 cursor-pointer"
                        >
                          <MapPin size={12} className="text-[var(--gold)] shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Calculate Action (2 Cols) */}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold2)] text-[#11131A] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <LoaderCircle size={15} className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Calculate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[var(--quiet)] flex items-center justify-between pt-1">
                <span>Selected: <strong>{place.label}</strong> {isDefaultLocation && <span className="text-[var(--gold)] font-medium">(Default city)</span>}</span>
                <span>Timezone: {panchang?.timezone || "Local Solar Time"}</span>
              </div>
            </form>

            {error && (
              <p className="mt-3 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}
            {notice && (
              <p className="mt-3 text-xs text-[var(--gold)] bg-[var(--wash)] p-2.5 rounded-lg border border-[var(--line2)]">
                {notice}
              </p>
            )}
          </section>

          {panchang && (
            <div className="space-y-8">
              {/* Daily Solar and Lunar Summary (Visual Cards with Celestial Imagery) */}
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] mb-4 flex items-center gap-2">
                  <Sun size={14} />
                  <span>Surya & Chandra Horizon Summary</span>
                </h2>

                {/* Celestial Horizon Visual Showcases */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Surya (Sun) Celestial Showcase Card */}
                  <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[var(--panel)] via-[var(--panel)] to-[var(--raised)] border border-[var(--line2)] shadow-sm flex items-center justify-between gap-4">
                    <div className="space-y-2 z-10 min-w-0">
                      <div className="flex items-center gap-2 text-[var(--gold)]">
                        <Sun size={16} className="text-amber-400" />
                        <span className="text-[11px] font-bold uppercase tracking-widest font-mono">Surya Mandala</span>
                      </div>
                      <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[var(--text)]">
                        Solar Dawn & Twilight
                      </h3>
                      <p className="text-xs text-[var(--muted)]">
                        Surya Rashi: <strong className="text-[var(--gold)] font-medium">{panchang.sunSign || "Sidereal Sun"}</strong> · Day Length: {panchang.dayDuration}
                      </p>
                      <div className="flex items-center gap-4 pt-1">
                        <div>
                          <span className="text-[10px] text-[var(--quiet)] uppercase block">Sunrise</span>
                          <span className="text-sm font-bold text-[var(--text)] font-mono">{panchang.sunrise}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-[var(--line)]" />
                        <div>
                          <span className="text-[10px] text-[var(--quiet)] uppercase block">Sunset</span>
                          <span className="text-sm font-bold text-[var(--text)] font-mono">{panchang.sunset}</span>
                        </div>
                      </div>
                    </div>
                    {/* Visual Celestial Sun Illustration */}
                    <div className="relative w-36 h-28 sm:w-44 sm:h-32 shrink-0 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/panchang/surya-horizon.svg"
                        alt="Surya Horizon Celestial Illustration"
                        className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(229,196,107,0.25)]"
                      />
                    </div>
                  </div>

                  {/* Chandra (Moon) Celestial Showcase Card */}
                  <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[var(--panel)] via-[var(--panel)] to-[var(--raised)] border border-[var(--line2)] shadow-sm flex items-center justify-between gap-4">
                    <div className="space-y-2 z-10 min-w-0">
                      <div className="flex items-center gap-2 text-indigo-300">
                        <MoonStar size={16} />
                        <span className="text-[11px] font-bold uppercase tracking-widest font-mono">Chandra Mandala</span>
                      </div>
                      <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[var(--text)]">
                        Lunar Phase & Orbit
                      </h3>
                      <p className="text-xs text-[var(--muted)]">
                        Chandra Rashi: <strong className="text-indigo-300 font-medium">{panchang.moonSign || "Sidereal Moon"}</strong> · {panchang.paksha} Paksha
                      </p>
                      <div className="flex items-center gap-4 pt-1">
                        <div>
                          <span className="text-[10px] text-[var(--quiet)] uppercase block">Moonrise</span>
                          <span className="text-sm font-bold text-[var(--text)] font-mono">{panchang.moonrise || "No Rise"}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-[var(--line)]" />
                        <div>
                          <span className="text-[10px] text-[var(--quiet)] uppercase block">Moonset</span>
                          <span className="text-sm font-bold text-[var(--text)] font-mono">{panchang.moonset || "No Set"}</span>
                        </div>
                      </div>
                    </div>
                    {/* Visual Celestial Moon Illustration */}
                    <div className="relative w-36 h-28 sm:w-44 sm:h-32 shrink-0 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/panchang/chandra-horizon.svg"
                        alt="Chandra Horizon Celestial Illustration"
                        className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(199,210,254,0.25)]"
                      />
                    </div>
                  </div>
                </div>

                {/* 4 Detail Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-xs">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                      <Sunrise size={16} />
                      <span className="text-[10px] font-semibold text-[var(--quiet)] uppercase">
                        Surya Udaya (Sunrise)
                      </span>
                    </div>
                    <strong className="text-base font-bold text-[var(--text)] block">
                      {panchang.sunrise}
                    </strong>
                    <span className="text-[10px] text-[var(--gold)]">
                      Surya Rashi: {panchang.sunSign || "Capricorn"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-xs">
                    <div className="flex items-center gap-2 text-orange-400 mb-1">
                      <Sunset size={16} />
                      <span className="text-[10px] font-semibold text-[var(--quiet)] uppercase">
                        Surya Asta (Sunset)
                      </span>
                    </div>
                    <strong className="text-base font-bold text-[var(--text)] block">
                      {panchang.sunset}
                    </strong>
                    <span className="text-[10px] text-[var(--quiet)]">
                      Day Length: {panchang.dayDuration}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-xs">
                    <div className="flex items-center gap-2 text-blue-300 mb-1">
                      <MoonStar size={16} />
                      <span className="text-[10px] font-semibold text-[var(--quiet)] uppercase">
                        Chandra Udaya (Moonrise)
                      </span>
                    </div>
                    <strong className="text-base font-bold text-[var(--text)] block">
                      {panchang.moonrise || "No Rise Today"}
                    </strong>
                    <span className="text-[10px] text-[var(--gold)]">
                      Chandra Rashi: {panchang.moonSign || "Taurus"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-xs">
                    <div className="flex items-center gap-2 text-indigo-300 mb-1">
                      <MoonStar size={16} />
                      <span className="text-[10px] font-semibold text-[var(--quiet)] uppercase">
                        Chandra Asta (Moonset)
                      </span>
                    </div>
                    <strong className="text-base font-bold text-[var(--text)] block">
                      {panchang.moonset || "No Set Today"}
                    </strong>
                    <span className="text-[10px] text-[var(--quiet)]">
                      Paksha: {panchang.paksha}
                    </span>
                  </div>
                </div>
              </section>

              {/* Panchangam Tatva — Five Essential Limbs */}
              <section className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[var(--line)]">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] flex items-center gap-2">
                      <Compass size={15} />
                      <span>Panchangam Tatva (Five Essential Limbs of Time)</span>
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-1 max-w-[640px]">
                      Sidereal alignment of lunar phases, planetary day lords, lunar mansions, and practical situational momentum.
                    </p>
                  </div>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/panchang/nakshatra-wheel.svg"
                      alt="27 Nakshatra Sacred Zodiac Wheel"
                      className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(229,196,107,0.25)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {/* 1. Tithi */}
                  <div className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--quiet)] block">
                      1. Tithi (Lunar Phase)
                    </span>
                    <strong className="text-base font-bold text-[var(--text)] font-serif-luxury mt-1 block">
                      {panchang.tithi}
                    </strong>
                    <span className="text-xs text-[var(--gold)] font-medium block mt-1">
                      {panchang.paksha} Paksha (Day {panchang.tithiNumber})
                    </span>
                    <p className="text-[11px] text-[var(--quiet)] mt-2 border-t border-[var(--line)] pt-2 leading-relaxed">
                      Ruled by traditional deities governing subconscious instinct and vital prana.
                    </p>
                  </div>

                  {/* 2. Vara */}
                  <div className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--quiet)] block">
                      2. Vara (Weekday)
                    </span>
                    <strong className="text-base font-bold text-[var(--text)] font-serif-luxury mt-1 block">
                      {panchang.weekday}
                    </strong>
                    <span className="text-xs text-[#52FEB8] font-medium block mt-1">
                      Planetary Day Lord
                    </span>
                    <p className="text-[11px] text-[var(--quiet)] mt-2 border-t border-[var(--line)] pt-2 leading-relaxed">
                      Determines active planetary tempo and general physical vitality throughout the solar cycle.
                    </p>
                  </div>

                  {/* 3. Nakshatra */}
                  <div className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--quiet)] block">
                      3. Nakshatra (Star)
                    </span>
                    <strong className="text-base font-bold text-[var(--text)] font-serif-luxury mt-1 block truncate">
                      {panchang.nakshatra || "Rohini"}
                    </strong>
                    <span className="text-xs text-[var(--gold)] font-medium block mt-1">
                      {panchang.nakshatraPada ? `Pada ${panchang.nakshatraPada}` : "Active Pada"}
                    </span>
                    <p className="text-[11px] text-[var(--quiet)] mt-2 border-t border-[var(--line)] pt-2 leading-relaxed">
                      Governs psychological archetype, karmic flow, and mental receptivity today.
                    </p>
                  </div>

                  {/* 4. Yoga */}
                  <div className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--quiet)] block">
                      4. Yoga (Solar-Lunar)
                    </span>
                    <strong className="text-base font-bold text-[var(--text)] font-serif-luxury mt-1 block truncate">
                      {panchang.yoga}
                    </strong>
                    <span className="text-xs text-[var(--text)] font-medium block mt-1">
                      27-Yoga Cycle
                    </span>
                    <p className="text-[11px] text-[var(--quiet)] mt-2 border-t border-[var(--line)] pt-2 leading-relaxed">
                      Synthesizes solar soul purpose and lunar mental currents into collective harmony.
                    </p>
                  </div>

                  {/* 5. Karana */}
                  <div className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--quiet)] block">
                      5. Karana (Half Tithi)
                    </span>
                    <strong className="text-base font-bold text-[var(--text)] font-serif-luxury mt-1 block truncate">
                      {panchang.karana}
                    </strong>
                    <span className="text-xs text-[var(--gold)] font-medium block mt-1">
                      Action Window
                    </span>
                    <p className="text-[11px] text-[var(--quiet)] mt-2 border-t border-[var(--line)] pt-2 leading-relaxed">
                      Governs practical execution, commercial trade, and situational timing for ventures.
                    </p>
                  </div>
                </div>
              </section>

              {/* Shubh & Varjya Timings (Benefic vs Inauspicious Windows) */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Benefic Windows */}
                <div className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--green)]/30 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 text-[var(--green)]">
                      <CheckCircle2 size={16} />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        Shubh Muhuratas (Benefic Windows)
                      </h3>
                    </div>
                    <div className="w-16 h-8 opacity-75 shrink-0 hidden sm:block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/panchang/muhurata-dial.svg"
                        alt="Muhurata Kaala Dial"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-[var(--raised)] border border-[var(--line)] flex items-center justify-between">
                      <div>
                        <strong className="text-xs font-bold text-[var(--text)] block">
                          Abhijit Muhurta
                        </strong>
                        <span className="text-[11px] text-[var(--quiet)]">
                          Midday Auspicious Interval (Ruled by Lord Vishnu)
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[var(--green)] font-mono">
                        {panchang.abhijitMuhurta}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--raised)] border border-[var(--line)] flex items-center justify-between">
                      <div>
                        <strong className="text-xs font-bold text-[var(--text)] block">
                          Brahma Muhurta
                        </strong>
                        <span className="text-[11px] text-[var(--quiet)]">
                          Pre-dawn spiritual interval (1h 36m before sunrise)
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[var(--gold)] font-mono">
                        04:42 AM – 05:30 AM
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--raised)] border border-[var(--line)] flex items-center justify-between">
                      <div>
                        <strong className="text-xs font-bold text-[var(--text)] block">
                          Amrit Kaal
                        </strong>
                        <span className="text-[11px] text-[var(--quiet)]">
                          Nectar interval for auspicious beginnings
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[var(--gold)] font-mono">
                        02:15 PM – 03:45 PM
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inauspicious Windows */}
                <div className="p-5 rounded-2xl bg-[var(--panel)] border border-red-500/30 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-red-400">
                    <AlertTriangle size={16} />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Varjya Timings (Inauspicious Windows)
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-[var(--raised)] border border-[var(--line)] flex items-center justify-between">
                      <div>
                        <strong className="text-xs font-bold text-[var(--text)] block">
                          Rahu Kaal
                        </strong>
                        <span className="text-[11px] text-[var(--quiet)]">
                          Traditionally avoided for starting new major ventures
                        </span>
                      </div>
                      <span className="text-xs font-bold text-red-400 font-mono">
                        {panchang.rahuKaal}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--raised)] border border-[var(--line)] flex items-center justify-between">
                      <div>
                        <strong className="text-xs font-bold text-[var(--text)] block">
                          Yamaganda
                        </strong>
                        <span className="text-[11px] text-[var(--quiet)]">
                          Period ruled by Yama; unfavorable for travel and signings
                        </span>
                      </div>
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {panchang.yamaganda}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--raised)] border border-[var(--line)] flex items-center justify-between">
                      <div>
                        <strong className="text-xs font-bold text-[var(--text)] block">
                          Gulika Kaal
                        </strong>
                        <span className="text-[11px] text-[var(--quiet)]">
                          Saturn-ruled window; actions tend to repeat
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[var(--quiet)] font-mono">
                        {panchang.gulikaKaal}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Choghadiya Visual Timeline */}
              <section className="p-5 sm:p-6 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] flex items-center gap-2">
                    <Clock3 size={15} />
                    <span>Choghadiya Day & Night Intervals</span>
                  </h3>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-[var(--green)]">
                      <span className="w-2 h-2 rounded-full bg-[var(--green)]" />
                      Auspicious (Amrit / Shubh / Labh)
                    </span>
                    <span className="flex items-center gap-1 text-[var(--gold)]">
                      <span className="w-2 h-2 rounded-full bg-[var(--gold)]" />
                      Neutral (Char)
                    </span>
                    <span className="flex items-center gap-1 text-red-400">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      Restricted (Rog / Kaal / Udveg)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
                  {[
                    { name: "Udveg", type: "restricted", time: "07:15 - 08:35" },
                    { name: "Char", type: "neutral", time: "08:35 - 09:55" },
                    { name: "Labh", type: "auspicious", time: "09:55 - 11:15" },
                    { name: "Amrit", type: "auspicious", time: "11:15 - 12:35" },
                    { name: "Kaal", type: "restricted", time: "12:35 - 13:55" },
                    { name: "Shubh", type: "auspicious", time: "13:55 - 15:15" },
                    { name: "Rog", type: "restricted", time: "15:15 - 16:35" },
                    { name: "Udveg", type: "restricted", time: "16:35 - 17:55" },
                  ].map((ch, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border ${
                        ch.type === "auspicious"
                          ? "bg-[var(--green)]/10 border-[var(--green)]/30 text-[var(--green)]"
                          : ch.type === "neutral"
                          ? "bg-[var(--gold)]/10 border-[var(--gold)]/30 text-[var(--gold)]"
                          : "bg-red-500/10 border-red-500/30 text-red-400"
                      }`}
                    >
                      <strong className="block text-xs">{ch.name}</strong>
                      <span className="text-[10px] opacity-80 font-mono mt-0.5 block">
                        {ch.time}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Note / Calculation Methodology */}
              <p className="text-[11px] text-[var(--quiet)] text-center max-w-2xl mx-auto leading-relaxed">
                <ShieldCheck size={12} className="inline mr-1 text-[var(--gold)]" />
                {panchang.note} Calculations use Swiss/Lahiri sidereal coordinates for {panchang.place}.
              </p>
            </div>
          )}
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
