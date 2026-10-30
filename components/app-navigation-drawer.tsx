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
    <aside className="mobile-nav-drawer shared-navigation-drawer" aria-label="App navigation" onClick={(event) => event.stopPropagation()}>
      <div className="mobile-nav-head shared-navigation-head">
        <Link href="/chat" className="brand sidebar-brand-premium" onClick={onClose} aria-label="Vedic AI home">
          <span className="brand-mark"><img src="/vedic-ai-emblem.svg" alt="" /></span>
          <span className="sidebar-brand-copy"><span className="sidebar-brand-line"><span className="brand-name">vedic<span style={{ color: "var(--gold)" }}>.</span>ai</span></span><span className="brand-sub">Your Jyotish space</span></span>
        </Link>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close navigation"><X size={18}/></button>
      </div>
      <Link href="/chat" className="new-chat mobile-drawer-new" onClick={(event) => { if (onWorkspace) { event.preventDefault(); onWorkspace(); } onClose(); }}><MessageCircle size={16}/> Open Astrology Chat <span className="shared-navigation-arrow">↗</span></Link>
      <div className="mobile-drawer-scroll">
        <button type="button" className="side-label shared-workspace-toggle" aria-expanded={workspaceOpen} onClick={() => setWorkspaceOpen((value) => !value)}><span>Workspace <small>{links.length} tools</small></span><ChevronDown size={17} className={workspaceOpen ? "workspace-chevron expanded" : "workspace-chevron"} /></button>
        {workspaceOpen && <nav className="shared-navigation-links" aria-label="Workspace pages">
          {links.map(({ label, href, Icon, key, detail }) => <Link key={key} href={href} className={"side-link shared-navigation-link" + (activeKey === key ? " active" : "")} aria-current={activeKey === key ? "page" : undefined} onClick={(event) => { if (key === "home" && onHome) { event.preventDefault(); onHome(); } if (key === "kundli" && onKundli) { event.preventDefault(); onKundli(); } onClose(); }}>
            <span className="shared-navigation-icon"><Icon size={18}/></span><span className="shared-navigation-copy"><strong>{label}</strong><small>{detail}</small></span><span className="shared-navigation-arrow">›</span>
          </Link>)}
        </nav>}
      </div>
      <section className="mobile-history-panel" aria-label="Conversation history">{extraContent}</section>
      <div className="shared-navigation-footer"><span/> Vedic AI · Astrology companion</div>
      {accountContent && <div className="shared-navigation-account-fixed">{accountContent}</div>}
    </aside>
  </div>;
}
