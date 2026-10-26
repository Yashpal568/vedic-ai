/**
 * Curated, original Jyotish reference notes used for lightweight retrieval.
 * This is an editorial starter knowledge base, not a substitute for licensed
 * source texts or review by a qualified Jyotish practitioner.
 *
 * Retrieval is deterministic keyword scoring (no embeddings/vector database).
 * Keep claims framed as traditional interpretations, not scientific facts.
 */
export type VedicKnowledgeEntry = {
  id: string;
  title: string;
  topics: string[];
  content: string;
};

const KNOWLEDGE: VedicKnowledgeEntry[] = [
  {
    id: "framework-basics",
    title: "Reading framework and evidence discipline",
    topics: ["kundli", "chart", "reading", "interpretation", "birth chart", "jyotish", "astrology"],
    content: "Traditional Jyotish chart interpretation should synthesize lagna and its lord, Moon, Sun, relevant house, house lord, occupants, aspects, dignity, nakshatra, dasha, and corroborating factors. Do not infer a conclusion from one placement alone. First state the chart facts supplied by the calculation engine; then distinguish traditional interpretation from uncertainty. If a required chart factor is absent, ask for it or say it cannot be determined.",
  },
  {
    id: "houses",
    title: "Bhava meanings",
    topics: ["house", "bhava", "career", "marriage", "relationship", "money", "wealth", "health", "education", "home", "children", "spirituality"],
    content: "Common traditional whole-sign bhava themes: 1st body, temperament and life approach; 2nd resources, family and speech; 3rd effort, skills, siblings and communication; 4th home, mother, property and inner security; 5th learning, creativity, children and purva-punya; 6th service, routines, debts, disputes and obstacles; 7th partnership, marriage and public dealings; 8th change, vulnerability, shared resources and research; 9th dharma, teachers, higher learning and long journeys; 10th work, duty, status and public contribution; 11th networks, gains and aspirations; 12th expenditure, retreat, sleep, foreign places and liberation. These are traditional symbolic associations, not deterministic outcomes.",
  },
  {
    id: "grahas",
    title: "Graha significations",
    topics: ["planet", "graha", "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"],
    content: "Traditional broad significations: Sun—identity, authority, vitality and responsibility; Moon—mind, habits, care and receptivity; Mars—drive, courage, conflict and action; Mercury—learning, speech, analysis and trade; Jupiter—wisdom, teaching, growth and counsel; Venus—relationships, art, pleasure and agreement; Saturn—discipline, delay, endurance, labour and structure; Rahu—amplification, appetite, novelty and unconventional paths; Ketu—detachment, reduction, inwardness and specialized focus. Interpret only with sign, house, lordship, dignity, aspects, conjunctions and dasha context. Rahu/Ketu are nodes, not physical planets.",
  },
  {
    id: "career",
    title: "Career and vocation analysis",
    topics: ["career", "job", "profession", "business", "work", "promotion", "employment", "10th house", "sixth house", "tenth house"],
    content: "For a traditional career reading, inspect the 10th bhava and its lord, 6th for service/routines, 2nd for livelihood/resources, 11th for gains/networks, lagna and lagna lord, relevant planetary strengths, and current dasha/transit only when accurately calculated. Seek repeated themes across multiple factors; discuss skills, preferences and real-world constraints alongside symbolism. Never promise a job, salary, promotion, or date. Do not advise quitting a job or investing money solely from astrology.",
  },
  {
    id: "relationships",
    title: "Relationships and marriage analysis",
    topics: ["marriage", "relationship", "love", "partner", "spouse", "compatibility", "7th house", "venus"],
    content: "Traditional relationship analysis may consider the 7th bhava and its lord, Venus as a relationship significator in many contexts, Jupiter in some traditional spouse-related readings, the Moon, relevant dasha and, where reliably calculated, Navamsa (D9). Do not conclude divorce, infidelity, a guaranteed marriage date, or a partner's hidden behaviour from a single factor. Compatibility requires both people's accurate data and a clear explanation of the chosen tradition and its limits.",
  },
  {
    id: "vimshottari",
    title: "Vimshottari dasha reasoning",
    topics: ["dasha", "mahadasha", "antardasha", "period", "timing", "vimshottari", "nakshatra"],
    content: "Vimshottari is a 120-year dasha system whose starting mahadasha and balance are derived from the Moon's birth nakshatra and the fraction traversed. The standard sequence is Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17 years. A period's traditional interpretation depends on the planet's chart role and condition, not just its name. Do not invent dates or subperiods; use only computed period dates and disclose the calculation convention.",
  },
  {
    id: "nakshatra",
    title: "Nakshatra and pada",
    topics: ["nakshatra", "pada", "moon sign", "birth star", "constellation"],
    content: "The 27-nakshatra scheme divides the sidereal zodiac into 27 equal spans of 13 degrees 20 minutes; each nakshatra has four padas of 3 degrees 20 minutes. Accurate assignment depends on a reliable sidereal longitude and ayanamsha convention. Explain nakshatra symbolism as a traditional interpretive layer and avoid claiming exact pada when longitude accuracy is uncertain.",
  },
  {
    id: "yogas",
    title: "Yoga interpretation and validation",
    topics: ["yoga", "raja yoga", "dhan yoga", "yog", "combination"],
    content: "A named yoga should be reported only when its traditional rule is explicitly defined and every required condition is verified from a validated chart. Similar-sounding rules vary across texts and lineages. Do not label an experimental candidate as a confirmed yoga or infer wealth, fame, illness, or destiny from a yoga alone. Explain the rule applied and any missing factors.",
  },
  {
    id: "transits",
    title: "Gochar and transit analysis",
    topics: ["transit", "gochar", "saturn return", "sade sati", "jupiter transit", "rahu transit"],
    content: "Transit interpretations depend on the selected tradition and reference point (lagna, Moon, or natal planet). State the reference point and date range. Use actual ephemeris-derived positions and clearly labelled time zone; never invent a planet's current sign or a transit date. Present transit themes as reflective possibilities, not certain events.",
  },
  {
    id: "divisional-charts",
    title: "Varga and divisional charts",
    topics: ["navamsa", "d9", "dashamsa", "d10", "varga", "divisional chart"],
    content: "Divisional charts magnify birth-time sensitivity and depend on precise longitudes and a clearly specified varga convention. D9 is traditionally used for dharma/marital themes and planetary refinement; D10 for vocation. Do not state varga-based conclusions unless the chart engine actually calculates and validates that varga. If birth time is uncertain, clearly flag the resulting uncertainty.",
  },
  {
    id: "panchang",
    title: "Panchang elements",
    topics: ["panchang", "tithi", "karana", "yoga", "vara", "weekday", "muhurta"],
    content: "Panchang commonly includes vara (weekday), tithi (lunar day), nakshatra, yoga and karana. These require accurate Sun/Moon longitudes and explicit boundary conventions. For muhurta, location, time zone and local sunrise matter. If the app's Panchang implementation has not been validated against a trusted reference, mark its result experimental and do not recommend consequential actions based on it.",
  },
  {
    id: "ethics",
    title: "Ethical and high-stakes responses",
    topics: ["health", "death", "illness", "pregnancy", "legal", "finance", "stock", "investment", "mental health", "fear", "remedy"],
    content: "Never predict death, diagnose illness, guarantee pregnancy, allege abuse/infidelity, or advise financial/legal/medical decisions from astrology. For health, mental health, legal or financial questions, provide general support and recommend an appropriately qualified professional. Avoid fear-based remedies, costly rituals, gemstones, or claims that payment is necessary to prevent harm. Respect the user's agency and cultural beliefs.",
  },
  {
    id: "remedies",
    title: "Remedies and spiritual practices",
    topics: ["remedy", "upay", "mantra", "gemstone", "puja", "donation", "shanti"],
    content: "If asked about traditional remedies, frame them as optional cultural/spiritual practices rather than proven causal treatments. Prefer low-cost, non-harmful options such as reflection, prayer/meditation if welcome, charity within means, ethical conduct and consistent practical effort. Do not prescribe expensive gemstones, fasting that may be unsafe, stopping medication, or fear-driven rituals.",
  },
];

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "what", "when", "where", "will", "would", "could",
  "about", "from", "this", "that", "have", "has", "your", "you", "are", "how",
  "mera", "meri", "mere", "mujhe", "kya", "kaise", "hai", "hoga", "hogi", "mein",
  "ke", "ki", "ka", "ko", "se", "aur", "par", "batao", "please", "tell",
]);

function tokens(value: string): string[] {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Retrieves the most relevant original reference notes using deterministic lexical scoring.
 * This keeps initial deployment dependency-free. It is not semantic/vector RAG.
 */
export function retrieveVedicKnowledge(query: string, limit = 3): string {
  const queryTokens = new Set(tokens(query));
  if (!queryTokens.size) return "";
  const ranked = KNOWLEDGE.map((entry) => {
    const topicTokens = new Set(tokens(entry.topics.join(" ")));
    const contentTokens = new Set(tokens(entry.title + " " + entry.content));
    let score = 0;
    for (const token of queryTokens) {
      if (topicTokens.has(token)) score += 4;
      if (entry.title.toLowerCase().includes(token)) score += 2;
      if (contentTokens.has(token)) score += 1;
    }
    return { entry, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id)).slice(0, Math.max(1, limit));
  if (!ranked.length) return "";
  return ranked.map(({ entry }) => `[Reference: ${entry.title}; id=${entry.id}]\n${entry.content}`).join("\n\n");
}

export const __test__ = { tokens, KNOWLEDGE };
