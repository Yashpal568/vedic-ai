/**
 * Vedic-AI Global Internationalization (i18n) Types
 * Supports English ('en') and Hindi ('hi' - हिन्दी) across text, reports, and voice.
 */

export type SupportedLanguage = "en" | "hi";

export interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isHindi: boolean;
  isEnglish: boolean;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  syncUserPreference: (lang: SupportedLanguage) => Promise<void>;
}

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

