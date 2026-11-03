"use client";

import React from "react";
import type { ParsedPalmReport } from "@/lib/palm-parser";

interface PalmThreeLayerAnalysisProps {
  report: ParsedPalmReport;
}

export default function PalmThreeLayerAnalysis({ report }: PalmThreeLayerAnalysisProps) {
  return (
    <section className="border-t border-[var(--line)] pt-8 pb-6 font-sans-luxury" data-purpose="three-layer-framework">
      <h2 className="text-[22px] font-semibold text-[var(--gold)] tracking-tight leading-snug font-serif-luxury">
        B. What the application should analyse
      </h2>
      <p className="text-[15px] text-[var(--muted)] mt-2 font-normal">
        I would divide the analysis into three layers.
      </p>

      {/* Layer 1: Palm structure */}
      <div className="mt-6 p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-sm" data-purpose="analysis-layer-1">
        <h3 className="text-[17px] font-bold text-[var(--text)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--gold)]" />
          Layer 1: Palm structure
        </h3>
        <ul className="mt-3 space-y-2 text-[14px] text-[var(--muted)] pl-5 list-disc marker:text-[var(--gold)]">
          {report.layer1Structure.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      </div>

      {/* Layer 2: Major lines */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-sm" data-purpose="analysis-layer-2">
        <h3 className="text-[17px] font-bold text-[var(--text)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--gold)]" />
          Layer 2: Major lines
        </h3>
        <ul className="mt-3 space-y-2 text-[14px] text-[var(--muted)] pl-5 list-disc marker:text-[var(--gold)]">
          {report.layer2Lines.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      </div>

      {/* Layer 3: Traditional interpretation */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-sm" data-purpose="analysis-layer-3">
        <h3 className="text-[17px] font-bold text-[var(--text)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--gold)]" />
          Layer 3: Traditional interpretation
        </h3>
        <ul className="mt-3 space-y-2 text-[14px] text-[var(--muted)] pl-5 list-disc marker:text-[var(--gold)]">
          {report.layer3Interpretation.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      </div>

      {/* Disclaimer Note */}
      <div className="mt-8 p-3.5 bg-[var(--raised)] rounded-xl border border-[var(--line2)] text-[var(--quiet)] text-[13px] leading-relaxed">
        <p>
          <span className="font-semibold text-[var(--gold)]">Note:</span> {report.disclaimer}
        </p>
      </div>
    </section>
  );
}

