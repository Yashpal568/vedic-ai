"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, CalendarDays, Hand, House, MessageCircle, MoonStar, Orbit, UserRound, X,
} from "lucide-react";

const links = [
  { label: "Home", href: "/chat", Icon: House, key: "home", detail: "Your astrology workspace" },
  { label: "Kundli", href: "/chat?openBirth=1", Icon: Orbit, key: "kundli", detail: "Birth chart and details" },
  { label: "AI Chat", href: "/chat#chat-input", Icon: MessageCircle, key: "chat", detail: "Ask your Jyotish questions" },
  { label: "Palmistry", href: "/palm-reading", Icon: Hand, key: "palm", detail: "Explore visible palm lines" },
  { label: "Panchang", href: "/panchang", Icon: CalendarDays, key: "panchang", detail: "Daily almanac and timings" },
  { label: "Saved Kundlis & reports", href: "/reports", Icon: BookOpen, key: "reports", detail: "Your saved birth charts" },
  { label: "My profile", href: "/profile", Icon: UserRound, key: "profile", detail: "Your account settings" },
];

export default function AppNavigationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
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
          <span className="brand-mark"><MoonStar size={21}/></span>
          <span className="sidebar-brand-copy"><span className="sidebar-brand-line"><span className="brand-name">vedic<span style={{ color: "var(--gold)" }}>.</span>ai</span></span><span className="brand-sub">Your Jyotish space</span></span>
        </Link>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close navigation"><X size={18}/></button>
      </div>
      <Link href="/chat" className="new-chat mobile-drawer-new" onClick={onClose}><MessageCircle size={16}/> Open AI workspace <span className="shared-navigation-arrow">↗</span></Link>
      <div className="side-label">Workspace</div>
      <nav className="shared-navigation-links" aria-label="Workspace pages">
        {links.map(({ label, href, Icon, key, detail }) => <Link key={key} href={href} onClick={onClose} className={"side-link shared-navigation-link" + (activeKey === key ? " active" : "")} aria-current={activeKey === key ? "page" : undefined}>
          <span className="shared-navigation-icon"><Icon size={18}/></span><span className="shared-navigation-copy"><strong>{label}</strong><small>{detail}</small></span><span className="shared-navigation-arrow">›</span>
        </Link>)}
      </nav>
      <div className="shared-navigation-footer"><span/> Vedic AI · Astrology companion</div>
    </aside>
  </div>;
}
