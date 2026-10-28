"use client";

import { useEffect } from "react";

export default function ThemeSync() {
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("vedic-chat-theme");
      document.documentElement.dataset.theme = saved === "light" ? "light" : "dark";
    } catch {
      document.documentElement.dataset.theme = "dark";
    }
    const sync = (event: StorageEvent) => {
      if (event.key === "vedic-chat-theme") {
        document.documentElement.dataset.theme = event.newValue === "light" ? "light" : "dark";
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return null;
}
