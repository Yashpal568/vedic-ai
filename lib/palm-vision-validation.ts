type PalmPoint = { x: number; y: number };
type PalmLine = { visible?: unknown; clarity?: unknown; points?: unknown };
type PalmLineKey = "heartLine" | "headLine" | "lifeLine" | "fateLine";

const LINE_KEYS: PalmLineKey[] = ["heartLine", "headLine", "lifeLine", "fateLine"];

function isPoint(value: unknown): value is PalmPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as Record<string, unknown>;
  return typeof point.x === "number" && typeof point.y === "number" &&
    Number.isFinite(point.x) && Number.isFinite(point.y) &&
    point.x >= 0 && point.x <= 1000 && point.y >= 0 && point.y <= 1000;
}

/** Retain only finite, normalized model traces; invalid points are never sent to the UI. */
export function sanitizePalmVisionEvidence(
  observations: unknown,
  detectedLines: unknown,
): {
  distinctiveFeatures: string[];
  detectedLines: Record<PalmLineKey, { visible: boolean; clarity: string; points: PalmPoint[] }>;
  hasTraceableLine: boolean;
} {
  const observationObject = observations && typeof observations === "object"
    ? observations as Record<string, unknown>
    : {};
  const isImageSpecificObservation = (item: unknown): item is string => {
    if (typeof item !== "string") return false;
    const text = item.trim();
    if (text.length < 20) return false;

    // Support Hindi (Devanagari script) observations directly
    if (/[\u0900-\u097F]/.test(text) && text.length >= 16) {
      return true;
    }

    // A feature must name a visible anatomical landmark and describe an observable
    // shape, path, proportion, depth, junction, branch, angle, or endpoint.
    const namesLandmark = /\b(?:palm|crease|line|thumb|finger|index|ring|middle|pinky|little|mount|thenar|hypothenar|knuckle|wrist|fork|branch|hand|pad|phalanx|phalanges|venus|jupiter|saturn|sun|apollo|mercury|moon|luna)\b/i.test(text);
    const describesAppearance = /\b(?:curve|curved|arc|broad|narrow|diagonal|straight|sloping|slope|deep|faint|visible|begins|starts|ends|stops|terminates|crosses|runs|extends|reaches|separated|joined|fork|branch|gap|longer|shorter|prominent|flat|raised|angle|balanced|opening|open|length|shape|proportion|ratio|developed|smooth|distinct|unbroken|broken|slender|oblong|square|flexible|firm)\w*\b/i.test(text);
    return namesLandmark && describesAppearance;
  };
  const distinctiveFeatures = Array.isArray(observationObject.distinctiveFeatures)
    ? Array.from(new Set(observationObject.distinctiveFeatures.filter(isImageSpecificObservation).map((item) => item.trim())))
    : [];

  // If distinctiveFeatures has fewer than 5 items, supplement from other grounded observation fields
  if (distinctiveFeatures.length < 5) {
    const candidateFields = [
      observationObject.handShape,
      observationObject.heartLine,
      observationObject.headLine,
      observationObject.lifeLine,
      observationObject.fateLine,
    ];
    for (const field of candidateFields) {
      if (typeof field === "string") {
        const trimmed = field.trim();
        if (isImageSpecificObservation(trimmed) && !distinctiveFeatures.includes(trimmed)) {
          distinctiveFeatures.push(trimmed);
        }
        if (distinctiveFeatures.length >= 5) break;
      }
    }
  }

  const source = detectedLines && typeof detectedLines === "object"
    ? detectedLines as Record<string, PalmLine>
    : {};
  const normalized = {} as Record<PalmLineKey, { visible: boolean; clarity: string; points: PalmPoint[] }>;

  for (const key of LINE_KEYS) {
    const line = source[key];
    const points = Array.isArray(line?.points) ? line.points : [];
    const valid = points.length >= 4 && points.every(isPoint);
    normalized[key] = line?.visible === true && valid
      ? { visible: true, clarity: typeof line?.clarity === "string" ? line.clarity : "model_trace", points: points as PalmPoint[] }
      : { visible: false, clarity: "not_detected", points: [] };
  }

  return {
    distinctiveFeatures,
    detectedLines: normalized,
    hasTraceableLine: LINE_KEYS.some((key) => normalized[key].visible),
  };
}
