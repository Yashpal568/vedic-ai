"use client";

import React, { useState } from "react";
import {
  Volume2,
  VolumeX,
  Square,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Loader2,
  Globe,
} from "lucide-react";
import type { VoiceStatus } from "@/hooks/use-palm-voice-narrator";
import type { NarrationLanguage } from "@/lib/palm-narration-service";
import type { ParsedPalmReport } from "@/lib/palm-parser";

interface PalmVoiceAssistantProps {
  status: VoiceStatus;
  script: string;
  language: NarrationLanguage;
  errorMessage?: string | null;
  report?: ParsedPalmReport | null;
  hand?: "left" | "right" | "unsure";
  onStopVoice: () => void;
  onResumeOrReplay: () => void;
  onSwitchLanguage: (
    lang: NarrationLanguage,
    report?: ParsedPalmReport | null,
    hand?: "left" | "right" | "unsure"
  ) => void;
  className?: string;
}

export default function PalmVoiceAssistant({
  status,
  script,
  language,
  errorMessage,
  report,
  hand = "unsure",
  onStopVoice,
  onResumeOrReplay,
  onSwitchLanguage,
  className = "",
}: PalmVoiceAssistantProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  // If completely idle with no script and no error, don't take up space
  if (status === "idle" && !script) {
    return null;
  }

  const isSpeaking = status === "speaking";
  const isPreparing = status === "preparing";
  const isBlocked = status === "blocked";
  const isStopped = status === "stopped";
  const isError = status === "error";

  const statusLabel = isPreparing
    ? "Preparing voice explanation..."
    : isSpeaking
    ? "Voice Active"
    : isBlocked
    ? "Autoplay Blocked by Browser"
    : isStopped
    ? "Voice explanation stopped"
    : isError
    ? "Voice Unavailable"
    : "Ready";

  return (
    <section
      aria-label="Vedic AI Spoken Voice Assistant"
      className={`relative w-full rounded-2xl border border-[var(--gold)]/35 bg-[#FAF7F0] dark:bg-[#151720] shadow-xl overflow-hidden transition-all duration-300 p-3.5 sm:p-4 my-4 ${className}`}
      data-purpose="palm-voice-assistant"
    >
      {/* Background ambient cosmic glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(212,183,122,0.12)_0%,transparent_70%)]" />

      {/* Header bar: Title, badge, and Language selector */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              isSpeaking
                ? "bg-[var(--gold)] text-[#11131A] border-white shadow-md animate-pulse"
                : "bg-[var(--panel)] text-[var(--gold)] border-[var(--gold)]/30"
            }`}
          >
            {isSpeaking ? (
              <Volume2 className="w-4 h-4 animate-bounce" />
            ) : isPreparing ? (
              <Loader2 className="w-4 h-4 animate-spin text-[var(--gold)]" />
            ) : (
              <Sparkles className="w-4 h-4 text-[var(--gold)]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-[var(--gold)] font-serif-luxury">
                Vedic AI Voice Assistant
              </h3>
              {/* Dynamic status pill */}
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${
                  isSpeaking
                    ? "bg-[#52FEB8]/10 text-[#52FEB8] border-[#52FEB8]/30"
                    : isPreparing
                    ? "bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/30"
                    : isBlocked
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : isStopped
                    ? "bg-[var(--line)] text-[var(--muted)] border-[var(--line)]"
                    : "bg-red-500/10 text-red-400 border-red-500/30"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSpeaking
                      ? "bg-[#52FEB8] animate-ping"
                      : isPreparing
                      ? "bg-[var(--gold)] animate-pulse"
                      : isBlocked
                      ? "bg-amber-400"
                      : isStopped
                      ? "bg-[var(--muted)]"
                      : "bg-red-400"
                  }`}
                />
                <span>{statusLabel}</span>
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              Spoken Hastarekha Vedic report explanation
            </p>
          </div>
        </div>

        {/* Language switcher pills */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-[var(--wash)] p-1 rounded-xl border border-[var(--line)]">
          <Globe className="w-3 h-3 text-[var(--quiet)] ml-1 mr-0.5 shrink-0" />
          <button
            type="button"
            onClick={() => onSwitchLanguage("en", report, hand)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
              language === "en"
                ? "bg-[var(--gold)] text-[#11131A] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => onSwitchLanguage("hi", report, hand)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
              language === "hi"
                ? "bg-[var(--gold)] text-[#11131A] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            हिन्दी
          </button>
          <button
            type="button"
            onClick={() => onSwitchLanguage("hinglish", report, hand)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
              language === "hinglish"
                ? "bg-[var(--gold)] text-[#11131A] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            Hinglish
          </button>
        </div>
      </div>

      {/* Main interactive state section */}
      <div className="relative z-10 pt-3 flex flex-col gap-3">
        {/* State A: Speaking (Live Audio Waveform + Primary Stop Voice Button) */}
        {isSpeaking && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-[var(--panel)]/90 border border-[var(--gold)]/30">
            <div className="flex items-center gap-3">
              {/* Animated audio waveform bars */}
              <div
                className="flex items-center gap-1 h-6 px-1.5"
                aria-label="Playing audio waveform"
              >
                <span className="w-1 bg-[var(--gold)] rounded-full animate-[wave_1.1s_ease-in-out_infinite_0ms] h-3" />
                <span className="w-1 bg-[var(--gold)] rounded-full animate-[wave_0.9s_ease-in-out_infinite_150ms] h-5" />
                <span className="w-1 bg-[var(--gold)] rounded-full animate-[wave_1.3s_ease-in-out_infinite_300ms] h-6" />
                <span className="w-1 bg-[var(--gold)] rounded-full animate-[wave_1.0s_ease-in-out_infinite_450ms] h-4" />
                <span className="w-1 bg-[var(--gold)] rounded-full animate-[wave_1.2s_ease-in-out_infinite_200ms] h-5" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-[var(--text)]">
                  Explaining your Hastarekha findings...
                </span>
                <span className="block text-[11px] text-[var(--muted)]">
                  Listen to the voice summary of your palm report
                </span>
              </div>
            </div>

            {/* Primary Visible Voice Control: STOP VOICE */}
            <button
              type="button"
              onClick={onStopVoice}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shadow-md border border-rose-500/50"
              aria-label="Stop Voice Explanation"
              title="Stop voice playback"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Voice</span>
            </button>
          </div>
        )}

        {/* State B: Preparing in background */}
        {isPreparing && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--panel)]/70 border border-[var(--gold)]/20">
            <div className="flex items-center gap-2.5 text-xs text-[var(--muted)]">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--gold)] shrink-0" />
              <span>
                Composing spoken Jyotish report and synthesizing voice...
              </span>
            </div>
            <button
              type="button"
              onClick={onStopVoice}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-white border border-[var(--line)] hover:border-rose-500 hover:bg-rose-600/20 transition-all cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        )}

        {/* State C: Browser Autoplay Blocked (Fallback Tap to Start button) */}
        {isBlocked && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2.5 text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Your browser paused audio autoplay. Tap below to begin voice
                explanation with sound.
              </span>
            </div>
            <button
              type="button"
              onClick={onResumeOrReplay}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide text-[#11131A] bg-[var(--gold)] hover:bg-[#e6c469] active:scale-95 transition-all cursor-pointer shadow-md border border-[var(--gold)] animate-pulse"
              aria-label="Tap to start voice explanation"
            >
              <Volume2 className="w-4 h-4" />
              <span>Tap to start voice explanation</span>
            </button>
          </div>
        )}

        {/* State D: Voice Stopped (Option to Replay Explanation) */}
        {isStopped && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-3 rounded-xl bg-[var(--panel)]/60 border border-[var(--line)]">
            <span className="text-xs text-[var(--muted)]">
              Voice explanation stopped. You can replay anytime.
            </span>
            <button
              type="button"
              onClick={onResumeOrReplay}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--gold)] bg-[var(--panel)] hover:bg-[var(--gold)]/15 border border-[var(--gold)]/40 hover:border-[var(--gold)] active:scale-95 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
              aria-label="Replay Voice Explanation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay Explanation</span>
            </button>
          </div>
        )}

        {/* State E: Error Fallback */}
        {isError && (
          <div className="flex items-center justify-between gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            <span className="truncate">
              {errorMessage || "Voice explanation could not be loaded."}
            </span>
            <button
              type="button"
              onClick={onResumeOrReplay}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-rose-200 border border-rose-400/40 hover:bg-rose-500/20 shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* Collapsible Spoken Transcript Reader */}
        {script && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--gold)] hover:underline cursor-pointer"
              aria-expanded={showTranscript}
            >
              <FileText className="w-3 h-3" />
              <span>
                {showTranscript
                  ? "Hide spoken transcript"
                  : "View spoken transcript"}
              </span>
              {showTranscript ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {showTranscript && (
              <div className="mt-2 p-3 rounded-xl bg-[var(--wash)] border border-[var(--line)] text-xs text-[var(--text)] leading-relaxed font-sans max-h-48 overflow-y-auto">
                <p className="italic text-[var(--muted)] mb-1 text-[10px] uppercase tracking-wider font-semibold">
                  Spoken Script ({language.toUpperCase()}):
                </p>
                <p className="whitespace-pre-line">{script}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

