"use client";

import React from "react";
import type { PalmReadinessState } from "@/lib/palm-camera-scanner";

interface PalmCameraGuideProps {
  progress: number;
  status: string;
  state: PalmReadinessState;
  guideColor: "red" | "amber" | "green";
  autoCapturing: boolean;
  onShowInstructions?: () => void;
  resolutionBadge?: string;
}

export function PalmCameraGuide({
  progress,
  status,
  state,
  guideColor,
  autoCapturing,
  onShowInstructions,
  resolutionBadge,
}: PalmCameraGuideProps) {
  // Theme colors based on strict detection validation
  const strokeColor =
    guideColor === "green"
      ? "#52feb8"
      : guideColor === "amber"
      ? "#f59e0b"
      : "#ef4444";

  const glowFilter =
    guideColor === "green"
      ? "drop-shadow(0 0 10px rgba(82, 254, 184, 0.6))"
      : guideColor === "amber"
      ? "drop-shadow(0 0 8px rgba(245, 158, 11, 0.45))"
      : "drop-shadow(0 0 6px rgba(239, 68, 68, 0.4))";

  return (
    <div
      className="palm-camera-guide-container"
      data-readiness-state={state}
      aria-hidden="true"
    >
      {/* SVG Hand Alignment Silhouette */}
      <svg
        className="palm-camera-silhouette-svg"
        viewBox="0 0 400 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: glowFilter }}
      >
        <defs>
          <linearGradient id="palmSilhouetteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              stopColor={strokeColor}
              stopOpacity={guideColor === "green" ? "0.15" : "0.06"}
            />
            <stop
              offset="100%"
              stopColor={strokeColor}
              stopOpacity={guideColor === "green" ? "0.05" : "0.02"}
            />
          </linearGradient>
        </defs>

        {/* Anatomical Open Hand Outline (Wrist, Thumb, 4 extended fingers) */}
        <path
          d="
            M 140 500
            L 130 430
            C 125 390 100 370 70 330
            C 45 295 40 260 55 245
            C 70 230 95 245 115 275
            L 130 300
            C 130 250 128 170 135 120
            C 138 95 160 95 165 120
            L 172 230
            C 173 170 178 80 190 60
            C 195 45 215 45 220 60
            L 228 230
            C 230 180 235 110 248 95
            C 255 80 275 85 278 105
            L 282 250
            C 285 220 295 170 310 160
            C 320 150 335 160 335 180
            C 335 240 330 320 320 370
            C 310 420 280 470 265 500
            Z
          "
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeDasharray={guideColor === "green" ? "none" : "6 4"}
          fill="url(#palmSilhouetteGrad)"
          className="palm-silhouette-path"
        />

        {/* Target Fingertip Alignment Rings */}
        {/* Thumb */}
        <circle cx="55" cy="245" r="9" stroke={strokeColor} strokeWidth="1.8" strokeDasharray="2 2" />
        {/* Index */}
        <circle cx="150" cy="108" r="9" stroke={strokeColor} strokeWidth="1.8" strokeDasharray="2 2" />
        {/* Middle */}
        <circle cx="205" cy="52" r="9" stroke={strokeColor} strokeWidth="1.8" strokeDasharray="2 2" />
        {/* Ring */}
        <circle cx="263" cy="92" r="9" stroke={strokeColor} strokeWidth="1.8" strokeDasharray="2 2" />
        {/* Pinky */}
        <circle cx="322" cy="170" r="9" stroke={strokeColor} strokeWidth="1.8" strokeDasharray="2 2" />

        {/* Wrist Base Bracket Marker */}
        <path
          d="M 120 495 L 120 512 L 285 512 L 285 495"
          stroke={strokeColor}
          strokeWidth="2"
          fill="none"
        />
        <text
          x="202"
          y="508"
          fill={strokeColor}
          fontSize="10"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
          letterSpacing="0.12em"
          textAnchor="middle"
        >
          WRIST BASE
        </text>

        {/* Fingertips Zone Marker */}
        <path
          d="M 120 40 L 205 28 L 290 40"
          stroke={strokeColor}
          strokeWidth="1.2"
          strokeDasharray="3 3"
          fill="none"
        />
        <text
          x="205"
          y="22"
          fill={strokeColor}
          fontSize="9"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
          letterSpacing="0.1em"
          textAnchor="middle"
        >
          FINGERTIPS
        </text>
      </svg>

      {/* Biometric Animated Laser Scanning Beam */}
      {state !== "NO_HAND" && state !== "FACE_OR_NON_HAND" && state !== "MODEL_LOADING" && (
        <div
          className={`palm-scan-laser-line ${autoCapturing || state === "READY_TO_CAPTURE" ? "is-locked" : ""}`}
          style={
            {
              "--laser-color": strokeColor,
              "--laser-glow":
                guideColor === "green"
                  ? "rgba(82, 254, 184, 0.85)"
                  : guideColor === "amber"
                  ? "rgba(245, 158, 11, 0.85)"
                  : "rgba(239, 68, 68, 0.85)",
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          <div className="palm-scan-laser-beam" />
        </div>
      )}

      {/* Top Banner: Progress Meter, Resolution & Active Instruction */}
      <div className="palm-guide-top-hud">
        {/* Live Circular Percentage Meter */}
        <div className="palm-scan-meter-card">
          <div
            className="palm-scan-ring"
            style={
              {
                "--scan-progress": `${progress * 3.6}deg`,
                "--scan-ring-color": strokeColor,
              } as React.CSSProperties
            }
          >
            <div className="palm-scan-ring-inner">
              <strong>{progress}%</strong>
              <span>{autoCapturing ? "LOCKED" : "SCAN"}</span>
            </div>
          </div>
          <div className="palm-scan-meter-info">
            <span className="palm-scan-meter-label">
              {guideColor === "green"
                ? "READY"
                : guideColor === "amber"
                ? "ALIGNING"
                : "SCANNER"}
            </span>
            <span className="palm-scan-meter-text">
              {autoCapturing ? "Capturing photo..." : "Palm Position"}
            </span>
          </div>
        </div>

        {/* Live Video Stream Resolution Indicator Badge */}
        {resolutionBadge && (
          <div className="palm-hud-resolution-pill" title={`Live camera stream: ${resolutionBadge}`}>
            <span className="palm-res-dot" />
            <span>{resolutionBadge}</span>
          </div>
        )}

        {/* Help button to review instructions */}
        {onShowInstructions && (
          <button
            type="button"
            className="palm-guide-help-pill"
            onClick={onShowInstructions}
            title="View scanning tips"
            aria-label="View scanning tips"
          >
            Tips ⓘ
          </button>
        )}
      </div>

      {/* Dynamic Instruction Pill at Bottom Center */}
      <div
        className="palm-dynamic-instruction-pill"
        style={{
          borderColor:
            guideColor === "green"
              ? "rgba(82, 254, 184, 0.45)"
              : guideColor === "amber"
              ? "rgba(245, 158, 11, 0.45)"
              : "rgba(239, 68, 68, 0.45)",
          backgroundColor: "rgba(16, 21, 27, 0.88)",
        }}
      >
        <span
          className="palm-instruction-dot"
          style={{ backgroundColor: strokeColor }}
        />
        <p className="palm-instruction-message">{status}</p>
      </div>
    </div>
  );
}
