"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ParsedPalmReport } from "@/lib/palm-parser";
import type { NarrationSection, StructuredNarrationResponse } from "@/lib/voice/narration-generator";
import type { VoiceLanguage } from "@/lib/voice/language-service";

export type VoiceStatus =
  | "idle"
  | "preparing"
  | "speaking"
  | "paused"
  | "blocked"
  | "stopped"
  | "completed"
  | "error";

export type PlaybackSpeed = 0.75 | 1.0 | 1.25 | 1.5;

export interface UsePalmVoiceNarratorOptions {
  initialLanguage?: VoiceLanguage | "auto";
  onSectionHighlight?: (correspondingReportSection: string | null) => void;
}

export function usePalmVoiceNarrator(options: UsePalmVoiceNarratorOptions = {}) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [language, setLanguage] = useState<VoiceLanguage>("en");
  const [languagePreference, setLanguagePreference] = useState<VoiceLanguage | "auto">(
    options.initialLanguage || "auto"
  );
  const [script, setScript] = useState<string>("");
  const [sections, setSections] = useState<NarrationSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioProvider, setAudioProvider] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeedState] = useState<PlaybackSpeed>(1.0);

  // Synchronized Highlighting State
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  // Interactive Voice Q&A State
  const [isRecordingQuestion, setIsRecordingQuestion] = useState<boolean>(false);
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState<boolean>(false);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);
  const [isAnsweringAudioPlaying, setIsAnsweringAudioPlaying] = useState<boolean>(false);
  const [hasInterruptedNarration, setHasInterruptedNarration] = useState<boolean>(false);

  // References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const qaAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const qaBlobUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastNarratedFingerprintRef = useRef<string>("");
  const userStoppedRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const sectionAudioUrlsRef = useRef<Map<number, string>>(new Map());

  // Prime audio context on user gesture to pre-authorize browser autoplay
  const primeAudio = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      audioRef.current = audio;
    }
    try {
      const ctxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (ctxClass) {
        const ctx = new ctxClass();
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  // Update synchronized report highlight
  const updateHighlight = useCallback(
    (correspondingSection: string | null | undefined) => {
      const target = correspondingSection || null;
      setHighlightedSection(target);
      if (options.onSectionHighlight) {
        options.onSectionHighlight(target);
      }
    },
    [options]
  );

  // Clean up object URLs
  const cleanupAudioBlob = useCallback(() => {
    if (audioBlobUrlRef.current) {
      try {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      } catch {}
      audioBlobUrlRef.current = null;
    }
    sectionAudioUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    sectionAudioUrlsRef.current.clear();
  }, []);

  // Set playback speed
  const setPlaybackSpeed = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeedState(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  // STOP Voice: Immediately stops audio, cancels chunks, aborts fetch, prevents auto-restart
  const stopVoice = useCallback(() => {
    userStoppedRef.current = true;

    // 1. Abort pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Halt main audio
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
    }

    // 3. Halt Q&A audio
    if (qaAudioRef.current) {
      try {
        qaAudioRef.current.pause();
        qaAudioRef.current.currentTime = 0;
      } catch {}
    }

    // 4. Cancel browser speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    currentUtteranceRef.current = null;

    // 5. Clear highlights and set stopped
    updateHighlight(null);
    setStatus("stopped");
  }, [updateHighlight]);

  // Pause Voice
  const pauseVoice = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
    setStatus("paused");
  }, []);

  // Fallback to browser Web Speech API for a specific section
  const speakSectionWithWebSpeech = useCallback(
    (section: NarrationSection, lang: VoiceLanguage, speed: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setStatus("error");
        setErrorMessage("Speech synthesis is unavailable in this browser.");
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(section.sectionText);
      currentUtteranceRef.current = utterance;

      const voices = window.speechSynthesis.getVoices();
      if (lang === "hi") {
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

      utterance.rate = 0.95 * speed;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setStatus("speaking");
        updateHighlight(section.correspondingReportSection);
      };

      utterance.onend = () => {
        currentUtteranceRef.current = null;
        // Advance to next section automatically
        setCurrentSectionIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex < sections.length) {
            // Speak next section
            setTimeout(() => {
              if (!userStoppedRef.current) {
                speakSectionWithWebSpeech(sections[nextIndex], lang, speed);
              }
            }, 300);
            return nextIndex;
          } else {
            setStatus("completed");
            updateHighlight(null);
            return prev;
          }
        });
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
      } catch {
        setStatus("blocked");
      }
    },
    [sections, updateHighlight]
  );

  // Resume Voice
  const resumeVoice = useCallback(async () => {
    userStoppedRef.current = false;
    setErrorMessage(null);

    if (audioRef.current && audioRef.current.src) {
      try {
        await audioRef.current.play();
        setStatus("speaking");
        return;
      } catch (err) {
        console.warn("[voice-player] Audio resume error:", err);
      }
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setStatus("speaking");
      return;
    }

    // Fallback: replay current section
    if (sections[currentSectionIndex]) {
      speakSectionWithWebSpeech(sections[currentSectionIndex], language, playbackSpeed);
    }
  }, [currentSectionIndex, language, playbackSpeed, sections, speakSectionWithWebSpeech]);

  // Play audio from base64 string
  const playAudioBase64 = useCallback(
    async (base64Audio: string, contentType = "audio/mpeg") => {
      cleanupAudioBlob();

      try {
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
        audio.playbackRate = playbackSpeed;

        audio.onended = () => {
          setStatus("completed");
          updateHighlight(null);
        };

        audio.onerror = () => {
          console.warn("[voice-player] Audio element error, using browser speech fallback");
          if (sections[0]) {
            speakSectionWithWebSpeech(sections[0], language, playbackSpeed);
          }
        };

        // Attempt automatic playback
        try {
          await audio.play();
          setStatus("speaking");
          if (sections[0]) {
            updateHighlight(sections[0].correspondingReportSection);
          }
        } catch (playErr: unknown) {
          const errName = (playErr as Error)?.name;
          if (errName === "NotAllowedError" || errName === "SecurityError") {
            console.info("[voice-player] Autoplay blocked, showing tap-to-start fallback");
            setStatus("blocked");
          } else {
            console.warn("[voice-player] Play failed:", playErr);
            setStatus("blocked");
          }
        }
      } catch (err) {
        console.warn("[voice-player] Base64 decode failed:", err);
        if (sections[0]) {
          speakSectionWithWebSpeech(sections[0], language, playbackSpeed);
        }
      }
    },
    [cleanupAudioBlob, language, playbackSpeed, sections, speakSectionWithWebSpeech, updateHighlight]
  );

  // Play a specific section
  const playSection = useCallback(
    async (index: number) => {
      if (index < 0 || index >= sections.length) return;
      setCurrentSectionIndex(index);
      const section = sections[index];
      updateHighlight(section.correspondingReportSection);

      // Synthesize section audio via /api/voice/speech
      try {
        setStatus("preparing");
        const res = await fetch("/api/voice/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: section.sectionText,
            language,
            speed: playbackSpeed,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            await playAudioBase64(data.audioBase64, data.contentType);
            return;
          }
        }
      } catch {}

      // Fallback to Web Speech
      speakSectionWithWebSpeech(section, language, playbackSpeed);
    },
    [language, playAudioBase64, playbackSpeed, sections, speakSectionWithWebSpeech, updateHighlight]
  );

  // Replay current section
  const replaySection = useCallback(() => {
    playSection(currentSectionIndex);
  }, [currentSectionIndex, playSection]);

  // Next section
  const nextSection = useCallback(() => {
    if (currentSectionIndex < sections.length - 1) {
      playSection(currentSectionIndex + 1);
    }
  }, [currentSectionIndex, playSection, sections.length]);

  // Previous section
  const prevSection = useCallback(() => {
    if (currentSectionIndex > 0) {
      playSection(currentSectionIndex - 1);
    }
  }, [currentSectionIndex, playSection]);

  // Main automatic narration initiator
  const autoNarrate = useCallback(
    async (
      report: Partial<ParsedPalmReport> | null | undefined,
      hand: "left" | "right" | "unsure" = "unsure",
      preferredLanguage?: VoiceLanguage | "auto"
    ) => {
      const activePref = preferredLanguage || languagePreference;

      if (!report || (!report.heartLine?.trim() && !report.headLine?.trim() && !report.lifeLine?.trim())) {
        return;
      }

      // Fingerprint to prevent duplicate narration for the exact same report
      const fingerprint = `${(report.overallStructure || "").slice(0, 30)}_${(report.heartLine || "").slice(0, 30)}_${hand}_${activePref}`;
      if (lastNarratedFingerprintRef.current === fingerprint) {
        return;
      }

      lastNarratedFingerprintRef.current = fingerprint;
      userStoppedRef.current = false;
      setErrorMessage(null);
      setStatus("preparing");

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // 1. Fetch structured narration from /api/voice/narration
        const narrateRes = await fetch("/api/voice/narration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            report,
            hand,
            languagePreference: activePref,
          }),
          signal: controller.signal,
        });

        if (userStoppedRef.current) return;

        if (!narrateRes.ok) {
          throw new Error("Could not prepare voice narration.");
        }

        const data: StructuredNarrationResponse = await narrateRes.json();
        if (userStoppedRef.current) return;

        setSections(data.sections || []);
        setScript(data.narrationText || "");
        setLanguage(data.detectedLanguage || "en");
        setCurrentSectionIndex(0);
        setAudioProvider(data.provider);

        // 2. Synthesize speech for full narration via /api/voice/speech
        const speechRes = await fetch("/api/voice/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: data.narrationText,
            language: data.detectedLanguage,
            speed: playbackSpeed,
          }),
          signal: controller.signal,
        });

        if (userStoppedRef.current) return;

        if (speechRes.ok) {
          const speechData = await speechRes.json();
          if (speechData.audioBase64) {
            await playAudioBase64(speechData.audioBase64, speechData.contentType);
            return;
          }
        }

        // 3. Fallback to browser Web Speech API
        if (data.sections && data.sections.length > 0) {
          speakSectionWithWebSpeech(data.sections[0], data.detectedLanguage, playbackSpeed);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
        console.warn("[voice-narrator] autoNarrate error:", err);
        if (!userStoppedRef.current) {
          setStatus("error");
          setErrorMessage((err as Error)?.message || "Voice narration could not be generated.");
        }
      }
    },
    [languagePreference, playAudioBase64, playbackSpeed, speakSectionWithWebSpeech]
  );

  // Switch language
  const switchLanguage = useCallback(
    (newLang: VoiceLanguage, report?: Partial<ParsedPalmReport> | null, hand: "left" | "right" | "unsure" = "unsure") => {
      setLanguage(newLang);
      setLanguagePreference(newLang);
      lastNarratedFingerprintRef.current = "";
      userStoppedRef.current = false;
      if (report) {
        autoNarrate(report, hand, newLang);
      }
    },
    [autoNarrate]
  );

  // Interactive Voice Q&A: Start microphone recording
  const startRecordingQuestion = useCallback(async () => {
    // Interrupt narration cleanly
    if (status === "speaking") {
      pauseVoice();
      setHasInterruptedNarration(true);
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMessage("Microphone access is not supported on this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecordingQuestion(true);
      primeAudio();
    } catch (err) {
      console.warn("[voice-qa] Microphone access error:", err);
      setErrorMessage("Microphone permission was denied. You can type your question instead.");
    }
  }, [pauseVoice, primeAudio, status]);

  // Interactive Voice Q&A: Stop recording and ask question
  const stopRecordingAndAsk = useCallback(
    async (report: Partial<ParsedPalmReport>, hand: "left" | "right" | "unsure" = "unsure") => {
      if (!mediaRecorderRef.current || !isRecordingQuestion) return;

      setIsRecordingQuestion(false);
      setIsAnsweringQuestion(true);

      const recorder = mediaRecorderRef.current;
      recorder.stop();
      recorder.stream.getTracks().forEach((track) => track.stop());

      // Give 250ms for last chunk
      await new Promise((r) => setTimeout(r, 250));
      const audioBlob = new Blob(recordedChunksRef.current, { type: "audio/webm" });

      try {
        // 1. Transcribe audio
        const formData = new FormData();
        formData.append("audio", audioBlob, "user-question.webm");

        const transRes = await fetch("/api/voice/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!transRes.ok) throw new Error("Could not transcribe voice question.");
        const transData = await transRes.json();
        const recognizedQuestion = transData.text || "";
        setLastQuestion(recognizedQuestion);

        // 2. Ask conversation engine
        const convRes = await fetch("/api/voice/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            report,
            question: recognizedQuestion,
            hand,
            languagePreference,
          }),
        });

        if (!convRes.ok) throw new Error("Could not answer report question.");
        const convData = await convRes.json();
        setLastAnswer(convData.answerText);

        // 3. Play spoken answer
        if (convData.audioBase64) {
          if (qaBlobUrlRef.current) URL.revokeObjectURL(qaBlobUrlRef.current);
          const binary = atob(convData.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const qaBlob = new Blob([bytes], { type: convData.contentType || "audio/mpeg" });
          const qaUrl = URL.createObjectURL(qaBlob);
          qaBlobUrlRef.current = qaUrl;

          if (!qaAudioRef.current) qaAudioRef.current = new Audio();
          qaAudioRef.current.src = qaUrl;
          setIsAnsweringAudioPlaying(true);
          qaAudioRef.current.onended = () => setIsAnsweringAudioPlaying(false);
          await qaAudioRef.current.play();
        } else if (convData.answerText && typeof window !== "undefined" && "speechSynthesis" in window) {
          setIsAnsweringAudioPlaying(true);
          const utt = new SpeechSynthesisUtterance(convData.answerText);
          utt.lang = convData.language === "hi" ? "hi-IN" : "en-IN";
          utt.onend = () => setIsAnsweringAudioPlaying(false);
          window.speechSynthesis.speak(utt);
        }
      } catch (err) {
        console.warn("[voice-qa] Q&A processing failed:", err);
        setErrorMessage("Could not process voice question. Please try typing it.");
      } finally {
        setIsAnsweringQuestion(false);
      }
    },
    [isRecordingQuestion, languagePreference]
  );

  // Interactive Voice Q&A: Text input question fallback
  const askTextQuestion = useCallback(
    async (questionText: string, report: Partial<ParsedPalmReport>, hand: "left" | "right" | "unsure" = "unsure") => {
      if (!questionText.trim()) return;

      if (status === "speaking") {
        pauseVoice();
        setHasInterruptedNarration(true);
      }

      setIsAnsweringQuestion(true);
      setLastQuestion(questionText);

      try {
        const convRes = await fetch("/api/voice/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            report,
            question: questionText,
            hand,
            languagePreference,
          }),
        });

        if (!convRes.ok) throw new Error("Could not answer report question.");
        const convData = await convRes.json();
        setLastAnswer(convData.answerText);

        if (convData.audioBase64) {
          if (qaBlobUrlRef.current) URL.revokeObjectURL(qaBlobUrlRef.current);
          const binary = atob(convData.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const qaBlob = new Blob([bytes], { type: convData.contentType || "audio/mpeg" });
          const qaUrl = URL.createObjectURL(qaBlob);
          qaBlobUrlRef.current = qaUrl;

          if (!qaAudioRef.current) qaAudioRef.current = new Audio();
          qaAudioRef.current.src = qaUrl;
          setIsAnsweringAudioPlaying(true);
          qaAudioRef.current.onended = () => setIsAnsweringAudioPlaying(false);
          await qaAudioRef.current.play();
        } else if (convData.answerText && typeof window !== "undefined" && "speechSynthesis" in window) {
          setIsAnsweringAudioPlaying(true);
          const utt = new SpeechSynthesisUtterance(convData.answerText);
          utt.lang = convData.language === "hi" ? "hi-IN" : "en-IN";
          utt.onend = () => setIsAnsweringAudioPlaying(false);
          window.speechSynthesis.speak(utt);
        }
      } catch (err) {
        console.warn("[voice-qa] Text Q&A error:", err);
        setErrorMessage("Could not answer question right now.");
      } finally {
        setIsAnsweringQuestion(false);
      }
    },
    [languagePreference, pauseVoice, status]
  );

  // Resume original report narration after Q&A
  const resumeNarrationAfterQA = useCallback(() => {
    if (qaAudioRef.current) {
      qaAudioRef.current.pause();
    }
    setIsAnsweringAudioPlaying(false);
    setHasInterruptedNarration(false);
    resumeVoice();
  }, [resumeVoice]);

  // Reset voice state
  const resetVoice = useCallback(() => {
    stopVoice();
    cleanupAudioBlob();
    lastNarratedFingerprintRef.current = "";
    userStoppedRef.current = false;
    setScript("");
    setSections([]);
    setCurrentSectionIndex(0);
    setErrorMessage(null);
    setAudioProvider(null);
    setLastQuestion(null);
    setLastAnswer(null);
    setIsRecordingQuestion(false);
    setIsAnsweringQuestion(false);
    setStatus("idle");
  }, [cleanupAudioBlob, stopVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
      if (qaAudioRef.current) {
        try {
          qaAudioRef.current.pause();
        } catch {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      cleanupAudioBlob();
      if (qaBlobUrlRef.current) {
        try {
          URL.revokeObjectURL(qaBlobUrlRef.current);
        } catch {}
      }
    };
  }, [cleanupAudioBlob]);

  return {
    status,
    script,
    language,
    languagePreference,
    sections,
    currentSectionIndex,
    currentSection: sections[currentSectionIndex] || null,
    highlightedSection,
    errorMessage,
    audioProvider,
    playbackSpeed,
    // Actions
    primeAudio,
    autoNarrate,
    stopVoice,
    pauseVoice,
    resumeVoice,
    replaySection,
    nextSection,
    prevSection,
    setPlaybackSpeed,
    switchLanguage,
    resetVoice,
    // Interactive Voice Q&A
    isRecordingQuestion,
    isAnsweringQuestion,
    isAnsweringAudioPlaying,
    lastQuestion,
    lastAnswer,
    hasInterruptedNarration,
    startRecordingQuestion,
    stopRecordingAndAsk,
    askTextQuestion,
    resumeNarrationAfterQA,
  };
}
