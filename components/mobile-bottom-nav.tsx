"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/language-context";
import { CalendarDays, Hand, House, MessageCircle, Orbit } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [openBirth, setOpenBirth] = useState(false);
  const [chatHash, setChatHash] = useState(false);

  const items = [
    { label: t("nav.home"), href: "/chat", Icon: House, key: "home" },
    { label: t("nav.kundli"), href: "/chat?openBirth=1", Icon: Orbit, key: "kundli" },
    { label: t("nav.chat"), href: "/chat#chat-input", Icon: MessageCircle, key: "chat" },
    { label: t("nav.palmistry"), href: "/palm-reading", Icon: Hand, key: "palm" },
    { label: t("nav.panchang"), href: "/panchang", Icon: CalendarDays, key: "panchang" },
  ];

  useEffect(() => {
    setOpenBirth(
      typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("openBirth") === "1"
    );
    setChatHash(
      typeof window !== "undefined" && window.location.hash === "#chat-input"
    );
  }, [pathname]);

  const active =
    pathname === "/panchang"
      ? "panchang"
      : pathname === "/palm-reading"
      ? "palm"
      : pathname === "/profile"
      ? "profile"
      : pathname === "/chat"
      ? openBirth
        ? "kundli"
        : chatHash
        ? "chat"
        : "home"
      : "home";

  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 lg:hidden flex items-center justify-around px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] border-t border-black/[0.08] bg-white/90 text-zinc-600 dark:border-t dark:border-white/10 dark:bg-[#0B0E17]/90 dark:text-[#8E92A2] backdrop-blur-xl shadow-lg transition-colors select-none"
      aria-label="Primary navigation"
    >
      {items.map(({ label, href, Icon, key }) => {
        const isActive = active === key;
        return (
          <Link
            key={key}
            href={href}
            className={`group relative flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-2xl transition-all duration-200 ease-out cursor-pointer hover:scale-105 active:scale-95 ${
              isActive
                ? "text-[#B58525] dark:text-[#D4A33C] font-semibold"
                : "text-zinc-600 hover:text-[#B58525] dark:text-[#8E92A2] dark:hover:text-[#D4A33C]"
            }`}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            onClick={(event) => {
              if (pathname === "/chat" && key === "kundli") {
                event.preventDefault();
                window.location.href = "/chat?openBirth=1";
              }
              if (pathname === "/chat" && key === "home") {
                event.preventDefault();
                window.location.href = "/chat?home=1";
              }
            }}
          >
            {/* Frosted hover backdrop pill */}
            <span
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-amber-500/10 dark:bg-white/[0.08] transition-opacity duration-200 pointer-events-none"
              aria-hidden="true"
            />

            {/* Icon */}
            <span className="relative z-10 transition-transform duration-200 flex items-center justify-center">
              <Icon size={19} strokeWidth={isActive ? 2.3 : 1.7} />
            </span>

            {/* Label */}
            <span className="relative z-10 text-[10px] tracking-tight mt-1 leading-none font-medium">
              {label}
            </span>

            {/* Animated Active Indicator: Sliding golden dot + soft underline glow */}
            {isActive && (
              <motion.div
                layoutId="activeBottomTab"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute -bottom-1 flex flex-col items-center pointer-events-none"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                <div className="w-5 h-[1.5px] rounded-full bg-amber-400/40 blur-[0.5px] -mt-[0.5px]" />
              </motion.div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
