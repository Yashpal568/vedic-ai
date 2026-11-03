import { SIGNS, type KundliReport, type PlanetPosition } from "@/lib/astrology";

const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

function readableDate(value: string, timezone?: string): string {
  const date = new Date(value.length === 10 ? value + "T12:00:00" : value);
  if (!Number.isFinite(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(timezone ? { timeZone: timezone } : { timeZone: "UTC" }),
    }).format(date);
  } catch {
    return value;
  }
}

function readableDateTime(value: string, timezone: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    }).format(date);
  } catch {
    return readableDate(value);
  }
}

const SIGN_ELEMENTS: Record<string, "fire" | "earth" | "air" | "water"> = {
  Aries: "fire", Leo: "fire", Sagittarius: "fire",
  Taurus: "earth", Virgo: "earth", Capricorn: "earth",
  Gemini: "air", Libra: "air", Aquarius: "air",
  Cancer: "water", Scorpio: "water", Pisces: "water",
};

const PLANET_PLAIN_THEMES: Record<string, string> = {
  Sun: "Identity, core vitality & purpose",
  Moon: "Emotions, mental calm & habits",
  Mars: "Initiative, drive & courage",
  Mercury: "Communication, logic & learning",
  Jupiter: "Wisdom, expansion & guidance",
  Venus: "Affection, relationships & creativity",
  Saturn: "Patience, discipline & steady effort",
  Rahu: "Ambition, innovation & worldly focus",
  Ketu: "Introspection, letting go & insight",
};

// Calculate current Antardasha within the current Mahadasha
function getAntardashaInfo(report: KundliReport): { lord: string; start: string; end: string } {
  const currentMaha = report.vimshottari.currentMahadasha;
  const mahaLord = currentMaha.lord;
  const VIMSHOTTARI_LORDS = [
    { lord: "Ketu", years: 7 },
    { lord: "Venus", years: 20 },
    { lord: "Sun", years: 6 },
    { lord: "Moon", years: 10 },
    { lord: "Mars", years: 7 },
    { lord: "Rahu", years: 18 },
    { lord: "Jupiter", years: 16 },
    { lord: "Saturn", years: 19 },
    { lord: "Mercury", years: 17 },
  ];

  const startIndex = VIMSHOTTARI_LORDS.findIndex((v) => v.lord === mahaLord);
  if (startIndex === -1) return { lord: mahaLord, start: currentMaha.start, end: currentMaha.end };

  const mahaYears = VIMSHOTTARI_LORDS[startIndex].years;
  const mStart = new Date(currentMaha.start).getTime();
  const now = Date.now();

  let cursor = mStart;
  for (let i = 0; i < 9; i++) {
    const subLord = VIMSHOTTARI_LORDS[(startIndex + i) % 9];
    const subYears = (mahaYears * subLord.years) / 120;
    const subDurationMs = subYears * 365.2425 * 86400000;
    const subEnd = cursor + subDurationMs;
    if (now >= cursor && now < subEnd) {
      return {
        lord: subLord.lord,
        start: new Date(cursor).toISOString(),
        end: new Date(subEnd).toISOString(),
      };
    }
    cursor = subEnd;
  }
  return { lord: mahaLord, start: currentMaha.start, end: currentMaha.end };
}

// Generate human-readable ChatGPT/Gemini style personality overview
function generatePersonalitySummary(report: KundliReport): string {
  const lagna = report.ascendant.sign;
  const element = SIGN_ELEMENTS[lagna] || "earth";
  const moon = report.planets.find((p) => p.name === "Moon");
  const sun = report.planets.find((p) => p.name === "Sun");

  const elementDescriptions = {
    earth: "Your birth chart suggests a grounded, thoughtful, and pragmatic nature. You tend to approach life with common sense, valuing stability and dependable results over rushed decisions.",
    fire: "Your birth chart indicates natural vitality, enthusiasm, and a self-starting spirit. You generally prefer taking positive action, inspiring others, and following through on what you genuinely care about.",
    air: "Your birth chart reflects a curious, communicative, and open-minded disposition. You thrive on exchanging ideas, exploring fresh perspectives, and maintaining social connections with people from diverse backgrounds.",
    water: "Your birth chart highlights deep emotional perception, empathy, and intuitive understanding. You are naturally reflective and value authentic, trustworthy connections where you feel safe and respected.",
  };

  const moonText = moon
    ? ` With your Moon in ${moon.sign} (${moon.nakshatra} nakshatra), your inner emotional landscape is anchored in ${moon.sign === "Taurus" || moon.sign === "Cancer" ? "comfort, nurturing, and steady loyalty" : moon.sign === "Scorpio" || moon.sign === "Aries" ? "intensity, passionate focus, and deep resolve" : "adaptability, balanced reasoning, and thoughtful reflection"}.`
    : "";

  const sunText = sun
    ? ` The placement of the Sun in ${sun.sign} in House ${sun.house} further emphasizes an ambition to express your individuality with integrity and quiet self-respect.`
    : "";

  return `${elementDescriptions[element]}${moonText}${sunText} Rather than seeing these tendencies as rigid limits, traditional Jyotish treats them as your natural starting baseline.`;
}

// Generate human-readable ChatGPT/Gemini style career overview
function generateCareerSummary(report: KundliReport): string {
  const h10Sign = SIGNS[(report.ascendant.signIndex + 9) % 12];
  const p10 = report.planets.filter((p) => p.house === 10);
  const maha = report.vimshottari.currentMahadasha.lord;

  let base = `Your 10th house of profession falls in ${h10Sign}, highlighting the importance of patience, clear principles, and structured professional growth.`;
  if (p10.length > 0) {
    base += ` Having ${p10.map((p) => p.name).join(" and ")} placed in your 10th house brings direct focus to leadership, specialized skills, and visible contributions in your chosen field.`;
  } else {
    base += ` You may benefit most from mastering one foundational area of expertise and building credibility gradually rather than making abrupt occupational shifts.`;
  }
  base += ` Your ongoing ${maha} Mahadasha encourages conscious discipline and steady alignment with your long-term goals.`;
  return base;
}

// Generate human-readable relationship overview
function generateRelationshipSummary(report: KundliReport): string {
  const h7Sign = SIGNS[(report.ascendant.signIndex + 6) % 12];
  const venus = report.planets.find((p) => p.name === "Venus");
  const p7 = report.planets.filter((p) => p.house === 7);

  let text = `In partnerships, your 7th house in ${h7Sign} values honest communication, mutual respect, and emotional balance.`;
  if (p7.length > 0) {
    text += ` With ${p7.map((p) => p.name).join(", ")} in your 7th house, close relationships serve as major catalysts for personal growth and mutual accountability.`;
  } else {
    text += ` You tend to look for companions who offer genuine loyalty and complement your practical style of living.`;
  }
  if (venus) {
    text += ` Venus in ${venus.sign} encourages warmth, harmony, and appreciation for shared creative or domestic comforts.`;
  }
  return text;
}

// Generate human-readable finances overview
function generateFinancesSummary(report: KundliReport): string {
  const h2Sign = SIGNS[(report.ascendant.signIndex + 1) % 12];
  const h11Sign = SIGNS[(report.ascendant.signIndex + 10) % 12];
  const jupiter = report.planets.find((p) => p.name === "Jupiter");

  return `Financial stability in your chart is influenced by ${h2Sign} (2nd house of resources) and ${h11Sign} (11th house of gains). Traditional indicators emphasize steady accumulation, disciplined budgeting, and diversified long-term planning over speculative shortcuts. Jupiter placed in ${jupiter?.sign || "a supportive sign"} reinforces the value of knowledge-based endeavors and ethical financial habits.`;
}

// Generate human-readable personal growth overview
function generatePersonalGrowthSummary(report: KundliReport): string {
  const antardasha = getAntardashaInfo(report);
  const maha = report.vimshottari.currentMahadasha.lord;

  return `Your current planetary cycle (${maha} Mahadasha · ${antardasha.lord} Antardasha) presents a constructive window for self-awareness, skill refinement, and building healthy personal boundaries. Use this period to balance ambitious outer goals with adequate mental rest and regular daily routines.`;
}

// Generate North Indian Kundli SVG Chart
function generateChartSvg(report: KundliReport): string {
  const houses = [
    { house: 1, x: 200, y: 56 },
    { house: 2, x: 104, y: 72 },
    { house: 3, x: 62, y: 128 },
    { house: 4, x: 56, y: 200 },
    { house: 5, x: 62, y: 272 },
    { house: 6, x: 104, y: 328 },
    { house: 7, x: 200, y: 344 },
    { house: 8, x: 296, y: 328 },
    { house: 9, x: 338, y: 272 },
    { house: 10, x: 344, y: 200 },
    { house: 11, x: 338, y: 128 },
    { house: 12, x: 296, y: 72 },
  ];

  const houseContents = houses.map(({ house, x, y }) => {
    const sign = SIGNS[(report.ascendant.signIndex + house - 1) % 12];
    const planets = report.planets
      .filter((planet) => planet.house === house)
      .map((planet) => {
        const retro = planet.retrograde ? "®" : "";
        const short = planet.name === "Mercury" ? "Merc" : planet.name === "Jupiter" ? "Jup" : planet.name === "Saturn" ? "Sat" : planet.name.slice(0, 3);
        return short + retro;
      })
      .join(" ");

    const isLagna = house === 1;
    return `<g>
      <text x="${x}" y="${y - 12}" class="chart-house">${isLagna ? "LAGNA · " : "H" + house + " · "}${escapeHtml(sign)}</text>
      <text x="${x}" y="${y + 5}" class="chart-planets">${escapeHtml(planets || "—")}</text>
    </g>`;
  }).join("");

  return `<svg class="kundli-svg" viewBox="0 0 400 400" role="img" aria-label="North Indian Vedic Birth Chart">
    <rect x="2" y="2" width="396" height="396" rx="6" fill="#fffdfa" stroke="#0f172a" stroke-width="2.5"/>
    <path d="M200 2 L398 200 L200 398 L2 200 Z" fill="none" stroke="#b88728" stroke-width="2"/>
    <path d="M2 2 L200 200 M398 2 L200 200 M2 398 L200 200 M398 398 L200 200" fill="none" stroke="#b88728" stroke-width="1.6"/>
    <circle cx="200" cy="200" r="32" fill="#faf6ec" stroke="#d5bd8a" stroke-width="1.4"/>
    <text x="200" y="196" class="chart-center-title">JANMA</text>
    <text x="200" y="211" class="chart-center-sub">KUNDLI</text>
    ${houseContents}
  </svg>`;
}

export function generateKundliPrintHtml(report: KundliReport, reportId?: string): string {
  const generated = readableDateTime(report.generatedAt, report.birth.timezone);
  const birthDate = readableDate(report.birth.date, report.birth.timezone);
  const moon = report.planets.find((p) => p.name === "Moon");
  const sun = report.planets.find((p) => p.name === "Sun");
  const antardasha = getAntardashaInfo(report);

  // Key planetary highlights
  const exaltedPlanets = report.planets.filter((p) =>
    (p.name === "Sun" && p.sign === "Aries") ||
    (p.name === "Moon" && p.sign === "Taurus") ||
    (p.name === "Mars" && p.sign === "Capricorn") ||
    (p.name === "Mercury" && p.sign === "Virgo") ||
    (p.name === "Jupiter" && p.sign === "Cancer") ||
    (p.name === "Venus" && p.sign === "Pisces") ||
    (p.name === "Saturn" && p.sign === "Libra")
  );
  const kendraPlanets = report.planets.filter((p) => [1, 4, 7, 10].includes(p.house));

  const planetRows = report.planets.map((planet: PlanetPosition) => {
    const retroTag = planet.retrograde ? " <span class='retro-badge'>®</span>" : "";
    const theme = PLANET_PLAIN_THEMES[planet.name] || "Life theme";
    const degStr = `${planet.degreeInSign.toFixed(2)}°`;
    return `<tr>
      <td><strong>${escapeHtml(planet.name)}</strong>${retroTag}</td>
      <td>${escapeHtml(planet.sign)}</td>
      <td>${degStr}</td>
      <td><strong>H${escapeHtml(planet.house)}</strong></td>
      <td>${escapeHtml(planet.nakshatra)} <small>(P${escapeHtml(planet.nakshatraPada)})</small></td>
      <td>${escapeHtml(planet.navamsaSign || "—")}</td>
      <td>${escapeHtml(theme)}</td>
    </tr>`;
  }).join("");

  const panchang = report.panchang;
  const yogaCandidates = Array.isArray(report.yogaCandidates) ? report.yogaCandidates : [];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vedic AI · Janma Kundli Report · Two-Page A4</title>
  <style>
    :root {
      --navy: #0f172a;
      --navy-light: #1e293b;
      --gold: #b88728;
      --gold-dark: #926c20;
      --gold-light: #fef9ee;
      --gold-border: #dfcaa0;
      --ink: #1e293b;
      --muted: #64748b;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --sheet-bg: #ffffff;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      background: #eef2f6;
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 8.5pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      max-width: 210mm;
      margin: 16px auto;
      padding: 12px 20px;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 14px rgba(0,0,0,0.06);
    }
    .toolbar-info p {
      font-size: 9.5pt;
      color: var(--navy);
      font-weight: 600;
    }
    .toolbar-info span {
      font-size: 8pt;
      color: var(--muted);
    }
    .toolbar button {
      background: var(--navy);
      color: #ffffff;
      border: 1px solid var(--gold);
      border-radius: 8px;
      padding: 10px 20px;
      font-weight: 700;
      font-size: 9pt;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(15,23,42,0.25);
    }
    .toolbar button:hover {
      background: #1e293b;
    }

    /* EXACT TWO-PAGE A4 CONTAINER */
    .pdf-page {
      position: relative;
      width: 210mm;
      height: 297mm;
      margin: 16px auto;
      padding: 12mm 14mm 10mm 14mm;
      background: var(--sheet-bg);
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.12);
      box-sizing: border-box;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* HEADER & BRANDLINE */
    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 7px;
      border-bottom: 1.5px solid var(--gold);
      margin-bottom: 10px;
    }
    .brand-title {
      font-size: 11pt;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--navy);
    }
    .brand-title span {
      color: var(--gold);
    }
    .page-indicator {
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: var(--gold-dark);
      background: var(--gold-light);
      border: 1px solid var(--gold-border);
      padding: 3px 9px;
      border-radius: 12px;
      text-transform: uppercase;
    }

    /* TITLES */
    .report-title-block {
      margin-bottom: 9px;
    }
    .report-eyebrow {
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--gold-dark);
      margin-bottom: 2px;
    }
    .report-main-title {
      font-family: Georgia, Garamond, serif;
      font-size: 19pt;
      font-weight: 700;
      color: var(--navy);
      line-height: 1.15;
    }
    .report-main-subtitle {
      font-size: 8pt;
      color: var(--muted);
      margin-top: 2px;
    }

    /* BIRTH DETAILS GRID */
    .birth-details-card {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      padding: 7px 10px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: #f8fafc;
      margin-bottom: 10px;
    }
    .birth-item span {
      display: block;
      font-size: 6.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--muted);
      font-weight: 600;
    }
    .birth-item strong {
      display: block;
      font-size: 8pt;
      color: var(--navy);
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* KEY IDENTIFIERS GRID */
    .key-metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 7px;
      margin-bottom: 11px;
    }
    .metric-pill {
      padding: 7px 9px;
      border-radius: 8px;
      border: 1px solid var(--gold-border);
      background: var(--gold-light);
    }
    .metric-pill span {
      display: block;
      font-size: 6.8pt;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--gold-dark);
      font-weight: 700;
    }
    .metric-pill strong {
      display: block;
      font-family: Georgia, serif;
      font-size: 11pt;
      color: var(--navy);
      font-weight: 700;
      margin-top: 1px;
    }
    .metric-pill small {
      display: block;
      font-size: 6.8pt;
      color: var(--muted);
      margin-top: 1px;
    }

    /* CHART & READING SECTION */
    .chart-dual-panel {
      display: grid;
      grid-template-columns: 215px 1fr;
      gap: 14px;
      align-items: center;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: #ffffff;
      margin-bottom: 11px;
    }
    .chart-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .kundli-svg {
      width: 195px;
      height: 195px;
      display: block;
    }
    .kundli-svg .chart-house {
      font-size: 8.5px;
      font-weight: 700;
      fill: var(--gold-dark);
      text-anchor: middle;
    }
    .kundli-svg .chart-planets {
      font-size: 8.5px;
      font-weight: 600;
      fill: var(--navy);
      text-anchor: middle;
    }
    .kundli-svg .chart-center-title {
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 1px;
      fill: var(--gold-dark);
      text-anchor: middle;
    }
    .kundli-svg .chart-center-sub {
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 1.2px;
      fill: var(--navy);
      text-anchor: middle;
    }

    .chart-reading-content h3 {
      font-size: 10pt;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .chart-reading-content p {
      font-size: 7.8pt;
      color: #334155;
      line-height: 1.45;
      margin-bottom: 5px;
    }
    .chart-highlights-list {
      margin-top: 5px;
      padding-left: 14px;
    }
    .chart-highlights-list li {
      font-size: 7.5pt;
      color: #475569;
      margin-bottom: 3px;
    }
    .chart-highlights-list strong {
      color: var(--navy);
    }

    /* PERSONALITY SECTION */
    .personality-section {
      padding: 10px 12px;
      border-radius: 9px;
      border: 1px solid var(--gold-border);
      background: #fffdfa;
      margin-bottom: 9px;
    }
    .section-title-sm {
      font-family: Georgia, serif;
      font-size: 10.5pt;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-title-sm span {
      font-size: 6.8pt;
      font-family: -apple-system, sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--gold-dark);
      font-weight: 700;
    }
    .personality-text {
      font-size: 7.8pt;
      line-height: 1.5;
      color: #334155;
    }

    /* FOOTER */
    .page-footer {
      padding-top: 6px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.8pt;
      color: var(--muted);
    }
    .page-footer strong {
      color: var(--navy);
    }

    /* PAGE 2 SECTIONS */
    .section-heading-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 1.2px solid var(--border);
      padding-bottom: 4px;
      margin: 8px 0 6px 0;
    }
    .section-heading-bar h2 {
      font-family: Georgia, serif;
      font-size: 11pt;
      font-weight: 700;
      color: var(--navy);
    }
    .section-heading-bar span {
      font-size: 6.8pt;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* PLANETARY TABLE */
    .planetary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.4pt;
      line-height: 1.35;
      margin-bottom: 8px;
    }
    .planetary-table thead th {
      background: #f1f5f9;
      color: var(--navy);
      padding: 5px 6px;
      text-align: left;
      font-size: 6.6pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      border-bottom: 1.5px solid #cbd5e1;
    }
    .planetary-table tbody td {
      padding: 4px 6px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .planetary-table tbody tr:nth-child(even) {
      background: #fafaf9;
    }
    .planetary-table tbody tr:last-child td {
      border-bottom: 1.5px solid var(--border);
    }
    .planetary-table strong {
      color: var(--navy);
    }
    .retro-badge {
      display: inline-block;
      font-size: 6.5pt;
      color: #dc2626;
      font-weight: 700;
    }

    /* DASHA & PANCHANG SPLIT */
    .mid-split-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 10px;
      margin-bottom: 9px;
    }
    .dasha-box {
      padding: 8px 11px;
      border-radius: 8px;
      border: 1px solid var(--gold-border);
      background: var(--gold-light);
    }
    .dasha-box-title {
      font-size: 7pt;
      font-weight: 700;
      color: var(--gold-dark);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 3px;
    }
    .dasha-current-cycle {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 4px;
    }
    .dasha-current-cycle strong {
      font-family: Georgia, serif;
      font-size: 11pt;
      color: var(--navy);
    }
    .dasha-current-cycle span {
      font-size: 7.2pt;
      color: var(--muted);
    }
    .dasha-box p {
      font-size: 7.2pt;
      line-height: 1.4;
      color: #334155;
    }

    .panchang-box {
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: #f8fafc;
    }
    .panchang-box-title {
      font-size: 7pt;
      font-weight: 700;
      color: var(--navy);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 4px;
    }
    .panchang-pills {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }
    .p-pill {
      padding: 3px 5px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
    }
    .p-pill span {
      display: block;
      font-size: 5.8pt;
      color: var(--muted);
      text-transform: uppercase;
    }
    .p-pill strong {
      display: block;
      font-size: 7.2pt;
      color: var(--navy);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* LIFE AREAS 2x2 GRID */
    .life-areas-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
      margin-bottom: 9px;
    }
    .life-card {
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: #ffffff;
    }
    .life-card h4 {
      font-size: 8pt;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .life-card h4 span {
      color: var(--gold);
    }
    .life-card p {
      font-size: 7.2pt;
      color: #334155;
      line-height: 1.42;
    }

    /* DISCLAIMER */
    .disclaimer-banner {
      padding: 6px 9px;
      border-radius: 6px;
      background: #f8fafc;
      border-left: 3px solid var(--gold);
      font-size: 6.8pt;
      color: var(--muted);
      line-height: 1.4;
      margin-bottom: 6px;
    }
    .disclaimer-banner strong {
      color: var(--navy);
    }

    /* PRINT RULES */
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    @media print {
      html, body {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .toolbar {
        display: none !important;
      }
      .pdf-page {
        width: 100% !important;
        max-width: 190mm !important;
        height: 280mm !important;
        max-height: 280mm !important;
        margin: 0 auto !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        overflow: hidden !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .pdf-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-info">
      <p>Janma Kundli Report · Ready for Export</p>
      <span>Verify your two-page document, then choose <strong>Save as PDF</strong> in your browser print window.</span>
    </div>
    <button onclick="window.print()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
      Print / Save as PDF
    </button>
  </div>

  <main>
    <!-- PAGE 1: YOUR KUNDLI AT A GLANCE -->
    <section class="pdf-page">
      <div>
        <div class="header-bar">
          <div class="brand-title">VEDIC <span>AI</span> · ASTROLOGICAL REPORT</div>
          <div class="page-indicator">PAGE 01 / 02 · KUNDLI AT A GLANCE</div>
        </div>

        <div class="report-title-block">
          <div class="report-eyebrow">PERSONAL JANMA KUNDLI</div>
          <h1 class="report-main-title">${escapeHtml(report.birth.place)}</h1>
          <p class="report-main-subtitle">Calculated Vedic Sidereal Birth Chart (Lahiri Ayanamsha) with Whole-Sign Houses</p>
        </div>

        <!-- BIRTH DETAILS -->
        <div class="birth-details-card">
          <div class="birth-item">
            <span>Date of Birth</span>
            <strong>${escapeHtml(birthDate)}</strong>
          </div>
          <div class="birth-item">
            <span>Exact Local Time</span>
            <strong>${escapeHtml(report.birth.time)}</strong>
          </div>
          <div class="birth-item">
            <span>Local Timezone</span>
            <strong>${escapeHtml(report.birth.timezone)}</strong>
          </div>
          <div class="birth-item">
            <span>Geo Coordinates</span>
            <strong>${report.birth.latitude.toFixed(2)}°N, ${report.birth.longitude.toFixed(2)}°E</strong>
          </div>
        </div>

        <!-- 4-PILL HIGHLIGHT GRID -->
        <div class="key-metrics-grid">
          <div class="metric-pill">
            <span>Ascendant (Lagna)</span>
            <strong>${escapeHtml(report.ascendant.sign)}</strong>
            <small>${report.ascendant.degreeInSign.toFixed(2)}° · ${escapeHtml(report.ascendant.nakshatra)}</small>
          </div>
          <div class="metric-pill">
            <span>Moon Sign (Rashi)</span>
            <strong>${escapeHtml(moon?.sign || "—")}</strong>
            <small>${escapeHtml(moon?.nakshatra || "—")} (Pada ${moon?.nakshatraPada || "—"})</small>
          </div>
          <div class="metric-pill">
            <span>Sun Sign & House</span>
            <strong>${escapeHtml(sun?.sign || "—")}</strong>
            <small>House ${sun?.house || "—"} · ${sun?.degreeInSign.toFixed(2) || "0.00"}°</small>
          </div>
          <div class="metric-pill">
            <span>Current Mahadasha</span>
            <strong>${escapeHtml(report.vimshottari.currentMahadasha.lord)}</strong>
            <small>${readableDate(report.vimshottari.currentMahadasha.start, report.birth.timezone)} – ${readableDate(report.vimshottari.currentMahadasha.end, report.birth.timezone)}</small>
          </div>
        </div>

        <!-- CHART DUAL PANEL (SVG CHART + READING NOTES) -->
        <div class="chart-dual-panel">
          <div class="chart-container">
            ${generateChartSvg(report)}
          </div>
          <div class="chart-reading-content">
            <h3>How to Read Your Chart</h3>
            <p>Your birth chart captures the astronomical sky at the exact minute of birth in <strong>${escapeHtml(report.birth.place.split(",")[0])}</strong>. The top central diamond represents your <strong>1st House (Lagna: ${escapeHtml(report.ascendant.sign)})</strong>, which sets the foundation for your life's orientation.</p>
            <p>Moving counter-clockwise through whole-sign houses, each section represents a distinct sphere of living (finances, family, career, partnerships).</p>
            <ul class="chart-highlights-list">
              <li><strong>Rising Sign:</strong> ${escapeHtml(report.ascendant.sign)} at ${report.ascendant.degreeInSign.toFixed(2)}° defines how you interact with the outside world.</li>
              <li><strong>Moon & Mind:</strong> In ${escapeHtml(moon?.sign || "—")} (${escapeHtml(moon?.nakshatra || "—")}), anchoring your instinctive emotional core.</li>
              ${exaltedPlanets.length > 0 ? `<li><strong>Prominent Dignities:</strong> ${exaltedPlanets.map((p) => `${p.name} exalted in ${p.sign}`).join(", ")}.</li>` : ""}
              <li><strong>Center of Activity:</strong> ${kendraPlanets.length} major planet${kendraPlanets.length === 1 ? "" : "s"} occupy primary pivot houses (Kendras: 1, 4, 7, 10).</li>
            </ul>
          </div>
        </div>

        <!-- PERSONALITY & LIFE PATTERNS -->
        <div class="personality-section">
          <div class="section-title-sm">
            Your Core Personality & Life Patterns
            <span>HUMAN-READABLE SUMMARY</span>
          </div>
          <p class="personality-text">
            ${generatePersonalitySummary(report)}
          </p>
        </div>
      </div>

      <div class="page-footer">
        <div><strong>Vedic AI</strong> · Generated: ${escapeHtml(generated)}${reportId ? ` · ID: ${escapeHtml(reportId)}` : ""}</div>
        <div>Page 01 of 02</div>
      </div>
    </section>

    <!-- PAGE 2: PLANETARY DETAILS & LIFE OVERVIEW -->
    <section class="pdf-page">
      <div>
        <div class="header-bar">
          <div class="brand-title">VEDIC <span>AI</span> · ASTROLOGICAL REPORT</div>
          <div class="page-indicator">PAGE 02 / 02 · PLANETARY DETAILS & LIFE OVERVIEW</div>
        </div>

        <!-- PLANETARY POSITIONS TABLE -->
        <div class="section-heading-bar">
          <h2>Planetary Placements & Exact Degrees</h2>
          <span>Lahiri Sidereal Longitudes · Whole-Sign Houses</span>
        </div>
        <table class="planetary-table">
          <thead>
            <tr>
              <th>Graha (Planet)</th>
              <th>Rashi (Sign)</th>
              <th>Degree</th>
              <th>House</th>
              <th>Nakshatra & Pada</th>
              <th>D9 Navamsa</th>
              <th>Simple Life Theme</th>
            </tr>
          </thead>
          <tbody>
            ${planetRows}
          </tbody>
        </table>

        <!-- CURRENT DASHA & BIRTH PANCHANG -->
        <div class="mid-split-grid">
          <div class="dasha-box">
            <div class="dasha-box-title">Vimshottari Dasha Chapter</div>
            <div class="dasha-current-cycle">
              <strong>${escapeHtml(report.vimshottari.currentMahadasha.lord)} Mahadasha</strong>
              <span>· ${escapeHtml(antardasha.lord)} Antardasha</span>
            </div>
            <p>
              Current major period runs from <strong>${readableDate(report.vimshottari.currentMahadasha.start, report.birth.timezone)}</strong> to <strong>${readableDate(report.vimshottari.currentMahadasha.end, report.birth.timezone)}</strong>.
              ${antardasha.lord !== report.vimshottari.currentMahadasha.lord ? `Current sub-period of <strong>${escapeHtml(antardasha.lord)}</strong> active until ${readableDate(antardasha.end, report.birth.timezone)}.` : ""}
              A Mahadasha reflects a long developmental chapter highlighting themes governed by its ruling planet.
            </p>
          </div>

          <div class="panchang-box">
            <div class="panchang-box-title">Birth Panchang (Five Calendar Factors)</div>
            <div class="panchang-pills">
              <div class="p-pill">
                <span>Tithi (Lunar Day)</span>
                <strong>${escapeHtml(panchang?.tithi || "Calculated")}</strong>
              </div>
              <div class="p-pill">
                <span>Paksha (Phase)</span>
                <strong>${escapeHtml(panchang?.paksha || "Shukla")}</strong>
              </div>
              <div class="p-pill">
                <span>Vara (Day)</span>
                <strong>${escapeHtml(panchang?.vara || "Birth Day")}</strong>
              </div>
              <div class="p-pill">
                <span>Nakshatra</span>
                <strong>${escapeHtml(moon?.nakshatra || "Moon Star")}</strong>
              </div>
              <div class="p-pill">
                <span>Yoga</span>
                <strong>${escapeHtml(panchang?.yoga || "Solar-Lunar")}</strong>
              </div>
              <div class="p-pill">
                <span>Karana</span>
                <strong>${escapeHtml(panchang?.karana || "Half-Day")}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- 4 LIFE AREAS OVERVIEW (CHATGPT/GEMINI PLAIN LANGUAGE) -->
        <div class="section-heading-bar">
          <h2>Key Life Areas Overview</h2>
          <span>Human-Readable Interpretations</span>
        </div>
        <div class="life-areas-grid">
          <div class="life-card">
            <h4><span>✦</span> Your Career & Profession</h4>
            <p>${generateCareerSummary(report)}</p>
          </div>
          <div class="life-card">
            <h4><span>✦</span> Relationships & Partnerships</h4>
            <p>${generateRelationshipSummary(report)}</p>
          </div>
          <div class="life-card">
            <h4><span>✦</span> Finances & Prosperity</h4>
            <p>${generateFinancesSummary(report)}</p>
          </div>
          <div class="life-card">
            <h4><span>✦</span> Personal Growth & Timing</h4>
            <p>${generatePersonalGrowthSummary(report)}</p>
          </div>
        </div>

        ${yogaCandidates.length > 0 ? `
        <div class="disclaimer-banner" style="margin-bottom: 6px;">
          <strong>Detected Yoga Combinations:</strong> ${yogaCandidates.map((y) => `${escapeHtml(y.name)} (${escapeHtml(y.reason)})`).join("; ")}.
        </div>` : ""}

        <!-- ETHICAL & CALCULATION DISCLAIMER -->
        <div class="disclaimer-banner">
          <strong>Important Astrological Note:</strong> Planetary positions, houses, and dashas above are calculated using standard sidereal astronomy. Traditional Jyotish readings are cultural, symbolic lenses for contemplation and self-reflection—not deterministic guarantees of future events. Personal choices and real-world effort remain decisive.
        </div>
      </div>

      <div class="page-footer">
        <div><strong>Vedic AI</strong> · Personal Astrological Library · ${escapeHtml(report.birth.place)}</div>
        <div>Page 02 of 02</div>
      </div>
    </section>
  </main>
</body>
</html>`;
}

export function printKundliReport(report: KundliReport, reportId?: string) {
  const html = generateKundliPrintHtml(report, reportId);

  if (typeof window === "undefined") return;

  // 1. Try invisible iframe print first (never blocked by browser pop-up blockers)
  try {
    const existing = document.getElementById("vedic-kundli-print-frame");
    if (existing) existing.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "vedic-kundli-print-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          // Fallback to window.open if iframe printing was restricted
          openPreviewWindow(html);
        }
      }, 350);
      return;
    }
  } catch {
    // Fallback to window.open
  }

  openPreviewWindow(html);
}

function openPreviewWindow(html: string) {
  const preview = window.open("", "_blank", "width=980,height=860");
  if (!preview) {
    // If popup blocked, download the standalone printable HTML file directly
    downloadKundliHtmlFile(html, "vedic-ai-kundli.html");
    return;
  }
  preview.opener = null;
  preview.document.open();
  preview.document.write(html);
  preview.document.close();
  preview.focus();
}

function downloadKundliHtmlFile(html: string, filename: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadKundliPdfFile(report: KundliReport, reportId?: string) {
  const html = generateKundliPrintHtml(report, reportId);
  const filename = `vedic-ai-kundli-${report.ascendant.sign.toLowerCase()}-${Date.now()}.html`;
  downloadKundliHtmlFile(html, filename);
}
