"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen, CalendarDays, ChevronDown, Hand, House, MessageCircle, Orbit, UserRound, X,
} from "lucide-react";

const links = [
  { label: "Home", href: "/chat", Icon: House, key: "home", detail: "Your astrology workspace" },
  { label: "Kundli", href: "/chat?openBirth=1", Icon: Orbit, key: "kundli", detail: "Birth chart and details" },
  { label: "Astrology Chat", href: "/chat#chat-input", Icon: MessageCircle, key: "chat", detail: "Ask your Jyotish questions" },
  { label: "Palmistry", href: "/palm-reading", Icon: Hand, key: "palm", detail: "Explore visible palm lines" },
  { label: "Panchang", href: "/panchang", Icon: CalendarDays, key: "panchang", detail: "Daily almanac and timings" },
  { label: "Saved Kundlis & reports", href: "/reports", Icon: BookOpen, key: "reports", detail: "Your saved birth charts" },
  { label: "My profile", href: "/profile", Icon: UserRound, key: "profile", detail: "Your account settings" },
];

export default function AppNavigationDrawer({ open, onClose, extraContent, accountContent, onHome, onKundli, onWorkspace }: { open: boolean; onClose: () => void; extraContent?: ReactNode; accountContent?: ReactNode; onHome?: () => void; onKundli?: () => void; onWorkspace?: () => void }) {
  const pathname = usePathname();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  if (!open) return null;
  const activeKey = pathname === "/panchang" ? "panchang"
    : pathname === "/palm-reading" ? "palm"
    : pathname === "/profile" ? "profile"
    : pathname === "/reports" ? "reports"
    : pathname === "/chat" ? "home" : "";
  return <div className="mobile-nav-backdrop shared-navigation-backdrop" onClick={onClose}>
    <aside className="mobile-nav-drawer shared-navigation-drawer stitch-mobile-drawer" aria-label="App navigation" onClick={(event) => event.stopPropagation()}>
      <header className="mobile-nav-head shared-navigation-head stitch-drawer-head">
        <Link href="/chat" className="brand sidebar-brand-premium" onClick={onClose} aria-label="Vedic AI home">
          <span className="brand-mark"><img src="/vedic-ai-emblem.svg" alt="" /></span>
          <span className="sidebar-brand-copy"><span className="sidebar-brand-line"><span className="brand-name">vedic<span style={{ color: "var(--gold)" }}>.</span>ai</span></span><span className="brand-sub">Your Jyotish space</span></span>
        </Link>
        <button type="button" className="icon-button stitch-close-button" onClick={onClose} aria-label="Close navigation"><X size={18}/></button>
      </header>

      <div className="mobile-drawer-scroll stitch-drawer-scroll">
        <button type="button" className="stitch-consultation-button" onClick={() => { onWorkspace?.(); onClose(); }}>
          <span className="stitch-consultation-plus">+</span>
          <span>New consultation</span>
          <span className="stitch-consultation-spark">✧</span>
        </button>

        <Link href="/chat#chat-input" className="stitch-featured-chat" onClick={onClose}>
          <span className="stitch-featured-icon"><MessageCircle size={17}/></span>
          <span className="stitch-featured-copy"><strong>Open Astrology Chat</strong><small>Ask your Jyotish questions</small></span>
          <span className="stitch-featured-arrow">↗</span>
        </Link>

        <section className="stitch-workspace-section" aria-label="Workspace tools">
          <div className="stitch-section-heading"><span>Workspace</span><span className="stitch-tool-count">7 tools</span></div>
          <nav className="stitch-workspace-links">
            {links.map(({ label, href, Icon, key, detail }) => <Link key={key} href={href} className={"stitch-workspace-link" + (activeKey === key ? " active" : "")} aria-current={activeKey === key ? "page" : undefined} onClick={(event) => { if (key === "home" && onHome) { event.preventDefault(); onHome(); } if (key === "kundli" && onKundli) { event.preventDefault(); onKundli(); } onClose(); }}>
              <span className="stitch-workspace-icon"><Icon size={17}/></span>
              <span className="stitch-workspace-copy"><strong>{label}</strong><small>{detail}</small></span>
              <span className="stitch-workspace-arrow">›</span>
            </Link>)}
          </nav>
        </section>

        <section className="stitch-history-section" aria-label="Conversation history">
          {extraContent}
        </section>
      </div>

      <footer className="stitch-drawer-footer">
        <div className="shared-navigation-footer stitch-engine-status"><span/> Vedic AI · Astrology companion</div>
        {accountContent && <div className="shared-navigation-account-fixed stitch-account-fixed">{accountContent}</div>}
      </footer>
    </aside>
  </div>;
}
