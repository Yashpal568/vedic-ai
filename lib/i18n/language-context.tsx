"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { SupportedLanguage, LanguageContextValue } from "./types";
import en from "./locales/en";
import hi from "./locales/hi";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const STORAGE_KEY = "vedic-language";
const COOKIE_NAME = "vedic_language";

const dictionaries: Record<SupportedLanguage, Record<string, unknown>> = {
  en: en as unknown as Record<string, unknown>,
  hi: hi as unknown as Record<string, unknown>,
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Helper to safely resolve nested dot-notation keys like "nav.palmReading"
 */
function resolveKey(obj: unknown, keyPath: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  const parts = keyPath.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  return typeof current === "string" ? current : null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  // Sync preference to Supabase user metadata asynchronously
  const syncUserPreference = useCallback(async (lang: SupportedLanguage) => {
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { language: lang },
        });
      }
    } catch {
      // Non-blocking; continue smoothly even if offline or unauthenticated
    }
  }, []);

  // Set language with instant UI update, local storage sync, cookie, and background auth sync
  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (newLang !== "en" && newLang !== "hi") return;
    setLanguageState(newLang);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, newLang);
        document.cookie = `${COOKIE_NAME}=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.lang = newLang;
        window.dispatchEvent(new CustomEvent("vedic-language-change", { detail: { language: newLang } }));
      } catch {
        // Storage access issues handled safely
      }
    }

    void syncUserPreference(newLang);
  }, [syncUserPreference]);

  // Initial preference detection on client mount
  useEffect(() => {
    let resolved: SupportedLanguage | null = null;

    // 1. Check localStorage first for immediate local responsiveness
    try {
      const local = window.localStorage.getItem(STORAGE_KEY);
      if (local === "en" || local === "hi") {
        resolved = local;
      }
    } catch {
      // LocalStorage unavailable
    }

    // 2. Check browser navigator language if no local storage preference
    if (!resolved && typeof navigator !== "undefined" && navigator.language) {
      if (navigator.language.toLowerCase().startsWith("hi")) {
        resolved = "hi";
      }
    }

    // Default to 'en' if still null
    const finalInitial = resolved || "en";
    setLanguageState(finalInitial);
    if (typeof document !== "undefined") {
      document.documentElement.lang = finalInitial;
    }

    // 3. Authenticated profile check (highest priority: syncs and supersedes if user profile has stored language)
    async function checkAuthProfile() {
      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        const profileLang = user?.user_metadata?.language;
        if (profileLang === "en" || profileLang === "hi") {
          setLanguageState(profileLang);
          try {
            window.localStorage.setItem(STORAGE_KEY, profileLang);
            document.cookie = `${COOKIE_NAME}=${profileLang}; path=/; max-age=31536000; SameSite=Lax`;
            document.documentElement.lang = profileLang;
          } catch {}
        }
      } catch {
        // Ignore auth fetch failures in offline or unauthenticated mode
      }
    }

    void checkAuthProfile();

    // Listen for custom multi-tab or cross-component sync events
    const handleCustomChange = (e: Event) => {
      const detail = (e as CustomEvent<{ language: SupportedLanguage }>).detail;
      if (detail && (detail.language === "en" || detail.language === "hi")) {
        setLanguageState(detail.language);
      }
    };

    window.addEventListener("vedic-language-change", handleCustomChange);
    return () => {
      window.removeEventListener("vedic-language-change", handleCustomChange);
    };
  }, []);

  // Translation function t(key, params)
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const dict = dictionaries[language] || dictionaries.en;
    let text = resolveKey(dict, key);

    // Fallback to English if translation is missing in Hindi
    if (!text && language !== "en") {
      text = resolveKey(dictionaries.en, key);
    }

    // Fallback to raw key if missing in both
    if (!text) {
      return key;
    }

    // Interpolate {paramName}
    if (params) {
      return text.replace(/\{(\w+)\}/g, (_, match: string) => {
        return match in params ? String(params[match]) : `{${match}}`;
      });
    }

    return text;
  }, [language]);

  const formatDate = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
      const locale = language === "hi" ? "hi-IN" : "en-IN";
      return new Intl.DateTimeFormat(locale, options || { dateStyle: "medium" }).format(d);
    } catch {
      return String(date);
    }
  }, [language]);

  const formatNumber = useCallback((num: number, options?: Intl.NumberFormatOptions): string => {
    try {
      const locale = language === "hi" ? "hi-IN" : "en-IN";
      return new Intl.NumberFormat(locale, options).format(num);
    } catch {
      return String(num);
    }
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t,
    isHindi: language === "hi",
    isEnglish: language === "en",
    formatDate,
    formatNumber,
    syncUserPreference,
  }), [language, setLanguage, t, formatDate, formatNumber, syncUserPreference]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if called outside provider (e.g. standalone test)
    return {
      language: "en",
      setLanguage: () => {},
      t: (key: string) => key,
      isHindi: false,
      isEnglish: true,
      formatDate: (d) => String(d),
      formatNumber: (n) => String(n),
      syncUserPreference: async () => {},
    };
  }
  return context;
}
