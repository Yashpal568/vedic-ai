"use client";

import { useEffect } from "react";

export default function ThemeSync() {
  useEffect(() => {
    try {
      const urlTheme = new URLSearchParams(window.location.search).get("theme");
      const saved = window.localStorage.getItem("vedic-chat-theme");
      const isLight = urlTheme === "light" || (urlTheme !== "dark" && saved === "light");
      const currentTheme = isLight ? "light" : "dark";
      document.documentElement.dataset.theme = currentTheme;
      document.documentElement.classList.toggle("dark", !isLight);
      document.documentElement.classList.toggle("light", isLight);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", isLight ? "#FAF8F4" : "#060812");
    } catch {
      document.documentElement.dataset.theme = "dark";
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", "#060812");
    }
    const sync = (event: StorageEvent) => {
      if (event.key === "vedic-chat-theme") {
        const isLight = event.newValue === "light";
        const currentTheme = isLight ? "light" : "dark";
        document.documentElement.dataset.theme = currentTheme;
        document.documentElement.classList.toggle("dark", !isLight);
        document.documentElement.classList.toggle("light", isLight);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", isLight ? "#FAF8F4" : "#060812");
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return null;
}
