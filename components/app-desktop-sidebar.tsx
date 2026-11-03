"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  PlusCircle,
  Hand,
  MessageSquare,
  Compass,
  Calendar,
  BookOpen,
  User,
  Sun,
  Moon,
} from "lucide-react";

interface AppDesktopSidebarProps {
  onNewConsultation?: () => void;
}

export default function AppDesktopSidebar({ onNewConsultation }: AppDesktopSidebarProps) {
  const pathname = usePathname();

  function toggleTheme() {
    if (typeof window !== "undefined") {
      const current = document.documentElement.dataset.theme;
      const next = current === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      try {
        window.localStorage.setItem("vedic-chat-theme", next);
        window.dispatchEvent(new StorageEvent("storage", { key: "vedic-chat-theme", newValue: next }));
      } catch {}
    }
  }

  const navItems = [
    {
      label: "Hastarekha (Palm)",
      href: "/palm-reading",
      icon: Hand,
      active: pathname === "/palm-reading",
      badge: "Vision AI",
    },
    {
      label: "Astrology Chat",
      href: "/chat",
      icon: MessageSquare,
      active: pathname === "/chat",
    },
    {
      label: "Birth Chart (Kundli)",
      href: "/chat?openBirth=1",
      icon: Compass,
      active: false,
    },
    {
      label: "Panchang Almanac",
      href: "/panchang",
      icon: Calendar,
      active: pathname === "/panchang",
    },
    {
      label: "Saved Reports",
      href: "/reports",
      icon: BookOpen,
      active: pathname === "/reports",
    },
  ];

  return (
    <aside
      className="hidden xl:flex fixed left-0 top-0 bottom-0 w-[280px] bg-[var(--panel)]/95 backdrop-blur-2xl z-40 flex-col justify-between border-r border-[var(--line)] shadow-xl font-sans-luxury select-none"
      data-purpose="desktop-master-sidebar"
    >
      <div className="flex flex-col min-h-0">
        {/* Sidebar Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[var(--line)]">
          <Link href="/chat" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[var(--wash)] border border-[var(--line2)] flex items-center justify-center text-[var(--gold)] shadow-[0_0_16px_rgba(229,196,107,0.15)] group-hover:scale-105 transition-transform">
              <Sparkles size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-serif-luxury text-lg font-bold text-[var(--gold)] tracking-wide leading-none">
                Vedic AI
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[var(--quiet)] mt-1 font-semibold">
                Jyotish Space
              </span>
            </div>
          </Link>
        </div>

        {/* New Consultation CTA Button (⌘N) */}
        <div className="px-5 py-4">
          <button
            type="button"
            onClick={onNewConsultation || (() => { window.location.href = "/chat"; })}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--raised)] border border-[var(--line2)] rounded-xl hover:border-[var(--gold)] hover:bg-[var(--wash)] transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <PlusCircle size={18} className="text-[var(--gold)] group-hover:rotate-90 transition-transform" />
              <span className="text-xs font-semibold text-[var(--text)] group-hover:text-[var(--gold)] transition-colors">
                New Consultation
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--panel)] border border-[var(--line)] text-[var(--quiet)] font-mono">
              ⌘N
            </span>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="px-5 mt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--quiet)] px-3 mb-2 block">
            Celestial Workspaces
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    item.active
                      ? "bg-[var(--wash)] text-[var(--gold)] border border-[var(--line2)] shadow-sm font-semibold"
                      : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--raised)] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className={item.active ? "text-[var(--gold)]" : "text-[var(--quiet)]"} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#52FEB8]/10 text-[#52FEB8] border border-[#52FEB8]/30 font-semibold uppercase">
                      {item.badge}
                    </span>
                  ) : item.active ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] shadow-[0_0_6px_#FFE192]" />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer & Theme Toggle */}
      <div className="p-5 border-t border-[var(--line)] bg-[var(--raised)]/50 space-y-3">
        <div className="flex items-center justify-between px-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
          >
            <Sun size={15} className="dark:hidden" />
            <Moon size={15} className="hidden dark:inline" />
            <span>Theme Toggle</span>
          </button>

          <Link
            href="/profile"
            className="p-1.5 rounded-lg text-[var(--quiet)] hover:text-[var(--gold)] hover:bg-[var(--panel)] transition-colors"
            title="My Profile"
          >
            <User size={16} />
          </Link>
        </div>

        <div className="pt-2 border-t border-[var(--line)] text-[10px] text-[var(--quiet)] flex items-center justify-between">
          <span>Vedic AI • 2026</span>
          <span className="inline-flex items-center gap-1 text-[#52FEB8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#52FEB8] animate-pulse" />
            Engine Online
          </span>
        </div>
      </div>
    </aside>
  );
}

