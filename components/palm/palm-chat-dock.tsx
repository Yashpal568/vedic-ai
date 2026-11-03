"use client";

import React, { useState } from "react";
import { Plus, Mic, Send, ArrowDown } from "lucide-react";

interface PalmChatDockProps {
  onSendMessage?: (msg: string) => void;
  onUploadClick?: () => void;
}

export default function PalmChatDock({ onSendMessage, onUploadClick }: PalmChatDockProps) {
  const [input, setInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !onSendMessage) return;
    onSendMessage(input.trim());
    setInput("");
  }

  function handleScrollDown() {
    if (typeof window !== "undefined") {
      window.scrollBy({ top: 400, behavior: "smooth" });
    }
  }

  return (
    <>
      {/* Floating Scroll-Down Action Indicator (as seen in Stitch ref #2 & #3) */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-auto" data-purpose="scroll-down-action">
        <button
          type="button"
          aria-label="Scroll to bottom"
          onClick={handleScrollDown}
          className="w-8 h-8 rounded-full bg-[var(--raised)]/90 hover:bg-[var(--raised)] border border-[var(--line2)] text-[var(--gold)] shadow-md flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
        >
          <ArrowDown size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Pinned Bottom Input Dock */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 flex justify-center bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/95 to-transparent pt-3 pb-5 px-3 pointer-events-none"
        data-purpose="chat-dock-container"
      >
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[440px] md:max-w-[620px] bg-[var(--raised)]/95 backdrop-blur-md rounded-full p-1.5 flex items-center shadow-xl border border-[var(--line2)] pointer-events-auto font-sans-luxury"
        >
          <button
            type="button"
            onClick={onUploadClick}
            aria-label="Add photo or attachment"
            className="w-9 h-9 rounded-full bg-[var(--panel)] hover:bg-[var(--panel)] text-[var(--gold)] flex items-center justify-center flex-shrink-0 transition-colors ml-0.5 border border-[var(--line2)]"
          >
            <Plus size={18} strokeWidth={2.2} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Vedic AI about your palm..."
            aria-label="Ask Vedic AI about your palm"
            className="flex-1 bg-transparent border-none text-[14px] text-[var(--text)] placeholder-[var(--quiet)] focus:ring-0 focus:outline-none px-3 py-1 font-normal outline-none"
          />

          <button
            type="button"
            aria-label="Voice input"
            className="p-2 text-[var(--quiet)] hover:text-[var(--gold)] transition-colors flex-shrink-0"
          >
            <Mic size={18} />
          </button>

          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send prompt"
            className="w-9 h-9 rounded-full bg-[var(--gold)] hover:brightness-110 disabled:opacity-40 text-[#0A0C13] flex items-center justify-center flex-shrink-0 shadow-md transition-all mr-0.5 font-bold"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </>
  );
}
