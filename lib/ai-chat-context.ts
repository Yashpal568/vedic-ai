export type BirthProfileForChart = {
  date: string;
  time: string;
  place: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
};

type ChartBirth = {
  date?: unknown;
  time?: unknown;
  place?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  timezone?: unknown;
};

type ChartContext = {
  engine?: unknown;
  zodiac?: unknown;
  houseSystem?: unknown;
  birth?: ChartBirth;
};

/**
 * Verify the supplied chart's calculation engine and birth inputs against the
 * active profile. This protects against stale client state, not forged payloads.
 */
export function isChartContextAligned(
  chartContext: unknown,
  profile: BirthProfileForChart,
): boolean {
  if (!chartContext || typeof chartContext !== "object") return false;
  const chart = chartContext as ChartContext;
  const birth = chart.birth;
  if (
    chart.engine !== "Swiss Ephemeris" ||
    chart.zodiac !== "sidereal" ||
    chart.houseSystem !== "whole_sign" ||
    !birth ||
    birth.date !== profile.date ||
    birth.time !== profile.time ||
    birth.place !== profile.place ||
    typeof profile.latitude !== "number" ||
    typeof profile.longitude !== "number" ||
    typeof birth.latitude !== "number" ||
    typeof birth.longitude !== "number" ||
    !Number.isFinite(birth.latitude) ||
    !Number.isFinite(birth.longitude) ||
    Math.abs(birth.latitude - profile.latitude) >= 0.00001 ||
    Math.abs(birth.longitude - profile.longitude) >= 0.00001
  ) return false;

  if (profile.timezone && birth.timezone !== profile.timezone) return false;
  return typeof birth.timezone === "string" && birth.timezone.length > 0;
}
