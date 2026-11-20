"use client";

import React, { useState, useEffect } from "react";
import { Plus, Mic, Send, ArrowDown } from "lucide-react";

interface PalmChatDockProps {
  onSendMessage?: (msg: string) => void;
  onUploadClick?: () => void;
  language?: "en" | "hi" | "hinglish";
}

export default function PalmChatDock({
  onSendMessage,
  onUploadClick,
  language = "en",
}: PalmChatDockProps) {
  const [input, setInput] = useState("");
  const [isNearBottom, setIsNearBottom] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkScrollPosition = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      // Hide button when within 180px of bottom
      if (scrollY + windowHeight >= docHeight - 180) {
        setIsNearBottom(true);
      } else {
        setIsNearBottom(false);
      }
    };

    window.addEventListener("scroll", checkScrollPosition, { passive: true });
    checkScrollPosition();
    return () => window.removeEventListener("scroll", checkScrollPosition);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !onSendMessage) return;
    onSendMessage(input.trim());
    setInput("");
  }

  function handleScrollDown() {
    if (typeof window !== "undefined") {
      window.scrollBy({ top: 450, behavior: "smooth" });
    }
  }

  const isHindi = language === "hi";
  const placeholderText = isHindi
    ? "अपनी हस्तरेखा के बारे में प्रश्न पूछें…"
    : language === "hinglish"
    ? "Apni Hastarekha ke baare mein poochein…"
    : "Ask Vedic AI about your palm...";

  return (
    <>
      {/* Floating Scroll-Down Action Indicator: positioned bottom-right to never overlap center headings */}
      {!isNearBottom && (
        <div
          className="fixed bottom-28 right-4 sm:right-8 z-30 pointer-events-auto transition-opacity duration-300"
          data-purpose="scroll-down-action"
        >
          <button
            type="button"
            aria-label={isHindi ? "नीचे स्क्रॉल करें" : "Scroll to bottom"}
            title={isHindi ? "नीचे स्क्रॉल करें" : "Scroll down"}
            onClick={handleScrollDown}
            className="w-9 h-9 rounded-full bg-[var(--raised)] hover:bg-[var(--panel)] border border-[var(--gold)]/40 text-[var(--gold)] shadow-lg flex items-center justify-center transition-all duration-200 backdrop-blur-md active:scale-95 cursor-pointer hover:border-[var(--gold)]"
          >
            <ArrowDown size={15} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Pinned Bottom Input Dock: shifted up on mobile above 64px MobileBottomNav with backdrop blur */}
      <div
        className="fixed bottom-[64px] sm:bottom-0 left-0 right-0 z-30 flex justify-center bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/95 to-transparent pt-4 pb-3 sm:pb-5 px-3 pointer-events-none"
        data-purpose="chat-dock-container"
      >
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[440px] md:max-w-[620px] bg-[var(--raised)]/95 backdrop-blur-md rounded-full p-1.5 flex items-center shadow-2xl border border-[var(--line2)] pointer-events-auto font-sans-luxury"
        >
          <button
            type="button"
            onClick={onUploadClick}
            aria-label={isHindi ? "हस्त चित्र बदलें" : "Add photo or attachment"}
            title={isHindi ? "हस्त चित्र बदलें" : "Change palm photo"}
            className="w-9 h-9 rounded-full bg-[var(--panel)] hover:bg-[var(--wash)] text-[var(--gold)] flex items-center justify-center flex-shrink-0 transition-colors ml-0.5 border border-[var(--line2)] cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.2} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholderText}
            aria-label={placeholderText}
            className="flex-1 min-w-0 bg-transparent border-none text-[13.5px] sm:text-[14px] text-[var(--text)] placeholder-[var(--quiet)] focus:ring-0 focus:outline-none px-3 py-1 font-normal outline-none truncate"
          />

          <button
            type="button"
            aria-label={isHindi ? "ध्वनि इनपुट" : "Voice input"}
            className="p-2 text-[var(--quiet)] hover:text-[var(--gold)] transition-colors flex-shrink-0 cursor-pointer"
          >
            <Mic size={17} />
          </button>

          <button
            type="submit"
            disabled={!input.trim()}
            aria-label={isHindi ? "प्रश्न भेजें" : "Send prompt"}
            className="w-9 h-9 rounded-full bg-[var(--gold)] hover:brightness-110 disabled:opacity-40 text-[#0A0C13] flex items-center justify-center flex-shrink-0 shadow-md transition-all mr-0.5 font-bold cursor-pointer"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </>
  );
}
