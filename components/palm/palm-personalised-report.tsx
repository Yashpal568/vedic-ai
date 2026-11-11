"use client";

import React from "react";
import type { ParsedPalmReport } from "@/lib/palm-parser";

interface PalmPersonalisedReportProps {
  report: ParsedPalmReport;
  highlightedSection?: string | null;
}

export default function PalmPersonalisedReport({
  report,
  highlightedSection = null,
}: PalmPersonalisedReportProps) {
  const items = [
    { id: "overallStructure", title: "1. Overall palm structure", body: report.overallStructure },
    { id: "heartLine", title: "2. Heart line interpretation", body: report.heartLine },
    { id: "headLine", title: "3. Head line interpretation", body: report.headLine },
    { id: "lifeLine", title: "4. Life line interpretation", body: report.lifeLine },
    { id: "fateLine", title: "5. Fate line interpretation", body: report.fateLine },
    { id: "thumbCharacteristics", title: "6. Thumb characteristics", body: report.thumbCharacteristics },
    { id: "fingerProportions", title: "7. Finger proportions", body: report.fingerProportions },
    { id: "mountOfVenus", title: "8. Mount of Venus", body: report.mountOfVenus },
    { id: "mountOfJupiter", title: "9. Mount of Jupiter", body: report.mountOfJupiter },
    { id: "synthesis", title: "10. Combined left and right palm interpretation", body: report.synthesis },
  ];

  return (
    <section className="mb-10 font-sans-luxury" data-purpose="report-numbered-index">
      <h2 className="text-[22px] font-semibold text-[var(--gold)] mb-5 tracking-tight font-serif-luxury">
        Your personalised report
      </h2>

      <ol className="space-y-3.5 text-[15px]">
        {items.map((item, idx) => {
          const isHighlighted = highlightedSection === item.id;
          return (
            <li
              key={idx}
              id={`palm-section-${item.id}`}
              className={`p-3.5 rounded-xl transition-all duration-300 shadow-sm ${
                isHighlighted
                  ? "bg-[var(--wash)] border-2 border-[var(--gold)] ring-2 ring-[var(--gold)]/30 scale-[1.01]"
                  : "bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--gold)]/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-bold block text-[15px] ${isHighlighted ? "text-[var(--gold)]" : "text-[var(--text)]"}`}>
                  {item.title}
                </span>
                {isHighlighted && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--gold)] bg-[var(--gold)]/15 px-2 py-0.5 rounded-full animate-pulse">
                    Spoken Now
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--muted)] mt-1.5 pl-2.5 leading-relaxed font-normal border-l-2 border-[var(--gold)]">
                {item.body}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
