const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

/**
 * Parashari divisional sign mapping for commonly used Vargas.
 * Input is a normalized sidereal ecliptic longitude in degrees.
 */
export function vargaSignIndex(longitude: number, division: 9 | 10): number {
  if (!Number.isFinite(longitude)) throw new Error("A finite longitude is required.");
  const normalized = ((longitude % 360) + 360) % 360;
  const rashiIndex = Math.floor(normalized / 30);
  const degreesInSign = normalized % 30;
  const segment = Math.min(division - 1, Math.floor(degreesInSign / (30 / division)));

  if (division === 9) {
    // Movable signs start from themselves, fixed signs from the 9th, dual signs from the 5th.
    const modality = rashiIndex % 3;
    const start = modality === 0 ? rashiIndex : modality === 1 ? (rashiIndex + 8) % 12 : (rashiIndex + 4) % 12;
    return (start + segment) % 12;
  }

  // Dashamsa: odd signs (Aries-based count) start from themselves; even signs from the 9th.
  const start = rashiIndex % 2 === 0 ? rashiIndex : (rashiIndex + 8) % 12;
  return (start + segment) % 12;
}

export function vargaSignName(longitude: number, division: 9 | 10): string {
  return SIGNS[vargaSignIndex(longitude, division)];
}
