"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, Hand, House, MessageCircle, Orbit } from "lucide-react";

const items = [
  { label: "Home", href: "/chat", Icon: House, key: "home" },
  { label: "Kundli", href: "/chat?openBirth=1", Icon: Orbit, key: "kundli" },
  { label: "AI Chat", href: "/chat#chat-input", Icon: MessageCircle, key: "chat" },
  { label: "Palmistry", href: "/palm-reading", Icon: Hand, key: "palm" },
  { label: "Panchang", href: "/panchang", Icon: CalendarDays, key: "panchang" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [openBirth, setOpenBirth] = useState(false);
  useEffect(() => {
    setOpenBirth(typeof window !== "undefined" && new URLSearchParams(window.location.search).get("openBirth") === "1");
  }, [pathname]);

  const active = pathname === "/panchang" ? "panchang"
    : pathname === "/palm-reading" ? "palm"
    : pathname === "/profile" ? "profile"
    : pathname === "/chat" ? (openBirth ? "kundli" : (typeof window !== "undefined" && window.location.hash === "#chat-input" ? "chat" : "home"))
    : "home";

  return <nav className="mobile-bottom-nav" aria-label="Primary navigation">
    {items.map(({ label, href, Icon, key }) => <Link
      key={key}
      href={href}
      className={"mobile-bottom-nav-item" + (active === key ? " active" : "")}
      aria-label={label}
      aria-current={active === key ? "page" : undefined}
    >
      <Icon size={19} strokeWidth={1.8} />
      <span>{label}</span>
    </Link>)}
  </nav>;
}
