import type { KundliReport } from "@/lib/astrology";

const htmlEntities: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

export function printKundliReport(report: KundliReport, reportId?: string) {
  const planetRows = report.planets.map((planet) =>
    "<tr><td>" + escapeHtml(planet.name) + "</td><td>" + escapeHtml(planet.sign) + "</td><td>" +
    escapeHtml(planet.degreeInSign.toFixed(4) + "°") + "</td><td>" + escapeHtml(planet.house) +
    "</td><td>" + escapeHtml(planet.nakshatra) + " · Pada " + escapeHtml(planet.nakshatraPada) +
    "</td><td>" + escapeHtml(planet.navamsaSign) + "</td></tr>"
  ).join("");
  const dashaRows = report.vimshottari.periods.map((period) =>
    "<tr><td>" + escapeHtml(period.lord) + "</td><td>" + escapeHtml(period.start) +
    "</td><td>" + escapeHtml(period.end) + "</td><td>" + escapeHtml(period.years) + "</td></tr>"
  ).join("");
  const generated = escapeHtml(new Date(report.generatedAt).toLocaleString());
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vedic AI Kundli Report</title><style>
  :root{color-scheme:light}*{box-sizing:border-box}body{font:14px/1.5 Arial,sans-serif;color:#222;background:#fff;margin:0;padding:36px}header{border-bottom:2px solid #b58b3b;padding-bottom:18px;margin-bottom:24px}h1{font-size:28px;margin:0 0 5px}h2{font-size:17px;margin:28px 0 10px}p{margin:5px 0}.muted{color:#666;font-size:12px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.card{border:1px solid #ddd;border-radius:8px;padding:12px}.card strong{display:block;font-size:16px;margin-top:5px}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:10px}th,td{padding:8px;border:1px solid #ddd;text-align:left}th{background:#f5f1e8}footer{border-top:1px solid #ddd;margin-top:28px;padding-top:12px;color:#666;font-size:10px}.actions{margin-bottom:20px}button{border:0;border-radius:6px;padding:10px 14px;background:#d4b77a;font-weight:700;cursor:pointer}@media print{body{padding:0}.actions{display:none}h2{break-after:avoid}table{break-inside:auto}tr{break-inside:avoid;break-after:auto}header,.card{break-inside:avoid}@page{size:A4;margin:14mm}}@media(max-width:600px){body{padding:18px}.grid{grid-template-columns:1fr}table{font-size:10px}th,td{padding:5px}}
  </style></head><body><div class="actions"><button onclick="window.print()">Print / Save as PDF</button><p class="muted">In the print dialog, choose “Save as PDF” as the destination.</p></div>
  <header><p class="muted">VEDIC AI · TRADITIONAL JYOTISH REPORT</p><h1>${escapeHtml(report.birth.place)}</h1><p>Birth date: ${escapeHtml(report.birth.date)} · Local time: ${escapeHtml(report.birth.time)} (${escapeHtml(report.birth.timezone)})</p><p class="muted">Generated: ${generated}${reportId ? " · Report ID: " + escapeHtml(reportId) : ""}</p></header>
  <div class="grid"><div class="card">Ascendant<strong>${escapeHtml(report.ascendant.sign)}</strong><p class="muted">${escapeHtml(report.ascendant.degreeInSign.toFixed(3))}° · ${escapeHtml(report.ascendant.nakshatra)}</p></div><div class="card">Moon nakshatra<strong>${escapeHtml(report.planets.find((p) => p.name === "Moon")?.nakshatra || "—")}</strong><p class="muted">Calculated placement</p></div><div class="card">Current Mahadasha<strong>${escapeHtml(report.vimshottari.currentMahadasha.lord)}</strong><p class="muted">${escapeHtml(report.vimshottari.currentMahadasha.start)} – ${escapeHtml(report.vimshottari.currentMahadasha.end)}</p></div></div>
  <h2>Planetary positions</h2><table><thead><tr><th>Graha</th><th>Sign</th><th>Degree</th><th>House</th><th>Nakshatra</th><th>Navamsa sign</th></tr></thead><tbody>${planetRows}</tbody></table>
  <h2>Vimshottari periods (engine output)</h2><table><thead><tr><th>Mahadasha</th><th>Start</th><th>End</th><th>Years</th></tr></thead><tbody>${dashaRows}</tbody></table>
  <h2>Calculation details</h2><p>Ayanamsha: ${escapeHtml(report.ayanamsha.name)} (${escapeHtml(report.ayanamsha.degrees.toFixed(5))}°)</p><p>Zodiac: ${escapeHtml(report.zodiac)} · House system: ${escapeHtml(report.houseSystem)} · Engine: ${escapeHtml(report.engine)} ${escapeHtml(report.engineVersion)}</p>
  <footer><strong>Important limitation:</strong> ${escapeHtml(report.disclaimer)} This report reflects the application's current calculation engine and is not a guarantee of astrological accuracy or a substitute for professional advice. Verify all placements against a trusted reference before relying on them.</footer></body></html>`;
  const preview = window.open("", "_blank", "width=900,height=700");
  if (!preview) throw new Error("The report preview was blocked. Allow pop-ups for this site, then try again.");
  preview.opener = null;
  preview.document.open();
  preview.document.write(html);
  preview.document.close();
  preview.focus();
}
