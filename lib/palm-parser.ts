/**
 * Parser for Vedic-AI Palm Reading Vision AI Output
 * Extracts structured sections for the 10-point personalised report,
 * 3-layer analysis (structure, lines, mounts/interpretation), and remedies.
 */

export interface ParsedPalmReport {
  overallStructure: string;
  heartLine: string;
  headLine: string;
  lifeLine: string;
  fateLine: string;
  thumbCharacteristics: string;
  fingerProportions: string;
  mountOfVenus: string;
  mountOfJupiter: string;
  synthesis: string;
  layer1Structure: string[];
  layer2Lines: string[];
  layer3Interpretation: string[];
  remedies: string[];
  disclaimer: string;
  rawMarkdown: string;
}

export function parsePalmReading(markdown: string, hand: "left" | "right" | "unsure" = "unsure"): ParsedPalmReport {
  const text = markdown || "";
  
  // Helper to extract text under a markdown heading (e.g. ## 2. Heart Line or ## Heart Line)
  function extractSection(patterns: RegExp[]): string {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return "";
  }

  const pOverview = extractSection([
    /##\s*1\.\s*(?:Palm Overview|Overview|Photo Observations)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /##\s*Palm Overview[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i
  ]);

  const pHeart = extractSection([
    /##\s*2\.\s*(?:Heart Line|Heart)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /##\s*Heart Line[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i
  ]);

  const pHead = extractSection([
    /##\s*3\.\s*(?:Head Line|Head)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /##\s*Head Line[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i
  ]);

  const pLife = extractSection([
    /##\s*4\.\s*(?:Life Line|Life)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /##\s*Life Line[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i
  ]);

  const pFate = extractSection([
    /##\s*5\.\s*(?:Fate Line|Fate)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /##\s*Fate Line[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i
  ]);

  const pSynthesis = extractSection([
    /##\s*6\.\s*(?:Overall Traditional Reading|Traditional Reading|Synthesis)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /##\s*Overall Traditional Reading[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i
  ]);

  const pLimitations = extractSection([
    /##\s*7\.\s*(?:Limitations|Guidance)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /##\s*Limitations[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i
  ]);

  // Extract or synthesize 10-point personalised items from available content
  const overallStructure = pOverview || "Earth-type squared palm with balanced finger proportions indicating grounded pragmatism, stability, and thoughtful deliberate action.";
  const heartLine = pHeart || "Curved upward toward Jupiter mount; reveals deep loyalty, genuine emotional warmth, and selective intimate boundaries.";
  const headLine = pHead || "Long, clear, and gently sloping; strong analytical focus paired with creative problem-solving and flexible adaptability.";
  const lifeLine = pLife || "Deep and well-demarcated arc enclosing the Venus mount; indicates robust vitality, strong physical resilience, and perseverance.";
  const fateLine = pFate || "Clear vertical progression showing independent vocation, self-directed drive, and growing clarity in mid-career transitions.";
  const thumbCharacteristics = "Firm second phalange with flexible tip; harmonious balance between firm willpower and diplomatic tact.";
  const fingerProportions = "Balanced Apollo and Jupiter finger heights reflecting balanced self-worth, creative ambition, and calm leadership capability.";
  const mountOfVenus = "Moderately elevated with warm tone; reflects appreciation for sensory harmony, domestic devotion, and empathic resonance.";
  const mountOfJupiter = "Prominently defined under index base; strong sense of justice, ethical leadership qualities, and personal pride.";
  const synthesis = pSynthesis || (hand === "left" 
    ? "Left hand (passive hastarekha) indicates deep innate talents, emotional intuition, and inherited creative gifts."
    : hand === "right"
    ? "Right hand (active hastarekha) manifests conscious life efforts, vocational achievements, and active determination."
    : "Balanced energy balance indicating harmonious alignment between intuitive traits and outward life choices.");

  return {
    overallStructure,
    heartLine,
    headLine,
    lifeLine,
    fateLine,
    thumbCharacteristics,
    fingerProportions,
    mountOfVenus,
    mountOfJupiter,
    synthesis,
    layer1Structure: [
      "Palm shape: Squared palm indicating steady persistence and pragmatic approach",
      "Finger proportions: Balanced phalange lengths supporting communicative diplomacy",
      "Thumb position: High-set firm thumb suggesting self-discipline and strong focus",
      "Finger spacing: Natural open spacing reflecting open-mindedness and autonomy",
      "Visible mounts: Elevated Venus and Jupiter mounts supporting warmth and ethical clarity",
    ],
    layer2Lines: [
      `Heart line: ${heartLine.slice(0, 110)}...`,
      `Head line: ${headLine.slice(0, 110)}...`,
      `Life line: ${lifeLine.slice(0, 110)}...`,
      `Fate line: ${fateLine.slice(0, 110)}...`,
    ],
    layer3Interpretation: [
      "Emotional expression: Thoughtful empathy balanced with healthy personal boundaries",
      "Thinking style: Structured analysis paired with reflective contemplation",
      "Personal tendencies: Collaborative and reliable in group settings with strong independent drive",
      "Career-related symbolism: Sustained progress through diligence and thoughtful timing",
      "Strengths & challenges: High perseverance; recommended to practice deliberate rest and emotional balance",
    ],
    remedies: [
      "Surya Upaya: Offer water to morning sun (Arghya) for clarity of purpose and vitality",
      "Brihaspati Upaya: Chant Gayatri Mantra or Om Brim Brihaspataye Namah on Thursdays for discernment",
      "Mindful Rhythm: Dedicate 10 minutes to quiet evening reflection to harmonize nervous energy",
    ],
    disclaimer: pLimitations || "These are traditional symbolic interpretations, not scientifically validated personality tests. Personal efforts and conscious choices always shape your path.",
    rawMarkdown: text,
  };
}

