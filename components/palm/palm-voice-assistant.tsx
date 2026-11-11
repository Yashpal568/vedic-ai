"use client";

import React, { useState } from "react";
import {
  Volume2,
  VolumeX,
  Square,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Loader2,
  Globe,
  Mic,
  MicOff,
  Send,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import type { VoiceStatus, PlaybackSpeed } from "@/hooks/use-palm-voice-narrator";
import type { VoiceLanguage } from "@/lib/voice/language-service";
import type { ParsedPalmReport } from "@/lib/palm-parser";
import type { NarrationSection } from "@/lib/voice/narration-generator";
import { useLanguage } from "@/lib/i18n/language-context";

interface PalmVoiceAssistantProps {
  status: VoiceStatus;
  script: string;
  language: VoiceLanguage;
  sections: NarrationSection[];
  currentSectionIndex: number;
  currentSection: NarrationSection | null;
  playbackSpeed: PlaybackSpeed;
  errorMessage?: string | null;
  report?: Partial<ParsedPalmReport> | null;
  hand?: "left" | "right" | "unsure";
  // Playback actions
  onStopVoice: () => void;
  onPauseVoice: () => void;
  onResumeVoice: () => void;
  onReplaySection: () => void;
  onNextSection: () => void;
  onPrevSection: () => void;
  onSetPlaybackSpeed: (speed: PlaybackSpeed) => void;
  onSwitchLanguage: (
    lang: VoiceLanguage,
    report?: Partial<ParsedPalmReport> | null,
    hand?: "left" | "right" | "unsure"
  ) => void;
  // Voice Q&A actions
  isRecordingQuestion: boolean;
  isAnsweringQuestion: boolean;
  isAnsweringAudioPlaying: boolean;
  lastQuestion: string | null;
  lastAnswer: string | null;
  hasInterruptedNarration: boolean;
  onStartRecordingQuestion: () => void;
  onStopRecordingQuestion: (report: Partial<ParsedPalmReport>, hand: "left" | "right" | "unsure") => void;
  onAskTextQuestion: (text: string, report: Partial<ParsedPalmReport>, hand: "left" | "right" | "unsure") => void;
  onResumeNarrationAfterQA: () => void;
  className?: string;
}

const QUICK_QUESTIONS = [
  "Explain my life line in simple language",
  "Meri heart line ka kya meaning hai?",
  "What does my fate line reveal about my career?",
  "What do my planetary mounts indicate?",
];

export default function PalmVoiceAssistant({
  status,
  script,
  language,
  sections,
  currentSectionIndex,
  currentSection,
  playbackSpeed,
  errorMessage,
  report,
  hand = "unsure",
  onStopVoice,
  onPauseVoice,
  onResumeVoice,
  onReplaySection,
  onNextSection,
  onPrevSection,
  onSetPlaybackSpeed,
  onSwitchLanguage,
  isRecordingQuestion,
  isAnsweringQuestion,
  isAnsweringAudioPlaying,
  lastQuestion,
  lastAnswer,
  hasInterruptedNarration,
  onStartRecordingQuestion,
  onStopRecordingQuestion,
  onAskTextQuestion,
  onResumeNarrationAfterQA,
  className = "",
}: PalmVoiceAssistantProps) {
  const { t } = useLanguage();
  const [showTranscript, setShowTranscript] = useState(false);
  const [showQAPanel, setShowQAPanel] = useState(false);
  const [textQuestion, setTextQuestion] = useState("");

  if (status === "idle" && !script && !lastQuestion) {
    return null;
  }

  const isSpeaking = status === "speaking";
  const isPaused = status === "paused";
  const isPreparing = status === "preparing";
  const isBlocked = status === "blocked";
  const isStopped = status === "stopped";
  const isCompleted = status === "completed";
  const isError = status === "error";

  const totalSections = sections.length || 1;
  const progressPercent = Math.min(100, Math.round(((currentSectionIndex + 1) / totalSections) * 100));

  const statusLabel = isPreparing
    ? "Preparing voice explanation..."
    : isSpeaking
    ? "Voice Active"
    : isPaused
    ? "Voice Paused"
    : isBlocked
    ? "Autoplay Blocked by Browser"
    : isStopped
    ? "Voice explanation stopped"
    : isCompleted
    ? "Narration Complete"
    : isError
    ? "Voice Unavailable"
    : "Ready";

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textQuestion.trim() || !report) return;
    onAskTextQuestion(textQuestion.trim(), report, hand);
    setTextQuestion("");
  };

  return (
    <section
      aria-label="Vedic AI Spoken Voice Assistant"
      className={`relative w-full rounded-2xl border border-[var(--gold)]/35 bg-[#FAF7F0] dark:bg-[#151720] shadow-xl overflow-hidden transition-all duration-300 p-3.5 sm:p-5 my-4 ${className}`}
      data-purpose="palm-voice-assistant"
    >
      {/* Background ambient cosmic glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(212,183,122,0.14)_0%,transparent_75%)]" />

      {/* Top Header Bar: Title, Status Badge, Language Switcher */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              isSpeaking
                ? "bg-[var(--gold)] text-[#11131A] border-white shadow-md animate-pulse"
                : "bg-[var(--panel)] text-[var(--gold)] border-[var(--gold)]/30"
            }`}
          >
            {isSpeaking ? (
              <Volume2 className="w-5 h-5 animate-bounce" />
            ) : isPreparing ? (
              <Loader2 className="w-5 h-5 animate-spin text-[var(--gold)]" />
            ) : (
              <Sparkles className="w-5 h-5 text-[var(--gold)]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
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
                    : isStopped || isCompleted
                    ? "bg-[var(--line)] text-[var(--muted)] border-[var(--line)]"
                    : isPaused
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
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
                      : isPaused
                      ? "bg-sky-400"
                      : isStopped || isCompleted
                      ? "bg-[var(--muted)]"
                      : "bg-red-400"
                  }`}
                />
                <span>{statusLabel}</span>
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              Natural conversational Jyotish audio explanation & interactive voice Q&A
            </p>
          </div>
        </div>

        {/* Right Header Actions: Language Switcher & Speed selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Speed Selector */}
          <div className="flex items-center bg-[var(--wash)] px-1 py-0.5 rounded-lg border border-[var(--line)] text-[10px] font-semibold text-[var(--muted)]">
            <span className="px-1 text-[9px] uppercase tracking-wider text-[var(--quiet)]">Speed:</span>
            {([0.75, 1.0, 1.25, 1.5] as PlaybackSpeed[]).map((spd) => (
              <button
                key={`speed-${spd}`}
                type="button"
                onClick={() => onSetPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  playbackSpeed === spd
                    ? "bg-[var(--gold)] text-[#11131A] font-bold shadow-2xs"
                    : "hover:text-[var(--text)]"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Language switcher pills */}
          <div className="flex items-center gap-1 bg-[var(--wash)] p-1 rounded-xl border border-[var(--line)]">
            <Globe className="w-3 h-3 text-[var(--quiet)] ml-1 mr-0.5 shrink-0" />
            {(["en", "hi", "hinglish"] as VoiceLanguage[]).map((lang) => (
              <button
                key={`lang-${lang}`}
                type="button"
                onClick={() => onSwitchLanguage(lang, report, hand)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                  language === lang
                    ? "bg-[var(--gold)] text-[#11131A] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {lang === "en" ? "English" : lang === "hi" ? "हिन्दी" : "Hinglish"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Controls & Section Info */}
      <div className="relative z-10 pt-3 flex flex-col gap-3">
        {/* Section Scrubber & Progress Bar */}
        {sections.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span className="font-medium text-[var(--gold)]">
                Section {currentSectionIndex + 1} of {totalSections}:{" "}
                <strong className="text-[var(--text)]">{currentSection?.sectionTitle || "Overview"}</strong>
              </span>
              <span className="text-[10px] text-[var(--quiet)]">{progressPercent}%</span>
            </div>
            {/* Horizontal Progress Track */}
            <div className="w-full h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--gold)] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* State A: Speaking / Paused Main Control Panel */}
        {(isSpeaking || isPaused) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-[var(--panel)]/90 border border-[var(--gold)]/30 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Waveform Animation */}
              <div
                className="flex items-center gap-1 h-6 px-1.5 shrink-0"
                aria-label="Playing audio waveform"
              >
                <span className={`w-1 bg-[var(--gold)] rounded-full ${isSpeaking ? "animate-[wave_1.1s_ease-in-out_infinite_0ms]" : "opacity-40"} h-3`} />
                <span className={`w-1 bg-[var(--gold)] rounded-full ${isSpeaking ? "animate-[wave_0.9s_ease-in-out_infinite_150ms]" : "opacity-40"} h-5`} />
                <span className={`w-1 bg-[var(--gold)] rounded-full ${isSpeaking ? "animate-[wave_1.3s_ease-in-out_infinite_300ms]" : "opacity-40"} h-6`} />
                <span className={`w-1 bg-[var(--gold)] rounded-full ${isSpeaking ? "animate-[wave_1.0s_ease-in-out_infinite_450ms]" : "opacity-40"} h-4`} />
                <span className={`w-1 bg-[var(--gold)] rounded-full ${isSpeaking ? "animate-[wave_1.2s_ease-in-out_infinite_200ms]" : "opacity-40"} h-5`} />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-[var(--text)] block truncate max-w-sm">
                  {currentSection?.sectionText || "Explaining your Hastarekha findings..."}
                </span>
                <span className="text-[11px] text-[var(--muted)]">
                  {isPaused ? "Paused — tap resume to continue" : "Synchronizing highlighted report findings with speech"}
                </span>
              </div>
            </div>

            {/* Playback Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {/* Previous Section */}
              <button
                type="button"
                onClick={onPrevSection}
                disabled={currentSectionIndex === 0}
                className="p-1.5 rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--gold)] disabled:opacity-30 cursor-pointer transition-all"
                title="Previous section"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              {/* Pause / Resume */}
              {isSpeaking ? (
                <button
                  type="button"
                  onClick={onPauseVoice}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--panel)] text-[var(--gold)] hover:bg-[var(--gold)]/10 border border-[var(--gold)]/40 text-xs font-semibold cursor-pointer transition-all shadow-xs"
                  title="Pause voice"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onResumeVoice}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--gold)] text-[#11131A] hover:bg-[#e6c469] text-xs font-bold cursor-pointer transition-all shadow-md"
                  title="Resume voice"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </button>
              )}

              {/* Replay Section */}
              <button
                type="button"
                onClick={onReplaySection}
                className="p-1.5 rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--gold)] cursor-pointer transition-all"
                title="Replay this section"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Next Section */}
              <button
                type="button"
                onClick={onNextSection}
                disabled={currentSectionIndex >= totalSections - 1}
                className="p-1.5 rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--gold)] disabled:opacity-30 cursor-pointer transition-all"
                title="Next section"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              {/* STOP VOICE (Primary Emergency Halt) */}
              <button
                type="button"
                onClick={onStopVoice}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shadow-md border border-rose-500/50"
                title="Stop voice explanation immediately"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>{t("voice.stopVoice")}</span>
              </button>
            </div>
          </div>
        )}

        {/* State B: Preparing in Background */}
        {isPreparing && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--panel)]/70 border border-[var(--gold)]/20">
            <div className="flex items-center gap-2.5 text-xs text-[var(--muted)]">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--gold)] shrink-0" />
              <span>Composing structured spoken script and synthesizing voice with ElevenLabs...</span>
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

        {/* State C: Browser Autoplay Blocked Fallback */}
        {isBlocked && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2.5 text-xs text-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <strong className="block text-amber-300 font-semibold">Your report is ready!</strong>
                <span>Browser autoplay policy paused audio. Tap below to begin the voice explanation with sound.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onResumeVoice}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide text-[#11131A] bg-[var(--gold)] hover:bg-[#e6c469] active:scale-95 transition-all cursor-pointer shadow-lg border border-[var(--gold)] animate-pulse shrink-0"
              aria-label="Tap to start voice explanation"
            >
              <Volume2 className="w-4 h-4" />
              <span>Tap to start voice explanation</span>
            </button>
          </div>
        )}

        {/* State D: Voice Stopped or Completed */}
        {(isStopped || isCompleted) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-3.5 rounded-xl bg-[var(--panel)]/60 border border-[var(--line)]">
            <span className="text-xs text-[var(--muted)]">
              {isCompleted ? "Voice explanation complete. You can replay anytime or ask questions." : "Voice explanation stopped. You can resume or replay anytime."}
            </span>
            <button
              type="button"
              onClick={onResumeVoice}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-[var(--gold)] bg-[var(--panel)] hover:bg-[var(--gold)]/15 border border-[var(--gold)]/40 hover:border-[var(--gold)] active:scale-95 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay Explanation</span>
            </button>
          </div>
        )}

        {/* State E: Error Fallback */}
        {isError && (
          <div className="flex items-center justify-between gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            <span className="truncate">{errorMessage || "Voice explanation could not be loaded."}</span>
            <button
              type="button"
              onClick={onResumeVoice}
              className="inline-flex items-center gap-1 px-3 py-1 rounded text-[11px] font-semibold text-rose-200 border border-rose-400/40 hover:bg-rose-500/20 shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Interactive Voice Q&A Accordion Panel */}
        <div className="border-t border-[var(--line)] pt-3 mt-1">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowQAPanel((v) => !v)}
              className="inline-flex items-center gap-2 text-xs font-bold text-[var(--gold)] hover:underline cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ask Astrologer a Question (Voice or Text)</span>
              {showQAPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {hasInterruptedNarration && (
              <button
                type="button"
                onClick={onResumeNarrationAfterQA}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#52FEB8] hover:underline cursor-pointer"
              >
                <span>Resume Report Narration</span>
              </button>
            )}
          </div>

          {showQAPanel && (
            <div className="mt-3 p-3.5 rounded-xl bg-[var(--wash)] border border-[var(--line)] flex flex-col gap-3">
              {/* Voice Microphone Record Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
                <div className="text-xs">
                  <span className="font-semibold text-[var(--text)] block">
                    {isRecordingQuestion
                      ? "Listening to your voice... Speak your question now"
                      : isAnsweringQuestion
                      ? "Astrologer is interpreting your palm report..."
                      : "Tap mic and speak your question about any line or mount"}
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    Supports Hindi, English, and Hinglish
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isRecordingQuestion ? (
                    <button
                      type="button"
                      onClick={() => report && onStopRecordingQuestion(report, hand)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 animate-pulse cursor-pointer shadow-md"
                    >
                      <MicOff className="w-4 h-4" />
                      <span>Done Speaking</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onStartRecordingQuestion}
                      disabled={isAnsweringQuestion}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#11131A] bg-[var(--gold)] hover:bg-[#e6c469] disabled:opacity-40 cursor-pointer shadow-md transition-all active:scale-95"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Ask via Voice</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick sample question chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase font-semibold text-[var(--quiet)] mr-1">Suggested:</span>
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={`quick-${idx}`}
                    type="button"
                    onClick={() => report && onAskTextQuestion(q, report, hand)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--raised)] hover:bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--gold)]/60 text-[var(--muted)] hover:text-[var(--text)] transition-all cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Text Input Fallback */}
              <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={textQuestion}
                  onChange={(e) => setTextQuestion(e.target.value)}
                  placeholder="Or type your question here (e.g. Why is my fate line faint?)..."
                  className="flex-1 text-xs px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:border-[var(--gold)] text-[var(--text)] outline-none"
                />
                <button
                  type="submit"
                  disabled={!textQuestion.trim() || isAnsweringQuestion}
                  className="px-3 py-2 rounded-lg bg-[var(--gold)] text-[#11131A] disabled:opacity-40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask</span>
                </button>
              </form>

              {/* Astrologer Response Card */}
              {(lastQuestion || isAnsweringQuestion) && (
                <div className="p-3 rounded-lg bg-[var(--panel)] border border-[var(--gold)]/30 mt-1">
                  {lastQuestion && (
                    <div className="text-xs text-[var(--gold)] font-medium mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>You asked: &quot;{lastQuestion}&quot;</span>
                    </div>
                  )}

                  {isAnsweringQuestion ? (
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] py-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--gold)]" />
                      <span>Formulating grounded answer from your palm report...</span>
                    </div>
                  ) : lastAnswer ? (
                    <div className="text-xs text-[var(--text)] leading-relaxed mt-1">
                      <p>{lastAnswer}</p>
                      {isAnsweringAudioPlaying && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#52FEB8] font-semibold mt-1">
                          <Volume2 className="w-3 h-3 animate-pulse" />
                          <span>Speaking answer aloud</span>
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Spoken Transcript Viewer */}
        {script && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--gold)] hover:underline cursor-pointer"
              aria-expanded={showTranscript}
            >
              <FileText className="w-3 h-3" />
              <span>{showTranscript ? "Hide spoken script" : "View complete spoken script"}</span>
              {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showTranscript && (
              <div className="mt-2 p-3.5 rounded-xl bg-[var(--wash)] border border-[var(--line)] text-xs text-[var(--text)] leading-relaxed font-sans max-h-52 overflow-y-auto">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[var(--line)]">
                  <span className="italic text-[var(--muted)] text-[10px] uppercase tracking-wider font-semibold">
                    Spoken Script ({language.toUpperCase()}):
                  </span>
                  <span className="text-[10px] text-[var(--quiet)]">{sections.length} synchronized sections</span>
                </div>
                <div className="space-y-2">
                  {sections.map((sec, idx) => (
                    <div
                      key={`transcript-sec-${sec.sectionId}-${idx}`}
                      className={`p-2 rounded-lg transition-colors ${
                        idx === currentSectionIndex ? "bg-[var(--gold)]/10 border-l-2 border-[var(--gold)]" : ""
                      }`}
                    >
                      <strong className="block text-[11px] text-[var(--gold)] font-medium mb-0.5">
                        {sec.sectionTitle}
                      </strong>
                      <p className="whitespace-pre-line text-[11px] text-[var(--muted)]">{sec.sectionText}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
