"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PlusCircle,
  Hand,
  MessageSquare,
  Compass,
  Calendar,
  BookOpen,
  User,
  Sun,
  MoonStar,
  Search,
  History,
  ShieldCheck,
  LogOut,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    try {
      const urlCollapsed = new URLSearchParams(window.location.search).get("collapsed");
      const savedCollapsed =
        urlCollapsed === "1" ||
        (urlCollapsed === null && window.localStorage.getItem("vedic-sidebar-collapsed") === "1");
      setIsCollapsed(savedCollapsed);
      if (savedCollapsed) {
        document.documentElement.dataset.sidebarCollapsed = "true";
      } else {
        delete document.documentElement.dataset.sidebarCollapsed;
      }

      const savedTheme = window.localStorage.getItem("vedic-chat-theme");
      const urlTheme = new URLSearchParams(window.location.search).get("theme");
      const currentTheme =
        urlTheme === "light" || urlTheme === "dark"
          ? urlTheme
          : savedTheme === "light"
          ? "light"
          : "dark";
      setTheme(currentTheme);
      document.documentElement.dataset.theme = currentTheme;
    } catch {}

    const handleToggle = () => {
      setIsCollapsed(document.documentElement.dataset.sidebarCollapsed === "true");
    };
    window.addEventListener("vedic-sidebar-toggle", handleToggle);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "vedic-chat-theme" && e.newValue) {
        setTheme(e.newValue === "light" ? "light" : "dark");
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("vedic-sidebar-toggle", handleToggle);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function toggleSidebar() {
    const next = !isCollapsed;
    setIsCollapsed(next);
    if (next) {
      document.documentElement.dataset.sidebarCollapsed = "true";
    } else {
      delete document.documentElement.dataset.sidebarCollapsed;
    }
    try {
      window.localStorage.setItem("vedic-sidebar-collapsed", next ? "1" : "0");
    } catch {}
    window.dispatchEvent(new CustomEvent("vedic-sidebar-toggle", { detail: { collapsed: next } }));
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("vedic-chat-theme", next);
      window.dispatchEvent(
        new StorageEvent("storage", { key: "vedic-chat-theme", newValue: next })
      );
    } catch {}
  }

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
      className={`sidebar desktop-master-sidebar ${
        isCollapsed ? "sidebar-is-collapsed" : ""
      } ${className}`}
      data-purpose="desktop-master-sidebar"
    >
      {/* Brand Header with Squircle Mark and Toggle */}
      <div className="sidebar-head">
        <Link
          href="/chat"
          className="brand sidebar-brand-clean"
          aria-label="Vedic AI home"
        >
          <span className="brand-mark" aria-hidden="true">
            <MoonStar size={19} strokeWidth={1.6} />
          </span>
          {!isCollapsed && (
            <span className="sidebar-brand-copy">
              <span className="brand-name">
                vedic<span style={{ color: "var(--gold)" }}>.</span>ai
              </span>
              <span className="brand-sub">Jyotish Intelligence</span>
            </span>
          )}
        </Link>
        <div className="sidebar-head-actions">
          <button
            type="button"
            className="sidebar-collapse-toggle desktop-sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
      </div>

      {/* Main Scrollable Body: Action CTA + Sacred Workspaces + Recent Consultations */}
      <div className="sidebar-scroll-area">
        {/* Action Button: New Consultation */}
        <div className="sidebar-action-wrap">
          <button
            type="button"
            onClick={
              onNewConsultation ||
              (() => {
                window.location.href = "/chat";
              })
            }
            className="new-consultation-btn"
            title="New Consultation (⌘N)"
          >
            <div className="new-consultation-left">
              <PlusCircle size={17} className="new-consultation-plus" />
              {!isCollapsed && <span>New Consultation</span>}
            </div>
            {!isCollapsed && <span className="new-consultation-badge">⌘N</span>}
          </button>
        </div>

        {/* Sacred Workspaces Section */}
        <div className="sidebar-section">
          {!isCollapsed && (
            <span className="sidebar-section-title">Sacred Workspaces</span>
          )}
          <nav className="sidebar-nav" aria-label="Sacred Workspaces">
            {sacredWorkspaces.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={item.label}
                  className={`sidebar-nav-link ${item.active ? "active" : ""}`}
                >
                  <div className="sidebar-nav-link-left">
                    <Icon size={17} className="sidebar-nav-icon" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge ? (
                    <span className="sidebar-vision-badge">{item.badge}</span>
                  ) : !isCollapsed && item.active ? (
                    <span className="sidebar-active-dot" />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Recent Consultations Section with Search (Desktop Full Mode Only) */}
        {!isCollapsed && (
          <div className="sidebar-section sidebar-recent-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">Recent Consultations</span>
              <span className="sidebar-count-badge">{conversations.length}</span>
            </div>

            {/* Search Input */}
            {conversations.length > 2 && (
              <div className="sidebar-search-wrap">
                <Search size={13} className="sidebar-search-icon" />
                <input
                  type="text"
                  placeholder="Search consultations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sidebar-search-input"
                  aria-label="Search consultations"
                />
              </div>
            )}

            <div className="sidebar-recent-list">
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
                    className={`sidebar-history-row ${
                      activeConversationId === item.id ? "active" : ""
                    }`}
                  >
                    <div className="sidebar-history-meta">
                      <History size={13} className="sidebar-history-icon" />
                      <div className="sidebar-history-copy">
                        <span className="sidebar-history-title">{item.title}</span>
                        <span className="sidebar-history-time">
                          {formatRelativeTime(item.updated_at)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(e, item.id)}
                      className="sidebar-history-delete"
                      title="Delete consultation"
                      aria-label={"Delete " + item.title}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="sidebar-empty-state">
                  {searchQuery ? "No matches" : "No saved consultations yet."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Permanently Fixed Footer: Theme Toggle & Account Profile */}
      <div className="sidebar-fixed-footer">
        {/* Theme Controls */}
        <div className="sidebar-theme-row">
          <button
            type="button"
            onClick={toggleTheme}
            className="sidebar-theme-btn"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun size={15} /> : <MoonStar size={15} />}
            {!isCollapsed && <span>Theme Toggle</span>}
          </button>
          {!isCollapsed && <span className="sidebar-version-pill">Vedic 4.0</span>}
        </div>

        {/* Account Row */}
        <div className="sidebar-account-row">
          <Link
            href="/profile"
            className="sidebar-account-link"
            title={userName}
          >
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatar}
                alt={userName}
                className="sidebar-avatar-img"
              />
            ) : (
              <div className="sidebar-avatar-fallback">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            {!isCollapsed && (
              <div className="sidebar-account-copy">
                <span className="sidebar-account-name">{userName}</span>
                <span className="sidebar-account-email">
                  {isSignedIn ? userEmail || "Account Active" : "Guest Mode"}
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            isSignedIn ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="sidebar-signout-btn"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={15} />
              </button>
            ) : (
              <Link
                href="/login"
                className="sidebar-signin-badge"
              >
                Sign In
              </Link>
            )
          )}
        </div>
      </div>
    </aside>
  );
}
