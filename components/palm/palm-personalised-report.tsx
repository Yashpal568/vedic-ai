"use client";

import React from "react";
import type { ParsedPalmReport } from "@/lib/palm-parser";

interface PalmPersonalisedReportProps {
  report: ParsedPalmReport;
}

export default function PalmPersonalisedReport({ report }: PalmPersonalisedReportProps) {
  const items = [
    { title: "1. Overall palm structure", body: report.overallStructure },
    { title: "2. Heart line interpretation", body: report.heartLine },
    { title: "3. Head line interpretation", body: report.headLine },
    { title: "4. Life line interpretation", body: report.lifeLine },
    { title: "5. Fate line interpretation", body: report.fateLine },
    { title: "6. Thumb characteristics", body: report.thumbCharacteristics },
    { title: "7. Finger proportions", body: report.fingerProportions },
    { title: "8. Mount of Venus", body: report.mountOfVenus },
    { title: "9. Mount of Jupiter", body: report.mountOfJupiter },
    { title: "10. Combined left and right palm interpretation", body: report.synthesis },
  ];

  return (
    <section className="mb-10 font-sans-luxury" data-purpose="report-numbered-index">
      <h2 className="text-[22px] font-semibold text-[var(--gold)] mb-5 tracking-tight font-serif-luxury">
        Your personalised report
      </h2>

      <ol className="space-y-3.5 text-[15px]">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--gold)]/60 transition-colors shadow-sm"
          >
            <span className="font-bold text-[var(--text)] block text-[15px]">
              {item.title}
            </span>
            <p className="text-sm text-[var(--muted)] mt-1.5 pl-2.5 leading-relaxed font-normal border-l-2 border-[var(--gold)]">
              {item.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
