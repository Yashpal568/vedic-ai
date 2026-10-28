import { SIGNS, type KundliReport } from "@/lib/astrology";

const htmlEntities: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
};
function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}
function readableDate(value: string, timezone?: string): string {
  const date = new Date(value.length === 10 ? value + "T12:00:00" : value);
  if (!Number.isFinite(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", ...(timezone ? { timeZone: timezone } : { timeZone: "UTC" }) }).format(date);
  } catch { return value; }
}
function readableDateTime(value: string, timezone: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(date);
  } catch { return readableDate(value); }
}
function chartSvg(report: KundliReport): string {
  const houses = [
    { house: 1, x: 200, y: 44 }, { house: 2, x: 104, y: 65 }, { house: 3, x: 60, y: 122 },
    { house: 4, x: 52, y: 200 }, { house: 5, x: 60, y: 278 }, { house: 6, x: 104, y: 335 },
    { house: 7, x: 200, y: 356 }, { house: 8, x: 296, y: 335 }, { house: 9, x: 340, y: 278 },
    { house: 10, x: 348, y: 200 }, { house: 11, x: 340, y: 122 }, { house: 12, x: 296, y: 65 },
  ];
  const houseContents = houses.map(({ house, x, y }) => {
    const sign = SIGNS[(report.ascendant.signIndex + house - 1) % 12];
    const planets = report.planets.filter((planet) => planet.house === house).map((planet) => planet.name === "Mercury" ? "Merc" : planet.name === "Jupiter" ? "Jup" : planet.name === "Saturn" ? "Sat" : planet.name.slice(0, 3)).join(" · ");
    const isLagna = house === 1;
    return `<g><text x="${x}" y="${y - 13}" class="house">${isLagna ? "LAGNA · " : "H" + house + " · "}${escapeHtml(sign)}</text><text x="${x}" y="${y + 3}" class="planet">${escapeHtml(planets || "—")}</text></g>`;
  }).join("");
  return `<svg class="kundli-chart" viewBox="0 0 400 400" role="img" aria-label="North Indian style birth chart">
    <rect x="1" y="1" width="398" height="398" rx="5" fill="#fffdf7" stroke="#b68d45" stroke-width="2"/>
    <path d="M1 1 L399 399 M399 1 L1 399 M200 1 L399 200 L200 399 L1 200 Z" fill="none" stroke="#b68d45" stroke-width="1.4"/>
    <path d="M1 1 L200 200 L399 1 M1 399 L200 200 L399 399" fill="none" stroke="#b68d45" stroke-width="1.4"/>
    <circle cx="200" cy="200" r="34" fill="#f6edd9" stroke="#e5d4ae"/>
    <text x="200" y="196" class="center">JANMA</text><text x="200" y="212" class="center">KUNDLI</text>
    ${houseContents}
  </svg>`;
}

export function printKundliReport(report: KundliReport, reportId?: string) {
  const generated = readableDateTime(report.generatedAt, report.birth.timezone);
  const birthDate = readableDate(report.birth.date, report.birth.timezone);
  const planetRows = report.planets.map((planet) =>
    `<tr><td><strong>${escapeHtml(planet.name)}</strong></td><td>${escapeHtml(planet.sign)}</td><td>${escapeHtml(planet.degreeInSign.toFixed(2) + "°")}</td><td>${escapeHtml(planet.house)}</td><td>${escapeHtml(planet.nakshatra)} <span class="muted">· Pada ${escapeHtml(planet.nakshatraPada)}</span></td><td>${escapeHtml(planet.navamsaSign || "—")}</td><td>${escapeHtml(planet.dashamsaSign || "—")}</td></tr>`
  ).join("");
  const dashaRows = report.vimshottari.periods.map((period) =>
    `<tr><td><strong>${escapeHtml(period.lord)}</strong></td><td>${escapeHtml(readableDate(period.start, report.birth.timezone))}</td><td>${escapeHtml(readableDate(period.end, report.birth.timezone))}</td><td>${escapeHtml(period.years)}</td></tr>`
  ).join("");
  const yogaCandidates = Array.isArray(report.yogaCandidates) ? report.yogaCandidates : [];
  const yogaHtml = yogaCandidates.length
    ? `<div class="yoga-grid">${yogaCandidates.map((yoga) => `<article class="yoga-card"><strong>${escapeHtml(yoga.name)}</strong><p>${escapeHtml(yoga.reason)}</p></article>`).join("")}</div>`
    : `<p class="muted callout">No yoga candidates were recorded in this report. The current engine does not perform a complete classical yoga assessment.</p>`;
  const panchangHtml = report.panchang
    ? `<div class="panchang-grid"><div><span>Paksha</span><strong>${escapeHtml(report.panchang.paksha)}</strong></div><div><span>Tithi</span><strong>${escapeHtml(report.panchang.tithi)}</strong></div><div><span>Yoga</span><strong>${escapeHtml(report.panchang.yoga)}</strong></div><div><span>Karana</span><strong>${escapeHtml(report.panchang.karana)}</strong></div><div><span>Vara</span><strong>${escapeHtml(report.panchang.vara)}</strong></div></div><p class="muted note">${escapeHtml(report.panchang.note)}</p>`
    : `<p class="muted">Panchang data was not included in this saved report.</p>`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vedic AI · Janma Kundli Report</title><style>
  :root{color-scheme:light;--ink:#202a35;--muted:#65717b;--gold:#a57a31;--gold-line:#dfcfac;--paper:#fffefa;--wash:#f7f3e9}
  *{box-sizing:border-box}html,body{margin:0;padding:0;background:#edf0f3;color:var(--ink);font:10pt/1.5 "Arial",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .toolbar{max-width:900px;margin:18px auto;padding:12px 16px;background:#fff;border:1px solid #dfe3e8;border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:12px}
  .toolbar p{margin:0;color:var(--muted);font-size:9pt}.toolbar button{border:0;border-radius:8px;padding:11px 16px;background:#cda95e;color:#211b10;font-weight:700}
  .report-page{position:relative;width:210mm;min-height:273mm;margin:18px auto;padding:0;background:var(--paper);box-shadow:0 8px 32px #24324418;overflow:hidden}
  .page-inner{padding:14mm 15mm 15mm}.brandline{display:flex;align-items:center;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid var(--gold-line);color:var(--gold);font-size:8pt;font-weight:700;letter-spacing:1.7px;text-transform:uppercase}
  .page-number{color:#8a9299;font-size:8pt;letter-spacing:.5px}.eyebrow{margin:22px 0 7px;color:var(--gold);font-size:8pt;font-weight:700;letter-spacing:2px;text-transform:uppercase}
  h1{margin:0;color:#18232e;font:700 27pt/1.14 Georgia,serif;letter-spacing:-.6px}h2{margin:0 0 12px;font-size:14pt;line-height:1.25;color:#25323e}h3{margin:0 0 5px;font-size:10pt;color:#263442}
  p{margin:6px 0}.subtitle{margin-top:10px;color:var(--muted);font-size:11pt}.birth-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:15px}.meta-pill{padding:7px 10px;border:1px solid #e4e0d6;border-radius:8px;background:#fff;font-size:8.5pt}.meta-pill strong{color:#3a4651}
  .summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:19px 0 17px}.summary-card{padding:12px;border:1px solid #e4dfd1;border-radius:10px;background:linear-gradient(145deg,#fffefa,#faf7ef);break-inside:avoid}.summary-card span{display:block;color:var(--muted);font-size:8pt}.summary-card strong{display:block;margin-top:6px;color:#886322;font:700 14pt/1.2 Georgia,serif}.summary-card small{display:block;margin-top:4px;color:var(--muted);font-size:8pt}
  .chart-layout{display:grid;grid-template-columns:1.05fr .95fr;gap:19px;align-items:center;margin-top:13px;padding:15px;border:1px solid #e4dfd1;border-radius:13px;background:#fff}.chart-copy p{color:var(--muted);font-size:9pt}.kundli-chart{display:block;width:100%;max-width:290px;margin:0 auto}.kundli-chart .house{text-anchor:middle;fill:#75551e;font-size:9px;font-weight:700}.kundli-chart .planet{text-anchor:middle;fill:#344250;font-size:9px}.kundli-chart .center{text-anchor:middle;fill:#795a23;font-size:9px;font-weight:700;letter-spacing:.5px}
  .section-head{display:flex;align-items:end;justify-content:space-between;gap:15px;margin:22px 0 10px;padding-bottom:8px;border-bottom:1px solid #e7e0d1}.section-head p{margin:0;color:var(--muted);font-size:8pt}
  table{width:100%;border-collapse:collapse;font-size:8.3pt;line-height:1.35;margin:8px 0 15px}thead{display:table-header-group}th{padding:8px 6px;background:#f1ead8;color:#55472b;text-align:left;font-size:7.2pt;letter-spacing:.35px;text-transform:uppercase;border-bottom:1px solid #d7c49b}td{padding:7px 6px;border-bottom:1px solid #e7e8e7;text-align:left;vertical-align:top}tbody tr:nth-child(even){background:#faf9f5}tr{break-inside:avoid}td strong{color:#2d3a45}
  .muted{color:var(--muted)}.note{font-size:8pt;line-height:1.5}.callout{padding:11px 13px;border-left:3px solid #c4a15d;background:#f8f4e9;border-radius:0 7px 7px 0}
  .panchang-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}.panchang-grid>div{padding:10px 8px;border:1px solid #e6e0d2;border-radius:8px;background:#fff}.panchang-grid span{display:block;color:var(--muted);font-size:7.5pt}.panchang-grid strong{display:block;margin-top:4px;font-size:9pt}
  .yoga-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.yoga-card{padding:10px;border:1px solid #e6e0d2;border-radius:8px;background:#fff;break-inside:avoid}.yoga-card strong{color:#7d5b20}.yoga-card p{margin:4px 0 0;color:#5e6871;font-size:8.5pt}
  .detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.detail-item{padding:10px;border:1px solid #e4e0d6;border-radius:8px}.detail-item span{display:block;color:var(--muted);font-size:8pt}.detail-item strong{display:block;margin-top:4px;font-size:9pt;overflow-wrap:anywhere}
  .report-footer{margin-top:18px;padding-top:10px;border-top:1px solid var(--gold-line);font-size:8pt;color:#68727a}.report-footer strong{color:#34404a}.disclaimer{padding:11px 13px;border-radius:8px;background:#f5f2e9;color:#5c625f;font-size:8pt;line-height:1.6}
  @page{size:A4;margin:12mm}
  @media print{html,body{background:#fff}.toolbar{display:none}.report-page{width:auto;min-height:0;margin:0;box-shadow:none;overflow:visible;break-after:page;page-break-after:always}.report-page:last-of-type{break-after:auto;page-break-after:auto}.page-inner{padding:0}.eyebrow{margin-top:15px}h2,.section-head{break-after:avoid}table{break-inside:auto}tr{break-inside:avoid}a{color:inherit;text-decoration:none}}
  @media screen and (max-width:760px){.report-page{width:100%;min-height:0;margin:0 0 14px;box-shadow:0 8px 32px #24324418}.page-inner{padding:24px 18px}.chart-layout{grid-template-columns:1fr}.kundli-chart{max-width:300px}.summary-grid{gap:6px}.summary-card{padding:9px}.summary-card strong{font-size:12pt}.panchang-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.panchang-grid>div:last-child{grid-column:1/-1}}
  </style></head><body>
  <div class="toolbar"><p>Review your report, then choose <strong>Save as PDF</strong> in your browser's print menu.</p><button onclick="window.print()">Print / Save PDF</button></div>
  <main>
    <section class="report-page"><div class="page-inner">
      <div class="brandline"><span>Vedic AI · Janma Kundli</span><span class="page-number">PERSONAL REPORT</span></div>
      <p class="eyebrow">Your birth chart</p><h1>${escapeHtml(report.birth.place)}</h1>
      <p class="subtitle">A structured overview of your Vedic birth chart and traditional Jyotish placements.</p>
      <div class="birth-meta"><span class="meta-pill"><strong>Birth date:</strong> ${escapeHtml(birthDate)}</span><span class="meta-pill"><strong>Local time:</strong> ${escapeHtml(report.birth.time)}</span><span class="meta-pill"><strong>Timezone:</strong> ${escapeHtml(report.birth.timezone)}</span></div>
      <div class="summary-grid">
        <div class="summary-card"><span>Ascendant (Lagna)</span><strong>${escapeHtml(report.ascendant.sign)}</strong><small>${escapeHtml(report.ascendant.degreeInSign.toFixed(2))}° · ${escapeHtml(report.ascendant.nakshatra)}</small></div>
        <div class="summary-card"><span>Moon nakshatra</span><strong>${escapeHtml(report.planets.find((p) => p.name === "Moon")?.nakshatra || "—")}</strong><small>Calculated placement</small></div>
        <div class="summary-card"><span>Current Mahadasha</span><strong>${escapeHtml(report.vimshottari.currentMahadasha.lord)}</strong><small>${escapeHtml(readableDate(report.vimshottari.currentMahadasha.start, report.birth.timezone))} – ${escapeHtml(readableDate(report.vimshottari.currentMahadasha.end, report.birth.timezone))}</small></div>
      </div>
      <div class="section-head"><h2>Janma Kundli chart</h2><p>North Indian style · Whole-sign houses</p></div>
      <div class="chart-layout"><div>${chartSvg(report)}</div><div class="chart-copy"><h3>Reading your chart</h3><p><strong>Lagna:</strong> ${escapeHtml(report.ascendant.sign)} at ${escapeHtml(report.ascendant.degreeInSign.toFixed(2))}°.</p><p><strong>Moon nakshatra:</strong> ${escapeHtml(report.planets.find((p) => p.name === "Moon")?.nakshatra || "—")}.</p><p>This diagram visualizes the calculated house and sign placements recorded in this report. Use the planetary table on the next page for the detailed values.</p></div></div>
      <div class="report-footer"><strong>Generated:</strong> ${escapeHtml(generated)}${reportId ? " · Report ID: " + escapeHtml(reportId) : ""}<br/>This report presents the application's current calculation output; see the final page for calculation notes and limitations.</div>
    </div></section>
    <section class="report-page"><div class="page-inner">
      <div class="brandline"><span>Vedic AI · Planetary details</span><span class="page-number">02 / 03</span></div>
      <div class="section-head"><h2>Planetary positions</h2><p>Calculated graha placements</p></div>
      <table><thead><tr><th>Graha</th><th>Sign</th><th>Degree</th><th>House</th><th>Nakshatra</th><th>D9 Navamsa</th><th>D10 Dashamsa</th></tr></thead><tbody>${planetRows}</tbody></table>
      <div class="section-head"><h2>Birth Panchang</h2><p>Experimental calculation</p></div>${panchangHtml}
      <div class="section-head"><h2>Yoga candidates</h2><p>Indicative only</p></div>${yogaHtml}
      <p class="muted note">Yoga candidates use simplified heuristics and are not a complete classical yoga assessment.</p>
      <div class="report-footer">The planetary values above are shown as returned by the current calculation engine. For interpretation, distinguish calculated placements from traditional symbolic meanings.</div>
    </div></section>
    <section class="report-page"><div class="page-inner">
      <div class="brandline"><span>Vedic AI · Timing & methods</span><span class="page-number">03 / 03</span></div>
      <div class="section-head"><h2>Vimshottari Mahadasha periods</h2><p>Engine output · dates in ${escapeHtml(report.birth.timezone)}</p></div>
      <table><thead><tr><th>Mahadasha</th><th>Start date</th><th>End date</th><th>Years</th></tr></thead><tbody>${dashaRows}</tbody></table>
      <div class="section-head"><h2>Calculation details</h2><p>Reference information</p></div>
      <div class="detail-grid">
        <div class="detail-item"><span>Ayanamsha</span><strong>${escapeHtml(report.ayanamsha.name)} · ${escapeHtml(report.ayanamsha.degrees.toFixed(4))}°</strong></div>
        <div class="detail-item"><span>Zodiac</span><strong>${escapeHtml(report.zodiac)}</strong></div>
        <div class="detail-item"><span>House system</span><strong>${escapeHtml(report.houseSystem.replace("_", " "))}</strong></div>
        <div class="detail-item"><span>Calculation engine</span><strong>${escapeHtml(report.engine)} · ${escapeHtml(report.engineVersion)}</strong></div>
        <div class="detail-item"><span>Birth location</span><strong>${escapeHtml(report.birth.latitude.toFixed(4))}, ${escapeHtml(report.birth.longitude.toFixed(4))}</strong></div>
        <div class="detail-item"><span>UTC birth time</span><strong>${escapeHtml(readableDateTime(report.birth.utc, "UTC"))}</strong></div>
      </div>
      <div class="section-head"><h2>Important notes</h2></div>
      <p class="disclaimer">${escapeHtml(report.disclaimer)} This report reflects the application's current calculation engine and is not a guarantee of astrological accuracy or a substitute for professional advice. Verify placements against a trusted reference before relying on them. Birth Panchang and yoga candidates are marked experimental where applicable.</p>
      <div class="report-footer"><strong>Vedic AI</strong> · A learning companion for exploring traditional Jyotish concepts.<br/>Generated on ${escapeHtml(generated)}${reportId ? " · Report ID: " + escapeHtml(reportId) : ""}</div>
    </div></section>
  </main></body></html>`;
  const preview = window.open("", "_blank", "width=980,height=820");
  if (!preview) throw new Error("The report preview was blocked. Allow pop-ups for this site, then try again.");
  preview.opener = null;
  preview.document.open();
  preview.document.write(html);
  preview.document.close();
  preview.focus();
}
