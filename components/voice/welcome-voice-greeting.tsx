"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/language-context";

const STORAGE_KEY = "hasPlayedWelcomeGreeting";

export const GREETINGS = {
  en: "Namaste, how can I assist you?",
  hi: "नमस्ते, मैं आपकी क्या सहायता कर सकता हूँ?",
  hiPhonetic: "Namaste, main aapki kya sahayata kar sakta hoon?",
};

export default function WelcomeVoiceGreeting() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const hasPlayedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Strictly restrict voice greeting to the Home page routes only
  const isHomePage = pathname === "/" || pathname === "/chat";

  useEffect(() => {
    if (typeof window === "undefined" || !isHomePage) return;

    // Detect active language accurately (context first, fallback to localStorage/DOM)
    const storedLang = window.localStorage.getItem("vedic-language");
    const docLang = document.documentElement.lang;
    const activeLang = language === "hi" || storedLang === "hi" || docLang === "hi" ? "hi" : "en";

    const greetingText = activeLang === "hi" ? GREETINGS.hi : GREETINGS.en;
    const audioSrc = activeLang === "hi" ? "/audio/greeting-hi.mp3" : "/audio/greeting-en.mp3";

    let hasCleanedUp = false;

    // Web Speech API fallback in case HTML5 Audio cannot play
    const playBrowserSpeechFallback = () => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const voices = window.speechSynthesis.getVoices();

        let utteranceText = greetingText;
        let targetLang = activeLang === "hi" ? "hi-IN" : "en-US";
        let chosenVoice: SpeechSynthesisVoice | undefined;

        if (voices && voices.length > 0) {
          if (activeLang === "hi") {
            // Find native Hindi voice
            chosenVoice = voices.find(
              (v) => v.lang.toLowerCase().startsWith("hi") || v.name.toLowerCase().includes("hindi")
            );
            // If no Hindi voice exists (e.g. Windows PC with only English), use Indian English voice with romanized Hindi
            if (!chosenVoice) {
              chosenVoice = voices.find(
                (v) => v.lang.toLowerCase() === "en-in" || v.name.toLowerCase().includes("india")
              );
              if (chosenVoice) {
                utteranceText = GREETINGS.hiPhonetic;
                targetLang = "en-IN";
              }
            }
          } else {
            // English voice (prefer Indian English if available for natural 'Namaste', else standard English)
            chosenVoice =
              voices.find((v) => v.lang.toLowerCase() === "en-in") ||
              voices.find((v) => v.lang.toLowerCase().startsWith("en"));
            if (chosenVoice?.lang) targetLang = chosenVoice.lang;
          }
        }

        const utterance = new SpeechSynthesisUtterance(utteranceText);
        utterance.lang = targetLang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        if (chosenVoice) utterance.voice = chosenVoice;

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("[welcome-voice] Web Speech error:", e);
      }
    };

    const stopActivePlayback = () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };

    const markPlayed = () => {
      hasPlayedRef.current = true;
      try {
        window.sessionStorage.setItem(STORAGE_KEY, "true");
      } catch {}
      removeListeners();
    };

    const removeListeners = () => {
      window.removeEventListener("click", onFirstInteraction, true);
      window.removeEventListener("touchstart", onFirstInteraction, true);
      window.removeEventListener("pointerdown", onFirstInteraction, true);
      window.removeEventListener("keydown", onFirstInteraction, true);
      window.removeEventListener("vedic-stop-voice", stopActivePlayback);
    };

    // Pre-create and preload the high-quality human audio
    const audio = new Audio(audioSrc);
    audio.preload = "auto";
    audioRef.current = audio;

    const playGreeting = async () => {
      if (hasCleanedUp) return;
      markPlayed();
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch {
        // Audio element failed or was blocked; fall back to Web Speech
        playBrowserSpeechFallback();
      }
    };

    // Synchronous first interaction handler (passes browser autoplay gesture checks)
    const onFirstInteraction = () => {
      if (hasPlayedRef.current || hasCleanedUp) return;
      void playGreeting();
    };

    // Intercept user gesture in the capture phase for 100% reliable mobile browser playback
    window.addEventListener("click", onFirstInteraction, { capture: true, once: true, passive: true });
    window.addEventListener("touchstart", onFirstInteraction, { capture: true, once: true, passive: true });
    window.addEventListener("pointerdown", onFirstInteraction, { capture: true, once: true, passive: true });
    window.addEventListener("keydown", onFirstInteraction, { capture: true, once: true, passive: true });
    window.addEventListener("vedic-stop-voice", stopActivePlayback);

    // Attempt immediate autoplay on mount
    const autoplayPromise = audio.play();
    if (autoplayPromise !== undefined) {
      autoplayPromise
        .then(() => {
          markPlayed();
        })
        .catch(() => {
          // Autoplay was blocked by browser security policy; onFirstInteraction will handle synchronous playback
        });
    }

    return () => {
      hasCleanedUp = true;
      removeListeners();
      stopActivePlayback();
      audioRef.current = null;
    };
  }, [language, isHomePage]);

  return null;
}
