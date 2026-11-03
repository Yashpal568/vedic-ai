"use client";

import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppDesktopSidebar from "@/components/app-desktop-sidebar";
import SiteHeader from "@/components/site-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import {
  Camera,
  Check,
  LoaderCircle,
  Save,
  ShieldCheck,
  UserRound,
  Compass,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Lock,
  ArrowRight,
  Orbit,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface PlaceOption {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  // Personal Information
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Celestial Birth Data
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [ayanamsha, setAyanamsha] = useState("Lahiri");
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [placeOptions, setPlaceOptions] = useState<PlaceOption[]>([]);

  // Derived Astrological Summary
  const [lagna, setLagna] = useState<string | null>(null);
  const [nakshatra, setNakshatra] = useState<string | null>(null);
  const [pada, setPada] = useState<number | null>(null);
  const [dasha, setDasha] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    // 1. Load Supabase Auth profile
    if (supabase) {
      supabase.auth.getUser().then(({ data, error: authError }) => {
        if (!active) return;
        if (authError || !data.user) {
          window.location.href = "/login";
          return;
        }
        const user = data.user;
        setUserId(user.id);
        setEmail(user.email || "");
        setName(String(user.user_metadata?.full_name || user.user_metadata?.name || ""));
        setDisplayName(
          String(
            user.user_metadata?.display_name ||
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              ""
          )
        );
        setBio(String(user.user_metadata?.bio || ""));
        setAvatar(String(user.user_metadata?.avatar_url || ""));
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    // 2. Load LocalStorage saved birth profile if present
    try {
      const savedBirth = window.localStorage.getItem("vedic_birth_profile");
      if (savedBirth) {
        const parsed = JSON.parse(savedBirth);
        if (parsed.date) setBirthDate(parsed.date);
        if (parsed.time) setBirthTime(parsed.time);
        if (parsed.place) setBirthPlace(parsed.place);
        if (parsed.latitude) setLatitude(parsed.latitude);
        if (parsed.longitude) setLongitude(parsed.longitude);
        if (parsed.ayanamsha) setAyanamsha(parsed.ayanamsha);
        if (parsed.lagna) setLagna(parsed.lagna);
        if (parsed.nakshatra) setNakshatra(parsed.nakshatra);
        if (parsed.pada) setPada(parsed.pada);
        if (parsed.dasha) setDasha(parsed.dasha);
      }
    } catch {}

    return () => {
      active = false;
    };
  }, []);

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setMessage("");
    if (!file.type.startsWith("image/")) {
      setError("Please select a standard image file (JPG, PNG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Profile photo must be under 2 MB.");
      return;
    }
    setAvatarFile(file);
    setAvatar(URL.createObjectURL(file));
  }

  async function searchLocation(query: string) {
    if (!query || query.length < 2) return;
    setIsSearchingPlace(true);
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlaceOptions(data.places || []);
      }
    } catch {
    } finally {
      setIsSearchingPlace(false);
    }
  }

  function handleSelectPlace(option: PlaceOption) {
    setBirthPlace(option.label);
    setLatitude(option.latitude);
    setLongitude(option.longitude);
    setPlaceOptions([]);
  }

  async function saveProfile() {
    const supabase = getSupabaseBrowserClient();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      let avatarUrl = avatar;
      if (avatarFile && supabase && userId) {
        const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/avatar-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

        if (!uploadError) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = data.publicUrl;
        }
      }

      if (supabase) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: name.trim(),
            display_name: displayName.trim(),
            bio: bio.trim(),
            avatar_url: avatarUrl,
            birth_date: birthDate,
            birth_time: birthTime,
            birth_place: birthPlace,
            latitude,
            longitude,
            ayanamsha,
          },
        });
        if (updateError) throw updateError;
      }

      // Update local storage so that chart and dashboard stay in complete synchrony
      const birthProfile = {
        name: name.trim() || displayName.trim() || "Seeker",
        date: birthDate,
        time: birthTime,
        place: birthPlace,
        latitude,
        longitude,
        ayanamsha,
        lagna: lagna || "Aries",
        nakshatra: nakshatra || "Rohini",
        pada: pada || 1,
        dasha: dasha || "Jupiter Mahadasha",
      };
      window.localStorage.setItem("vedic_birth_profile", JSON.stringify(birthProfile));

      setAvatar(avatarUrl);
      setAvatarFile(null);
      setMessage("Your profile and celestial coordinates have been saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center font-sans-luxury">
        <div className="flex items-center gap-2 text-sm text-[var(--gold)]">
          <LoaderCircle className="animate-spin" size={20} />
          <span>Loading your profile…</span>
        </div>
      </main>
    );
  }

  const isKundliLinked = Boolean(birthDate && birthPlace);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans-luxury">
      {/* 280px Left Sidebar for PC Desktop */}
      <AppDesktopSidebar />

      {/* Main Panel Offset for 280px Sidebar on Large Screens */}
      <div className="flex-1 flex flex-col xl:pl-[280px] min-w-0">
        <SiteHeader section="Account Profile" backHref="/chat" onSignOut={() => void signOut()} />

        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-28">
          {/* Page Header */}
          <section className="mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--gold)] flex items-center gap-1.5 mb-1.5">
              <ShieldCheck size={14} />
              <span>Your Celestial Identity · Prana & Janma</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[var(--text)] tracking-tight">
              My Profile
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 max-w-[720px] leading-relaxed">
              Manage your birth coordinates, personal astrology details, and session preferences saved to your signed-in profile.
            </p>
          </section>

          {/* Top Grid: Profile Identity Card + Planetary Horizon Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Identity Card (5 Cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] shadow-sm flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-16 h-16 rounded-2xl bg-[var(--wash)] border-2 border-[var(--gold)]/40 overflow-hidden flex items-center justify-center text-[var(--gold)] cursor-pointer group shadow-md"
                    aria-label="Upload profile photo"
                  >
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserRound size={32} />
                    )}
                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Camera size={16} />
                    </span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={selectAvatar}
                    className="hidden"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[var(--text)] truncate">
                      {displayName || name || "Seeker"}
                    </h2>
                    {isKundliLinked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--green)]/15 text-[var(--green)] border border-[var(--green)]/30 font-semibold uppercase">
                        Kundli Linked
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold uppercase">
                        Unlinked
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--quiet)] truncate block mt-0.5">{email}</span>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-[11px] font-semibold text-[var(--gold)] hover:text-[var(--gold2)] mt-1.5 inline-block cursor-pointer"
                  >
                    Change profile photo
                  </button>
                </div>
              </div>

              {/* Security & Vault Note */}
              <div className="mt-5 pt-4 border-t border-[var(--line)] text-xs text-[var(--quiet)] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock size={12} className="text-[var(--gold)]" />
                  Encrypted Jyotish Vault
                </span>
                <span className="text-[10px] text-[#52FEB8] font-mono">Active Sync</span>
              </div>
            </div>

            {/* Planetary Horizon & Summary (7 Cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] flex items-center gap-1.5">
                    <Orbit size={14} />
                    <span>Planetary Horizon & Chart Overview</span>
                  </h3>
                  <span className="text-[10px] text-[var(--quiet)]">Lahiri Precision</span>
                </div>

                {isKundliLinked ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-center">
                      <span className="text-[9px] uppercase font-semibold text-[var(--quiet)] block">
                        Ascendant (Lagna)
                      </span>
                      <strong className="text-xs font-bold text-[var(--gold)] mt-0.5 block">
                        {lagna || "Aries"}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-center">
                      <span className="text-[9px] uppercase font-semibold text-[var(--quiet)] block">
                        Birth Nakshatra
                      </span>
                      <strong className="text-xs font-bold text-[var(--text)] mt-0.5 block">
                        {nakshatra || "Rohini"} {pada ? `P${pada}` : ""}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-center">
                      <span className="text-[9px] uppercase font-semibold text-[var(--quiet)] block">
                        Current Dasha
                      </span>
                      <strong className="text-xs font-bold text-[var(--text)] mt-0.5 block">
                        {dasha || "Jupiter"}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-center">
                      <span className="text-[9px] uppercase font-semibold text-[var(--quiet)] block">
                        Ayanamsha Mode
                      </span>
                      <strong className="text-xs font-bold text-[var(--gold)] mt-0.5 block">
                        {ayanamsha}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[var(--raised)] border border-dashed border-[var(--line2)] text-center">
                    <p className="text-xs text-[var(--muted)]">
                      Birth data incomplete. Complete the Celestial Coordinates form below to calculate your Janam Kundli.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between">
                <span className="text-xs text-[var(--quiet)]">
                  Parashara Vedic Mathematical Standard
                </span>
                <Link
                  href="/chat?openBirth=1"
                  className="text-xs font-bold text-[var(--gold)] hover:text-[var(--gold2)] flex items-center gap-1"
                >
                  <span>Inspect Full Kundli</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          {/* Form Section: Celestial Coordinates & Personal Information */}
          <div className="space-y-6">
            {/* 1. Celestial Coordinates & Birth Data */}
            <div className="p-6 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--gold)] mb-1 flex items-center gap-2">
                <Compass size={16} />
                <span>Celestial Coordinates & Birth Data</span>
              </h3>
              <p className="text-xs text-[var(--muted)] mb-5">
                Exact birth time and geographic coordinates ensure accurate Lagna degree and sub-divisional (D9/D10) charts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5 flex items-center gap-1.5">
                    <Calendar size={13} className="text-[var(--gold)]" />
                    <span>Date of Birth</span>
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-xs text-[var(--text)] outline-none focus:border-[var(--gold)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5 flex items-center gap-1.5">
                    <Clock size={13} className="text-[var(--gold)]" />
                    <span>Exact Time of Birth (24h)</span>
                  </label>
                  <input
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-xs text-[var(--text)] outline-none focus:border-[var(--gold)] transition-colors"
                  />
                </div>

                <div className="sm:col-span-2 relative">
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5 flex items-center gap-1.5">
                    <MapPin size={13} className="text-[var(--gold)]" />
                    <span>City & Country of Birth</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={birthPlace}
                      onChange={(e) => {
                        setBirthPlace(e.target.value);
                        searchLocation(e.target.value);
                      }}
                      placeholder="e.g. New Delhi, India"
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-xs text-[var(--text)] placeholder-[var(--quiet)] outline-none focus:border-[var(--gold)] transition-colors"
                    />
                    {isSearchingPlace && (
                      <LoaderCircle
                        size={14}
                        className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gold)]"
                      />
                    )}
                  </div>

                  {placeOptions.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-[var(--panel)] border border-[var(--line2)] rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {placeOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectPlace(opt)}
                          className="w-full px-3.5 py-2 text-left text-xs text-[var(--text)] hover:bg-[var(--raised)] flex items-center gap-2 border-b border-[var(--line)] last:border-0"
                        >
                          <MapPin size={12} className="text-[var(--gold)] shrink-0" />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {latitude !== null && longitude !== null && (
                    <span className="text-[10px] text-[var(--quiet)] mt-1 block">
                      Coordinates: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
                    </span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[var(--gold)]" />
                    <span>Ayanamsha Calculation System</span>
                  </label>
                  <select
                    value={ayanamsha}
                    onChange={(e) => setAyanamsha(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-xs text-[var(--text)] outline-none focus:border-[var(--gold)] transition-colors cursor-pointer"
                  >
                    <option value="Lahiri">Lahiri (Chitrapaksha) — Indian National Standard</option>
                    <option value="Raman">B.V. Raman System</option>
                    <option value="KP">Krishnamurti Paddhati (KP System)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Personal Information Form */}
            <div className="p-6 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--gold)] mb-4 flex items-center gap-2">
                <UserRound size={16} />
                <span>Personal Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Full Name (used on formal Kundli PDF reports)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    placeholder="Your legal or full name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-xs text-[var(--text)] outline-none focus:border-[var(--gold)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Display Name (used in consultation headers)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={60}
                    placeholder="How Vedic AI should greet you"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-xs text-[var(--text)] outline-none focus:border-[var(--gold)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    About You / Astrological Context (optional)
                  </label>
                  <span className="text-[10px] text-[var(--quiet)]">{bio.length} / 500</span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Share your personal questions, life goals, or specific Jyotish areas you want your AI companion to remember."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-xs text-[var(--text)] placeholder-[var(--quiet)] outline-none focus:border-[var(--gold)] transition-colors resize-none"
                />
              </div>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3.5 rounded-xl bg-[var(--green)]/10 border border-[var(--green)]/30 text-[var(--green)] text-xs flex items-center gap-2">
                <Check size={14} />
                <span>{message}</span>
              </div>
            )}

            {/* Save Actions Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
                className="px-4 py-2 text-xs text-[var(--quiet)] hover:text-[var(--text)] font-semibold transition-colors cursor-pointer"
              >
                Discard Changes
              </button>

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold2)] text-[#11131A] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" />
                    <span>Saving Profile…</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
