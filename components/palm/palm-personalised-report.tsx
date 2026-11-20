"use client";

import React from "react";
import type { ParsedPalmReport } from "@/lib/palm-parser";

interface PalmPersonalisedReportProps {
  report: ParsedPalmReport;
  highlightedSection?: string | null;
  language?: "en" | "hi" | "hinglish";
}

export default function PalmPersonalisedReport({
  report,
  highlightedSection = null,
  language = "en",
}: PalmPersonalisedReportProps) {
  const isHi = language === "hi";

  const items = [
    {
      id: "overallStructure",
      title: isHi ? "1. हथेली की समग्र बनावट" : "1. Overall palm structure",
      body: report.overallStructure,
    },
    {
      id: "heartLine",
      title: isHi ? "2. हृदय रेखा (भावनाएं व संबंध)" : "2. Heart line interpretation",
      body: report.heartLine,
    },
    {
      id: "headLine",
      title: isHi ? "3. मस्तिष्क रेखा (बुद्धि व निर्णय)" : "3. Head line interpretation",
      body: report.headLine,
    },
    {
      id: "lifeLine",
      title: isHi ? "4. जीवन रेखा (प्राणशक्ति व स्थिरता)" : "4. Life line interpretation",
      body: report.lifeLine,
    },
    {
      id: "fateLine",
      title: isHi ? "5. भाग्य रेखा (करियर व कर्म)" : "5. Fate line interpretation",
      body: report.fateLine,
    },
    {
      id: "thumbCharacteristics",
      title: isHi ? "6. अंगूठे की विशेषताएं" : "6. Thumb characteristics",
      body: report.thumbCharacteristics,
    },
    {
      id: "fingerProportions",
      title: isHi ? "7. उंगलियों का अनुपात" : "7. Finger proportions",
      body: report.fingerProportions,
    },
    {
      id: "mountOfVenus",
      title: isHi ? "8. शुक्र पर्वत" : "8. Mount of Venus",
      body: report.mountOfVenus,
    },
    {
      id: "mountOfJupiter",
      title: isHi ? "9. बृहस्पति (गुरु) पर्वत" : "9. Mount of Jupiter",
      body: report.mountOfJupiter,
    },
    {
      id: "synthesis",
      title: isHi ? "10. सम्पूर्ण हस्तरेखा विश्लेषण व निष्कर्ष" : "10. Combined left and right palm interpretation",
      body: report.synthesis,
    },
  ];

  return (
    <section className="mb-10 font-sans-luxury" data-purpose="report-numbered-index">
      <h2 className="text-[22px] font-semibold text-[var(--gold)] mb-5 tracking-tight font-serif-luxury">
        {isHi ? "आपकी व्यक्तिगत हस्तरेखा रिपोर्ट" : "Your personalised report"}
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
                    {isHi ? "वाचन सक्रिय" : "Spoken Now"}
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
