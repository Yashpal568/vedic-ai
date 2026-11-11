"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { Languages, Check } from "lucide-react";

interface LanguageSelectorProps {
  variant?: "compact" | "full" | "minimal";
  className?: string;
  showIcon?: boolean;
}

export function LanguageSelector({
  variant = "compact",
  className = "",
  showIcon = true,
}: LanguageSelectorProps) {
  const { setLanguage, isHindi } = useLanguage();

  if (variant === "full") {
    return (
      <div className={`vedic-language-selector-full ${className}`} role="radiogroup" aria-label="Language preference">
        <button
          type="button"
          role="radio"
          aria-checked={!isHindi}
          onClick={() => setLanguage("en")}
          className={`lang-option-card ${!isHindi ? "selected" : ""}`}
        >
          <div className="lang-option-header">
            <span className="lang-code-tag">EN</span>
            <span className="lang-title">English</span>
            {!isHindi && <Check size={16} className="lang-check" />}
          </div>
          <p className="lang-desc">Standard English astrological reports and conversational voice narration.</p>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={isHindi}
          onClick={() => setLanguage("hi")}
          className={`lang-option-card ${isHindi ? "selected" : ""}`}
        >
          <div className="lang-option-header">
            <span className="lang-code-tag lang-hi-tag">हि</span>
            <span className="lang-title">हिन्दी (Hindi)</span>
            {isHindi && <Check size={16} className="lang-check" />}
          </div>
          <p className="lang-desc">प्रामाणिक वैदिक ज्योतिष शब्दावली, देवनागरी लिपि और प्राकृतिक हिन्दी वाणी।</p>
        </button>

        <style jsx>{`
          .vedic-language-selector-full {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 12px;
            width: 100%;
          }
          .lang-option-card {
            background: var(--surface, rgba(255, 255, 255, 0.03));
            border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
            border-radius: 12px;
            padding: 16px;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
          }
          .lang-option-card:hover {
            border-color: rgba(229, 169, 59, 0.4);
            background: var(--surface-hover, rgba(229, 169, 59, 0.04));
          }
          .lang-option-card.selected {
            border-color: var(--gold, #e5a93b);
            background: rgba(229, 169, 59, 0.08);
            box-shadow: 0 0 16px rgba(229, 169, 59, 0.12);
          }
          .lang-option-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
          }
          .lang-code-tag {
            font-size: 11px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.08);
            color: var(--ink, #ffffff);
            letter-spacing: 0.05em;
          }
          .lang-hi-tag {
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
          }
          .lang-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--ink, #ffffff);
            flex: 1;
          }
          .lang-check {
            color: var(--gold, #e5a93b);
          }
          .lang-desc {
            font-size: 12.5px;
            line-height: 1.45;
            color: var(--quiet, #a0aec0);
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  // Compact Pill Selector (Standard for topbars, headers, sidebars)
  return (
    <div
      className={`vedic-language-pill-toggle ${className}`}
      role="radiogroup"
      aria-label="Language selector"
    >
      {showIcon && (
        <span className="lang-icon" aria-hidden="true">
          <Languages size={14} />
        </span>
      )}
      <div className="pill-track">
        <button
          type="button"
          role="radio"
          aria-checked={!isHindi}
          title="Switch to English"
          aria-label="Switch to English"
          onClick={() => setLanguage("en")}
          className={`pill-btn ${!isHindi ? "active" : ""}`}
        >
          English
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={isHindi}
          title="हिन्दी में बदलें"
          aria-label="हिन्दी में बदलें"
          onClick={() => setLanguage("hi")}
          className={`pill-btn ${isHindi ? "active" : ""}`}
        >
          हिन्दी
        </button>
      </div>

      <style jsx>{`
        .vedic-language-pill-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          user-select: none;
        }
        .lang-icon {
          display: inline-flex;
          align-items: center;
          color: var(--quiet, rgba(255, 255, 255, 0.6));
        }
        .pill-track {
          display: inline-flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
          border-radius: 9999px;
          padding: 2px;
          position: relative;
        }
        :global(html[data-theme="light"]) .pill-track {
          background: rgba(0, 0, 0, 0.04);
          border-color: rgba(0, 0, 0, 0.12);
        }
        .pill-btn {
          font-family: inherit;
          font-size: 11.5px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 9999px;
          border: none;
          background: transparent;
          color: var(--quiet, rgba(255, 255, 255, 0.65));
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          line-height: 1.3;
          white-space: nowrap;
        }
        :global(html[data-theme="light"]) .pill-btn {
          color: rgba(30, 41, 59, 0.7);
        }
        .pill-btn:hover {
          color: var(--ink, #ffffff);
        }
        :global(html[data-theme="light"]) .pill-btn:hover {
          color: #0f172a;
        }
        .pill-btn.active {
          background: var(--gold, #e5a93b);
          color: #0d0f15;
          font-weight: 600;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }
        :global(html[data-theme="light"]) .pill-btn.active {
          background: #ca8a04;
          color: #ffffff;
          box-shadow: 0 1px 3px rgba(202, 138, 4, 0.35);
        }
      `}</style>
    </div>
  );
}

export default LanguageSelector;

