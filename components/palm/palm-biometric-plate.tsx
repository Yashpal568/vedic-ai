"use client";

import React, { useState } from "react";
import { RefreshCw, Eye, EyeOff, Sparkles, CheckCircle2 } from "lucide-react";
import { derivePalmFeatures, type PalmAnalysisFeatures } from "@/lib/palm-feature-detector";

interface PalmBiometricPlateProps {
  imageSrc: string;
  hand: "left" | "right" | "unsure";
  onRetake: () => void;
  features?: PalmAnalysisFeatures;
  className?: string;
}

export default function PalmBiometricPlate({
  imageSrc,
  hand,
  onRetake,
  features,
  className = "",
}: PalmBiometricPlateProps) {
  // Enabled by default so the user immediately sees their palm lines and highlighted points
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const activeFeatures = features || derivePalmFeatures(hand);

  const handLabel =
    hand === "left"
      ? "Left Hand (Passive Hastarekha)"
      : hand === "right"
      ? "Right Hand (Active Hastarekha)"
      : "Open Palm";

  return (
    <section className={`mb-8 ${className}`} data-purpose="palm-diagram-card">
      {/* Title */}
      <div className="text-center mb-3">
        <h2 className="text-[18px] sm:text-[20px] font-bold tracking-[0.18em] uppercase text-[var(--gold)] font-serif-luxury">
          YOUR PALMISTRY PROFILE
        </h2>
        <p className="text-[13px] text-[var(--muted)] font-normal mt-0.5 tracking-wide">
          Traditional Palmistry Interpretation
        </p>
      </div>

      {/* Telemetry subtitle bar */}
      <div className="flex items-center justify-between text-[11px] text-[var(--muted)] px-2 mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
          <span className="font-semibold text-[var(--text)]">Verified Hastarekha Scan</span>
          <span className="text-[10px] text-[var(--quiet)] hidden sm:inline">
            · {activeFeatures.lines.filter((l) => l.visible).length} Creases Mapped
          </span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOverlay((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide border border-[var(--gold)]/40 hover:border-[var(--gold)] text-[var(--gold)] bg-[var(--panel)] transition-all cursor-pointer shadow-xs active:scale-95"
            title={showOverlay ? "Hide palm lines & points overlay" : "Show palm lines & points overlay"}
            aria-label={showOverlay ? "Hide Annotations" : "Show Annotations"}
          >
            {showOverlay ? <EyeOff size={12} /> : <Eye size={12} />}
            <span>{showOverlay ? "Hide Annotations" : "Show Annotations"}</span>
          </button>
          <span className="font-semibold text-[var(--quiet)] uppercase tracking-wider text-[10px] hidden sm:inline">
            AI Biometrics
          </span>
        </div>
      </div>

      <div className="relative w-full rounded-2xl border border-[var(--gold)]/30 bg-[#FAF7F0] dark:bg-[#191B23] overflow-hidden shadow-xl p-2 sm:p-3 flex flex-col items-center justify-center transition-all">
        {/* Palm presentation container */}
        <div className="relative w-full aspect-[4/3.8] max-h-[480px] rounded-xl overflow-hidden bg-[#FAF6EE] dark:bg-[#13151D] flex items-center justify-center border border-[var(--gold)]/20 shadow-inner">
          {/* Subtle studio backdrop lighting */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.45)_0%,rgba(240,233,219,0.75)_100%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(28,30,42,0.55)_0%,rgba(14,16,23,0.92)_100%)]" />

          {/* Celestial compass watermark rings behind palm */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none text-[var(--gold)]/20 dark:text-[var(--gold)]/15 z-0"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid meet"
          >
            <circle cx="500" cy="500" r="420" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5 6" />
            <circle cx="500" cy="500" r="320" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="500" cy="500" r="220" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 4" />
            <line x1="80" y1="500" x2="920" y2="500" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 5" />
            <line x1="500" y1="80" x2="500" y2="920" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 5" />
          </svg>

          {/* User's Actual Palm Photograph */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc || "/realistic-palm.jpg"}
            alt="User's Analysed Palm Photo"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/realistic-palm.jpg";
            }}
            className="w-full h-full object-contain object-center filter contrast-[1.04] brightness-[1.02] transition-all duration-300 relative z-0"
          />

          {/* Responsive SVG Overlay: Mapped Lines & Landmarks */}
          {showOverlay && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="purple-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Render Visible Primary Lines */}
              {activeFeatures.lines
                .filter((line) => line.visible && line.pathData)
                .map((line) => {
                  const isSelected = selectedFeature === line.id;
                  const filterUrl =
                    line.id === "head"
                      ? "url(#emerald-glow)"
                      : line.id === "fate"
                      ? "url(#purple-glow)"
                      : "url(#gold-glow)";

                  return (
                    <g key={line.id} className="transition-all duration-200">
                      {/* Halo backing stroke */}
                      <path
                        d={line.pathData}
                        fill="none"
                        stroke={line.glowColor}
                        strokeWidth={isSelected ? 10 : 7}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.8}
                      />
                      {/* Main core stroke */}
                      <path
                        d={line.pathData}
                        fill="none"
                        stroke={line.color}
                        strokeWidth={isSelected ? 5 : 3.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={filterUrl}
                        strokeDasharray={line.id === "fate" ? "6 5" : undefined}
                        opacity={0.96}
                      />
                      {/* Keypoint markers along the crease */}
                      {line.points.map((pt, idx) => (
                        <circle
                          key={`${line.id}-pt-${idx}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={idx === 0 || idx === line.points.length - 1 ? 4.5 : 3}
                          fill={line.color}
                          stroke="#FFFFFF"
                          strokeWidth="1.2"
                        />
                      ))}
                    </g>
                  );
                })}

              {/* Render Planetary Mount Nodes */}
              {activeFeatures.mounts.map((mount) => {
                const isSelected = selectedFeature === mount.id;
                return (
                  <g key={mount.id} className="transition-all duration-200">
                    {/* Pulsing beacon ring for mounts */}
                    <circle
                      cx={mount.point.x}
                      cy={mount.point.y}
                      r={isSelected ? 12 : 8}
                      fill={mount.color}
                      opacity={0.25}
                    />
                    <circle
                      cx={mount.point.x}
                      cy={mount.point.y}
                      r={isSelected ? 6 : 4.5}
                      fill={mount.color}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Interactive Callout Badges */}
          {showOverlay && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Callouts for lines */}
              {activeFeatures.lines
                .filter((line) => line.visible)
                .map((line) => {
                  const isSelected = selectedFeature === line.id;
                  const leftPct = (line.labelPosition.x / 1000) * 100;
                  const topPct = (line.labelPosition.y / 1000) * 100;

                  return (
                    <div
                      key={`callout-${line.id}`}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className="absolute pointer-events-auto cursor-pointer"
                      onClick={() => setSelectedFeature(selectedFeature === line.id ? null : line.id)}
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold tracking-wide transition-all shadow-md backdrop-blur-md ${
                          isSelected
                            ? "bg-[var(--gold)] text-[#11131A] scale-105 border border-white"
                            : "bg-[var(--panel)]/90 text-[var(--text)] border hover:border-[var(--gold)]"
                        }`}
                        style={{
                          borderColor: isSelected ? "#FFFFFF" : line.color,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: line.color }}
                        />
                        <span>{line.name}</span>
                      </span>
                    </div>
                  );
                })}

              {/* Passive/Active Hand label callout (Left lower) */}
              <div className="absolute left-3 bottom-3 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#11131A]/90 backdrop-blur-md text-[#FFE192] text-[10px] sm:text-[11px] font-medium rounded-full border border-[#E5C46B]/40 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E5C46B]" />
                  {handLabel}
                </span>
              </div>
            </div>
          )}

          {/* Top Right Retake Button */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
            <button
              type="button"
              onClick={onRetake}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--panel)]/90 backdrop-blur-md text-[var(--gold)] hover:text-white border border-[var(--gold)]/30 hover:border-[var(--gold)] text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
              aria-label="Upload or take another palm photo"
              title="Upload or take another photo"
            >
              <RefreshCw size={12} />
              <span>Retake</span>
            </button>
          </div>
        </div>

        {/* Feature Legend & Quality Status */}
        <div className="w-full mt-3 pt-3 border-t border-[var(--line)] px-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--gold)] flex items-center gap-1">
              <Sparkles size={11} /> Mapped Hastarekha Creases & Mounts (Heart Line, Head Line, Life Line)
            </span>
            <span className="text-[10px] text-[var(--quiet)]">Click any line to highlight</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {activeFeatures.lines.map((line) => {
              const isSelected = selectedFeature === line.id;
              return (
                <button
                  key={`legend-${line.id}`}
                  type="button"
                  onClick={() => setSelectedFeature(selectedFeature === line.id ? null : line.id)}
                  className={`flex flex-col text-left p-2 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--wash)] border-[var(--gold)] shadow-xs"
                      : "bg-[var(--raised)] border-[var(--line)] hover:border-[var(--line2)]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)]">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: line.color }}
                      />
                      <span>{line.name}</span>
                    </span>
                    {line.visible ? (
                      <span className="inline-flex items-center gap-1 text-[9px] text-[#52FEB8] font-medium">
                        <CheckCircle2 size={11} /> Mapped
                      </span>
                    ) : (
                      <span className="text-[9px] text-[var(--quiet)] font-medium">Not clearly detected</span>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--quiet)] mt-0.5 truncate">
                    {line.hindiName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mounts quick pill list */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[9px] uppercase tracking-wider text-[var(--quiet)] font-semibold mr-1">
              Planetary Mounts:
            </span>
            {activeFeatures.mounts.map((mount) => {
              const isSelected = selectedFeature === mount.id;
              return (
                <button
                  key={`mount-pill-${mount.id}`}
                  type="button"
                  onClick={() => setSelectedFeature(selectedFeature === mount.id ? null : mount.id)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] border transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[var(--wash)] border-[var(--gold)] text-[var(--gold)]"
                      : "bg-[var(--raised)] border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                  title={`${mount.parvatName}: ${mount.significance}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mount.color }} />
                  <span>{mount.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
