"use client";

import React from "react";
import { FileText } from "lucide-react";

interface PalmReportHeaderProps {
  onOpenExportModal?: () => void;
}

export default function PalmReportHeader({ onOpenExportModal }: PalmReportHeaderProps) {
  return (
    <div className="text-center mb-6 pt-2" data-purpose="report-heading">
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--raised)] border border-[var(--line2)] mb-3 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-[#52FEB8] animate-pulse"></span>
        <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--gold)]">
          Vedic Astrological Insight
        </span>
      </div>

      <h1 className="text-[26px] md:text-[32px] tracking-widest uppercase font-serif-luxury font-bold text-[var(--gold)] drop-shadow-[0_2px_12px_rgba(229,196,107,0.2)]">
        YOUR PALMISTRY PROFILE
      </h1>
      
      <p className="text-[13px] md:text-[14px] text-[var(--muted)] font-normal mt-1.5 tracking-wide font-sans-luxury">
        Traditional Palmistry Interpretation • Jyotish Hastarekha
      </p>

      {onOpenExportModal && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--raised)] hover:bg-[var(--panel)] border border-[var(--line2)] text-[var(--gold)] text-xs font-semibold tracking-wide shadow-sm hover:border-[var(--gold)] transition-all"
          >
            <FileText size={15} />
            <span>Export Hastarekha PDF Dossier</span>
          </button>
        </div>
      )}
    </div>
  );
}
