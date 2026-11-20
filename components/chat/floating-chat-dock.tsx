"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Mic, MicOff, Send } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface FloatingChatDockProps {
  onSendMessage?: (msg: string) => void;
  onPlusClick?: () => void;
  placeholder?: string;
  className?: string;
}

type VoiceRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

type VoiceWindow = Window & {
  SpeechRecognition?: new () => VoiceRecognition;
  webkitSpeechRecognition?: new () => VoiceRecognition;
};

export default function FloatingChatDock({
  onSendMessage,
  onPlusClick,
  placeholder,
  className = "",
}: FloatingChatDockProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const [input, setInput] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speechRecognitionRef = useRef<VoiceRecognition | null>(null);

  const isHindi = language === "hi";
  const defaultPlaceholder = isHindi
    ? "वैदिक एआई से पूछें…"
    : "Ask Vedic AI anything...";

  const resolvedPlaceholder = placeholder || defaultPlaceholder;

  function toggleVoiceInput() {
    if (typeof window === "undefined") return;
    const vWin = window as unknown as VoiceWindow;
    const Recognition = vWin.SpeechRecognition || vWin.webkitSpeechRecognition;

    if (!Recognition) {
      alert(isHindi ? "यह ब्राउज़र ध्वनि इनपुट का समर्थन नहीं करता।" : "Speech recognition is not supported in this browser.");
      return;
    }

    if (voiceListening) {
      speechRecognitionRef.current?.stop();
      setVoiceListening(false);
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = isHindi ? "hi-IN" : "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
        }
      };

      recognition.onerror = () => {
        setVoiceListening(false);
      };

      recognition.onend = () => {
        setVoiceListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
      setVoiceListening(true);
    } catch {
      setVoiceListening(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    if (onSendMessage) {
      onSendMessage(trimmed);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } else {
      try {
        window.sessionStorage.setItem("vedic-pending-query", trimmed);
      } catch {}
      router.push(`/chat?q=${encodeURIComponent(trimmed)}`);
    }
  }

  function handlePlus() {
    if (onPlusClick) {
      onPlusClick();
    } else {
      router.push("/chat?openBirth=1");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <>
      {/* Ambient Gradient Mask behind Floating Input Dock */}
      <div
        className="pointer-events-none fixed bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#060812] via-[#060812]/80 to-transparent z-20"
        aria-hidden="true"
      />

      {/* Floating Chat Dock */}
      <div
        className={`fixed bottom-[68px] sm:bottom-[72px] lg:bottom-6 left-0 right-0 lg:left-[280px] z-25 px-3.5 sm:px-6 pointer-events-none flex justify-center transition-all duration-200 ${className}`}
      >
        <div className="w-full max-w-xl pointer-events-auto">
          <form
            onSubmit={handleSubmit}
            className="group flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#121624]/90 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65)] hover:border-white/20 focus-within:border-amber-400/50 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all"
          >
            <textarea
              id="chat-input"
              ref={textareaRef}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                event.target.style.height = "auto";
                event.target.style.height = Math.min(event.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={onKeyDown}
              placeholder={resolvedPlaceholder}
              rows={1}
              aria-label={isHindi ? "वैदिक एआई को संदेश भेजें" : "Message Vedic AI"}
              className="flex-1 bg-transparent border-0 outline-none text-white text-xs sm:text-[13.5px] placeholder:text-white/40 resize-none py-1.5 px-2 max-h-[120px] leading-relaxed"
            />

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handlePlus}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                title={isHindi ? "जन्म विवरण जोड़ें" : "Add birth details"}
                aria-label="Birth details"
              >
                <Plus size={18} strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  voiceListening
                    ? "text-rose-400 bg-rose-500/20 animate-pulse"
                    : "text-white/60 hover:text-white hover:bg-white/[0.08]"
                }`}
                aria-label={
                  voiceListening
                    ? isHindi ? "ध्वनि इनपुट रोकें" : "Stop voice typing"
                    : isHindi ? "बोलकर लिखें" : "Start voice typing"
                }
                title={
                  voiceListening
                    ? isHindi ? "ध्वनि इनपुट रोकें" : "Stop voice typing"
                    : isHindi ? "बोलकर लिखें" : "Speak to type"
                }
              >
                {voiceListening ? <MicOff size={17} /> : <Mic size={17} />}
              </button>

              <button
                type="submit"
                disabled={!input.trim()}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#11131a] shadow-[0_0_15px_rgba(229,184,75,0.35)] disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
                style={{
                  background: "linear-gradient(90deg, #F6D365 0%, #E5B84B 50%, #C89B3C 100%)",
                }}
                aria-label={isHindi ? "संदेश भेजें" : "Send message"}
              >
                <Send size={16} strokeWidth={2.2} className="-translate-x-0.5 translate-y-0.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
