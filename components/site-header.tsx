"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays, Hand, House, LogOut, Menu, MessageCircle, MoonStar, Orbit, Sun, UserRound, X,
} from "lucide-react";

type Props = { section?: string; backHref?: string; backLabel?: string; onSignOut?: () => void };

const appLinks = [
  { label: "Home", href: "/chat", Icon: House, key: "home", detail: "Your astrology workspace" },
  { label: "Kundli", href: "/chat?openBirth=1", Icon: Orbit, key: "kundli", detail: "Birth chart and details" },
  { label: "AI Chat", href: "/chat#chat-input", Icon: MessageCircle, key: "chat", detail: "Ask your Jyotish questions" },
  { label: "Palmistry", href: "/palm-reading", Icon: Hand, key: "palm", detail: "Explore visible palm lines" },
  { label: "Panchang", href: "/panchang", Icon: CalendarDays, key: "panchang", detail: "Daily almanac and timings" },
  { label: "My profile", href: "/profile", Icon: UserRound, key: "profile", detail: "Your account settings" },
];

export default function SiteHeader({ section, backHref, backLabel = "Back to chat", onSignOut }: Props) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("vedic-chat-theme");
      const next = saved === "light" ? "light" : "dark";
      setTheme(next);
      document.documentElement.dataset.theme = next;
    } catch {}
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { window.localStorage.setItem("vedic-chat-theme", next); } catch {}
  }

  const activeKey = pathname === "/panchang" ? "panchang"
    : pathname === "/palm-reading" ? "palm"
    : pathname === "/profile" ? "profile"
    : "home";

  return <>
    <header className="site-header">
      <div className="site-header-left">
        <button type="button" className="site-header-menu" aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={drawerOpen} onClick={() => setDrawerOpen((open) => !open)}>
          {drawerOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
        {backHref && <Link href={backHref} className="site-header-back">{backLabel}</Link>}
        <Link href="/chat" className="site-header-brand" aria-label="Vedic AI home">
          <span className="site-header-mark"><MoonStar size={19} strokeWidth={1.6}/></span>
          <strong>vedic<span>.</span>ai</strong>
        </Link>
      </div>
      {section && <span className="site-header-section">{section}</span>}
      <div className="site-header-actions">
        <button type="button" className="site-theme-toggle" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} title={theme === "dark" ? "Light theme" : "Dark theme"}>
          {theme === "dark" ? <Sun size={17}/> : <MoonStar size={17}/>}<span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
        {onSignOut ? <button type="button" className="site-header-profile" onClick={onSignOut}><LogOut size={15}/><span>Sign out</span></button> : <Link href="/profile" className="site-header-profile"><UserRound size={15}/><span>My profile</span></Link>}
      </div>
    </header>
    {drawerOpen && <>
      <button type="button" className="site-drawer-backdrop" aria-label="Close navigation menu" onClick={() => setDrawerOpen(false)}/>
      <aside className="site-navigation-drawer" aria-label="App navigation">
        <div className="site-drawer-heading"><span className="site-header-mark"><MoonStar size={19}/></span><div><strong>vedic<span>.</span>ai</strong><small>Your Jyotish space</small></div><button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)}><X size={18}/></button></div>
        <Link href="/chat" className="site-drawer-new" onClick={() => setDrawerOpen(false)}><MessageCircle size={16}/> Open AI workspace <span>↗</span></Link>
        <div className="site-drawer-label">WORKSPACE</div>
        <nav className="site-drawer-links" aria-label="Workspace pages">
          {appLinks.map(({ label, href, Icon, key, detail }) => <Link key={key} href={href} onClick={() => setDrawerOpen(false)} className={"site-drawer-link" + (activeKey === key ? " active" : "")} aria-current={activeKey === key ? "page" : undefined}>
            <span className="site-drawer-icon"><Icon size={18}/></span><span className="site-drawer-copy"><strong>{label}</strong><small>{detail}</small></span><span className="site-drawer-arrow">›</span>
          </Link>)}
        </nav>
        <div className="site-drawer-footer"><span className="site-drawer-status"/><span>Vedic AI · Astrology companion</span></div>
      </aside>
    </>}
  </>;
}
