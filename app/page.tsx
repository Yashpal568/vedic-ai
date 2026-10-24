"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import type { KundliReport } from "@/lib/astrology";
import {
  ArrowDown, ArrowUp, AudioLines, BookOpen, CalendarDays, Check, ChevronDown,
  CircleHelp, Gem, History, Menu, MessageCircle, MoonStar, Orbit, Plus,
  ShieldCheck, Sparkles, Stars, UserRound, X, BriefcaseBusiness, Heart, Compass,
} from "lucide-react";

type Message = { id: string; role: "user" | "assistant"; content: string };
type BirthProfile = { name: string; date: string; time: string; place: string; latitude?: number; longitude?: number; timezone?: string };
type PlaceOption = { id: string; label: string; latitude: number; longitude: number; type: string; importance: number };
type HistoryItem = { id: string; title: string; updated_at?: string };

const suggestions = [
  { title: "Understand my birth chart", description: "Explore your lagna, houses, and planetary placements.", prompt: "Help me understand my Vedic birth chart. What details do you need from me?", icon: Orbit },
  { title: "Career & life direction", description: "Learn how career themes are read in traditional Jyotish.", prompt: "Explain how Vedic astrology traditionally examines career and life direction.", icon: BriefcaseBusiness },
  { title: "Love & relationships", description: "Explore traditional relationship indicators in a chart.", prompt: "Which houses and planetary placements are traditionally considered for relationships?", icon: Heart },
  { title: "Nakshatra & dasha", description: "Discover lunar mansions and planetary period systems.", prompt: "Explain nakshatras and Vimshottari dasha, and how they are calculated.", icon: Stars },
];
const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBirthOpen, setIsBirthOpen] = useState(false);
  const [birth, setBirth] = useState<BirthProfile>({ name: "", date: "", time: "", place: "" });
  const [savedBirth, setSavedBirth] = useState<BirthProfile | null>(null);
  const [chartReport, setChartReport] = useState<KundliReport | null>(null);
  const [placeOptions, setPlaceOptions] = useState<PlaceOption[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasConversation = messages.length > 0;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);
  useEffect(() => {
    let active = true;
    fetch("/api/conversations")
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => { if (active && data?.conversations) setHistoryItems(data.conversations); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function startNewChat() {
    setMessages([]);
    setInput("");
    setChartReport(null);
    setActiveConversationId(null);
    setMobileMenuOpen(false);
  }

  async function loadConversation(id: string) {
    try {
      const response = await fetch("/api/conversations?id=" + encodeURIComponent(id));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load conversation.");
      setMessages((data.messages || []).map((message: { id: string; role: "user" | "assistant"; content: string }) => ({
        id: message.id, role: message.role, content: message.content,
      })));
      setActiveConversationId(id);
      setChartReport(data.chartReport || null);
      if (data.chartReport?.birth) {
        setSavedBirth({
          name: "",
          date: data.chartReport.birth.date,
          time: data.chartReport.birth.time,
          place: data.chartReport.birth.place,
          latitude: data.chartReport.birth.latitude,
          longitude: data.chartReport.birth.longitude,
          timezone: data.chartReport.birth.timezone,
        });
      }
      setMobileMenuOpen(false);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not load conversation.");
    }
  }

  async function persistConversation(allMessages: Message[], newMessages: Message[]) {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeConversationId || undefined,
          messages: (activeConversationId ? newMessages : allMessages).slice(-30).map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!response.ok) return;
      const data = await response.json();
      const conversation = data.conversation as HistoryItem | undefined;
      if (conversation?.id) {
        setActiveConversationId(conversation.id);
        setHistoryItems((items) => [conversation, ...items.filter((item) => item.id !== conversation.id)].slice(0, 30));
      }
    } catch {
      // Conversation persistence is optional until Supabase Auth is configured.
    }
  }

  async function sendMessage(value?: string) {
    const trimmed = (value === undefined ? input : value).trim();
    if (!trimmed || isLoading) return;
    const userMessage: Message = { id: makeId(), role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-30).map(({ role, content }) => ({ role, content })),
          birthProfile: savedBirth || undefined,
          chartContext: chartReport || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The AI service is not available right now.");
      const assistantMessage: Message = { id: makeId(), role: "assistant", content: data.reply };
      setMessages((current) => [...current, assistantMessage]);
      await persistConversation([...nextMessages, assistantMessage], [userMessage, assistantMessage]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach the AI service.";
      setMessages((current) => [...current, { id: makeId(), role: "assistant", content: message }]);
    } finally {
      setIsLoading(false);
    }
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) { event.preventDefault(); sendMessage(); }
  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); }
  }

  async function searchPlaces() {
    const query = birth.place.trim();
    if (query.length < 2) return;
    setIsGeocoding(true);
    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not find that birthplace.");
      const places = (data.places || []) as PlaceOption[];
      setPlaceOptions(places);
      if (places.length === 1) {
        setSelectedPlace(places[0]);
        setBirth((current) => ({ ...current, place: places[0].label }));
      } else if (places.length === 0) {
        setToast("No matching place found. Add city, region, and country.");
      } else {
        setToast("Choose the correct birthplace from the matching locations.");
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Birthplace lookup failed.");
    } finally {
      setIsGeocoding(false);
    }
  }

  async function submitBirth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!birth.date || !birth.time || !birth.place.trim() || isLoading || isGeocoding) return;
    let place = selectedPlace;
    if (!place || place.label !== birth.place) {
      setIsGeocoding(true);
      try {
        const response = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: birth.place.trim() }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not find that birthplace.");
        const places = (data.places || []) as PlaceOption[];
        setPlaceOptions(places);
        if (places.length !== 1) {
          setToast(places.length ? "Choose the exact birthplace from the list before continuing." : "No matching place found. Include city, region, and country.");
          return;
        }
        place = places[0];
        setSelectedPlace(place);
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Birthplace lookup failed.");
        return;
      } finally {
        setIsGeocoding(false);
      }
    }
    if (!place) return;

    setIsLoading(true);
    const profile: BirthProfile = {
      ...birth, place: place.label, latitude: place.latitude, longitude: place.longitude,
    };
    try {
      const chartResponse = await fetch("/api/kundli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: profile.date, time: profile.time, place: profile.place,
          latitude: place.latitude, longitude: place.longitude,
        }),
      });
      const chartData = await chartResponse.json();
      if (!chartResponse.ok) throw new Error(chartData.error || "Kundli calculation failed.");
      const report = chartData.report as KundliReport;
      profile.timezone = report.birth.timezone;
      setSavedBirth(profile);
      setChartReport(report);
      setIsBirthOpen(false);
      const details = (profile.name.trim() ? "Name: " + profile.name.trim() + "\n" : "") +
        "Date of birth: " + profile.date + "\nLocal birth time: " + profile.time +
        "\nBirthplace: " + profile.place + "\nTimezone: " + report.birth.timezone;
      const userMessage: Message = { id: makeId(), role: "user", content: "Please create and explain my Vedic kundli using these birth details:\n" + details };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      try {
        const aiResponse = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.slice(-30).map(({ role, content }) => ({ role, content })),
            birthProfile: profile,
            chartContext: report,
          }),
        });
        const aiData = await aiResponse.json();
        if (!aiResponse.ok) throw new Error(aiData.error || "AI chat is not configured.");
        setMessages((current) => [...current, { id: makeId(), role: "assistant", content: aiData.reply }]);
      } catch {
        setMessages((current) => [...current, {
          id: makeId(), role: "assistant",
          content: "Your chart has been calculated and is shown above. To enable personalised AI explanations and follow-up questions, configure GEMINI_API_KEY or OPENAI_API_KEY in the server environment. The chart engine currently uses an approximate Lahiri ayanamsha and should be validated against trusted reference charts before high-accuracy or commercial use.",
        }]);
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Kundli calculation failed. Please verify your details.");
    } finally {
      setIsLoading(false);
    }
  }


  async function saveChartReport() {
    if (!chartReport || !savedBirth) return;
    try {
      const response = await fetch("/api/saved-kundli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: savedBirth, report: chartReport, conversationId: activeConversationId || undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setToast("Sign in first to save this kundli. Opening sign-in…");
          window.location.href = "/login";
          return;
        }
        throw new Error(data.error || "Could not save kundli.");
      }
      setToast("Kundli saved securely to your account.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not save kundli.");
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={startNewChat} aria-label="Vedic AI home" style={{ border: 0, background: "transparent", textAlign: "left", color: "inherit" }}>
          <span className="brand-mark"><MoonStar size={19} strokeWidth={1.6} /></span>
          <span><span className="brand-name" style={{ display: "block" }}>vedic<span style={{ color: "var(--gold)" }}>.</span>ai</span><span className="brand-sub" style={{ display: "block" }}>Ancient insight, reimagined</span></span>
        </button>
        <button className="new-chat" onClick={startNewChat}><Plus size={16} /> <span>New conversation</span></button>
        <div className="side-label">Your workspace</div>
        <button className="side-link active" onClick={startNewChat}><MessageCircle size={16} /> <span>Astrology chat</span></button>
        <button className="side-link" onClick={() => setIsBirthOpen(true)}><Orbit size={16} /> <span>My birth profile</span>{savedBirth && <Check size={13} style={{ marginLeft: "auto", color: "var(--green)" }} />}</button>
        <button className="side-link" onClick={() => { window.location.href = "/reports"; }}><BookOpen size={16} /> <span>Kundli & reports</span></button>
        <button className="side-link" onClick={() => setToast("Panchang and transit tools are on the product roadmap.")}><CalendarDays size={16} /> <span>Panchang & transits</span></button>
        <div className="side-label">Recent conversations</div>
        {historyItems.length ? historyItems.map((item) => <button className={"side-link " + (activeConversationId === item.id ? "active" : "")} key={item.id} onClick={() => loadConversation(item.id)}><History size={15} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span></button>) : <p className="history-empty">Sign in to save conversations and see them here.</p>}
        <div className="sidebar-bottom">
          <div className="plan-card">
            <div className="plan-top"><Gem size={14} /> YOUR COSMIC JOURNEY</div>
            <p>A more thoughtful way to explore your birth chart, one question at a time.</p>
            <button className="plan-action" onClick={() => setToast("Plans and billing will be added after the core experience is ready.")}>Explore the experience <ArrowDown size={12} style={{ display: "inline", marginLeft: 4 }} /></button>
          </div>
          <div className="profile-row">
            <div className="avatar">{savedBirth?.name?.trim()?.[0]?.toUpperCase() || "G"}</div>
            <div style={{ minWidth: 0 }}><div className="profile-name">{savedBirth?.name || "Guest explorer"}</div><div className="profile-caption">{savedBirth ? "Birth profile added · session only" : "Personal astrology workspace"}</div></div>
            <button className="icon-button" aria-label="Profile information" onClick={() => setToast("Account sign-in and cloud sync will be enabled with Supabase.")} style={{ marginLeft: "auto" }}><ChevronDown size={15} /></button>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && <div className="modal-backdrop" onClick={() => setMobileMenuOpen(false)}><div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head"><div className="modal-title">Your workspace</div><button className="icon-button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><X size={17} /></button></div>
        <button className="side-link active" style={{ marginTop: 15 }} onClick={startNewChat}><MessageCircle size={16} /> Astrology chat</button>
        <button className="side-link" onClick={() => { setIsBirthOpen(true); setMobileMenuOpen(false); }}><Orbit size={16} /> My birth profile</button>
        <button className="side-link" onClick={() => { window.location.href = "/reports"; }}><BookOpen size={16} /> Kundli & reports</button>
        <button className="new-chat" onClick={startNewChat}><Plus size={16} /> New conversation</button>
      </div></div>}

      <section className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
            <div className="mobile-brand"><span className="brand-mark"><MoonStar size={17} /></span><span className="brand-name">vedic<span style={{ color: "var(--gold)" }}>.</span>ai</span></div>
            <div className="mode-pill"><span className="status-dot" /> Vedic AI <span style={{ color: "var(--quiet)" }}>· Preview</span></div>
          </div>
          <div className="topbar-actions">
            <Link href="/login" className="topbar-link"><UserRound size={14}/> Sign in</Link>
            <button className="topbar-link" onClick={() => setIsBirthOpen(true)}><UserRound size={14} /> {savedBirth ? "Edit birth details" : "Add birth details"}</button>
            <button className="icon-button" aria-label="Help and product status" onClick={() => setToast("Vedic AI is in early development. Real AI, calculations, sign-in and saved conversations are not connected yet.")}><CircleHelp size={17} /></button>
          </div>
        </header>

        <div className="content-scroll">
          {!hasConversation ? <section className="welcome-wrap">
            <div className="hero-heading-row">
              <svg className="hero-orbit" viewBox="0 0 220 220" fill="none" aria-hidden="true">
                <circle cx="110" cy="110" r="78" stroke="#d4b77a" strokeOpacity=".18" /><circle cx="110" cy="110" r="58" stroke="#d4b77a" strokeOpacity=".12" strokeDasharray="2 7" /><circle cx="110" cy="110" r="37" stroke="#d4b77a" strokeOpacity=".22" />
                <ellipse cx="110" cy="110" rx="96" ry="38" transform="rotate(-36 110 110)" stroke="#d4b77a" strokeOpacity=".22" /><ellipse cx="110" cy="110" rx="96" ry="38" transform="rotate(54 110 110)" stroke="#d4b77a" strokeOpacity=".12" />
                <circle cx="171" cy="57" r="4" fill="#e6cc91" /><circle cx="34" cy="126" r="3" fill="#d4b77a" /><path d="M110 80 L117 103 L140 110 L117 117 L110 140 L103 117 L80 110 L103 103 Z" fill="#d4b77a" fillOpacity=".8" /><circle cx="110" cy="110" r="5" fill="#f1dba5" />
              </svg>
              <div className="eyebrow"><span className="eyebrow-line" /> THE WISDOM OF JYOTISH, REIMAGINED</div>
              <h1 className="hero-title">Your stars have a story.<br /><span className="gold">Let’s explore it.</span></h1>
              <p className="hero-copy">A personal space to explore Vedic astrology with more clarity. Start with your birth chart, discover the language of the planets, and ask the questions that matter to you.</p>
            </div>
            <div className="quick-label">A good place to begin</div>
            <div className="prompt-grid">{suggestions.map((item) => {
              const Icon = item.icon;
              return <button className="prompt-card" key={item.title} onClick={() => sendMessage(item.prompt)}>
                <span className="prompt-icon"><Icon size={16} strokeWidth={1.7} /></span>
                <span><span className="prompt-title" style={{ display: "block" }}>{item.title}</span><span className="prompt-description" style={{ display: "block" }}>{item.description}</span></span>
              </button>;
            })}</div>
            <div className="assistant-note" style={{ marginTop: 22 }}><ShieldCheck size={15} style={{ flexShrink: 0, color: "var(--gold)", marginTop: 1 }} /><span>For a personalised reading, add your birth date, exact local birth time, and birthplace. This preview won’t invent planetary placements; verified chart calculations will be connected in the next development phase.</span></div>
          </section> : <section className="chat-area" aria-live="polite">
            {chartReport && <section className="chart-panel">
              <div className="chart-panel-head"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR VEDIC BIRTH CHART</div><h2 className="chart-title">{chartReport.ascendant.sign} Ascendant <span>· {chartReport.birth.place.split(",").slice(0, 2).join(",")}</span></h2><p className="chart-subtitle">Lahiri sidereal · Whole-sign houses · {chartReport.birth.timezone}</p></div><button className="secondary-button chart-export" onClick={() => { const blob = new Blob([JSON.stringify(chartReport, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "vedic-ai-kundli.json"; link.click(); URL.revokeObjectURL(url); }}>Export chart <ArrowDown size={13}/></button><button className="primary-button chart-save" onClick={saveChartReport}>Save kundli <Check size={13}/></button></div>
              <div className="chart-stats"><div className="chart-stat"><span>Ascendant / Lagna</span><strong>{chartReport.ascendant.sign}</strong><small>{chartReport.ascendant.degreeInSign.toFixed(2)}° · {chartReport.ascendant.nakshatra}</small></div><div className="chart-stat"><span>Moon Nakshatra</span><strong>{chartReport.planets.find((planet) => planet.name === "Moon")?.nakshatra || "—"}</strong><small>Pada {chartReport.planets.find((planet) => planet.name === "Moon")?.nakshatraPada || "—"}</small></div><div className="chart-stat"><span>Current Mahadasha</span><strong>{chartReport.vimshottari.currentMahadasha.lord}</strong><small>{new Date(chartReport.vimshottari.currentMahadasha.start).toLocaleDateString()} – {new Date(chartReport.vimshottari.currentMahadasha.end).toLocaleDateString()}</small></div></div>
              <div className="chart-secondary-grid">
                <section className="chart-subpanel"><h3>Rashi chart · D1 whole-sign houses</h3><p className="chart-subcopy">House signs are derived from the calculated ascendant.</p><div className="house-grid">{Array.from({ length: 12 }, (_, index) => { const house = index + 1; const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]; const occupants = chartReport.planets.filter((planet) => planet.house === house); return <div className="house-cell" key={house}><span>HOUSE {house}</span><strong>{signs[(chartReport.ascendant.signIndex + house - 1) % 12]}</strong><small>{occupants.length ? occupants.map((planet) => planet.name).join(" · ") : "—"}</small></div>; })}</div></section>
                <section className="chart-subpanel"><h3>Vimshottari mahadasha</h3><p className="chart-subcopy">Approximate period timeline derived from the Moon's nakshatra.</p><div className="dasha-list">{chartReport.vimshottari.periods.slice(0, 9).map((period, index) => <div className={"dasha-row " + (period.lord === chartReport.vimshottari.currentMahadasha.lord ? "current" : "")} key={period.lord + index}><span className="dasha-dot"/><div><strong>{period.lord}</strong><small>{new Date(period.start).toLocaleDateString()} – {new Date(period.end).toLocaleDateString()}</small></div><span className="dasha-years">{period.years}y</span></div>)}</div></section>
              </div>
              <div className="chart-table-wrap"><table className="chart-table"><thead><tr><th>Graha</th><th>Rashi</th><th>Degree</th><th>House</th><th>Nakshatra</th><th>Navamsa</th><th>Status</th></tr></thead><tbody>{chartReport.planets.map((planet) => <tr key={planet.name}><td>{planet.name}</td><td>{planet.sign}</td><td>{planet.degreeInSign.toFixed(2)}°</td><td>{planet.house}</td><td>{planet.nakshatra} · {planet.nakshatraPada}</td><td>{planet.navamsaSign}</td><td>{planet.retrograde ? "Retrograde" : "Direct"}</td></tr>)}</tbody></table></div>
              <p className="chart-disclaimer"><ShieldCheck size={13}/> {chartReport.disclaimer}</p>
            </section>}
            {messages.map((message) => <div className={"message-row " + message.role} key={message.id}>
              {message.role === "assistant" && <div className="message-avatar"><MoonStar size={16} /></div>}
              {message.role === "assistant" ? <div className="message-content">
                <div className="message-meta">VEDIC AI <span style={{ color: "#5f6057", margin: "0 5px" }}>·</span> ASTROLOGY COMPANION</div>
                <div className="message-text markdown-body"><ReactMarkdown>{message.content}</ReactMarkdown></div>
                <div className="assistant-note"><Sparkles size={14} style={{ flexShrink: 0, color: "var(--gold)", marginTop: 2 }} /><span>Interpretations are intended for reflection and learning. Chart-based answers will be enabled once calculation and AI services are configured.</span></div>
              </div> : <div className="user-bubble">{message.content}</div>}
            </div>)}
            {isLoading && <div className="message-row"><div className="message-avatar"><MoonStar size={16} /></div><div className="message-content"><div className="message-meta">VEDIC AI · THINKING</div><div className="message-text">Preparing a thoughtful response…</div></div></div>}<div ref={bottomRef} />
          </section>}
        </div>

        <footer className="chat-footer"><div className="composer-wrap">
          <form className="composer" onSubmit={submitMessage}>
            <textarea ref={textareaRef} value={input} onChange={(event) => { setInput(event.target.value); event.target.style.height = "auto"; event.target.style.height = Math.min(event.target.scrollHeight, 150) + "px"; }} onKeyDown={onComposerKeyDown} placeholder="Ask about your kundli, planets, nakshatras, or Jyotish…" rows={1} aria-label="Message Vedic AI" />
            <div className="composer-bottom"><div className="composer-tools">
              <button type="button" className="tool-button" onClick={() => setIsBirthOpen(true)}><Plus size={15} /><span>{savedBirth ? "Birth profile added" : "Add birth details"}</span></button>
              <button type="button" className="tool-button" onClick={() => setToast("Voice input is planned for a later release.")}><AudioLines size={15} /><span>Voice</span></button>
            </div><button type="submit" className="send-button" aria-label="Send message" disabled={!input.trim() || isLoading}><ArrowUp size={17} /></button></div>
          </form>
          <p className="footer-note">Vedic AI can make mistakes. Astrological interpretations are traditional perspectives, not certainties.</p>
        </div></footer>
      </section>

      {toast && <div role="status" style={{ position: "fixed", zIndex: 80, bottom: 85, left: "50%", transform: "translateX(-50%)", width: "max-content", maxWidth: "calc(100vw - 32px)", padding: "12px 16px", border: "1px solid var(--line2)", borderRadius: 12, color: "var(--text)", background: "#25261f", boxShadow: "0 12px 40px #0005", fontSize: 12, lineHeight: 1.6 }}>{toast}</div>}

      {isBirthOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsBirthOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="birth-modal-title">
          <div className="modal-head"><div>
            <div className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL CHART</div>
            <h2 className="modal-title" id="birth-modal-title" style={{ margin: "12px 0 0" }}>Begin with your birth details</h2>
            <p className="modal-copy">Accurate time and place help determine the ascendant and planetary houses. You can review these details before chart calculation.</p>
          </div><button className="icon-button" onClick={() => setIsBirthOpen(false)} aria-label="Close birth details"><X size={17} /></button></div>
          <form onSubmit={submitBirth}>
            <div className="form-grid">
              <label className="form-field full"><span className="form-label">Name <span style={{ color: "var(--quiet)", fontWeight: 400 }}>(optional)</span></span><input className="form-input" autoComplete="name" value={birth.name} onChange={(event) => setBirth({ ...birth, name: event.target.value })} placeholder="What should we call you?" /></label>
              <label className="form-field"><span className="form-label">Date of birth *</span><input className="form-input" type="date" required value={birth.date} onChange={(event) => setBirth({ ...birth, date: event.target.value })} /></label>
              <label className="form-field"><span className="form-label">Local birth time *</span><input className="form-input" type="time" required value={birth.time} onChange={(event) => setBirth({ ...birth, time: event.target.value })} /></label>
              <label className="form-field full"><span className="form-label">Birthplace *</span><div className="place-search-row"><input className="form-input" required value={birth.place} onChange={(event) => { setBirth({ ...birth, place: event.target.value }); setSelectedPlace(null); setPlaceOptions([]); }} placeholder="City, region, country (e.g. Jaipur, India)" /><button type="button" className="secondary-button place-search-button" disabled={isGeocoding || birth.place.trim().length < 2} onClick={searchPlaces}>{isGeocoding ? "Searching…" : "Find place"}</button></div>{selectedPlace && <p className="place-selected"><Check size={12} /> Selected: {selectedPlace.label}</p>}{placeOptions.length > 1 && <div className="place-options">{placeOptions.map((option) => <button type="button" className={"place-option " + (selectedPlace?.id === option.id ? "chosen" : "")} key={option.id} onClick={() => { setSelectedPlace(option); setBirth({ ...birth, place: option.label }); setPlaceOptions([]); }}><Compass size={13}/><span>{option.label}</span>{selectedPlace?.id === option.id && <Check size={13}/>}</button>)}</div>}<span className="place-hint">Select the exact city/area so timezone and coordinates are resolved correctly.</span></label>
            </div>
            <div className="assistant-note"><ShieldCheck size={14} style={{ flexShrink: 0, color: "var(--gold)", marginTop: 2 }} /><span>Birth details are sent to the chart service to calculate your kundli. This prototype does not save them to a database; add sign-in and storage configuration before using cloud history.</span></div>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setIsBirthOpen(false)}>Cancel</button><button type="submit" className="primary-button">Save birth details <ArrowUp size={14} /></button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
