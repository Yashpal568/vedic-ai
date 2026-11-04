"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppNavigationDrawer from "@/components/app-navigation-drawer";
import {
  LogOut,
  Menu,
  MoonStar,
  Sun,
  UserRound,
  X,
} from "lucide-react";

type Props = { section?: string; backHref?: string; backLabel?: string; onSignOut?: () => void };

export default function SiteHeader({ section, onSignOut }: Props) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("vedic-chat-theme");
      const urlTheme = new URLSearchParams(window.location.search).get("theme");
      const nextTheme = urlTheme === "light" || urlTheme === "dark" ? urlTheme : (savedTheme === "light" ? "light" : "dark");
      setTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "vedic-chat-theme" && e.newValue) {
        setTheme(e.newValue === "light" ? "light" : "dark");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
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

  return (
    <>
      <header className="site-header">
        <div className="site-header-left">
          {/* Mobile Navigation Menu Button: Only on Mobile (< 1024px) */}
          <button
            type="button"
            className="site-header-menu"
            aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((open) => !open)}
          >
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Mobile Brand: Only visible on mobile/tablet when sidebar is hidden — NEVER duplicate on PC */}
          <Link href="/chat" className="site-header-brand" aria-label="Vedic AI home">
            <span className="site-header-mark"><MoonStar size={19} strokeWidth={1.6}/></span>
            <strong>vedic<span>.</span>ai</strong>
          </Link>
        </div>

        {section && <span className="site-header-section">{section}</span>}

        <div className="site-header-actions">
          <button
            type="button"
            className="site-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            {theme === "dark" ? <Sun size={17}/> : <MoonStar size={17}/>}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          {onSignOut ? (
            <button type="button" className="site-header-profile" onClick={onSignOut}>
              <LogOut size={15}/><span>Sign out</span>
            </button>
          ) : (
            <Link href="/profile" className="site-header-profile">
              <UserRound size={15}/><span>My profile</span>
            </Link>
          )}
        </div>
      </header>
      <AppNavigationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
