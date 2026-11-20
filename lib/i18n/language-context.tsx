"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import type { SupportedLanguage, LanguageContextValue } from "./types";
import en from "./locales/en";
import hi from "./locales/hi";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { stopAllSpeech } from "@/lib/voice/unified-tts-client";

export const STORAGE_KEY = "vedic-language";
export const STORAGE_TIMESTAMP_KEY = "vedic-language-timestamp";
export const STORAGE_EXPLICIT_KEY = "vedic-language-explicit";
export const COOKIE_NAME = "vedic_language";

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

  // Track timestamps and request sequence to avoid race conditions with async profile fetches
  const lastExplicitSelectionRef = useRef<number>(0);
  const activeRequestIdRef = useRef<number>(0);

  // Sync preference to Supabase user metadata asynchronously
  const syncUserPreference = useCallback(async (lang: SupportedLanguage) => {
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { language: lang, language_updated_at: Date.now() },
        });
      }
    } catch {
      // Non-blocking; continue smoothly even if offline or unauthenticated
    }
  }, []);

  // Set language with instant UI update, local storage sync, cookie, and background auth sync
  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (newLang !== "en" && newLang !== "hi") return;

    // Explicit user action recorded immediately
    const now = Date.now();
    lastExplicitSelectionRef.current = now;
    activeRequestIdRef.current++; // Invalidate any in-flight asynchronous profile queries

    setLanguageState(newLang);

    // Cancel active TTS playback when language changes
    try {
      stopAllSpeech();
    } catch {}

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, newLang);
        window.localStorage.setItem(STORAGE_TIMESTAMP_KEY, String(now));
        window.localStorage.setItem(STORAGE_EXPLICIT_KEY, "true");
        document.cookie = `${COOKIE_NAME}=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.lang = newLang;
        window.dispatchEvent(
          new CustomEvent("vedic-language-change", {
            detail: { language: newLang, timestamp: now },
          })
        );
      } catch {
        // Storage access issues handled safely
      }
    }

    void syncUserPreference(newLang);
  }, [syncUserPreference]);

  // Initial preference detection on client mount with strict race-condition guards
  useEffect(() => {
    let resolved: SupportedLanguage | null = null;
    let hasExplicitLocal = false;

    // 1. Check localStorage first for immediate local responsiveness
    try {
      const local = window.localStorage.getItem(STORAGE_KEY);
      const isExplicit = window.localStorage.getItem(STORAGE_EXPLICIT_KEY) === "true";
      const timestamp = parseInt(window.localStorage.getItem(STORAGE_TIMESTAMP_KEY) || "0", 10);

      if (local === "en" || local === "hi") {
        resolved = local;
        if (isExplicit && timestamp > 0) {
          hasExplicitLocal = true;
          lastExplicitSelectionRef.current = timestamp;
        }
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

    // 3. Authenticated profile check (syncs only if no newer local user selection exists)
    async function checkAuthProfile() {
      const fetchReqId = ++activeRequestIdRef.current;
      const fetchStart = Date.now();

      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();

        // Guard against race conditions:
        // A. If a newer request was dispatched while this was in flight, abort
        if (fetchReqId !== activeRequestIdRef.current) return;

        // B. If the user explicitly toggled language while this fetch was in flight, abort
        if (lastExplicitSelectionRef.current > fetchStart) return;

        const profileLang = user?.user_metadata?.language;
        if (profileLang === "en" || profileLang === "hi") {
          // If the user already made an explicit local choice before this profile fetch,
          // prioritize the user's explicit local choice and sync it to the profile instead of overwriting!
          if (hasExplicitLocal && resolved && resolved !== profileLang) {
            void syncUserPreference(resolved);
            return;
          }

          // Otherwise, adopt the stored profile preference safely
          setLanguageState(profileLang);
          try {
            window.localStorage.setItem(STORAGE_KEY, profileLang);
            document.cookie = `${COOKIE_NAME}=${profileLang}; path=/; max-age=31536000; SameSite=Lax`;
            document.documentElement.lang = profileLang;
          } catch {}
        } else if (hasExplicitLocal && resolved) {
          // User has explicit local choice, but profile has no language set: sync local to profile
          void syncUserPreference(resolved);
        }
      } catch {
        // Ignore auth fetch failures in offline or unauthenticated mode
      }
    }

    void checkAuthProfile();

    // 4. Handle cross-tab storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "en" || e.newValue === "hi")) {
        lastExplicitSelectionRef.current = Date.now();
        setLanguageState(e.newValue);
        if (typeof document !== "undefined") {
          document.documentElement.lang = e.newValue;
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    // 5. Listen for custom intra-page or cross-component sync events
    const handleCustomChange = (e: Event) => {
      const detail = (e as CustomEvent<{ language: SupportedLanguage; timestamp?: number }>).detail;
      if (detail && (detail.language === "en" || detail.language === "hi")) {
        if (detail.timestamp && detail.timestamp >= lastExplicitSelectionRef.current) {
          lastExplicitSelectionRef.current = detail.timestamp;
        }
        setLanguageState(detail.language);
      }
    };
    window.addEventListener("vedic-language-change", handleCustomChange);

    // 6. Handle Supabase auth state transitions (login / logout)
    let authSubscription: { unsubscribe: () => void } | null = null;
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session?.user) {
            const profileLang = session.user.user_metadata?.language;
            // If user explicitly chose in this session, sync to profile
            if (lastExplicitSelectionRef.current > 0) {
              const currentLang = (window.localStorage.getItem(STORAGE_KEY) as SupportedLanguage) || "en";
              void syncUserPreference(currentLang);
            } else if (profileLang === "en" || profileLang === "hi") {
              setLanguageState(profileLang);
              try {
                window.localStorage.setItem(STORAGE_KEY, profileLang);
                document.cookie = `${COOKIE_NAME}=${profileLang}; path=/; max-age=31536000; SameSite=Lax`;
                document.documentElement.lang = profileLang;
              } catch {}
            }
          }
        });
        authSubscription = subscription;
      }
    } catch {}

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("vedic-language-change", handleCustomChange);
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [syncUserPreference]);

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
