"use client";

import React, { useEffect, useState } from "react";
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
  Search,
  History,
  ShieldCheck,
  LogOut,
  Trash2,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface AppDesktopSidebarProps {
  onNewConsultation?: () => void;
  activeConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  className?: string;
}

interface ConversationSummary {
  id: string;
  title: string;
  updated_at: string;
}

export default function AppDesktopSidebar({
  onNewConsultation,
  activeConversationId,
  onSelectConversation,
  className = "",
}: AppDesktopSidebarProps) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userName, setUserName] = useState("Guest Explorer");
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (!active || !data.user) return;
        setIsSignedIn(true);
        setUserEmail(data.user.email || "");
        setUserName(
          data.user.user_metadata?.display_name ||
            data.user.user_metadata?.full_name ||
            data.user.email?.split("@")[0] ||
            "Seeker"
        );
        setUserAvatar(data.user.user_metadata?.avatar_url || "");
      });
    }

    // Load recent conversations
    fetch("/api/conversations")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (Array.isArray(data.conversations)) {
          setConversations(data.conversations);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  function toggleTheme() {
    if (typeof window !== "undefined") {
      const current = document.documentElement.dataset.theme;
      const next = current === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      try {
        window.localStorage.setItem("vedic-chat-theme", next);
        window.dispatchEvent(
          new StorageEvent("storage", { key: "vedic-chat-theme", newValue: next })
        );
      } catch {}
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = "/";
  }

  async function handleDeleteConversation(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    e.preventDefault();
    try {
      await fetch(`/api/conversations?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id && onNewConsultation) {
        onNewConsultation();
      }
    } catch {}
  }

  function formatRelativeTime(dateStr: string) {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(dateStr).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  }

  const sacredWorkspaces = [
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
      label: "Palm Reading (Hastarekha)",
      href: "/palm-reading",
      icon: Hand,
      active: pathname === "/palm-reading",
      badge: "Vision AI",
    },
    {
      label: "Panchang Almanac",
      href: "/panchang",
      icon: Calendar,
      active: pathname === "/panchang",
    },
    {
      label: "Saved Reports & Kundlis",
      href: "/reports",
      icon: BookOpen,
      active: pathname === "/reports",
    },
    {
      label: "AI Memory",
      href: "/chat?openMemory=1",
      icon: ShieldCheck,
      active: false,
    },
    {
      label: "Account Profile",
      href: "/profile",
      icon: User,
      active: pathname === "/profile",
    },
  ];

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`hidden xl:flex fixed left-0 top-0 bottom-0 w-[280px] bg-[var(--panel)]/95 backdrop-blur-2xl z-40 flex-col justify-between border-r border-[var(--line)] shadow-xl font-sans-luxury select-none ${className}`}
      data-purpose="desktop-master-sidebar"
    >
      <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
        {/* Sidebar Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[var(--line)] shrink-0">
          <Link href="/chat" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[var(--wash)] border border-[var(--line2)] flex items-center justify-center text-[var(--gold)] shadow-[0_0_16px_rgba(229,196,107,0.15)] group-hover:scale-105 transition-transform">
              <Sparkles size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-serif-luxury text-lg font-bold text-[var(--gold)] tracking-wide leading-none">
                Vedic AI
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[var(--quiet)] mt-1 font-semibold">
                Jyotish Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Primary Action: New Consultation CTA Button (⌘N) */}
        <div className="px-5 py-3.5 shrink-0">
          <button
            type="button"
            onClick={
              onNewConsultation ||
              (() => {
                window.location.href = "/chat";
              })
            }
            className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--raised)] border border-[var(--line2)] rounded-xl hover:border-[var(--gold)] hover:bg-[var(--wash)] transition-all group shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <PlusCircle
                size={18}
                className="text-[var(--gold)] group-hover:rotate-90 transition-transform"
              />
              <span className="text-xs font-semibold text-[var(--text)] group-hover:text-[var(--gold)] transition-colors">
                New Consultation
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--panel)] border border-[var(--line)] text-[var(--quiet)] font-mono">
              ⌘N
            </span>
          </button>
        </div>

        {/* Scrollable Middle: Sacred Workspaces + Recent Consultations */}
        <div className="flex-1 overflow-y-auto px-5 space-y-4 custom-scrollbar">
          {/* Sacred Workspaces Section */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--quiet)] px-3 mb-2 block">
              Sacred Workspaces
            </span>
            <nav className="space-y-1">
              {sacredWorkspaces.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      item.active
                        ? "bg-[var(--wash)] text-[var(--gold)] border border-[var(--line2)] shadow-sm font-semibold"
                        : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--raised)] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={17}
                        className={item.active ? "text-[var(--gold)]" : "text-[var(--quiet)]"}
                      />
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

          {/* Recent Consultations Section with Search */}
          <div className="pt-2 border-t border-[var(--line)]">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--quiet)]">
                Recent Consultations
              </span>
              <span className="text-[10px] text-[var(--quiet)] font-mono">
                {conversations.length}
              </span>
            </div>

            {/* Search consultations */}
            {conversations.length > 3 && (
              <div className="relative mb-2">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--quiet)] pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search consultations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-[var(--raised)] border border-[var(--line)] text-[11px] text-[var(--text)] placeholder-[var(--quiet)] outline-none focus:border-[var(--gold)] transition-colors"
                />
              </div>
            )}

            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (onSelectConversation) {
                        onSelectConversation(item.id);
                      } else {
                        window.location.href = `/chat?c=${item.id}`;
                      }
                    }}
                    className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      activeConversationId === item.id
                        ? "bg-[var(--wash)] text-[var(--gold)] font-medium border border-[var(--line2)]"
                        : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--raised)] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <History size={13} className="text-[var(--quiet)] shrink-0" />
                      <div className="truncate">
                        <span className="block truncate text-[11px]">{item.title}</span>
                        <span className="block text-[9px] text-[var(--quiet)]">
                          {formatRelativeTime(item.updated_at)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(e, item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[var(--quiet)] hover:text-red-400 transition-opacity"
                      title="Delete consultation"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-[11px] text-[var(--quiet)] italic">
                  {searchQuery ? "No matches" : "No saved consultations yet."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Footer: Theme Toggle & Account Section */}
      <div className="p-4 border-t border-[var(--line)] bg-[var(--raised)]/40 shrink-0 space-y-3">
        {/* Theme Controls */}
        <div className="flex items-center justify-between px-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--gold)] transition-colors cursor-pointer"
          >
            <Sun size={15} className="dark:hidden text-[var(--gold)]" />
            <Moon size={15} className="hidden dark:inline text-[var(--gold)]" />
            <span>Theme Toggle</span>
          </button>
          <span className="text-[10px] text-[var(--quiet)] font-mono">Vedic 4.0</span>
        </div>

        {/* Account Section */}
        <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-90 transition-opacity"
          >
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatar}
                alt={userName}
                className="w-7 h-7 rounded-full object-cover border border-[var(--gold)]/40 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[var(--wash)] border border-[var(--line2)] flex items-center justify-center text-[var(--gold)] text-xs font-bold shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="block text-xs font-medium text-[var(--text)] truncate">
                {userName}
              </span>
              <span className="block text-[10px] text-[var(--quiet)] truncate">
                {isSignedIn ? userEmail || "Account Active" : "Guest Mode"}
              </span>
            </div>
          </Link>

          {isSignedIn ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-[var(--quiet)] hover:text-red-400 hover:bg-[var(--panel)] transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          ) : (
            <Link
              href="/login"
              className="px-2 py-1 text-[10px] font-semibold text-[var(--gold)] border border-[var(--gold)]/30 rounded-md hover:bg-[var(--wash)] transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
