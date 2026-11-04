"use client";

import React from "react";
import { CheckCircle2, XCircle, Camera, X } from "lucide-react";

interface PalmPreScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScan: () => void;
}

export function PalmPreScanModal({
  isOpen,
  onClose,
  onStartScan,
}: PalmPreScanModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="palm-camera-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Palm Scanning Instructions"
    >
      <div className="palm-prescan-modal">
        {/* Header */}
        <div className="palm-prescan-header">
          <div className="palm-prescan-title-wrap">
            <span className="palm-prescan-badge">HOW TO SCAN</span>
            <h2 className="palm-prescan-title">Palm Scanner Guidance</h2>
          </div>
          <button
            type="button"
            className="palm-camera-close"
            onClick={onClose}
            aria-label="Close instructions"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visual Comparison: Open Palm vs Back of Hand */}
        <div className="palm-prescan-visual-grid">
          <div className="palm-prescan-visual-card is-correct">
            <div className="palm-prescan-card-badge is-valid">
              <CheckCircle2 size={14} /> Correct
            </div>
            <div className="palm-prescan-illustration">
              <svg viewBox="0 0 100 120" width="60" height="72" fill="none">
                {/* Palmar surface with lines */}
                <path
                  d="M 35 110 L 32 85 C 30 75 22 70 14 62 C 8 55 10 48 16 45 C 22 42 28 47 32 55 L 35 62 C 34 50 33 30 36 18 C 38 12 45 12 47 18 L 49 48 C 50 36 52 14 56 8 C 58 4 64 4 66 8 L 68 50 C 69 40 72 20 76 16 C 78 12 84 14 85 18 L 86 55 C 88 48 91 36 95 34 C 98 32 101 36 100 42 C 98 56 94 72 90 85 C 86 98 75 108 70 110 Z"
                  stroke="#52feb8"
                  strokeWidth="2"
                  fill="rgba(82, 254, 184, 0.08)"
                />
                {/* Heart line, Head line, Life line */}
                <path d="M 40 68 C 55 64 75 70 88 64" stroke="#52feb8" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 40 78 C 55 76 72 82 85 86" stroke="#52feb8" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 36 70 C 44 80 50 96 52 108" stroke="#52feb8" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="palm-prescan-card-label">Open Palm Facing Camera</span>
            <p className="palm-prescan-card-desc">Palm lines & creases clearly visible</p>
          </div>

          <div className="palm-prescan-visual-card is-incorrect">
            <div className="palm-prescan-card-badge is-invalid">
              <XCircle size={14} /> Incorrect
            </div>
            <div className="palm-prescan-illustration">
              <svg viewBox="0 0 100 120" width="60" height="72" fill="none">
                {/* Dorsal back of hand with fingernails */}
                <path
                  d="M 35 110 L 32 85 C 30 75 22 70 14 62 C 8 55 10 48 16 45 C 22 42 28 47 32 55 L 35 62 C 34 50 33 30 36 18 C 38 12 45 12 47 18 L 49 48 C 50 36 52 14 56 8 C 58 4 64 4 66 8 L 68 50 C 69 40 72 20 76 16 C 78 12 84 14 85 18 L 86 55 C 88 48 91 36 95 34 C 98 32 101 36 100 42 C 98 56 94 72 90 85 C 86 98 75 108 70 110 Z"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  fill="rgba(239, 68, 68, 0.06)"
                />
                {/* Fingernails instead of palm lines */}
                <rect x="34" y="20" width="5" height="7" rx="2" stroke="#ef4444" strokeWidth="1.2" />
                <rect x="54" y="10" width="5" height="7" rx="2" stroke="#ef4444" strokeWidth="1.2" />
                <rect x="74" y="18" width="5" height="7" rx="2" stroke="#ef4444" strokeWidth="1.2" />
              </svg>
            </div>
            <span className="palm-prescan-card-label">Back of Hand or Knuckles</span>
            <p className="palm-prescan-card-desc">Rejected — scanner requires palmar lines</p>
          </div>
        </div>

        {/* 7 Required Scanning Rules */}
        <div className="palm-prescan-rules">
          <ol className="palm-prescan-rules-list">
            <li>
              <strong>1. Open your palm:</strong> Show the inner surface with your life, heart, and head lines.
            </li>
            <li>
              <strong>2. Face your palm directly toward camera:</strong> Keep it straight without tilting sideways.
            </li>
            <li>
              <strong>3. Spread your fingers naturally:</strong> Do not curl fingers or make a fist.
            </li>
            <li>
              <strong>4. Keep wrist and all 5 fingertips visible:</strong> Do not crop your fingers outside the screen.
            </li>
            <li>
              <strong>5. Use bright, even lighting:</strong> Avoid harsh backlighting, heavy shadows, or direct glare.
            </li>
            <li>
              <strong>6. Keep camera 20–30 cm away:</strong> Position your palm to comfortably fill the alignment silhouette.
            </li>
            <li>
              <strong>7. Hold still until automatic capture:</strong> The scanner will verify 100% and capture automatically.
            </li>
          </ol>
        </div>

        {/* Modal Actions */}
        <div className="palm-prescan-actions">
          <button
            type="button"
            className="palm-prescan-start-btn"
            onClick={onStartScan}
          >
            <Camera size={18} />
            Start Scanning
          </button>
          <button
            type="button"
            className="palm-prescan-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
