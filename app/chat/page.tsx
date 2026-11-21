"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import AppNavigationDrawer from "@/components/app-navigation-drawer";
import AppDesktopSidebar from "@/components/app-desktop-sidebar";
import CelestialHomeView from "@/components/home/celestial-home-view";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useLanguage } from "@/lib/i18n/language-context";
import { translateAssistantChatMessage, isDevanagariText } from "@/lib/i18n/chat-translator";
import type { KundliReport } from "@/lib/astrology";
import { printKundliReport, downloadKundliPdfFile } from "@/lib/print-report";
import { buildKundliHouseSummary, buildKundliPlanetSummary, buildKundliSimpleSummary } from "@/lib/kundli-summary";
import { build15PointVedicReport, calculatePlanetaryAspects } from "@/lib/vedic-15-point-report";
import KundliVoicePlayer from "@/components/voice/kundli-voice-player";
import { stopAllSpeech } from "@/lib/voice/unified-tts-client";
import {
  ArrowDown, ArrowUp, Mic, MicOff, CalendarDays, Check, ChevronLeft, ChevronRight,
  History, LogOut, Menu, MoonStar, Orbit, Plus,
  ShieldCheck, Sparkles, UserRound, X, Trash2, RefreshCw, Bell,
  Download, Printer, LoaderCircle, Send, Compass,
} from "lucide-react";

type Message = { id: string; role: "user" | "assistant"; content: string; animated?: boolean };
type BirthProfile = { name: string; date: string; time: string; place: string; latitude?: number; longitude?: number; timezone?: string };
type PlaceOption = { id: string; label: string; latitude: number; longitude: number; type: string; importance: number };
type HistoryItem = { id: string; title: string; updated_at?: string };
type VoiceRecognition = { lang: string; interimResults: boolean; continuous: boolean; onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onerror: ((event: { error?: string }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void; abort?: () => void };
type VoiceWindow = Window & { SpeechRecognition?: new () => VoiceRecognition; webkitSpeechRecognition?: new () => VoiceRecognition };

const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function formatConversationDate(value?: string) {
  if (!value) return "Saved conversation";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved conversation";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);
  if (dayDiff === 0) return "Today, " + date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff > 1 && dayDiff < 7) return dayDiff + " days ago";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function BirthDatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const today = new Date();
  const selected = value ? new Date(value + "T12:00:00") : null;
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());
  const rootRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarCells = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const years = Array.from({ length: maxDate.getFullYear() - 1899 }, (_, index) => maxDate.getFullYear() - index);
  const displayValue = value ? (() => {
    const [year, month, day] = value.split("-");
    return day + "-" + month + "-" + year;
  })() : "";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node) || calendarRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!value) return;
    const parsed = new Date(value + "T12:00:00");
    if (Number.isNaN(parsed.getTime())) return;
    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
  }, [value]);

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    if (next.getFullYear() < 1900 || next > maxDate) return;
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function chooseDay(day: number) {
    const next = new Date(viewYear, viewMonth, day);
    if (next > maxDate) return;
    onChange([viewYear, String(viewMonth + 1).padStart(2, "0"), String(day).padStart(2, "0")].join("-"));
    setOpen(false);
  }

  return <><div className="birth-date-picker" ref={rootRef}>
    <div className="birth-date-control">
      <input className="form-input birth-date-display" type="text" value={displayValue} placeholder="DD-MM-YYYY" readOnly required aria-label="Date of birth" onClick={() => setOpen(true)} />
      <button type="button" className="birth-date-toggle" aria-label={open ? "Close calendar" : "Open calendar"} aria-expanded={open} onClick={() => setOpen((current) => !current)}><CalendarDays size={16}/></button>
    </div>

  </div>
    {open && typeof document !== "undefined" ? createPortal(
      <div className="birth-calendar-layer" onPointerDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <div className="birth-calendar" ref={calendarRef} role="dialog" aria-label="Choose date of birth" aria-modal="true" onPointerDown={(event) => event.stopPropagation()}>
      <div className="birth-calendar-topline"><span className="birth-calendar-kicker">BIRTH DETAILS</span><span className="birth-calendar-zone"><span /> LOCAL DATE</span></div>
      <div className="birth-calendar-heading">
        <div className="birth-calendar-selectors">
          <select aria-label="Month" value={viewMonth} onChange={(event) => setViewMonth(Number(event.target.value))}>
            {monthNames.map((month, index) => <option value={index} key={month} disabled={viewYear === maxDate.getFullYear() && index > maxDate.getMonth()}>{month}</option>)}
          </select>
          <select aria-label="Year" value={viewYear} onChange={(event) => {
            const nextYear = Number(event.target.value);
            setViewYear(nextYear);
            if (nextYear === maxDate.getFullYear() && viewMonth > maxDate.getMonth()) setViewMonth(maxDate.getMonth());
          }}>
            {years.map((year) => <option value={year} key={year}>{year}</option>)}
          </select>
        </div>
        <div className="birth-calendar-navigation">
          <button type="button" className="birth-calendar-nav" aria-label="Previous month" disabled={viewYear === 1900 && viewMonth === 0} onClick={() => shiftMonth(-1)}><ChevronLeft size={17}/></button>
          <button type="button" className="birth-calendar-nav" aria-label="Next month" disabled={viewYear === maxDate.getFullYear() && viewMonth >= maxDate.getMonth()} onClick={() => shiftMonth(1)}><ChevronRight size={17}/></button>
        </div>
      </div>
      <div className="birth-calendar-grid birth-calendar-weekdays">{weekdayNames.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="birth-calendar-grid birth-calendar-days" aria-live="polite">
        {calendarCells.map((day, index) => {
          const isFuture = day !== null && new Date(viewYear, viewMonth, day) > maxDate;
          const isSelected = day !== null && value === [viewYear, String(viewMonth + 1).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
          const isToday = day !== null && viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
          return day === null
            ? <span className="birth-calendar-empty" key={"empty-" + index} />
            : <button type="button" key={day} disabled={isFuture} className={"birth-calendar-day" + (isSelected ? " selected" : "") + (isToday ? " today" : "")} aria-pressed={isSelected} aria-label={monthNames[viewMonth] + " " + day + ", " + viewYear + (isToday ? ", today" : "")} onClick={() => chooseDay(day)}>{day}</button>;
        })}
      </div>
      <div className="birth-calendar-footer"><div className="birth-calendar-selected"><span>SELECTED DATE</span><strong>{displayValue || "Choose a date"}</strong></div><button type="button" className="birth-calendar-today" onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); onChange([today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-")); setOpen(false); }}><CalendarDays size={13}/> Today</button></div>
    </div>
      </div>,
      document.body
    ) : null}
  </>;
}

function KundliDiagram({ report }: { report: KundliReport }) {
  const houses = [
    { house: 1, x: 200, y: 54 }, { house: 2, x: 105, y: 54 },
    { house: 3, x: 52, y: 105 }, { house: 4, x: 52, y: 200 },
    { house: 5, x: 52, y: 295 }, { house: 6, x: 105, y: 346 },
    { house: 7, x: 200, y: 346 }, { house: 8, x: 295, y: 346 },
    { house: 9, x: 348, y: 295 }, { house: 10, x: 348, y: 200 },
    { house: 11, x: 348, y: 105 }, { house: 12, x: 295, y: 54 },
  ];
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return <div className="kundli-visual-wrap">
    <div className="kundli-visual-heading"><div><span className="eyebrow-line" /> NORTH INDIAN · D1 RASHI CHART</div><span>Calculated positions</span></div>
    <svg className="kundli-svg" viewBox="0 0 400 400" role="img" aria-label={"North Indian style Rashi chart for " + report.birth.place + ", " + report.ascendant.sign + " ascendant"}>
      <rect x="1" y="1" width="398" height="398" rx="5" className="kundli-frame" />
      <path d="M1 1 L399 399 M399 1 L1 399 M200 1 L1 200 L200 399 L399 200 Z" className="kundli-lines" />
      <circle cx="200" cy="200" r="31" className="kundli-center-glow" />
      <text x="200" y="194" textAnchor="middle" className="kundli-center-title">VEDIC AI</text>
      <text x="200" y="211" textAnchor="middle" className="kundli-center-sub">RASHI · D1</text>
      {houses.map(({ house, x, y }) => {
        const sign = signs[(report.ascendant.signIndex + house - 1) % 12];
        const occupants = report.planets.filter((planet) => planet.house === house);
        const label = house === 1 ? "Lagna · 1" : "House " + house;
        const max = 3;
        return <g key={house} className={house === 1 ? "kundli-house kundli-lagna" : "kundli-house"}>
          <text x={x} y={y - 15} textAnchor="middle" className="kundli-house-label">{label}</text>
          <text x={x} y={y + 1} textAnchor="middle" className="kundli-sign">{sign}</text>
          {occupants.slice(0, max).map((planet, index) => <text key={planet.name} x={x} y={y + 19 + index * 13} textAnchor="middle" className="kundli-planet">{planet.name}</text>)}
          {occupants.length > max && <text x={x} y={y + 19 + max * 13} textAnchor="middle" className="kundli-planet">+{occupants.length - max}</text>}
        </g>;
      })}
    </svg>
    <p className="kundli-visual-caption">Planet labels are placed from the calculated whole-sign house positions. Verify this early calculation engine against a trusted Jyotish reference before relying on precise readings.</p>
  </div>;
}


function normalizeAssistantMarkdown(raw: string) {
  const source = raw.replace(/\\r\\n?/g, "\\n").trim();
  const lines = source.split("\\n");
  const normalized: string[] = [];
  const isPipeRow = (line: string) => line.includes("|") && line.split("|").length >= 3;
  const isSeparator = (line: string) => {
    const cells = line.trim().replace(/^\\|/, "").replace(/\\|$/, "").split("|");
    return cells.length >= 2 && cells.every((cell) => /^\\s*:?-{1,}:?\\s*$/.test(cell));
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trimEnd();
    normalized.push(line);
    if (isPipeRow(line) && i + 1 < lines.length && isPipeRow(lines[i + 1]) && !isSeparator(lines[i + 1])) {
      const headerCells = line.trim().replace(/^\\|/, "").replace(/\\|$/, "").split("|");
      const nextCells = lines[i + 1].trim().replace(/^\\|/, "").replace(/\\|$/, "").split("|");
      if (headerCells.length === nextCells.length && headerCells.length >= 2) {
        normalized.push("| " + headerCells.map(() => "---").join(" | ") + " |");
      }
    } else if (isSeparator(line)) {
      const cells = line.trim().replace(/^\\|/, "").replace(/\\|$/, "").split("|");
      normalized[normalized.length - 1] = "| " + cells.map((cell) => {
        const alignment = cell.trim();
        return alignment.startsWith(":") && alignment.endsWith(":") ? ":---:" : alignment.startsWith(":") ? ":---" : alignment.endsWith(":") ? "---:" : "---";
      }).join(" | ") + " |";
    }
  }

  return normalized.join("\\n").replace(/\\n{3,}/g, "\\n\\n");
}

function StructuredMessageView({ content, language = "en" }: { content: string; language?: "en" | "hi" }) {
  const normalizedContent = normalizeAssistantMarkdown(content);
  return (
    <div className="message-text markdown-body ai-structured-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h3({ children }) {
            const raw = String(children || "");
            const match = raw.match(/^([1-7])\.\s*(.+)$/);
            if (match) {
              const num = match[1];
              const title = match[2];
              return (
                <div className={`ai-structured-heading ai-section-${num}`}>
                  <span className="ai-heading-pill">
                    {language === "hi" ? `खंड ${num}` : `Section ${num}`}
                  </span>
                  <h3 className="ai-heading-text">{title}</h3>
                </div>
              );
            }
            return <h3 className="ai-heading-text">{children}</h3>;
          },
          blockquote({ children }) {
            return <div className="ai-quote-card">{children}</div>;
          },
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}

export default function Home() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("openBirth") === "1") setIsBirthOpen(true);
      const query = params.get("q") || params.get("prompt") || window.sessionStorage?.getItem("vedic-pending-query");
      if (query && query.trim()) {
        setInput(query.trim());
      }
      if (params.get("home") === "1") {
        startNewChat();
        window.history.replaceState(null, "", "/chat");
      }
    }
  }, []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountAvatar, setAccountAvatar] = useState("");
  const [isBirthOpen, setIsBirthOpen] = useState(false);
  const [birthAiConsent, setBirthAiConsent] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [memoryText, setMemoryText] = useState("");
  const [memoryDraft, setMemoryDraft] = useState("");
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memorySaving, setMemorySaving] = useState(false);
  const [birth, setBirth] = useState<BirthProfile>({ name: "", date: "", time: "", place: "" });
  const [savedBirth, setSavedBirth] = useState<BirthProfile | null>(null);
  const [chartReport, setChartReport] = useState<KundliReport | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string>("");
  const [transitReport, setTransitReport] = useState<KundliReport | null>(null);
  const [transitLoading, setTransitLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [placeOptions, setPlaceOptions] = useState<PlaceOption[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);
  const [pendingDeleteConversation, setPendingDeleteConversation] = useState<HistoryItem | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const conversationLoadRequestRef = useRef(0);
  const accountUserIdRef = useRef<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      try {
        const urlTheme = new URLSearchParams(window.location.search).get("theme");
        if (urlTheme === "light" || urlTheme === "dark") return urlTheme;
        const saved = window.localStorage.getItem("vedic-chat-theme");
        if (saved === "light" || saved === "dark") return saved;
      } catch {}
    }
    return "dark";
  });
  const { language, setLanguage } = useLanguage();
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [isTranslatingChat, setIsTranslatingChat] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const assistantMsgs = messages.filter((m) => m.role === "assistant");
    if (assistantMsgs.length === 0) return;

    const msgsToTranslate = assistantMsgs.filter((m) => {
      const isDev = isDevanagariText(m.content);
      const isTargetDev = language === "hi";
      const key = `${m.id}:${language}`;
      return isDev !== isTargetDev && !translatedMessages[key];
    });

    if (msgsToTranslate.length === 0) return;

    setIsTranslatingChat(true);
    void Promise.all(
      msgsToTranslate.map(async (m) => {
        const translated = await translateAssistantChatMessage(m.content, language);
        return { id: m.id, translated };
      })
    )
      .then((results) => {
        if (!isCurrent) return;
        setTranslatedMessages((prev) => {
          const next = { ...prev };
          for (const res of results) {
            next[`${res.id}:${language}`] = res.translated;
          }
          return next;
        });
      })
      .catch((err) => console.warn("[vedic-ai] Chat translation error:", err))
      .finally(() => {
        if (isCurrent) setIsTranslatingChat(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [language, messages, translatedMessages]);

  const [toast, setToast] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<VoiceRecognition | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasConversation = messages.length > 0;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);
  useEffect(() => {
    try {
      const urlTheme = new URLSearchParams(window.location.search).get("theme");
      const saved = window.localStorage.getItem("vedic-chat-theme");
      const current = urlTheme === "light" || urlTheme === "dark" ? urlTheme : (saved === "light" ? "light" : "dark");
      console.log("THEME_EFFECT: urlTheme=", urlTheme, "saved=", saved, "current=", current);
      setTheme(current);
      document.documentElement.dataset.theme = current;
      document.documentElement.classList.toggle("dark", current === "dark");
      document.documentElement.classList.toggle("light", current === "light");
    } catch {}
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem("vedic-chat-theme", theme);
      document.documentElement.dataset.theme = theme;
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.classList.toggle("light", theme === "light");
      document.querySelectorAll('[data-theme="dark"]').forEach(el => {
        console.log("FIND_DARK: [data-theme=dark] on", el.tagName, el.className.slice(0, 30));
      });
      document.querySelectorAll('.dark').forEach(el => {
        console.log("FIND_DARK: .dark on", el.tagName, el.className.slice(0, 30));
      });
    } catch {}
  }, [theme]);
  // Do not restore birth profiles, charts, or chat messages from a global browser key.
  // That key was shared across accounts and could expose one user's chart to another.
  useEffect(() => {
    try { window.localStorage.removeItem("vedic-active-chat-v2"); } catch {}
  }, []);
  useEffect(() => {
    try {
      setSidebarCollapsed(window.localStorage.getItem("vedic-sidebar-collapsed") === "1");
      // Clear legacy guest chat data; history is now strictly account-scoped.
      window.localStorage.removeItem("vedic-guest-chat-v1");
      window.localStorage.removeItem("vedic-guest-conversations-v1");
      window.localStorage.removeItem("vedic-pending-chat-v1");
      for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
        const key = window.localStorage.key(index);
        if (key?.startsWith("vedic-chat-cache-v1:")) window.localStorage.removeItem(key);
      }
    } catch {}
  }, []);


  async function enableNotifications() {
    if (!("Notification" in window)) {
      setToast("This browser does not support web notifications. Try updating Chrome or installing the site as an app.");
      return;
    }
    if (!window.isSecureContext) {
      setToast("Notifications require a secure HTTPS connection.");
      return;
    }
    if (Notification.permission === "granted") {
      setToast("Notifications are already enabled for this site.");
      return;
    }
    if (Notification.permission === "denied") {
      setToast("Notifications are blocked in browser settings. Tap the site controls beside the address bar → Permissions → Notifications → Allow, then reload.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setToast(permission === "granted" ? "Notifications enabled for this browser." : permission === "denied" ? "Notifications were blocked. Enable them from this site's browser permissions." : "No permission was selected. You can enable notifications from the bell button later.");
    } catch {
      setToast("Could not request notification permission. Check this site's browser permissions and try again.");
    }
  }

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setAuthReady(true); return; }
    const applyUser = (user: { id?: string; email?: string; is_anonymous?: boolean; user_metadata?: Record<string, unknown> } | null) => {
      const signedInUser = Boolean(user && !user.is_anonymous && user.id);
      const nextUserId = signedInUser ? user?.id || null : null;
      if (accountUserIdRef.current !== nextUserId) {
        accountUserIdRef.current = nextUserId;
        setHistoryItems([]);
        setMessages([]);
        setSavedBirth(null);
        setActiveConversationId(null);
        setLoadingConversationId(null);
        setPendingDeleteConversation(null);
        setChartReport(null);
        setTransitReport(null);
        try { window.localStorage.removeItem("vedic-active-chat-v2"); } catch {}
      }
      setIsSignedIn(signedInUser);
      setAuthReady(true);
      setAccountEmail(signedInUser ? user?.email || "" : "");
      setAccountName(signedInUser ? String(user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "") : "");
      setAccountAvatar(signedInUser ? String(user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "") : "");
    };
    supabase.auth.getUser().then(({ data }) => applyUser(data.user)).catch(() => setAuthReady(true));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const refreshHistory = async () => {
      if (!isSignedIn) return;
      try {
        const response = await fetch("/api/conversations", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (Array.isArray(payload?.conversations)) setHistoryItems(payload.conversations);
      } catch {}
    };
    window.addEventListener("focus", refreshHistory);
    window.addEventListener("online", refreshHistory);
    return () => {
      window.removeEventListener("focus", refreshHistory);
      window.removeEventListener("online", refreshHistory);
    };
  }, [isSignedIn]);

  useEffect(() => {
    const conversationId = new URLSearchParams(window.location.search).get("conversation");
    if (conversationId) void loadConversation(conversationId);
  }, []);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const loadHistory = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active || !data.session || data.session.user.is_anonymous) return;
      const response = await fetch("/api/conversations");
      if (!active || !response.ok) return;
      const payload = await response.json();
      if (payload?.conversations) setHistoryItems(payload.conversations);
    };
    void loadHistory().catch(() => undefined);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session || session.user.is_anonymous) { setHistoryItems([]); return; }
      void loadHistory().catch(() => undefined);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const handleToggle = () => {
      setSidebarCollapsed(document.documentElement.dataset.sidebarCollapsed === "true");
    };
    window.addEventListener("vedic-sidebar-toggle", handleToggle);
    return () => window.removeEventListener("vedic-sidebar-toggle", handleToggle);
  }, []);

 

  function startNewChat() {
    stopAllSpeech();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vedic-stop-voice"));
    }
    conversationLoadRequestRef.current += 1;
    setMessages([]);
    setInput("");
    setChartReport(null);
    setTransitReport(null);
    setActiveConversationId(null);
    setLoadingConversationId(null);
    setMobileMenuOpen(false);
    try { window.localStorage.removeItem("vedic-active-chat-v2"); } catch {}
    if (typeof window !== "undefined") window.history.replaceState({}, "", "/chat");
  }

  function retryLastTurn() {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg && !isLoading) {
      sendMessage(lastUserMsg.content);
    }
  }

  async function loadConversation(id: string) {
    stopAllSpeech();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vedic-stop-voice"));
    }
    if (!isSignedIn) { setToast("Sign in to open your saved conversations."); return; }
    const requestId = ++conversationLoadRequestRef.current;
    setLoadingConversationId(id);
    try {
      const response = await fetch("/api/conversations?id=" + encodeURIComponent(id), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load conversation.");
      const loadedMessages: Message[] = Array.isArray(data.messages)
        ? data.messages.filter((message: { role?: string; content?: string }) =>
            (message.role === "user" || message.role === "assistant") && typeof message.content === "string" && message.content.trim()
          ).map((message: { id?: string; role: "user" | "assistant"; content: string }, index: number) => ({
            id: message.id || id + "-" + index, role: message.role, content: message.content,
          }))
        : [];
      if (requestId !== conversationLoadRequestRef.current) return;
      if (!loadedMessages.length) throw new Error("This conversation has no readable saved messages.");
      setMessages(loadedMessages);
      setActiveConversationId(id);
      setChartReport(data.chartReport || null);
      setTransitReport(null);
      if (data.chartReport?.birth) {
        setSavedBirth({ name: "", date: data.chartReport.birth.date, time: data.chartReport.birth.time, place: data.chartReport.birth.place, latitude: data.chartReport.birth.latitude, longitude: data.chartReport.birth.longitude, timezone: data.chartReport.birth.timezone });
      } else setSavedBirth(null);
      window.history.replaceState({}, "", "/chat?conversation=" + encodeURIComponent(id));
      setMobileMenuOpen(false);
    } catch (error) {
      if (requestId === conversationLoadRequestRef.current) setToast(error instanceof Error ? error.message : "Could not load conversation.");
    } finally {
      if (requestId === conversationLoadRequestRef.current) setLoadingConversationId(null);
    }
  }

  function requestDeleteConversation(id: string) {
    const item = historyItems.find((conversation) => conversation.id === id);
    if (item) setPendingDeleteConversation(item);
  }

  async function deleteConversation(id: string) {
    if (!isSignedIn) { setToast("Sign in to delete saved conversations."); return; }
    if (deletingConversationId) return;
    setDeletingConversationId(id);
    try {
      const response = await fetch("/api/conversations?id=" + encodeURIComponent(id), { method: "DELETE", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete conversation.");
      setHistoryItems((items) => items.filter((item) => item.id !== id));
      if (activeConversationId === id) startNewChat();
      setPendingDeleteConversation(null);
      setToast("Conversation deleted successfully.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not delete conversation.");
    } finally {
      setDeletingConversationId(null);
    }
  }

  async function persistConversation(allMessages: Message[], newMessages: Message[], conversationId: string | null = activeConversationId): Promise<string | null> {
    // Guest chats live only in React state for the current tab. Never write them to browser storage.
    if (!isSignedIn) return null;
    const messagesToSave = (conversationId ? newMessages : allMessages).slice(-30).map(({ role, content }) => ({ role, content }));
    try {
      const response = await fetch("/api/conversations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: conversationId || undefined, messages: messagesToSave }), cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        setToast(response.status === 401 ? "Your session expired. Sign in again to save this chat." : (data.error || "Could not save this chat. It remains only in this open tab."));
        return conversationId;
      }
      const conversation = data.conversation as HistoryItem | undefined;
      if (conversation?.id) {
        setActiveConversationId(conversation.id);
        setHistoryItems((items) => [conversation, ...items.filter((item) => item.id !== conversation.id)].slice(0, 30));
        return conversation.id;
      }
      return conversationId;
    } catch {
      setToast("Connection interrupted. This chat is only available in this open tab until it can be saved.");
      return conversationId;
    }
  }

  async function sendMessage(value?: string) {
    stopAllSpeech();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vedic-stop-voice"));
    }
    const trimmed = (value === undefined ? input : value).trim();
    if (!trimmed || isLoading) return;
    if (!authReady) { setToast("Checking your sign-in session. Please try again in a moment."); return; }
    // Personal questions must not receive generic text disguised as a chart reading.
    const personalIntent = /\b(my career|my job|my profession|my marriage|my relationship|my future|my kundli|my birth chart|my nakshatra|my dasha|my promotion|my business|personal reading|personalised reading|personalized reading|meri kundli|mera career|meri job|meri shaadi|mera bhavishya|mujhe job|mujhe career|career prediction|job prediction|marriage prediction|relationship prediction|when will i get a job|will i get married|will i get a job)\b/i.test(trimmed);
    if ((!savedBirth || !chartReport) && personalIntent) {
      setPendingPrompt(trimmed);
      setIsBirthOpen(true);
      setToast("For a personal reading, add your date of birth, exact local birth time, and birthplace first. I won't guess your chart.");
      return;
    }
    const userMessage: Message = { id: makeId(), role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    // Save the user turn in parallel with the AI request. Conversation persistence
    // must never keep the chat's "thinking" state visible after the AI has replied.
    const initialSave = persistConversation(nextMessages, [userMessage], activeConversationId);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-30).map(({ role, content }) => ({ role, content })),
          birthProfile: savedBirth || undefined,
          chartContext: chartReport || undefined, language,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The AI service is not available right now.");
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The AI returned an empty response. Please try again.");
      }
      const assistantMessage: Message = { id: makeId(), role: "assistant", content: data.reply, animated: true };
      const completeMessages = [...nextMessages, assistantMessage];
      setMessages(completeMessages);
      setIsLoading(false);
      // Persist the completed turn in the background; don't block rendering or input.
      void initialSave.then((conversationId) =>
        persistConversation(completeMessages, [assistantMessage], conversationId)
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach the AI service.";
      const assistantMessage: Message = { id: makeId(), role: "assistant", content: message, animated: true };
      const failedMessages = [...nextMessages, assistantMessage];
      setMessages(failedMessages);
      setIsLoading(false);
      void initialSave.then((conversationId) =>
        persistConversation(failedMessages, [assistantMessage], conversationId)
      );
    } finally {
      setIsLoading(false);
    }
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) { event.preventDefault(); sendMessage(); }

  // Handle incoming query from FloatingChatDock on other pages (?q=... or ?prompt=...)
  useEffect(() => {
    if (typeof window === "undefined" || !authReady) return;
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || params.get("prompt") || window.sessionStorage?.getItem("vedic-pending-query");
    if (query && query.trim()) {
      try {
        window.sessionStorage?.removeItem("vedic-pending-query");
      } catch {}
      window.history.replaceState(null, "", "/chat");
      void sendMessage(query.trim());
    }
  }, [authReady]);
  async function toggleVoiceInput() {
    if (voiceListening) {
      try {
        if (speechRecognitionRef.current) speechRecognitionRef.current.stop();
        else recorderRef.current?.stop();
      } catch {}
      return;
    }
    if (typeof window === "undefined" || !window.isSecureContext) {
      setToast("Voice typing needs HTTPS. Open Vedic AI using its https:// address.");
      return;
    }

    // Prefer Chrome's built-in speech-to-text on Android. This avoids a separate
    // audio upload/transcription API for browsers that support Web Speech.
    const voiceWindow = window as VoiceWindow;
    const Recognition = voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition;
    if (Recognition) {
      try {
        // Ask for microphone permission explicitly before native speech recognition.
        if (navigator.mediaDevices?.getUserMedia) {
          const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          permissionStream.getTracks().forEach((track) => track.stop());
        }
        const recognition = new Recognition();
        speechRecognitionRef.current = recognition;
        recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
          const finalParts: string[] = [];
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result?.[0]?.transcript && result.isFinal) finalParts.push(result[0].transcript.trim());
          }
          const transcript = finalParts.join(" ").trim();
          if (transcript) {
            setInput((current) => current.trim() ? current.trimEnd() + " " + transcript : transcript);
            setToast("Voice added to your message. Keep speaking or tap the microphone to finish.");
          }
        };
        recognition.onerror = (event) => {
          setVoiceListening(false);
          speechRecognitionRef.current = null;
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setToast("Mic blocked. In Chrome, open site settings → Microphone → Allow; also check Android Settings → Apps → Chrome → Permissions → Microphone, then reload.");
          } else if (event.error === "no-speech") {
            setToast("I couldn't hear speech. Tap the microphone and speak clearly near your phone.");
          } else if (event.error === "audio-capture") {
            setToast("No microphone is available. Close apps using the microphone and check Android permissions.");
          } else if (event.error !== "aborted") {
            setToast("Voice typing couldn't start (" + event.error + "). Check your connection and microphone permission, then try again.");
          }
        };
        recognition.onend = () => {
          setVoiceListening(false);
          speechRecognitionRef.current = null;
        };
        recognition.start();
        setVoiceListening(true);
        setToast("Listening… speak in Hindi or English. Your words will appear in the message box.");
        return;
      } catch (error) {
        speechRecognitionRef.current = null;
        setVoiceListening(false);
        const err = error as DOMException;
        if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
          setToast("Mic permission denied. Allow Microphone for vedic-ai-psi.vercel.app in Chrome site settings and Android app permissions, then reload.");
          return;
        }
        // If native recognition fails to initialize, continue to the recorder fallback below.
      }
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setToast("Voice typing is not supported in this browser. Update Chrome and allow microphone access, or use your keyboard's microphone.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      recorder.onerror = () => {
        setVoiceListening(false);
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        recorderRef.current = null;
        setToast("Voice recording failed. Check microphone permissions and try again.");
      };
      recorder.onstop = async () => {
        setVoiceListening(false);
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        recorderRef.current = null;
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioChunksRef.current = [];
        if (blob.size < 1500) {
          setToast("Recording was too short. Tap the microphone, speak, then tap it again to finish.");
          return;
        }
        if (blob.size > 10 * 1024 * 1024) {
          setToast("That recording is too long. Please record a shorter message (under 10 MB).");
          return;
        }
        setToast("Transcribing your voice…");
        try {
          const formData = new FormData();
          const extension = (blob.type || "").includes("mp4") ? "m4a" : "webm";
          formData.append("audio", blob, "voice-input." + extension);
          const response = await fetch("/api/transcribe", { method: "POST", body: formData });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || "Voice transcription is temporarily unavailable.");
          const transcript = typeof data.text === "string" ? data.text.trim() : "";
          if (!transcript) {
            setToast("I couldn't hear clear words. Please try again, speaking close to the microphone.");
            return;
          }
          setInput((current) => current.trim() ? current.trimEnd() + " " + transcript : transcript);
          setToast("Voice added to your message. Review it, then tap send.");
          window.setTimeout(() => textareaRef.current?.focus(), 0);
        } catch (error) {
          setToast(error instanceof Error ? error.message : "Could not transcribe the recording. Please try again.");
        }
      };
      recorder.start(250);
      setVoiceListening(true);
      setToast("Listening… speak now, then tap the microphone again to add your words.");
    } catch (error) {
      setVoiceListening(false);
      const err = error as DOMException;
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        setToast("Microphone permission is blocked. In Android Chrome, tap the site controls beside the address → Permissions → Microphone → Allow. Also check Android Settings → Apps → Chrome → Permissions → Microphone, then reload Vedic AI.");
      } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        setToast("No microphone was detected. Check your phone's microphone and Android app permissions.");
      } else if (err?.name === "NotReadableError") {
        setToast("The microphone is busy in another app. Close other apps using the mic and try again.");
      } else {
        setToast("Could not start microphone (" + (err?.name || "unknown error") + "). Check site and Android microphone permissions.");
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      recorderRef.current = null;
    }
  }
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
      if (!response.ok) throw new Error(data.error || "Birthplace lookup is temporarily unavailable. Try again or include city, region, and country.");
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
    if (!birthAiConsent) {
      setToast("Please confirm that your birth details and calculated chart may be sent to the configured AI provider for interpretation.");
      return;
    }
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

    stopAllSpeech();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vedic-stop-voice"));
    }

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
      setTransitReport(null);
      setIsBirthOpen(false);
      const details = (profile.name.trim() ? (language === "hi" ? "नाम: " : "Name: ") + profile.name.trim() + "\n" : "") +
        (language === "hi" ? "जन्म तिथि: " : "Date of birth: ") + profile.date +
        (language === "hi" ? "\nस्थानीय जन्म समय: " : "\nLocal birth time: ") + profile.time +
        (language === "hi" ? "\nजन्म स्थान: " : "\nBirthplace: ") + profile.place +
        (language === "hi" ? "\nसमय क्षेत्र: " : "\nTimezone: ") + report.birth.timezone;
      const requestedFocus = pendingPrompt.trim();
      const userMessage: Message = {
        id: makeId(),
        role: "user",
        content: requestedFocus
          ? (language === "hi"
              ? "मेरे इस व्यक्तिगत प्रश्न का उत्तर देने के लिए मेरी नई गणना की गई जन्म कुंडली का उपयोग करें: " + requestedFocus + "\n\nइस सत्र के लिए सत्यापित जन्म विवरण:\n" + details + "\n\nपहले प्रासंगिक गणना किए गए चार्ट तथ्यों का उल्लेख करें, फिर पारंपरिक ज्योतिषीय व्याख्या समझाएं। यदि चार्ट इंजन किसी आवश्यक कारक की विश्वसनीय गणना नहीं करता है, तो अनुमान लगाने के बजाय उस सीमा को स्पष्ट करें।"
              : "Use my newly calculated birth chart to answer this personal question: " + requestedFocus + "\n\nBirth details verified for this session:\n" + details + "\n\nFirst state the relevant calculated chart facts, then explain the traditional Jyotish interpretation. If the chart engine does not calculate a required factor reliably, disclose that limitation rather than guessing.")
          : (language === "hi"
              ? "कृपया इन जन्म विवरणों का उपयोग करके मेरी वैदिक कुंडली बनाएं और समझाएं:\n" + details
              : "Please create and explain my Vedic kundli using these birth details:\n" + details),
      };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      // Persist the birth-details turn without blocking the AI request or chat UI.
      const initialSave = persistConversation(nextMessages, [userMessage], activeConversationId);
      try {
        const aiResponse = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.slice(-30).map(({ role, content }) => ({ role, content })),
            birthProfile: profile,
            chartContext: report, language,
          }),
        });
        const aiData = await aiResponse.json();
        if (!aiResponse.ok) throw new Error(aiData.error || (language === "hi" ? "एआई सेवा आपकी व्याख्या तैयार नहीं कर सकी।" : "The AI service could not generate your reading."));
        if (typeof aiData.reply !== "string" || !aiData.reply.trim()) {
          throw new Error(language === "hi" ? "एआई ने खाली उत्तर दिया। कृपया पुनः प्रयास करें।" : "The AI returned an empty reading. Please try again.");
        }
        const assistantMessage: Message = { id: makeId(), role: "assistant", content: aiData.reply, animated: true };
        const completeMessages = [...nextMessages, assistantMessage];
        setMessages(completeMessages);
        setIsLoading(false);
        void initialSave.then((conversationId) =>
          persistConversation(completeMessages, [assistantMessage], conversationId)
        ).catch((saveError) => console.error("[vedic-ai] Could not persist completed birth-chat turn.", saveError));
      } catch (aiError) {
        const reason = aiError instanceof Error ? aiError.message : (language === "hi" ? "एआई सेवा अस्थायी रूप से अनुपलब्ध है।" : "The AI service is temporarily unavailable.");
        const assistantMessage: Message = {
          id: makeId(), role: "assistant", animated: true,
          content: language === "hi"
            ? "आपकी जन्म कुंडली की गणना सफलतापूर्वक हो गई, लेकिन इस बार मैं व्याख्या तैयार नहीं कर सका। " + reason + " आप प्रश्न पुनः पूछ सकते हैं; आपकी कुंडली नीचे उपलब्ध है।"
            : "Your birth chart was calculated successfully, but I couldn't generate the interpretation this time. " + reason + " You can retry the question; your calculated chart remains available below.",
        };
        const failedMessages = [...nextMessages, assistantMessage];
        setMessages(failedMessages);
        setIsLoading(false);
        void initialSave.then((conversationId) =>
          persistConversation(failedMessages, [assistantMessage], conversationId)
        ).catch((saveError) => console.error("[vedic-ai] Could not persist failed birth-chat turn.", saveError));
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Kundli calculation failed. Please verify your details.");
    } finally {
      setIsLoading(false);
    }
  }


  async function openMemory() {
    if (!isSignedIn) {
      setToast("Sign in to use saved context memory.");
      window.location.href = "/login";
      return;
    }
    setIsMemoryOpen(true);
    setMemoryLoading(true);
    try {
      const response = await fetch("/api/memory", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load saved memory.");
      setMemoryText(data.memory || "");
      setMemoryDraft(data.memory || "");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not load saved memory.");
    } finally { setMemoryLoading(false); }
  }

  async function saveMemory() {
    setMemorySaving(true);
    try {
      const response = await fetch("/api/memory", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memory: memoryDraft }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save memory.");
      setMemoryText(data.memory || "");
      setMemoryDraft(data.memory || "");
      setToast("Your saved context memory has been updated.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not save memory.");
    } finally { setMemorySaving(false); }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("openMemory") === "1" && isSignedIn) {
        void openMemory();
      }
    }
  }, [isSignedIn]);

  async function deleteMemory() {
    if (!window.confirm("Delete your saved context memory? Your chat history will not be deleted.")) return;
    setMemorySaving(true);
    try {
      const response = await fetch("/api/memory", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete memory.");
      setMemoryText("");
      setMemoryDraft("");
      setToast("Saved context memory deleted. Chat history remains available.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not delete memory.");
    } finally { setMemorySaving(false); }
  }

  function exportPersonalData() {
    if (!isSignedIn) {
      setToast("Sign in to export your saved data.");
      window.location.href = "/login";
      return;
    }
    window.location.href = "/api/account-data";
  }

  async function deleteAccount() {
    const confirmation = window.prompt("This permanently deletes your Vedic AI account and saved database records. Sign in again first if your session is older than 10 minutes. Type DELETE MY ACCOUNT to continue.");
    if (confirmation !== "DELETE MY ACCOUNT") return;
    setMemorySaving(true);
    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete account.");
      const supabase = getSupabaseBrowserClient();
      if (supabase) await supabase.auth.signOut();
      setIsSignedIn(false);
      setHistoryItems([]);
      setMessages([]);
      setChartReport(null);
      setTransitReport(null);
      setSavedBirth(null);
      setActiveConversationId(null);
      setIsMemoryOpen(false);
      window.location.href = "/?account_deleted=1";
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not delete account.");
    } finally {
      setMemorySaving(false);
    }
  }

  async function deletePersonalData() {
    if (!window.confirm("Delete all saved Vedic AI personal data, including birth profiles, Kundli reports, conversations, messages, and saved memory? This cannot be undone. Your sign-in account will remain active.")) return;
    setMemorySaving(true);
    try {
      const response = await fetch("/api/account-data", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete saved data.");
      setMemoryText("");
      setMemoryDraft("");
      setHistoryItems([]);
      setMessages([]);
      setChartReport(null);
      setTransitReport(null);
      setSavedBirth(null);
      setActiveConversationId(null);
      setToast(data.message || "Saved personal data deleted.");
      setIsMemoryOpen(false);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not delete saved data.");
    } finally { setMemorySaving(false); }
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setToast("Could not sign out. Please try again.");
    else {
      setIsSignedIn(false);
      setHistoryItems([]);
      setMessages([]);
      setChartReport(null);
      setTransitReport(null);
      setSavedBirth(null);
      setActiveConversationId(null);
      setToast("You have signed out securely.");
      window.location.href = "/login";
    }
  }

  async function loadCurrentTransits() {
    if (!chartReport || transitLoading) return;
    setTransitLoading(true);
    try {
      const response = await fetch("/api/transits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place: chartReport.birth.place,
          latitude: chartReport.birth.latitude,
          longitude: chartReport.birth.longitude,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not calculate current transits.");
      setTransitReport(data.report as KundliReport);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not calculate current transits.");
    } finally {
      setTransitLoading(false);
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
    <main className={"app-shell" + (sidebarCollapsed ? " sidebar-is-collapsed" : "")} data-theme={theme} data-sidebar-collapsed={sidebarCollapsed ? "true" : "false"}>
      {/* 280px Unified Left Sidebar for Desktop PC */}
      <AppDesktopSidebar
        onNewConsultation={startNewChat}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => void loadConversation(id)}
      />

      <AppNavigationDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onHome={startNewChat}
        onWorkspace={startNewChat}
        onKundli={() => setIsBirthOpen(true)}
        extraContent={
          <>
            <div className="side-label mobile-history-label">All conversations <span>{historyItems.length}</span></div>
            <div className="mobile-history-list shared-navigation-history">
              {isSignedIn && historyItems.length ? historyItems.map((item) => <div className="history-item-row" key={item.id}>
                <button type="button" className={"side-link history-item-open " + (activeConversationId === item.id ? "active" : "")} onClick={() => { void loadConversation(item.id); setMobileMenuOpen(false); }} disabled={loadingConversationId === item.id}>
                  <History size={14}/>
                  <span className="mobile-history-copy"><strong>{loadingConversationId === item.id ? "Opening…" : item.title}</strong><small>{formatConversationDate(item.updated_at)}</small></span>
                </button>
                <button type="button" className="history-delete" aria-label={"Delete " + item.title} title={"Delete " + item.title} onClick={() => { requestDeleteConversation(item.id); setMobileMenuOpen(false); }}><Trash2 size={13}/></button>
              </div>) : <p className="history-empty">{isSignedIn ? "Your saved conversations will appear here." : "Sign in to save private conversations."}</p>}
            </div>

          </>
        }
        accountContent={
            <div className="mobile-nav-bottom shared-navigation-account">
              <div className="profile-row">
                {accountAvatar ? <img className="profile-avatar" src={accountAvatar} alt="" /> : <span className="profile-avatar profile-avatar-fallback">{(accountName || savedBirth?.name || (isSignedIn ? accountEmail : "Guest explorer") || "G").trim().charAt(0).toUpperCase()}</span>}
                <div style={{ minWidth: 0, flex: 1 }}><div className="profile-name">{isSignedIn ? (accountName || "My profile") : (savedBirth?.name || "Guest explorer")}</div><div className="profile-caption">{isSignedIn ? (accountEmail || "Signed in · private library") : "Guest session"}</div></div>
              </div>
              <button className="mobile-signout-button" onClick={() => void enableNotifications()} title="Enable notifications" aria-label="Enable notifications"><Bell size={18}/></button>
              {isSignedIn ? <button className="mobile-signout-button" onClick={() => { setMobileMenuOpen(false); void signOut(); }} title="Sign out" aria-label="Sign out"><LogOut size={18}/></button> : <Link className="mobile-signout-button" href="/login" onClick={() => setMobileMenuOpen(false)} title="Sign in to sync history" aria-label="Sign in to sync history"><UserRound size={18}/></Link>}
            </div>
        }
      />

      <section className="main-panel app-sidebar-offset">
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-16 backdrop-blur-md bg-[#FAF8F4]/85 border-b border-black/[0.06] text-[#18181B] dark:bg-[#070913]/75 dark:border-white/[0.06] dark:text-white transition-colors">
          {/* Left Zone: Hamburger + refined vedic.ai logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] border border-black/10 flex items-center justify-center text-zinc-700 hover:text-zinc-900 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/10 dark:text-white/80 dark:hover:text-white transition-colors cursor-pointer"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} strokeWidth={2} />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-[0_0_12px_rgba(217,119,6,0.15)] dark:bg-white/[0.04] dark:border-white/10 dark:text-amber-300 dark:shadow-[0_0_12px_rgba(251,191,36,0.18)]">
                <MoonStar size={16} strokeWidth={1.8} />
              </span>
              <span className="font-bold text-base tracking-tight text-[#18181B] dark:text-white">
                vedic<span className="text-amber-500 dark:text-amber-400">.</span>ai
              </span>
            </div>
          </div>

          {/* Right Zone: Compact EN / हिं segmented pill + sleek avatar */}
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center rounded-full bg-black/[0.04] border border-black/10 dark:bg-white/[0.05] dark:border-white/10 p-0.5 text-xs font-semibold backdrop-blur-md">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 rounded-full transition-all text-xs cursor-pointer ${
                  language === "en"
                    ? "bg-amber-500/20 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300 font-bold shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white"
                }`}
              >
                EN
              </button>
              <span className="text-black/20 dark:text-white/20 text-[10px] px-0.5 select-none">/</span>
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                className={`px-2.5 py-1 rounded-full transition-all text-xs cursor-pointer ${
                  language === "hi"
                    ? "bg-amber-500/20 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300 font-bold shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white"
                }`}
              >
                हिं
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="relative w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 shadow-[0_0_12px_rgba(251,191,36,0.25)] hover:scale-105 active:scale-95 transition-transform cursor-pointer overflow-hidden flex items-center justify-center shrink-0"
              title={isSignedIn ? (accountName || "My profile") : "Account / Menu"}
              aria-label="Account menu"
            >
              {accountAvatar ? (
                <img
                  src={accountAvatar}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="w-full h-full rounded-full bg-amber-50 text-amber-900 dark:bg-[#121524] dark:text-amber-200 flex items-center justify-center text-xs font-bold">
                  {(accountName || savedBirth?.name || (isSignedIn ? accountEmail : "Guest") || "G").trim().charAt(0).toUpperCase()}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="content-scroll pb-44 sm:pb-48">
          {!hasConversation ? (
            <CelestialHomeView
              language={language}
              savedBirth={savedBirth}
              chartReport={chartReport}
              historyItems={historyItems}
              onOpenBirth={() => setIsBirthOpen(true)}
              onSelectPrompt={(prompt, title) => {
                if (title?.startsWith("Today's") || title?.startsWith("आज का")) {
                  window.location.href = "/panchang";
                } else if (!savedBirth || !chartReport) {
                  setPendingPrompt(prompt);
                  setIsBirthOpen(true);
                  setToast(
                    language === "hi"
                      ? "व्यक्तिगत व्याख्या के लिए पहले अपनी जन्म तिथि, सटीक समय और स्थान जोड़ें।"
                      : "For a personal reading, add your birth date, exact time, and birthplace first."
                  );
                } else {
                  void sendMessage(prompt);
                }
              }}
              onLoadConversation={(id) => void loadConversation(id)}
            />
          ) : <section className="chat-area" aria-live="polite">
            {messages.map((message, messageIndex) => <div className={"message-row " + message.role + (message.animated ? " is-new" : "")} key={message.id}>
              {message.role === "assistant" && <div className="message-avatar"><MoonStar size={16} /></div>}
              {message.role === "assistant" ? <div className="message-content">
                <div className="message-meta flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">
                      {language === "hi" ? "वैदिक एआई · ज्योतिष सहचर" : "VEDIC AI · ASTROLOGY COMPANION"}
                    </span>
                    {isTranslatingChat && !translatedMessages[`${message.id}:${language}`] && (
                      <span style={{ color: "var(--gold)", fontSize: "11px" }} className="shrink-0">
                        · {language === "hi" ? "अनुवाद हो रहा है…" : "Translating…"}
                      </span>
                    )}
                  </div>
                  <KundliVoicePlayer
                    content={translatedMessages[`${message.id}:${language}`] || message.content}
                    language={language}
                    messageId={message.id}
                    autoPlay={Boolean(message.animated && messageIndex === messages.length - 1)}
                  />
                </div>
                <div className="assistant-response-card">
                  <StructuredMessageView
                    content={translatedMessages[`${message.id}:${language}`] || message.content}
                    language={language}
                  />
                  <div className="assistant-footer-row">
                    <div className="assistant-note">
                      <Sparkles size={14} style={{ flexShrink: 0, color: "var(--gold)", marginTop: 2 }} />
                      <span>
                        {language === "hi"
                          ? "पारंपरिक ज्योतिषीय व्याख्याएं आत्म-चिंतन के लिए हैं, निश्चितता के लिए नहीं।"
                          : "Traditional Jyotish interpretations are for reflection, not certainty."}
                      </span>
                    </div>
                    {messageIndex === messages.length - 1 && !isLoading && (
                      <button
                        type="button"
                        className="message-retry-btn"
                        onClick={retryLastTurn}
                        title={language === "hi" ? "अंतिम उत्तर पुनः प्राप्त करें" : "Retry last response"}
                      >
                        <RefreshCw size={12} />
                        <span>{language === "hi" ? "पुनः प्रयास करें" : "Retry"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div> : <div className="user-bubble">{message.content}</div>}
            </div>)}
            {isLoading && (
              <div className="message-row assistant">
                <div className="message-avatar"><MoonStar size={16} /></div>
                <div className="message-content">
                  <div className="message-meta">
                    {language === "hi" ? "वैदिक एआई · कुंडली विश्लेषण जारी" : "VEDIC AI · ANALYZING CHART"}
                  </div>
                  <div className="assistant-response-card is-loading">
                    <div className="ai-thinking-pulse"><div className="pulse-dot"/><div className="pulse-dot"/><div className="pulse-dot"/></div>
                    <p className="ai-thinking-text">
                      {language === "hi"
                        ? "ग्रह स्थिति, भाव और पारंपरिक ज्योतिषीय संकेतकों का विश्लेषण किया जा रहा है…"
                        : "Examining planetary placements, houses, and traditional Jyotish indicators…"}
                    </p>
                  </div>
                </div>
              </div>
            )}{chartReport && <details className="chart-panel-collapsible"><summary className="chart-panel-summary"><span><span className="chart-summary-kicker">YOUR VEDIC BIRTH CHART</span><strong>{chartReport.ascendant.sign} Ascendant · {chartReport.birth.place}</strong></span><span className="chart-summary-action">View calculated chart <ChevronRight size={15}/></span></summary><section className="chart-panel">
              <div className="chart-panel-head"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR VEDIC BIRTH CHART</div><h2 className="chart-title">{chartReport.ascendant.sign} Ascendant <span>· {chartReport.birth.place.split(",").slice(0, 2).join(",")}</span></h2><p className="chart-subtitle">Lahiri sidereal · Whole-sign houses · {chartReport.birth.timezone}</p></div><button className="secondary-button chart-export" onClick={() => { const blob = new Blob([JSON.stringify(chartReport, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "vedic-ai-kundli.json"; link.click(); URL.revokeObjectURL(url); }}>Export chart <ArrowDown size={13}/></button><button className="secondary-button chart-export" disabled={isExportingPdf} onClick={async () => { setIsExportingPdf(true); try { await downloadKundliPdfFile(chartReport); setToast(language === "hi" ? "आपकी 2-पृष्ठीय कुंडली PDF तैयार हो गई है।" : "2-page Kundli PDF generated successfully."); } catch (error) { setToast(error instanceof Error ? error.message : "Could not generate PDF."); } finally { setIsExportingPdf(false); } }}>{isExportingPdf ? <LoaderCircle size={13} className="spin-icon" /> : <Download size={13} />} {isExportingPdf ? (language === "hi" ? "PDF बन रही है…" : "Generating PDF…") : (language === "hi" ? "कुंडली PDF" : "Download PDF")}</button><button className="secondary-button chart-export" onClick={() => { try { printKundliReport(chartReport); } catch (error) { setToast(error instanceof Error ? error.message : "Could not open PDF preview."); } }}><Printer size={13} /> {language === "hi" ? "प्रिंट / सेव" : "Print Sheet"}</button><button className="primary-button chart-save" onClick={saveChartReport}>Save kundli <Check size={13}/></button><button className="secondary-button chart-export" onClick={loadCurrentTransits} disabled={transitLoading}>{transitLoading ? <RefreshCw size={13} className="spin-icon"/> : <Orbit size={13}/>} {transitLoading ? "Calculating…" : "Current transits"}</button></div>
              <div className="chart-stats"><div className="chart-stat"><span>Ascendant / Lagna</span><strong>{chartReport.ascendant.sign}</strong><small>{chartReport.ascendant.degreeInSign.toFixed(2)}° · {chartReport.ascendant.nakshatra}</small></div><div className="chart-stat"><span>Moon Nakshatra</span><strong>{chartReport.planets.find((planet) => planet.name === "Moon")?.nakshatra || "—"}</strong><small>Pada {chartReport.planets.find((planet) => planet.name === "Moon")?.nakshatraPada || "—"}</small></div><div className="chart-stat"><span>Current Mahadasha</span><strong>{chartReport.vimshottari.currentMahadasha.lord}</strong><small>{new Date(chartReport.vimshottari.currentMahadasha.start).toLocaleDateString()} – {new Date(chartReport.vimshottari.currentMahadasha.end).toLocaleDateString()}</small></div></div>
              <div className="chart-secondary-grid">
                <KundliDiagram report={chartReport} />
                <section className="chart-subpanel"><h3>Rashi chart · D1 whole-sign houses</h3><p className="chart-subcopy">House signs are derived from the calculated ascendant.</p><div className="house-grid">{Array.from({ length: 12 }, (_, index) => { const house = index + 1; const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]; const occupants = chartReport.planets.filter((planet) => planet.house === house); return <div className="house-cell" key={house}><span>HOUSE {house}</span><strong>{signs[(chartReport.ascendant.signIndex + house - 1) % 12]}</strong><small>{occupants.length ? occupants.map((planet) => planet.name).join(" · ") : "—"}</small></div>; })}</div></section>
                <section className="chart-subpanel"><h3>Vimshottari mahadasha</h3><p className="chart-subcopy">Approximate period timeline derived from the Moon&apos;s nakshatra.</p><div className="dasha-list">{chartReport.vimshottari.periods.slice(0, 9).map((period, index) => <div className={"dasha-row " + (period.lord === chartReport.vimshottari.currentMahadasha.lord ? "current" : "")} key={period.lord + index}><span className="dasha-dot"/><div><strong>{period.lord}</strong><small>{new Date(period.start).toLocaleDateString()} – {new Date(period.end).toLocaleDateString()}</small></div><span className="dasha-years">{period.years}y</span></div>)}</div></section>
              </div>
              <div className="chart-secondary-grid">
                <section className="chart-subpanel"><h3>Birth Panchang <span className="experimental-label">Experimental</span></h3><p className="chart-subcopy">Calculated from the current Sun/Moon output and the local birth date; validate before relying on it.</p><div className="house-grid"><div className="house-cell"><span>PAKSHA</span><strong>{chartReport.panchang?.paksha || "—"}</strong></div><div className="house-cell"><span>TITHI</span><strong>{chartReport.panchang?.tithi || "—"}</strong></div><div className="house-cell"><span>YOGA</span><strong>{chartReport.panchang?.yoga || "—"}</strong></div><div className="house-cell"><span>KARANA</span><strong>{chartReport.panchang?.karana || "—"}</strong></div><div className="house-cell"><span>VARA</span><strong>{chartReport.panchang?.vara || "—"}</strong></div></div></section>
                <section className="chart-subpanel"><h3>Yoga candidates <span className="experimental-label">Experimental</span></h3><p className="chart-subcopy">Simplified candidate rules only. Classical conditions, cancellations, strengths, and source traditions are not fully assessed.</p>{chartReport.yogaCandidates?.length ? <div className="dasha-list">{chartReport.yogaCandidates.map((yoga) => <div className="dasha-row" key={yoga.name}><span className="dasha-dot"/><div><strong>{yoga.name}</strong><small>{yoga.reason}</small></div></div>)}</div> : <p className="chart-subcopy">No candidate matched the currently implemented simplified rules. This is not a complete yoga analysis.</p>}</section>
              </div>
              <div className="chart-table-wrap"><table className="chart-table"><thead><tr><th>Graha</th><th>Rashi</th><th>Degree</th><th>House</th><th>Nakshatra</th><th>D9 Navamsa</th><th>D10 Dashamsa</th><th>Status</th></tr></thead><tbody>{chartReport.planets.map((planet) => <tr key={planet.name}><td>{planet.name}</td><td>{planet.sign}</td><td>{planet.degreeInSign.toFixed(2)}°</td><td>{planet.house}</td><td>{planet.nakshatra} · {planet.nakshatraPada}</td><td>{planet.navamsaSign}</td><td>{planet.dashamsaSign}</td><td>{planet.retrograde ? "Retrograde" : "Direct"}</td></tr>)}</tbody></table></div>
              <p className="chart-disclaimer"><ShieldCheck size={13}/> {chartReport.disclaimer} D9/D10 sign mapping is tested separately, but the underlying planetary longitudes and full chart are still awaiting independent ephemeris validation.</p>
              <section className="kundli-simple-summary" aria-labelledby="kundli-simple-summary-title">
                <div className="kundli-summary-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL BIRTH CHART</div><h2 id="kundli-simple-summary-title">Your Kundli, in everyday language</h2><p>A friendly explanation of what your chart shows. You do not need prior astrology knowledge to read this.</p></div></div>
                <div className="kundli-summary-subheading"><span>01</span><div><h3>The big picture</h3><p>Start here for the most important points in your chart.</p></div></div>
                <div className="kundli-summary-points">{buildKundliSimpleSummary(chartReport, language).map((item, index) => <article className="kundli-summary-point" key={index}><span>{index + 1}</span><p>{item}</p></article>)}</div>
                <div className="kundli-summary-subheading"><span>02</span><div><h3>Your planets, explained</h3><p>Each planet represents a different part of life. Its sign and house add context.</p></div></div>
                <div className="kundli-planet-summary-grid">{buildKundliPlanetSummary(chartReport, language).map((planet) => <article className="kundli-planet-summary-card" key={planet.name}><div className="kundli-planet-summary-top"><strong>{planet.name}</strong><span>{planet.sign} · House {planet.house}</span></div><p>{planet.explanation}</p><small>Star group (Nakshatra): {planet.nakshatra || "Not available"}</small></article>)}</div>
                <div className="kundli-summary-subheading"><span>03</span><div><h3>Your 12 life areas</h3><p>In astrology, each house represents one area of everyday life. Empty houses are normal.</p></div></div>
                <div className="kundli-house-summary-grid">{buildKundliHouseSummary(chartReport, language).map((house) => <article className="kundli-house-summary-card" key={house.house}><div className="kundli-house-summary-top"><span>HOUSE {house.house}</span><strong>{house.sign}</strong></div><h4>{house.title}</h4><p>{house.explanation}</p><small>Planets here: {house.planets.length ? house.planets.join(", ") : "None listed"}</small></article>)}</div>
              
                {/* Planetary Aspects (Parashari Drishti) */}
                <div className="kundli-summary-subheading mt-8"><span>04</span><div><h3>Planetary Aspects (Parashari Drishti)</h3><p>Traditional drishtis cast by grahas across the 12 houses with special aspects for Mars, Jupiter, and Saturn.</p></div></div>
                <div className="chart-table-wrap mt-3">
                  <table className="chart-table">
                    <thead>
                      <tr>
                        <th>Graha</th>
                        <th>From House</th>
                        <th>Aspects House</th>
                        <th>Drishti Strength</th>
                        <th>Impacted Occupants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatePlanetaryAspects(chartReport, language).slice(0, 16).map((aspect, aspectIdx) => (
                        <tr key={aspectIdx}>
                          <td><strong>{aspect.planet}</strong></td>
                          <td>House {aspect.fromHouse}</td>
                          <td>House {aspect.aspectsHouse} {aspect.specialDrishti ? <span style={{ fontSize: "10px", background: "rgba(229,196,107,0.18)", color: "var(--gold)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600, marginLeft: "6px" }}>Special Drishti</span> : null}</td>
                          <td>{aspect.aspectDegree}</td>
                          <td>{aspect.impactedPlanets.length ? aspect.impactedPlanets.join(", ") : <span style={{ opacity: 0.5 }}>Empty house</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Official 15-Point Indian Vedic Astrology Report */}
                <div className="kundli-summary-subheading mt-8"><span>05</span><div><h3>The 15-Point Indian Vedic Astrology Report</h3><p>Comprehensive traditional analysis structured across the 15 approved core sections.</p></div></div>
                <div className="space-y-3 mt-4">
                  {build15PointVedicReport(chartReport, language).map((item) => (
                    <article key={item.number} className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--gold)]/50 transition-colors shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] text-xs font-bold border border-[var(--gold)]/30">
                            {item.number}
                          </span>
                          <span className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">
                            {item.section}
                          </span>
                        </div>
                        {item.tag && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--raised)] border border-[var(--line2)] text-[var(--gold2)]">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text)] mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[var(--gold)] font-medium mb-1.5">
                        {item.summary}
                      </p>
                      <p className="text-xs text-[var(--muted)] leading-relaxed pl-2.5 border-l-2 border-[var(--gold)]/40">
                        {item.details}
                      </p>
                    </article>
                  ))}
                </div>
</section>
            </section></details>}
            {transitReport && chartReport && <details className="chart-panel-collapsible"><summary className="chart-panel-summary"><span><span className="chart-summary-kicker">CURRENT SKY</span><strong>Transit snapshot</strong></span><span className="chart-summary-action">View transits <ChevronRight size={15}/></span></summary><section className="chart-panel transit-panel">
              <div className="chart-panel-head"><div><div className="eyebrow"><span className="eyebrow-line" /> CURRENT SKY · EXPERIMENTAL</div><h2 className="chart-title">Transit snapshot <span>· {transitReport.birth.timezone}</span></h2><p className="chart-subtitle">Calculated at {new Date(transitReport.birth.utc).toLocaleString()} · compared with natal Lagna</p></div><button className="secondary-button" onClick={loadCurrentTransits} disabled={transitLoading}>{transitLoading ? "Refreshing…" : "Refresh"}</button></div>
              <p className="chart-disclaimer"><ShieldCheck size={13}/> Transit positions use the experimental calculation engine and are not independently validated. Treat this as a preview, not a predictive reading.</p>
              <div className="chart-table-wrap"><table className="chart-table"><thead><tr><th>Graha</th><th>Current sign</th><th>Degree</th><th>House from natal Lagna</th><th>Natal sign</th></tr></thead><tbody>{transitReport.planets.map((planet) => { const natal = chartReport.planets.find((item) => item.name === planet.name); return <tr key={planet.name}><td>{planet.name}</td><td>{planet.sign}</td><td>{planet.degreeInSign.toFixed(2)}°</td><td>{(planet.signIndex - chartReport.ascendant.signIndex + 12) % 12 + 1}</td><td>{natal?.sign || "—"}</td></tr>; })}</tbody></table></div>
            </section></details>}
            <div ref={bottomRef} />
          </section>}
        </div>

        {/* Ambient Gradient Mask behind Floating Input Dock */}
        <div
          className="pointer-events-none fixed bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#FAF8F4] via-[#FAF8F4]/90 to-transparent dark:from-[#060812] dark:via-[#060812]/80 dark:to-transparent z-20"
          aria-hidden="true"
        />

        {/* Floating Chat Dock */}
        <footer
          className={`fixed bottom-[68px] sm:bottom-[72px] lg:bottom-6 left-0 right-0 ${
            sidebarCollapsed ? "lg:left-[72px]" : "lg:left-[280px]"
          } z-25 px-3.5 sm:px-6 pointer-events-none flex justify-center transition-all duration-200`}
        >
          <div className="w-full max-w-3xl pointer-events-auto">
            <form
              onSubmit={submitMessage}
              className="group flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/95 border border-black/10 shadow-lg text-[#18181B] hover:border-black/20 focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20 dark:bg-[#121624]/90 dark:border-white/10 dark:shadow-[0_12px_40px_rgba(0,0,0,0.65)] dark:hover:border-white/20 dark:focus-within:border-amber-400/50 dark:focus-within:ring-amber-400/20 backdrop-blur-2xl transition-all"
            >
              <textarea
                id="chat-input"
                ref={textareaRef}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  event.target.style.height = "auto";
                  event.target.style.height = Math.min(event.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={onComposerKeyDown}
                placeholder={
                  language === "hi"
                    ? "वैदिक एआई से पूछें…"
                    : "Ask Vedic AI anything..."
                }
                rows={1}
                aria-label={language === "hi" ? "वैदिक एआई को संदेश भेजें" : "Message Vedic AI"}
                className="flex-1 bg-transparent border-0 outline-none text-[#18181B] placeholder:text-[#71717A] dark:text-white dark:placeholder:text-white/40 text-xs sm:text-[13.5px] resize-none py-1.5 px-2 max-h-[120px] leading-relaxed"
              />

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBirthOpen(true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.05] dark:text-white/60 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  title={
                    savedBirth
                      ? (language === "hi" ? "जन्म विवरण देखें" : "View birth details")
                      : (language === "hi" ? "जन्म विवरण जोड़ें" : "Add birth details")
                  }
                  aria-label="Birth details"
                >
                  <Plus size={18} strokeWidth={2} />
                </button>

                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    voiceListening
                      ? "text-rose-500 bg-rose-500/20 animate-pulse"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.05] dark:text-white/60 dark:hover:text-white dark:hover:bg-white/[0.08]"
                  }`}
                  aria-label={
                    voiceListening
                      ? (language === "hi" ? "ध्वनि इनपुट रोकें" : "Stop voice typing")
                      : (language === "hi" ? "बोलकर लिखें" : "Start voice typing")
                  }
                  title={
                    voiceListening
                      ? (language === "hi" ? "ध्वनि इनपुट रोकें" : "Stop voice typing")
                      : (language === "hi" ? "बोलकर लिखें" : "Speak to type")
                  }
                >
                  {voiceListening ? <MicOff size={17} /> : <Mic size={17} />}
                </button>

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || !authReady}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#11131a] shadow-[0_0_15px_rgba(229,184,75,0.35)] disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
                  style={{
                    background: "linear-gradient(90deg, #F6D365 0%, #E5B84B 50%, #C89B3C 100%)",
                  }}
                  aria-label={language === "hi" ? "संदेश भेजें" : "Send message"}
                >
                  <Send size={16} strokeWidth={2.2} className="-translate-x-0.5 translate-y-0.5" />
                </button>
              </div>
            </form>
          </div>
        </footer>

        <MobileBottomNav />
      </section>

      {toast && <div role="status" style={{ position: "fixed", zIndex: 80, bottom: 85, left: "50%", transform: "translateX(-50%)", width: "max-content", maxWidth: "calc(100vw - 32px)", padding: "12px 16px", border: "1px solid var(--line2)", borderRadius: 12, color: "var(--text)", background: "#25261f", boxShadow: "0 12px 40px #0005", fontSize: 12, lineHeight: 1.6 }}>{toast}</div>}

      {pendingDeleteConversation && <div className="modal-backdrop conversation-delete-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingConversationId) setPendingDeleteConversation(null); }}>
        <section className="modal conversation-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-conversation-title" aria-describedby="delete-conversation-description">
          <div className="conversation-delete-icon"><Trash2 size={22}/></div>
          <div className="conversation-delete-eyebrow">{language === "hi" ? "संवाद हटाएं" : "DELETE CONVERSATION"}</div>
          <h2 className="modal-title" id="delete-conversation-title">{language === "hi" ? "क्या यह संवाद हटाना चाहते हैं?" : "Delete this chat?"}</h2>
          <p className="modal-copy" id="delete-conversation-description">“{pendingDeleteConversation.title}” {language === "hi" ? "और इसके सभी सहेजे गए संदेश स्थायी रूप से हटा दिए जाएंगे।" : "and all its saved messages will be permanently deleted. This action cannot be undone."}</p>
          <div className="conversation-delete-actions">
            <button type="button" className="secondary-button" onClick={() => setPendingDeleteConversation(null)} disabled={Boolean(deletingConversationId)}>{language === "hi" ? "संवाद रखें" : "Keep conversation"}</button>
            <button type="button" className="conversation-delete-confirm" onClick={() => void deleteConversation(pendingDeleteConversation.id)} disabled={Boolean(deletingConversationId)}>
              {deletingConversationId === pendingDeleteConversation.id ? <><RefreshCw size={15} className="spin"/> {language === "hi" ? "हटाया जा रहा है…" : "Deleting…"}</> : <><Trash2 size={15}/> {language === "hi" ? "संवाद हटाएं" : "Delete chat"}</>}
            </button>
          </div>
        </section>
      </div>}

      {isBirthOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsBirthOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="birth-modal-title">
          <div className="modal-head"><div>
            <div className="eyebrow"><span className="eyebrow-line" /> {language === "hi" ? "आपकी व्यक्तिगत कुंडली" : "YOUR PERSONAL CHART"}</div>
            <h2 className="modal-title" id="birth-modal-title" style={{ margin: "12px 0 0" }}>{language === "hi" ? "जन्म विवरण से आरंभ करें" : "Begin with your birth details"}</h2>
            <p className="modal-copy">{language === "hi" ? "सटीक समय और स्थान लग्न और भावों के निर्धारण में सहायता करते हैं। आप गणना से पहले इनकी समीक्षा कर सकते हैं।" : "Accurate time and place help determine the ascendant and planetary houses. You can review these details before chart calculation."}</p>
          </div><button className="icon-button" onClick={() => setIsBirthOpen(false)} aria-label={language === "hi" ? "जन्म विवरण बंद करें" : "Close birth details"}><X size={17} /></button></div>
          <form onSubmit={submitBirth}>
            <div className="form-grid">
              <label className="form-field full"><span className="form-label">{language === "hi" ? "नाम" : "Name"} <span style={{ color: "var(--quiet)", fontWeight: 400 }}>({language === "hi" ? "वैकल्पिक" : "optional"})</span></span><input className="form-input" autoComplete="name" value={birth.name} onChange={(event) => setBirth({ ...birth, name: event.target.value })} placeholder={language === "hi" ? "हम आपको किस नाम से संबोधित करें?" : "What should we call you?"} /></label>
              <label className="form-field"><span className="form-label">{language === "hi" ? "जन्म तिथि *" : "Date of birth *"}</span><BirthDatePicker value={birth.date} onChange={(date) => setBirth((current) => ({ ...current, date }))} /></label>
              <label className="form-field"><span className="form-label">{language === "hi" ? "स्थानीय जन्म समय *" : "Local birth time *"}</span><input className="form-input" type="time" required value={birth.time} onChange={(event) => setBirth({ ...birth, time: event.target.value })} /></label>
              <label className="form-field full"><span className="form-label">{language === "hi" ? "जन्म स्थान *" : "Birthplace *"}</span><div className="place-search-row"><input className="form-input" required value={birth.place} onChange={(event) => { setBirth({ ...birth, place: event.target.value }); setSelectedPlace(null); setPlaceOptions([]); }} placeholder={language === "hi" ? "शहर, राज्य, देश (उदा. जयपुर, भारत)" : "City, region, country (e.g. Jaipur, India)"} /><button type="button" className="secondary-button place-search-button" disabled={isGeocoding || birth.place.trim().length < 2} onClick={searchPlaces}>{isGeocoding ? (language === "hi" ? "खोज रहे हैं…" : "Searching…") : (language === "hi" ? "स्थान खोजें" : "Find place")}</button></div>{selectedPlace && <p className="place-selected"><Check size={12} /> {language === "hi" ? "चयनित: " : "Selected: "}{selectedPlace.label}</p>}{placeOptions.length > 1 && <div className="place-options">{placeOptions.map((option) => <button type="button" className={"place-option " + (selectedPlace?.id === option.id ? "chosen" : "")} key={option.id} onClick={() => { setSelectedPlace(option); setBirth({ ...birth, place: option.label }); setPlaceOptions([]); }}><Compass size={13}/><span>{option.label}</span>{selectedPlace?.id === option.id && <Check size={13}/>}</button>)}</div>}<span className="place-hint">{language === "hi" ? "कम से कम 2 अक्षर दर्ज करें, स्थान खोजें दबाएं, फिर सही शहर/क्षेत्र का चयन करें ताकि समय क्षेत्र और निर्देशांक सटीक प्राप्त हों।" : "Enter at least 2 characters, tap Find place, then select the matching city/area so timezone and coordinates resolve correctly."}</span><span className="place-attribution">Location data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>.</span></label>
            </div>
            <div className="assistant-note"><ShieldCheck size={14} style={{ flexShrink: 0, color: "var(--gold)", marginTop: 2 }} /><span>{language === "hi" ? "आपके जन्म विवरण गणना के लिए वैदिक एआई के चार्ट एंडपॉइंट पर भेजे जाते हैं। व्यक्तिगत व्याख्या तैयार करने के लिए ये विवरण एआई प्रदाता को भेजे जाते हैं। अतिथि सत्र सहेजे नहीं जाते।" : "Your birth details are sent to Vedic AI's chart endpoint to calculate placements. To generate the automatic interpretation, your birth details and calculated chart are also sent to the AI provider configured by the site owner. Signed-in conversations may be saved to your account; use “Save kundli” only when you want to store a report. Guest conversations are not persisted."}</span></div>
            <label className="birth-consent"><input type="checkbox" checked={birthAiConsent} onChange={(event) => setBirthAiConsent(event.target.checked)} /><span>{language === "hi" ? "मैं व्यक्तिगत व्याख्या के लिए इन जन्म विवरणों और गणना की गई कुंडली को एआई प्रदाता को भेजने के लिए सहमत हूँ।" : "I agree to send these birth details and the calculated chart to the configured AI provider for personalized interpretation. I understand astrology is interpretive and the calculation engine is still being validated."}</span></label>
            <div className="modal-actions birth-modal-actions"><button type="submit" className="primary-button birth-calculate-button" disabled={!birthAiConsent || isLoading || isGeocoding}>{isLoading ? (language === "hi" ? "आपकी कुंडली की गणना की जा रही है…" : "Calculating your kundli…") : isGeocoding ? (language === "hi" ? "जन्म स्थान खोजा जा रहा है…" : "Finding birthplace…") : (language === "hi" ? "मेरी कुंडली की गणना करें" : "Calculate my kundli")} <ArrowUp size={16} /></button></div>
          </form>
        </section>
      </div>}

      {isMemoryOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsMemoryOpen(false); }}>
        <section className="modal memory-modal" role="dialog" aria-modal="true" aria-labelledby="memory-modal-title">
          <div className="modal-head"><div>
            <div className="eyebrow"><span className="eyebrow-line" /> PERSONALIZATION</div>
            <h2 className="modal-title" id="memory-modal-title" style={{ margin: "12px 0 0" }}>Saved context memory</h2>
            <p className="modal-copy">Add details you want Vedic AI to remember across chats. This text is included as context for your replies when you are signed in.</p>
          </div><button className="icon-button" onClick={() => setIsMemoryOpen(false)} aria-label="Close memory settings"><X size={17} /></button></div>
          {memoryLoading ? <p role="status" className="modal-copy">Loading your saved memory…</p> : <>
            <label className="form-field full"><span className="form-label">What should Vedic AI remember? ({memoryDraft.length}/6000)</span>
              <textarea className="form-input memory-textarea" rows={8} maxLength={6000} value={memoryDraft} onChange={(event) => setMemoryDraft(event.target.value)} placeholder={"Examples:\n• I prefer concise explanations in Hindi.\n• Explain astrology terms in simple language.\n• My preferred name is…"} />
            </label>
            <div className="assistant-note"><ShieldCheck size={14} style={{ flexShrink: 0, color: "var(--gold)", marginTop: 2 }} /><span>Memory is editable and can be deleted here. Save only information you are comfortable sending as context to your configured AI provider. Do not store passwords, payment details, or sensitive personal information.</span></div>
            <div className="memory-data-actions">
              <div><strong>Your saved data</strong><p>Export a copy or remove stored personal data from Vedic AI. Your sign-in account remains active.</p></div>
              <div className="memory-data-buttons"><button type="button" className="secondary-button" onClick={exportPersonalData} disabled={memorySaving}>Export my data</button><button type="button" className="secondary-button danger-button" onClick={deletePersonalData} disabled={memorySaving}>Delete saved data</button><button type="button" className="secondary-button danger-button" onClick={deleteAccount} disabled={memorySaving}>Delete account permanently</button></div>
            </div>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={deleteMemory} disabled={memorySaving || !memoryText}>Delete memory</button><button type="button" className="secondary-button" onClick={() => { setMemoryDraft(memoryText); setIsMemoryOpen(false); }}>Cancel</button><button type="button" className="primary-button" onClick={saveMemory} disabled={memorySaving}>{memorySaving ? "Saving…" : "Save memory"} <Check size={14} /></button></div>
          </>}
        </section>
      </div>}
    </main>
  );
}
