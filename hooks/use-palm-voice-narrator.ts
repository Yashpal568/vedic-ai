"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ParsedPalmReport } from "@/lib/palm-parser";
import type { NarrationLanguage } from "@/lib/palm-narration-service";

export type VoiceStatus =
  | "idle"
  | "preparing"
  | "speaking"
  | "blocked"
  | "stopped"
  | "error";

export interface UsePalmVoiceNarratorOptions {
  initialLanguage?: NarrationLanguage;
}

export function usePalmVoiceNarrator(options: UsePalmVoiceNarratorOptions = {}) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [script, setScript] = useState<string>("");
  const [language, setLanguage] = useState<NarrationLanguage>(
    options.initialLanguage || "en"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioProvider, setAudioProvider] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastNarratedFingerprintRef = useRef<string>("");
  const userStoppedRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize or pre-warm audio element for gesture-based playback permission
  const primeAudio = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      audioRef.current = audio;
    }
    // Attempt silent warm-up to satisfy browser autoplay security context
    try {
      const ctxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (ctxClass) {
        const ctx = new ctxClass();
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
      }
    } catch {
      // Ignore background audio context warming error
    }
  }, []);

  // Revoke any created object URL safely
  const cleanupAudioBlob = useCallback(() => {
    if (audioBlobUrlRef.current) {
      try {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      } catch {
        // Ignored
      }
      audioBlobUrlRef.current = null;
    }
  }, []);

  // Stop all active playback, speech synthesis, and in-flight generation requests
  const stopVoice = useCallback(() => {
    userStoppedRef.current = true;

    // 1. Abort any active API fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Pause audio element
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // Ignored
      }
    }

    // 3. Cancel any browser Web Speech utterance
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignored
      }
    }
    currentUtteranceRef.current = null;

    setStatus("stopped");
  }, []);

  // Reset voice state when user retakes photo or clears report
  const resetVoice = useCallback(() => {
    stopVoice();
    cleanupAudioBlob();
    lastNarratedFingerprintRef.current = "";
    userStoppedRef.current = false;
    setScript("");
    setErrorMessage(null);
    setAudioProvider(null);
    setStatus("idle");
  }, [stopVoice, cleanupAudioBlob]);

  // Fallback to client browser Web Speech API
  const speakWithBrowserWebSpeech = useCallback(
    (textToSpeak: string, langToSpeak: NarrationLanguage) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setStatus("error");
        setErrorMessage("Speech synthesis is unavailable in this browser.");
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      currentUtteranceRef.current = utterance;

      // Select natural voice if available
      const voices = window.speechSynthesis.getVoices();
      if (langToSpeak === "hi") {
        utterance.lang = "hi-IN";
        const hiVoice = voices.find((v) => v.lang.startsWith("hi"));
        if (hiVoice) utterance.voice = hiVoice;
      } else {
        utterance.lang = "en-IN";
        const enVoice =
          voices.find((v) => v.lang === "en-IN") ||
          voices.find((v) => v.lang.startsWith("en"));
        if (enVoice) utterance.voice = enVoice;
      }

      utterance.rate = 0.94;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setStatus("speaking");
      };

      utterance.onend = () => {
        setStatus("stopped");
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        currentUtteranceRef.current = null;
        if (e.error === "not-allowed") {
          setStatus("blocked");
        } else if (e.error !== "canceled" && e.error !== "interrupted") {
          setStatus("error");
          setErrorMessage("Browser voice synthesis could not complete.");
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
        // Verify speaking state
        if (window.speechSynthesis.speaking) {
          setStatus("speaking");
        }
      } catch {
        setStatus("blocked");
      }
    },
    []
  );

  // Play audio from base64 audio/mpeg string
  const playAudioBase64 = useCallback(
    async (base64Audio: string, contentType = "audio/mpeg") => {
      cleanupAudioBlob();

      try {
        // Convert base64 to binary blob
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: contentType });
        const objectUrl = URL.createObjectURL(blob);
        audioBlobUrlRef.current = objectUrl;

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        const audio = audioRef.current;
        audio.src = objectUrl;

        audio.onended = () => {
          setStatus("stopped");
        };

        audio.onerror = () => {
          console.warn("[voice-narrator] Audio element error, attempting speech synthesis");
          if (script) {
            speakWithBrowserWebSpeech(script, language);
          } else {
            setStatus("error");
            setErrorMessage("Audio playback could not be loaded.");
          }
        };

        // Attempt automatic playback
        try {
          await audio.play();
          setStatus("speaking");
        } catch (playErr: unknown) {
          const errName = (playErr as Error)?.name;
          if (errName === "NotAllowedError" || errName === "SecurityError") {
            // Autoplay blocked by browser policy without user gesture
            console.info("[voice-narrator] Autoplay blocked, surfacing tap-to-start action");
            setStatus("blocked");
          } else {
            console.warn("[voice-narrator] Play failed:", playErr);
            setStatus("blocked");
          }
        }
      } catch (decodeErr) {
        console.warn("[voice-narrator] Base64 decode failed:", decodeErr);
        if (script) {
          speakWithBrowserWebSpeech(script, language);
        } else {
          setStatus("error");
          setErrorMessage("Failed to prepare voice audio stream.");
        }
      }
    },
    [cleanupAudioBlob, language, script, speakWithBrowserWebSpeech]
  );

  // Explicit Resume or Replay after Stop / Blocked state
  const resumeOrReplayVoice = useCallback(async () => {
    userStoppedRef.current = false;
    setErrorMessage(null);

    // 1. If audio element has audio loaded, play it
    if (audioRef.current && audioRef.current.src) {
      try {
        if (audioRef.current.ended) {
          audioRef.current.currentTime = 0;
        }
        await audioRef.current.play();
        setStatus("speaking");
        return;
      } catch (err) {
        console.warn("[voice-narrator] Audio resume failed:", err);
      }
    }

    // 2. If speech script is present, use Web Speech API
    if (script) {
      speakWithBrowserWebSpeech(script, language);
      return;
    }

    setStatus("error");
    setErrorMessage("No voice audio available to play.");
  }, [script, language, speakWithBrowserWebSpeech]);

  // Main automatic narration runner
  const autoNarrate = useCallback(
    async (
      report: ParsedPalmReport | null | undefined,
      hand: "left" | "right" | "unsure" = "unsure",
      preferredLanguage?: NarrationLanguage
    ) => {
      const activeLang = preferredLanguage || language;
      if (preferredLanguage && preferredLanguage !== language) {
        setLanguage(preferredLanguage);
      }

      // 1. Validate complete report
      if (
        !report ||
        !report.heartLine?.trim() ||
        !report.headLine?.trim() ||
        !report.lifeLine?.trim() ||
        !report.overallStructure?.trim()
      ) {
        return;
      }

      // 2. Report fingerprint to prevent duplicate narration for the same report
      const fingerprint = `${report.overallStructure.slice(0, 30)}_${report.heartLine.slice(0, 30)}_${report.headLine.slice(0, 30)}_${hand}_${activeLang}`;

      if (lastNarratedFingerprintRef.current === fingerprint) {
        // Already processed or actively running for this exact report and language
        return;
      }

      lastNarratedFingerprintRef.current = fingerprint;
      userStoppedRef.current = false;
      setErrorMessage(null);
      setStatus("preparing");

      // Abort any prior in-flight fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/palm-reading/narrate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            report: {
              overallStructure: report.overallStructure,
              heartLine: report.heartLine,
              headLine: report.headLine,
              lifeLine: report.lifeLine,
              fateLine: report.fateLine,
              thumbCharacteristics: report.thumbCharacteristics,
              fingerProportions: report.fingerProportions,
              mountOfVenus: report.mountOfVenus,
              mountOfJupiter: report.mountOfJupiter,
              synthesis: report.synthesis,
              remedies: report.remedies,
            },
            hand,
            language: activeLang,
          }),
          signal: controller.signal,
        });

        if (userStoppedRef.current) return;

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(
            errData?.error || `Server responded with status ${response.status}`
          );
        }

        const data = await response.json();
        if (userStoppedRef.current) return;

        const generatedScript = data.script || "";
        setScript(generatedScript);
        setAudioProvider(data.provider || "server");

        // If server provided pre-synthesized TTS audio
        if (data.audioBase64) {
          await playAudioBase64(data.audioBase64, data.contentType || "audio/mpeg");
        } else {
          // Fallback to client browser Web Speech API
          speakWithBrowserWebSpeech(generatedScript, activeLang);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          return;
        }
        console.warn("[voice-narrator] Narration request error:", err);
        if (!userStoppedRef.current) {
          setStatus("error");
          setErrorMessage(
            (err as Error)?.message || "Voice narration could not be prepared."
          );
        }
      }
    },
    [language, playAudioBase64, speakWithBrowserWebSpeech]
  );

  // Change language and immediately re-narrate if report is available
  const switchLanguage = useCallback(
    (newLang: NarrationLanguage, report?: ParsedPalmReport | null, hand: "left" | "right" | "unsure" = "unsure") => {
      setLanguage(newLang);
      // Reset fingerprint so the new language triggers narration
      lastNarratedFingerprintRef.current = "";
      userStoppedRef.current = false;
      if (report) {
        autoNarrate(report, hand, newLang);
      }
    },
    [autoNarrate]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // Ignored
        }
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignored
        }
      }
      if (audioBlobUrlRef.current) {
        try {
          URL.revokeObjectURL(audioBlobUrlRef.current);
        } catch {
          // Ignored
        }
      }
    };
  }, []);

  return {
    status,
    script,
    language,
    errorMessage,
    audioProvider,
    primeAudio,
    autoNarrate,
    stopVoice,
    resumeOrReplayVoice,
    switchLanguage,
    resetVoice,
  };
}

