"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, Play, Pause, Square, RotateCcw, LoaderCircle } from "lucide-react";
import { extractKundliSections5And6, sanitizeTextForTTS } from "@/lib/voice/kundli-voice-parser";
import { speakUnified, stopAllSpeech, type ActiveSpeechHandle } from "@/lib/voice/unified-tts-client";

interface KundliVoicePlayerProps {
  content: string;
  language: "en" | "hi";
  messageId: string;
}

export default function KundliVoicePlayer({
  content,
  language,
  messageId,
}: KundliVoicePlayerProps) {
  // Extract Section 5 and Section 6
  const rawSections = extractKundliSections5And6(content);
  const [playerState, setPlayerState] = useState<"idle" | "loading" | "playing" | "paused" | "completed">("idle");
  const speechHandleRef = useRef<ActiveSpeechHandle | null>(null);
  const isPlayingRef = useRef(false);

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

  // Play or Resume
  const handlePlay = useCallback(async () => {
    if (!rawSections) return;

    if (playerState === "paused" && speechHandleRef.current) {
      try {
        await speechHandleRef.current.resume();
        isPlayingRef.current = true;
        setPlayerState("playing");
        return;
      } catch (e) {
        console.warn("[kundli-voice] Could not resume, restarting:", e);
      }
    }

    // Stop any existing speech before starting new
    stopAllSpeech();
    setPlayerState("loading");

    // Strictly sanitize ONLY Section 5 and Section 6 for audio synthesis
    const textToSpeak = sanitizeTextForTTS(rawSections, language);

    try {
      const handle = await speakUnified({
        text: textToSpeak,
        language,
        speed: 1.0,
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
      console.error("[kundli-voice] Failed to play:", error);
      speechHandleRef.current = null;
      setPlayerState("idle");
    }
  }, [language, playerState, rawSections]);

  // Pause
  const handlePause = useCallback(() => {
    if (speechHandleRef.current) {
      speechHandleRef.current.pause();
      isPlayingRef.current = false;
      setPlayerState("paused");
    } else {
      handleStop();
    }
  }, [handleStop]);

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
      handleStop();
    };
  }, [handleStop, language]);

  // Auto-Cleanup 3: When a new Kundli report is generated or stop requested
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

  // If this message does not contain Section 5 & 6, do not render player
  if (!rawSections) {
    return null;
  }

  const isHindi = language === "hi";

  return (
    <div
      className="kundli-voice-player mb-4 p-3 rounded-xl border border-[var(--gold)]/30 bg-[var(--wash)] shadow-sm transition-all duration-300"
      data-testid="kundli-voice-player"
      data-message-id={messageId}
      role="region"
      aria-label={isHindi ? "कुंडली मुख्य बिंदु और मार्गदर्शन वाक् वाचन" : "Kundli Key Points & Guidance Voice Narration"}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              playerState === "playing"
                ? "bg-[var(--gold)] text-black animate-pulse shadow-md shadow-[var(--gold)]/20"
                : "bg-[var(--gold)]/15 text-[var(--gold)]"
            }`}
          >
            {playerState === "playing" ? (
              <Volume2 size={16} className="animate-bounce" />
            ) : (
              <Volume2 size={16} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] font-sans">
                {isHindi ? "ऑडियो वाचन · महत्वपूर्ण बिंदु" : "VOICE NARRATION · IMPORTANT POINTS"}
              </span>
              {playerState === "playing" && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 animate-pulse">
                  {isHindi ? "बोल रहा है…" : "Speaking…"}
                </span>
              )}
              {playerState === "paused" && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400">
                  {isHindi ? "रोका गया" : "Paused"}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text)] font-medium truncate mt-0.5">
              {isHindi
                ? "आपकी कुंडली के महत्वपूर्ण बिंदु व मार्गदर्शन सुनें"
                : "Listen to Important Points About Your Kundli"}
            </p>
          </div>
        </div>

        {/* Playback Controls (Play / Pause / Stop / Replay) */}
        <div className="flex items-center gap-1.5 ml-auto">
          {playerState === "loading" ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--gold)]/20 text-[var(--gold)] cursor-not-allowed opacity-80"
              aria-label="Loading voice"
            >
              <LoaderCircle size={13} className="animate-spin" />
              <span>{isHindi ? "तैयार हो रहा है…" : "Loading…"}</span>
            </button>
          ) : playerState === "playing" ? (
            <>
              <button
                type="button"
                onClick={handlePause}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90 transition-all shadow-sm"
                aria-label={isHindi ? "वाचन रोकें" : "Pause narration"}
              >
                <Pause size={13} />
                <span>{isHindi ? "रोकें" : "Pause"}</span>
              </button>
              <button
                type="button"
                onClick={handleStop}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                title={isHindi ? "वाचन बंद करें" : "Stop narration"}
                aria-label={isHindi ? "वाचन बंद करें" : "Stop narration"}
              >
                <Square size={13} />
                <span>{isHindi ? "बंद करें" : "Stop"}</span>
              </button>
            </>
          ) : playerState === "paused" ? (
            <>
              <button
                type="button"
                onClick={handlePlay}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90 transition-all shadow-sm"
                aria-label={isHindi ? "वाचन पुनः शुरू करें" : "Resume narration"}
              >
                <Play size={13} />
                <span>{isHindi ? "जारी रखें" : "Resume"}</span>
              </button>
              <button
                type="button"
                onClick={handleStop}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                title={isHindi ? "वाचन बंद करें" : "Stop narration"}
                aria-label={isHindi ? "वाचन बंद करें" : "Stop narration"}
              >
                <Square size={13} />
                <span>{isHindi ? "बंद करें" : "Stop"}</span>
              </button>
            </>
          ) : playerState === "completed" ? (
            <button
              type="button"
              onClick={handlePlay}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90 transition-all shadow-sm"
              aria-label={isHindi ? "पुनः सुनें" : "Replay narration"}
            >
              <RotateCcw size={13} />
              <span>{isHindi ? "पुनः सुनें" : "Replay"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlay}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              aria-label={isHindi ? "खंड 5 और 6 सुनें" : "Listen to Sections 5 & 6"}
            >
              <Play size={13} fill="currentColor" />
              <span>{isHindi ? "सुनें (खंड 5 और 6)" : "Listen to Sec 5 & 6"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
