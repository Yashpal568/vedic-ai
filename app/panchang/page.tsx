"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, Compass, MapPin, MoonStar, Search, Sun, Sunrise, Sunset, Sparkles, LoaderCircle } from "lucide-react";
import MobileBottomNav from "@/components/mobile-bottom-nav";

type Place = { id: string; label: string; latitude: number; longitude: number; type: string; importance: number };
type Panchang = {
  date: string; place: string; timezone: string; weekday: string; paksha: string; tithi: string; tithiNumber: number;
  nakshatra: string | null; nakshatraPada: number | null; yoga: string; karana: string;
  sunSign: string | null; moonSign: string | null; sunrise: string; sunset: string; moonrise: string | null; moonset: string | null;
  rahuKaal: string; yamaganda: string; gulikaKaal: string; abhijitMuhurta: string;
  dayDuration: string; calculatedAt: string; engine: string; engineVersion: string; experimental: boolean; note: string;
};

function localToday() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth()+1).padStart(2,"0"), String(now.getDate()).padStart(2,"0")].join("-");
}

export default function PanchangPage() {
  const [date, setDate] = useState(localToday);
  const [placeQuery, setPlaceQuery] = useState("Rudrapur, Uttarakhand, India");
  const [place, setPlace] = useState<Place>({ id: "rudrapur", label: "Rudrapur, Uttarakhand, India", latitude: 28.987, longitude: 79.414, type: "city", importance: 1 });
  const [places, setPlaces] = useState<Place[]>([]);
  const [panchang, setPanchang] = useState<Panchang | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function searchPlace() {
    if (placeQuery.trim().length < 2 || searching) return;
    setSearching(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/geocode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: placeQuery.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not search for that place.");
      setPlaces(data.places || []);
      if (!data.places?.length) setNotice("No matching places found. Try adding the city and country.");
    } catch (e) { setError(e instanceof Error ? e.message : "Place search failed."); }
    finally { setSearching(false); }
  }

  async function calculate(event?: FormEvent) {
    event?.preventDefault();
    if (loading) return;
    setLoading(true); setError(""); setNotice(""); setPanchang(null);
    try {
      const response = await fetch("/api/panchang", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, place: place.label, latitude: place.latitude, longitude: place.longitude }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Panchang could not be calculated.");
      setPanchang(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Panchang could not be calculated."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void calculate(); }, []);

  const facts = panchang ? [
    { label: "Tithi", value: panchang.tithi, detail: panchang.paksha + " Paksha", icon: MoonStar },
    { label: "Nakshatra", value: panchang.nakshatra || "Unavailable", detail: panchang.nakshatraPada ? "Pada " + panchang.nakshatraPada : "Lunar mansion", icon: Sparkles },
    { label: "Yoga", value: panchang.yoga, detail: "27-yoga cycle", icon: Compass },
    { label: "Karana", value: panchang.karana, detail: "Half-tithi division", icon: CalendarDays },
  ] : [];

  return <main className="panchang-shell">
    <header className="panchang-header">
      <Link href="/chat" className="panchang-back"><MoonStar size={20}/> <strong>vedic.ai</strong></Link>
      <span className="panchang-header-label">PANCHANG · DAILY ALMANAC</span>
      <Link href="/profile" className="panchang-profile">My profile</Link>
    </header>
    <section className="panchang-content">
      <div className="panchang-kicker"><Sparkles size={15}/> TRADITIONAL JYOTISH · LOCAL TIMINGS</div>
      <h1>Today in the <em>cosmos.</em></h1>
      <p className="panchang-intro">A location-aware daily Panchang with tithi, nakshatra, yoga, karana, sunrise and traditional time windows. Choose the date and place to calculate the almanac.</p>

      <form className="panchang-controls" onSubmit={calculate}>
        <label className="panchang-field"><span><CalendarDays size={15}/> Date</span><input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label>
        <div className="panchang-place-field">
          <label className="panchang-field"><span><MapPin size={15}/> Location</span><input value={placeQuery} onChange={e=>{setPlaceQuery(e.target.value);setPlaces([]);}} placeholder="Search city or town" required/></label>
          <button type="button" className="panchang-search-button" onClick={searchPlace} disabled={searching}>{searching?<LoaderCircle size={16} className="palm-spin"/>:<Search size={16}/>} Find</button>
        </div>
        {places.length>0 && <div className="panchang-place-results" role="listbox" aria-label="Location results">{places.map(item=><button type="button" key={item.id} onClick={()=>{setPlace(item);setPlaceQuery(item.label);setPlaces([]);setNotice("Location selected. Calculate Panchang to refresh the timings.");}}><MapPin size={15}/><span>{item.label}</span></button>)}</div>}
        <div className="panchang-selected-location"><MapPin size={14}/><span>Selected: {place.label}</span></div>
        <button className="panchang-calculate-button" type="submit" disabled={loading}>{loading?<><LoaderCircle size={17} className="palm-spin"/> Calculating Panchang…</>:<><Sparkles size={17}/> Calculate Panchang <span>→</span></>}</button>
      </form>

      {error && <div className="panchang-error" role="alert">{error}</div>}
      {notice && <div className="panchang-notice" role="status">{notice}</div>}

      {panchang && <>
        <div className="panchang-result-heading"><div><span>DAILY ALMANAC</span><h2>{panchang.weekday}, {new Date(panchang.date+"T12:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</h2><p>{panchang.place} · {panchang.timezone}</p></div><span className="panchang-live-pill"><i/> Calculated</span></div>
        <div className="panchang-fact-grid">{facts.map(({label,value,detail,icon:Icon})=><article className="panchang-fact-card" key={label}><span className="panchang-fact-icon"><Icon size={18}/></span><span className="panchang-fact-label">{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</div>
        <section className="panchang-timing-card"><div className="panchang-card-title"><Sun size={18}/> Sunrise & sunset</div><div className="panchang-sun-grid"><div><Sunrise size={19}/><span>Sunrise</span><strong>{panchang.sunrise}</strong></div><div><Sunset size={19}/><span>Sunset</span><strong>{panchang.sunset}</strong></div><div><MoonStar size={19}/><span>Moonrise</span><strong>{panchang.moonrise || "No rise today"}</strong></div><div><MoonStar size={19}/><span>Moonset</span><strong>{panchang.moonset || "No set today"}</strong></div><div><Clock3 size={19}/><span>Day length</span><strong>{panchang.dayDuration}</strong></div></div></section>
        <section className="panchang-timing-card"><div className="panchang-card-title"><Clock3 size={18}/> Traditional time windows</div><div className="panchang-window-list">
          <div><span>Rahu Kaal</span><strong>{panchang.rahuKaal}</strong><small>Traditionally avoided for starting auspicious work</small></div>
          <div><span>Yamaganda</span><strong>{panchang.yamaganda}</strong><small>Traditional inauspicious period</small></div>
          <div><span>Gulika Kaal</span><strong>{panchang.gulikaKaal}</strong><small>Traditional weekday-based time segment</small></div>
          <div><span>Abhijit Muhurta</span><strong>{panchang.abhijitMuhurta}</strong><small>Approximate midday muhurta window</small></div>
        </div></section>
        <section className="panchang-timing-card panchang-rashi-card"><div className="panchang-card-title"><MoonStar size={18}/> Sidereal signs at local sunrise</div><div className="panchang-rashi-grid"><div><span>Surya Rashi</span><strong>{panchang.sunSign || "Unavailable"}</strong></div><div><span>Chandra Rashi</span><strong>{panchang.moonSign || "Unavailable"}</strong></div><div><span>Nakshatra Pada</span><strong>{panchang.nakshatraPada || "Unavailable"}</strong></div></div></section>
        <p className="panchang-method-note"><ShieldCheckIcon/> {panchang.note}</p>
      </>}
    </section>
    <MobileBottomNav/>
  </main>;
}

function ShieldCheckIcon() { return <Sparkles size={14} aria-hidden="true"/>; }
