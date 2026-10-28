"use client";

import { useEffect } from "react";

export default function ThemeSync() {
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("vedic-chat-theme");
      document.documentElement.dataset.theme = saved === "light" ? "light" : "dark";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", saved === "light" ? "#f7f5ef" : "#10110f");
    } catch {
      document.documentElement.dataset.theme = "dark";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", "#10110f");
    }
    const sync = (event: StorageEvent) => {
      if (event.key === "vedic-chat-theme") {
        document.documentElement.dataset.theme = event.newValue === "light" ? "light" : "dark";
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", event.newValue === "light" ? "#f7f5ef" : "#10110f");
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return null;
}
