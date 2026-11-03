"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Award,
} from "lucide-react";
import type { ParsedPalmReport } from "@/lib/palm-parser";

interface DossierPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ParsedPalmReport;
  imageSrc: string;
  hand: "left" | "right" | "unsure";
}

export default function DossierPreviewModal({
  isOpen,
  onClose,
  report,
  imageSrc,
  hand,
}: DossierPreviewModalProps) {
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedFormat, setSelectedFormat] = useState<"A4" | "US_Letter">("A4");
  const [selectedTexture, setSelectedTexture] = useState<"parchment" | "clean" | "void">("parchment");
  const [hasWatermark, setHasWatermark] = useState<boolean>(true);
  const [paperWeight, setPaperWeight] = useState<"120gsm" | "80gsm">("120gsm");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  async function handleDownloadPdf() {
    setIsExporting(true);
    try {
      // Direct print trigger configured for exact A4 print styles
      window.print();
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-fade-in font-sans-luxury">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-[var(--panel)] border border-[var(--line2)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--raised)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--wash)] border border-[var(--line2)] flex items-center justify-center text-[var(--gold)] shadow-sm">
              <Award size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--gold)] font-serif-luxury tracking-wide">
                Export Hastarekha PDF Dossier
              </h2>
              <p className="text-xs text-[var(--muted)]">
                High-resolution archival astrological dossier with custom textures & seals
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-[var(--quiet)] hover:text-[var(--text)] hover:bg-[var(--panel)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: 2-Column Split Composition (Matching Reference #5) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Realistic A4 Document Page Preview (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* Viewport Toolbar: Pagination & Zoom */}
            <div className="w-full max-w-[540px] flex items-center justify-between pb-3 text-xs text-[var(--muted)] border-b border-[var(--line)] mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-1 rounded bg-[var(--raised)] disabled:opacity-30 hover:text-[var(--gold)]"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-medium">
                  Page {currentPage} of 2
                </span>
                <button
                  type="button"
                  disabled={currentPage === 2}
                  onClick={() => setCurrentPage(2)}
                  className="p-1 rounded bg-[var(--raised)] disabled:opacity-30 hover:text-[var(--gold)]"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                  className="p-1 rounded hover:text-[var(--gold)]"
                >
                  <ZoomOut size={15} />
                </button>
                <span>{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(125, z + 10))}
                  className="p-1 rounded hover:text-[var(--gold)]"
                >
                  <ZoomIn size={15} />
                </button>
              </div>
            </div>

            {/* Realistic A4 Document Sheet Container */}
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
              className={`w-full max-w-[520px] aspect-[1/1.4142] rounded-lg shadow-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative border overflow-hidden ${
                selectedTexture === "parchment"
                  ? "bg-[#FAF7EE] text-[#1E2229] border-[#DFCBB0]"
                  : selectedTexture === "clean"
                  ? "bg-white text-[#111] border-gray-300"
                  : "bg-[#11131A] text-[#E2E2EC] border-[#4D4638]"
              }`}
            >
              {/* Subtle Deckled Paper Watermark Stamp (Ref #5 & #6) */}
              {hasWatermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
                  <Sparkles size={280} />
                </div>
              )}

              {/* PAGE 1 CONTENT (Ref #6) */}
              {currentPage === 1 && (
                <div className="flex flex-col h-full justify-between">
                  {/* Archival Jyotish Header Block */}
                  <div className="border-b border-current/15 pb-3">
                    <div className="flex items-center justify-between text-[10px] tracking-widest uppercase opacity-75 font-mono">
                      <span>Ref: VD-PALM-2026-8824</span>
                      <span>Lahiri Ayanamsha 24°11&apos;32&quot;</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <h3 className="text-xl font-bold font-serif-luxury tracking-wide text-[#96671D]">
                        HASTAREKHA DOSSIER
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-black/5 border border-current/20 font-bold uppercase">
                        Part I: Scan Plate
                      </span>
                    </div>
                    <p className="text-[10px] opacity-75 mt-0.5">
                      Authentic Astrological Biometric Synthesis • {hand === "left" ? "Left Hand (Passive)" : hand === "right" ? "Right Hand (Active)" : "Hastarekha"}
                    </p>
                  </div>

                  {/* Scanned Palm Image Plate with Biometric HUD Overlays */}
                  <div className="my-3 relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-current/20 bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt="Palm preview"
                      className="w-full h-full object-cover object-center"
                    />
                    {/* Reticles */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#52FEB8]" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#52FEB8]" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#52FEB8]" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#52FEB8]" />
                    <div className="absolute top-2 left-3 text-[9px] font-bold text-[#52FEB8] bg-black/70 px-1.5 py-0.5 rounded">
                      Live Scan • 99.4% Match
                    </div>
                  </div>

                  {/* Quantitative Mount Strength Barometers */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 rounded bg-current/5 border border-current/10">
                      <strong>Mount of Jupiter (Guru):</strong>
                      <p className="opacity-80 mt-0.5 text-[9px]">Strong ethical vision & leadership clarity.</p>
                    </div>
                    <div className="p-2 rounded bg-current/5 border border-current/10">
                      <strong>Mount of Venus (Shukra):</strong>
                      <p className="opacity-80 mt-0.5 text-[9px]">Warm sensory harmony & domestic devotion.</p>
                    </div>
                  </div>

                  {/* Footer Strip */}
                  <div className="border-t border-current/15 pt-2 flex items-center justify-between text-[9px] opacity-70">
                    <span>Vedic AI • Jyotish Hastarekha</span>
                    <span>Page 1 of 2</span>
                  </div>
                </div>
              )}

              {/* PAGE 2 CONTENT (Ref #1 & #10) */}
              {currentPage === 2 && (
                <div className="flex flex-col h-full justify-between">
                  <div className="border-b border-current/15 pb-2">
                    <div className="flex items-center justify-between text-[10px] tracking-widest uppercase opacity-75 font-mono">
                      <span>Ref: VD-PALM-2026-8824</span>
                      <span>Ephemeris: Swiss Sidereal</span>
                    </div>
                    <h3 className="text-base font-bold font-serif-luxury tracking-wide text-[#96671D] mt-1">
                      SECTION II: REKHA & PARVATA INTERPRETATION
                    </h3>
                  </div>

                  {/* Part A: Maha Rekhas */}
                  <div className="space-y-1.5 my-2 text-[10px]">
                    <div className="p-1.5 rounded bg-current/5 border-l-2 border-[#96671D]">
                      <strong>Hridaya Rekha (Heart Line):</strong>
                      <p className="opacity-85 text-[9px] line-clamp-2">{report.heartLine}</p>
                    </div>
                    <div className="p-1.5 rounded bg-current/5 border-l-2 border-[#52FEB8]">
                      <strong>Mastaka Rekha (Head Line):</strong>
                      <p className="opacity-85 text-[9px] line-clamp-2">{report.headLine}</p>
                    </div>
                    <div className="p-1.5 rounded bg-current/5 border-l-2 border-[#96671D]">
                      <strong>Jeeva Rekha (Life Line):</strong>
                      <p className="opacity-85 text-[9px] line-clamp-2">{report.lifeLine}</p>
                    </div>
                    <div className="p-1.5 rounded bg-current/5 border-l-2 border-[#52FEB8]">
                      <strong>Bhagya Rekha (Fate Line):</strong>
                      <p className="opacity-85 text-[9px] line-clamp-2">{report.fateLine}</p>
                    </div>
                  </div>

                  {/* Part C: Upaya Remedies */}
                  <div className="p-2 rounded bg-current/5 border border-current/10 text-[9px]">
                    <strong className="text-[10px] text-[#96671D] block mb-1">
                      Prescribed Karmic Harmonization (Upaya):
                    </strong>
                    <ul className="list-disc pl-4 space-y-0.5 opacity-85">
                      {report.remedies.slice(0, 2).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer Strip */}
                  <div className="border-t border-current/15 pt-2 flex items-center justify-between text-[9px] opacity-70">
                    <span>Vedic AI • Jyotish Hastarekha</span>
                    <span>Page 2 of 2</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Export Configuration & Texture Options (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div>
              <h3 className="text-sm font-bold text-[var(--gold)] uppercase tracking-wider mb-3">
                Dossier Configuration
              </h3>

              {/* 1. Paper Format */}
              <div className="mb-4">
                <label className="text-xs text-[var(--muted)] font-medium block mb-1.5">
                  Paper Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat("A4")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      selectedFormat === "A4"
                        ? "bg-[var(--gold)] text-[#0A0C13] border-[var(--gold)]"
                        : "bg-[var(--raised)] border-[var(--line)] text-[var(--muted)]"
                    }`}
                  >
                    <span>A4 Standard (ISO 216)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat("US_Letter")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      selectedFormat === "US_Letter"
                        ? "bg-[var(--gold)] text-[#0A0C13] border-[var(--gold)]"
                        : "bg-[var(--raised)] border-[var(--line)] text-[var(--muted)]"
                    }`}
                  >
                    <span>US Letter (8.5 × 11&quot;)</span>
                  </button>
                </div>
              </div>

              {/* 2. Texture & Color Palette (3 Texture Cards from Ref #5) */}
              <div className="mb-4">
                <label className="text-xs text-[var(--muted)] font-medium block mb-1.5">
                  Color Profile & Texture
                </label>
                <div className="space-y-2">
                  <div
                    onClick={() => setSelectedTexture("parchment")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedTexture === "parchment"
                        ? "bg-[var(--wash)] border-[var(--gold)] shadow-sm"
                        : "bg-[var(--raised)] border-[var(--line)]"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--gold)] block">
                        Vedic Parchment (Recommended)
                      </span>
                      <p className="text-[11px] text-[var(--muted)]">
                        Warm archival tone with celestial gold accents
                      </p>
                    </div>
                    <Sparkles size={16} className="text-[var(--gold)]" />
                  </div>

                  <div
                    onClick={() => setSelectedTexture("clean")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedTexture === "clean"
                        ? "bg-[var(--wash)] border-[var(--gold)] shadow-sm"
                        : "bg-[var(--raised)] border-[var(--line)]"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--text)] block">
                        Clean White (Printer-Friendly)
                      </span>
                      <p className="text-[11px] text-[var(--muted)]">
                        Crisp monochrome for domestic laser printers
                      </p>
                    </div>
                    <Layers size={16} className="text-[var(--muted)]" />
                  </div>

                  <div
                    onClick={() => setSelectedTexture("void")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedTexture === "void"
                        ? "bg-[var(--wash)] border-[var(--gold)] shadow-sm"
                        : "bg-[var(--raised)] border-[var(--line)]"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-[#52FEB8] block">
                        Cosmic Void (Digital Display)
                      </span>
                      <p className="text-[11px] text-[var(--muted)]">
                        Nocturnal dark canvas with luminous starlight inks
                      </p>
                    </div>
                    <ShieldCheck size={16} className="text-[#52FEB8]" />
                  </div>
                </div>
              </div>

              {/* 3. Watermark Stamp Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--raised)] border border-[var(--line)] mb-4">
                <div>
                  <span className="text-xs font-bold text-[var(--text)] block">
                    Sacred Geometry Watermark
                  </span>
                  <p className="text-[11px] text-[var(--muted)]">
                    Official Jyotish Hastarekha seal in background
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hasWatermark}
                  onChange={(e) => setHasWatermark(e.target.checked)}
                  className="rounded text-[var(--gold)] focus:ring-0"
                />
              </div>
              {/* 4. Paper Weight & Finish (Reference #5) */}
              <div className="mb-4">
                <label className="text-xs text-[var(--muted)] font-medium block mb-1.5">
                  Paper Weight & Finish
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaperWeight("120gsm")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      paperWeight === "120gsm"
                        ? "bg-[var(--wash)] border-[var(--gold)] text-[var(--gold)]"
                        : "bg-[var(--raised)] border-[var(--line)] text-[var(--muted)]"
                    }`}
                  >
                    <span>120 gsm Heavy Stock</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperWeight("80gsm")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      paperWeight === "80gsm"
                        ? "bg-[var(--wash)] border-[var(--gold)] text-[var(--gold)]"
                        : "bg-[var(--raised)] border-[var(--line)] text-[var(--muted)]"
                    }`}
                  >
                    <span>80 gsm Standard</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="w-full py-3 px-4 rounded-xl bg-[var(--gold)] hover:brightness-110 text-[#0A0C13] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Download size={16} />
                <span>Download Archival PDF (A4)</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--raised)] hover:bg-[var(--panel)] border border-[var(--line2)] text-[var(--text)] text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Printer size={15} />
                <span>Print Dossier Directly</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
