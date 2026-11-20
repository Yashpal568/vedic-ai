"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppNavigationDrawer from "@/components/app-navigation-drawer";
import { useLanguage } from "@/lib/i18n/language-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Menu, MoonStar } from "lucide-react";

type Props = { section?: string; backHref?: string; backLabel?: string; onSignOut?: () => void };

export default function SiteHeader({ section: _section, onSignOut }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const [accountAvatar, setAccountAvatar] = useState<string | null>(null);
  const [accountInitial, setAccountInitial] = useState<string>("G");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        const avatar = metadata.avatar_url || metadata.picture || null;
        const name = metadata.full_name || metadata.name || session.user.email || "G";
        setAccountAvatar(avatar);
        setAccountInitial(name.trim().charAt(0).toUpperCase());
      }
    });
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-16 backdrop-blur-md bg-[#070913]/75 border-b border-white/[0.06] transition-colors">
        {/* Left Zone: Hamburger + refined vedic.ai logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={18} strokeWidth={2} />
          </button>
          <Link href="/chat" className="flex items-center gap-2 text-decoration-none">
            <span className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.18)]">
              <MoonStar size={16} strokeWidth={1.8} />
            </span>
            <span className="font-bold text-base tracking-tight text-white">
              vedic<span className="text-amber-400">.</span>ai
            </span>
          </Link>
        </div>

        {/* Right Zone: Compact EN / हिं segmented pill + sleek avatar */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center rounded-full bg-white/[0.05] border border-white/10 p-0.5 text-xs font-semibold backdrop-blur-md">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-2.5 py-1 rounded-full transition-all text-xs cursor-pointer ${
                language === "en"
                  ? "bg-amber-400/20 text-amber-300 font-bold shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              EN
            </button>
            <span className="text-white/20 text-[10px] px-0.5 select-none">/</span>
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={`px-2.5 py-1 rounded-full transition-all text-xs cursor-pointer ${
                language === "hi"
                  ? "bg-amber-400/20 text-amber-300 font-bold shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              हिं
            </button>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="relative w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-600 shadow-[0_0_12px_rgba(251,191,36,0.25)] hover:scale-105 active:scale-95 transition-transform cursor-pointer overflow-hidden flex items-center justify-center shrink-0"
            title="Account / Menu"
            aria-label="Account menu"
          >
            {accountAvatar ? (
              <img
                src={accountAvatar}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="w-full h-full rounded-full bg-[#121524] flex items-center justify-center text-xs font-bold text-amber-200">
                {accountInitial}
              </span>
            )}
          </button>
        </div>
      </header>

      <AppNavigationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
