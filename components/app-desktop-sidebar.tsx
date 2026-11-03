"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Plus,
  MessageCircle,
  Orbit,
  Calendar,
  BookOpen,
  UserRound,
  Sun,
  MoonStar,
  History,
  ShieldCheck,
  LogOut,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Check,
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
  const [userName, setUserName] = useState("Guest explorer");
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [workspaceExpanded, setWorkspaceExpanded] = useState(true);
  const [savedBirth, setSavedBirth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    try {
      const savedCollapsed = window.localStorage.getItem("vedic-sidebar-collapsed") === "1";
      setIsCollapsed(savedCollapsed);
      if (savedCollapsed) {
        document.documentElement.dataset.sidebarCollapsed = "true";
      } else {
        delete document.documentElement.dataset.sidebarCollapsed;
      }

      const savedTheme = window.localStorage.getItem("vedic-chat-theme");
      const currentTheme = savedTheme === "light" ? "light" : "dark";
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

    try {
      const birth = window.localStorage.getItem("vedic_birth_profile");
      if (birth) {
        setSavedBirth(JSON.parse(birth));
      }
    } catch {}

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

  return (
    <aside
      className={`sidebar desktop-master-sidebar ${isCollapsed ? "sidebar-is-collapsed" : ""} ${className}`}
      data-purpose="desktop-master-sidebar"
    >
      {/* Brand Header with Emblem, Subtitle, and Top Controls */}
      <div className="sidebar-head">
        <Link
          href="/chat"
          className="brand sidebar-brand-premium"
          aria-label="Vedic AI home"
          style={{ border: 0, background: "transparent", textAlign: "left", color: "inherit", textDecoration: "none" }}
        >
          <span className="brand-mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vedic-ai-emblem.svg" alt="" />
          </span>
          <span className="sidebar-brand-copy">
            <span className="sidebar-brand-line">
              <span className="brand-name">
                vedic<span style={{ color: "var(--gold)" }}>.</span>ai
              </span>
            </span>
            <span className="brand-sub">Your Jyotish space</span>
          </span>
        </Link>
        <div className="sidebar-head-actions">
          <button
            type="button"
            className="sidebar-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun size={15} /> : <MoonStar size={15} />}
          </button>
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
      </div>

      {/* Scroll Area with New Conversation CTA, Workspace items, and Conversations History */}
      <div className="sidebar-scroll-area">
        <button
          type="button"
          className="new-chat sidebar-new-chat"
          onClick={
            onNewConsultation ||
            (() => {
              window.location.href = "/chat";
            })
          }
        >
          <Plus size={17} /> <span>New conversation</span>
        </button>

        {/* Workspace Dropdown */}
        <button
          type="button"
          className="side-label sidebar-workspace-label sidebar-workspace-toggle"
          aria-expanded={workspaceExpanded}
          onClick={() => setWorkspaceExpanded(!workspaceExpanded)}
        >
          <span>Workspace</span>
          <span className="sidebar-workspace-toggle-right">
            <span className="sidebar-tool-count">7 Tools</span>
            <ChevronDown
              size={15}
              className={workspaceExpanded ? "workspace-chevron expanded" : "workspace-chevron"}
            />
          </span>
        </button>

        {workspaceExpanded && (
          <div className="sidebar-workspace-items">
            <Link
              href="/chat"
              className={"side-link" + (pathname === "/chat" ? " active" : "")}
            >
              <MessageCircle size={17} /> <span>Astrology chat</span>
              {pathname === "/chat" && <span className="sidebar-active-dot" />}
            </Link>
            <Link
              href="/chat?openBirth=1"
              className="side-link"
            >
              <Orbit size={17} /> <span>My birth profile</span>
              {savedBirth && <Check size={13} style={{ marginLeft: "auto", color: "var(--green)" }} />}
            </Link>
            <Link
              href="/palm-reading"
              className={"side-link" + (pathname === "/palm-reading" ? " active" : "")}
            >
              <Sparkles size={17} /> <span>Palm reading</span>
              {pathname === "/palm-reading" && <span className="sidebar-active-dot" />}
            </Link>
            <Link
              href="/panchang"
              className={"side-link" + (pathname === "/panchang" ? " active" : "")}
            >
              <Calendar size={17} /> <span>Panchang almanac</span>
              {pathname === "/panchang" && <span className="sidebar-active-dot" />}
            </Link>
            <Link
              href="/reports"
              className={"side-link" + (pathname === "/reports" ? " active" : "")}
            >
              <BookOpen size={17} /> <span>Kundli & reports</span>
              {pathname === "/reports" && <span className="sidebar-active-dot" />}
            </Link>
            <Link
              href="/profile"
              className={"side-link" + (pathname === "/profile" ? " active" : "")}
            >
              <UserRound size={17} /> <span>My profile</span>
              {pathname === "/profile" && <span className="sidebar-active-dot" />}
            </Link>
            <button
              type="button"
              className="side-link"
              onClick={() => {
                window.location.href = "/chat?openMemory=1";
              }}
            >
              <ShieldCheck size={17} /> <span>AI memory</span>
            </button>
          </div>
        )}

        {/* History List */}
        <section className="sidebar-history" aria-label="Conversation history">
          <div className="side-label sidebar-history-label">
            <span>All conversations</span>
            <span className="sidebar-history-count">{conversations.length}</span>
          </div>
          <div className="sidebar-history-list">
            {conversations.length > 0 ? (
              conversations.map((item) => (
                <div className="history-item-row" key={item.id}>
                  <button
                    type="button"
                    className={
                      "side-link history-item-open " +
                      (activeConversationId === item.id ? "active" : "")
                    }
                    onClick={() => {
                      if (onSelectConversation) {
                        onSelectConversation(item.id);
                      } else {
                        window.location.href = `/chat?id=${encodeURIComponent(item.id)}`;
                      }
                    }}
                  >
                    <History size={15} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="history-delete"
                    aria-label={"Delete " + item.title}
                    title={"Delete " + item.title}
                    onClick={(e) => handleDeleteConversation(e, item.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            ) : (
              <p className="history-empty">
                {isSignedIn
                  ? "Your saved conversations will appear here."
                  : "Sign in to save private conversations."}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Sidebar Footer with Profile and Session Status */}
      <div className="sidebar-bottom">
        <div className="profile-row">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="profile-avatar" src={userAvatar} alt="" />
          ) : (
            <span className="profile-avatar profile-avatar-fallback">
              {userName.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="profile-name">{userName}</div>
            <div className="profile-caption">
              {isSignedIn ? userEmail || "Signed in · private library" : "Guest session"}
            </div>
          </div>
          <div className="sidebar-profile-actions">
            {isSignedIn && <span className="sidebar-google-mark" title="Account connected">G</span>}
            {isSignedIn ? (
              <button
                className="sidebar-logout"
                aria-label="Sign out"
                title="Sign out"
                onClick={handleSignOut}
              >
                <LogOut size={16} />
              </button>
            ) : (
              <Link
                className="sidebar-logout"
                href="/login"
                aria-label="Sign in"
                title="Sign in"
              >
                <UserRound size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
