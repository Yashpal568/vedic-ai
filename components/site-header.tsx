"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, MoonStar, Sun, UserRound } from "lucide-react";

type Props = { section?: string; backHref?: string; backLabel?: string; onSignOut?: () => void };

export default function SiteHeader({ section, backHref, backLabel = "Back to chat", onSignOut }: Props) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("vedic-chat-theme");
      const next = saved === "light" ? "light" : "dark";
      setTheme(next);
      document.documentElement.dataset.theme = next;
    } catch {}
  }, []);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { window.localStorage.setItem("vedic-chat-theme", next); } catch {}
  }
  return <header className="site-header">
    <div className="site-header-left">
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
  </header>;
}
