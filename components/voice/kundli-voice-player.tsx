"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, Play, Pause, Square, RotateCcw, LoaderCircle } from "lucide-react";
import { extractKundliSections5And6, sanitizeTextForTTS } from "@/lib/voice/kundli-voice-parser";
import { speakUnified, stopAllSpeech, type ActiveSpeechHandle } from "@/lib/voice/unified-tts-client";

interface KundliVoicePlayerProps {
  content: string;
  language: "en" | "hi";
  messageId: string;
  autoPlay?: boolean;
}

// Global registry of played Kundli message narration IDs to prevent duplicate autoplays across re-renders
const playedKundliNarrationIds = new Set<string>();

export default function KundliVoicePlayer({
  content,
  language,
  messageId,
  autoPlay = false,
}: KundliVoicePlayerProps) {
  // Extract Section 5 and Section 6
  const rawSections = extractKundliSections5And6(content);
  const [playerState, setPlayerState] = useState<"idle" | "loading" | "playing" | "paused" | "completed">("idle");
  const speechHandleRef = useRef<ActiveSpeechHandle | null>(null);
  const isPlayingRef = useRef(false);
  const hasAutoPlayedRef = useRef(false);

  // Stop any active speech
  const handleStop = useCallback(() => {
    if (speechHandleRef.current) {
      speechHandleRef.current.stop();
      speechHandleRef.current = null;
    }
    stopAllSpeech();
    isPlayingRef.current = false;
    setPlayerState("idle");
  }, []);

  // Play or Resume narration
  const handlePlay = useCallback(async () => {
    if (!rawSections) return;

    if (playerState === "paused" && speechHandleRef.current) {
      try {
        await speechHandleRef.current.resume();
        isPlayingRef.current = true;
        setPlayerState("playing");
        return;
      } catch (e) {
        console.warn("[kundli-voice] Could not resume speech, restarting:", e);
      }
    }

    // Stop any existing speech before starting new narration
    stopAllSpeech();
    setPlayerState("loading");

    // Strictly sanitize ONLY Section 5 and Section 6 for audio synthesis:
    // Replaces robotic "Point 5 explain" / "Point 6 explain" with natural phrases:
    // - English: "Important points about your Kundli:" & "Practical guidance for your Kundli:"
    // - Hindi: "आपकी कुंडली के महत्वपूर्ण बिंदु:" & "आपकी कुंडली के लिए व्यावहारिक मार्गदर्शन:"
    const textToSpeak = sanitizeTextForTTS(rawSections, language);

    try {
      const handle = await speakUnified({
        text: textToSpeak,
        language,
        speed: 1.0,
        preferInstant: true, // Instant voice start (<50ms) with zero waiting!
        onStart: () => {
          isPlayingRef.current = true;
          setPlayerState("playing");
        },
        onPause: () => {
          isPlayingRef.current = false;
          setPlayerState("paused");
        },
        onResume: () => {
          isPlayingRef.current = true;
          setPlayerState("playing");
        },
        onEnd: () => {
          isPlayingRef.current = false;
          speechHandleRef.current = null;
          setPlayerState("completed");
        },
        onError: (err) => {
          console.error("[kundli-voice] Speech error:", err);
          isPlayingRef.current = false;
          speechHandleRef.current = null;
          setPlayerState("idle");
        },
      });

      speechHandleRef.current = handle;
    } catch (error) {
      console.warn("[kundli-voice] Playback could not start (possibly autoplay policy):", error);
      speechHandleRef.current = null;
      setPlayerState("idle");
    }
  }, [language, playerState, rawSections]);

  const handlePlayRef = useRef(handlePlay);
  handlePlayRef.current = handlePlay;

  // Pause narration
  const handlePause = useCallback(() => {
    if (speechHandleRef.current) {
      speechHandleRef.current.pause();
      isPlayingRef.current = false;
      setPlayerState("paused");
    } else {
      handleStop();
    }
  }, [handleStop]);

  // Automatic Voice Narration on Kundli Generation:
  // When a new Kundli response is generated, automatically start explaining Sections 5 & 6
  useEffect(() => {
    if (!autoPlay || !rawSections || hasAutoPlayedRef.current || playedKundliNarrationIds.has(messageId)) {
      return;
    }

    hasAutoPlayedRef.current = true;
    playedKundliNarrationIds.add(messageId);

    // Start auto voice virtually immediately once DOM mounts
    const timer = setTimeout(() => {
      void handlePlayRef.current();
    }, 120);

    return () => clearTimeout(timer);
  }, [autoPlay, messageId, rawSections]);

  // Auto-Cleanup 1: When user switches tabs or hides document
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlayingRef.current) {
        handleStop();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleStop]);

  // Auto-Cleanup 2: When user switches app language
  useEffect(() => {
    const handleLanguageChange = () => {
      handleStop();
    };
    window.addEventListener("vedic-language-change", handleLanguageChange);
    return () => {
      window.removeEventListener("vedic-language-change", handleLanguageChange);
    };
  }, [handleStop]);

  // Auto-Cleanup 3: When a new turn or query is initiated
  useEffect(() => {
    const handleStopVoiceEvent = () => {
      handleStop();
    };
    window.addEventListener("vedic-stop-voice", handleStopVoiceEvent);
    return () => {
      window.removeEventListener("vedic-stop-voice", handleStopVoiceEvent);
    };
  }, [handleStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (speechHandleRef.current) {
        speechHandleRef.current.stop();
        speechHandleRef.current = null;
      }
    };
  }, []);

  // If this message does not contain Section 5 & 6, do not render speaker control
  if (!rawSections) {
    return null;
  }

  const isHindi = language === "hi";

  return (
    <div
      className="kundli-voice-pill-container inline-flex items-center"
      data-testid="kundli-voice-player"
      data-message-id={messageId}
      role="region"
      aria-label={isHindi ? "कुंडली मुख्य बिंदु और व्यावहारिक मार्गदर्शन वाचन" : "Kundli Important Points & Guidance Voice Narration"}
    >
      {playerState === "loading" ? (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 animate-pulse backdrop-blur-md"
          aria-label={isHindi ? "ऑडियो तैयार हो रहा है…" : "Preparing voice…"}
        >
          <LoaderCircle size={12} className="animate-spin text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline">{isHindi ? "वाचन तैयार हो रहा है…" : "Loading voice…"}</span>
          <span className="sm:hidden">{isHindi ? "तैयारी…" : "Loading…"}</span>
        </span>
      ) : playerState === "playing" ? (
        <div
          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200 shadow-[0_0_12px_rgba(212,163,60,0.18)] backdrop-blur-md transition-all animate-pulse"
        >
          {/* Animated soundwave bars */}
          <div className="flex items-center gap-0.5">
            <Volume2 size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="flex items-end gap-0.5 ml-1 h-3">
              <span className="w-0.5 h-2 bg-amber-600 dark:bg-amber-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite]" />
              <span className="w-0.5 h-3 bg-amber-600 dark:bg-amber-400 rounded-full animate-[pulse_0.35s_ease-in-out_infinite]" />
              <span className="w-0.5 h-1.5 bg-amber-600 dark:bg-amber-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
            </span>
          </div>

          <span className="truncate max-w-[120px] sm:max-w-none text-xs">
            {isHindi ? "महत्वपूर्ण बिंदु वाचन" : "Speaking Important Points"}
          </span>

          <div className="flex items-center gap-1 border-l border-amber-600/30 dark:border-amber-400/30 pl-1.5">
            <button
              type="button"
              onClick={handlePause}
              className="p-1 rounded-full hover:bg-amber-600/20 dark:hover:bg-amber-400/20 text-amber-800 dark:text-amber-200 transition-colors cursor-pointer"
              title={isHindi ? "वाचन रोकें" : "Pause narration"}
              aria-label={isHindi ? "वाचन रोकें" : "Pause narration"}
            >
              <Pause size={11} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={handleStop}
              className="p-1 rounded-full hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
              title={isHindi ? "वाचन बंद करें" : "Stop narration"}
              aria-label={isHindi ? "वाचन बंद करें" : "Stop narration"}
            >
              <Square size={10} fill="currentColor" />
            </button>
          </div>
        </div>
      ) : playerState === "paused" ? (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 backdrop-blur-md transition-all"
        >
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            <Pause size={11} />
            <span>{isHindi ? "रुका हुआ" : "Paused"}</span>
          </span>

          <div className="flex items-center gap-1 border-l border-amber-600/30 dark:border-amber-400/30 pl-1.5">
            <button
              type="button"
              onClick={handlePlay}
              className="p-1 rounded-full hover:bg-amber-600/20 dark:hover:bg-amber-400/20 text-amber-800 dark:text-amber-200 transition-colors cursor-pointer"
              title={isHindi ? "वाचन जारी रखें" : "Resume narration"}
              aria-label={isHindi ? "वाचन जारी रखें" : "Resume narration"}
            >
              <Play size={11} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={handleStop}
              className="p-1 rounded-full hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
              title={isHindi ? "वाचन बंद करें" : "Stop narration"}
              aria-label={isHindi ? "वाचन बंद करें" : "Stop narration"}
            >
              <Square size={10} fill="currentColor" />
            </button>
          </div>
        </div>
      ) : playerState === "completed" ? (
        <button
          type="button"
          onClick={handlePlay}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 backdrop-blur-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          title={isHindi ? "महत्वपूर्ण बिंदु पुनः सुनें" : "Replay Important Points"}
          aria-label={isHindi ? "महत्वपूर्ण बिंदु पुनः सुनें" : "Replay Important Points"}
        >
          <RotateCcw size={11} className="text-amber-600 dark:text-amber-400" />
          <span>{isHindi ? "पुनः सुनें" : "Replay Points"}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handlePlay}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 backdrop-blur-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          title={isHindi ? "आपकी कुंडली के महत्वपूर्ण बिंदु सुनें" : "Listen to Important Points About Your Kundli"}
          aria-label={isHindi ? "आपकी कुंडली के महत्वपूर्ण बिंदु सुनें" : "Listen to Important Points About Your Kundli"}
        >
          <Volume2 size={12} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{isHindi ? "महत्वपूर्ण बिंदु सुनें" : "Listen Important Points"}</span>
        </button>
      )}
    </div>
  );
}
