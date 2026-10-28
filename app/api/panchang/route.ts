import { NextResponse } from "next/server";
import { z } from "zod";
import tzlookup from "@photostructure/tz-lookup";
import { calculateKundliAtInstant } from "@/lib/astrology";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  place: z.string().trim().min(2).max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

function dayOfYear(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86400000);
}
function timezoneOffsetMinutes(instant: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(instant);
  const p = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return (asUtc - instant.getTime()) / 60000;
}
function solarEvents(date: string, latitude: number, longitude: number, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const n = dayOfYear(date);
  const gamma = 2 * Math.PI / 365 * (n - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const lat = latitude * Math.PI / 180;
  const cosHour = Math.cos(90.833 * Math.PI / 180) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl);
  if (cosHour < -1 || cosHour > 1) return null;
  const hourAngle = Math.acos(cosHour) * 180 / Math.PI;
  const sunriseUtcMinutes = 720 - 4 * (longitude + hourAngle) - eq;
  const sunsetUtcMinutes = 720 - 4 * (longitude - hourAngle) - eq;
  const utcMidnight = Date.UTC(year, month - 1, day);
  const sunrise = new Date(utcMidnight + sunriseUtcMinutes * 60000);
  const sunset = new Date(utcMidnight + sunsetUtcMinutes * 60000);
  // Re-evaluate the offset at the actual event to handle local DST changes.
  const sunriseLocalOffset = timezoneOffsetMinutes(sunrise, timezone);
  const sunsetLocalOffset = timezoneOffsetMinutes(sunset, timezone);
  return { sunrise, sunset, sunriseLocalOffset, sunsetLocalOffset };
}
function formatTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: true }).format(date);
}
function formatDateTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" }).format(date);
}
function muhurta(start: Date, end: Date, timezone: string) {
  return formatTime(start, timezone) + " – " + formatTime(end, timezone);
}
function weekdayIndex(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}
function segment(start: Date, end: Date, index: number) {
  const length = (end.getTime() - start.getTime()) / 8;
  return { start: new Date(start.getTime() + (index - 1) * length), end: new Date(start.getTime() + index * length) };
}

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "panchang", 20, 60000);
  if (!rate.available) return NextResponse.json({ error: "Panchang is temporarily unavailable because shared rate limiting is not configured." }, { status: 503 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many Panchang requests. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  try {
    const input = schema.parse(await request.json());
    const [year, month, day] = input.date.split("-").map(Number);
    const valid = new Date(Date.UTC(year, month - 1, day));
    if (valid.toISOString().slice(0, 10) !== input.date) return NextResponse.json({ error: "Choose a valid calendar date." }, { status: 400 });
    const timezone = tzlookup(input.latitude, input.longitude);
    const events = solarEvents(input.date, input.latitude, input.longitude, timezone);
    if (!events) return NextResponse.json({ error: "Sunrise and sunset are not available for this location and date with the current solar model." }, { status: 422 });
    const { sunrise, sunset } = events;
    const localParts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(sunrise);
    const p = Object.fromEntries(localParts.map((part) => [part.type, part.value]));
    const localTime = p.hour + ":" + p.minute;
    const report = calculateKundliAtInstant({
      date: input.date, time: localTime, timezone, place: input.place,
      latitude: input.latitude, longitude: input.longitude,
    }, sunrise);
    const weekday = weekdayIndex(input.date);
    const rahuIndices = [8, 2, 7, 5, 6, 4, 3];
    const yamaIndices = [5, 4, 3, 2, 1, 7, 6];
    const gulikaIndices = [7, 6, 5, 4, 3, 2, 1];
    const rahu = segment(sunrise, sunset, rahuIndices[weekday]);
    const yama = segment(sunrise, sunset, yamaIndices[weekday]);
    const gulika = segment(sunrise, sunset, gulikaIndices[weekday]);
    const noon = new Date((sunrise.getTime() + sunset.getTime()) / 2);
    const abhijit = { start: new Date(noon.getTime() - 24 * 60000), end: new Date(noon.getTime() + 24 * 60000) };
    const planets = report.planets;
    const sun = planets.find((planet) => planet.name === "Sun");
    const moon = planets.find((planet) => planet.name === "Moon");
    const dayDurationMinutes = Math.round((sunset.getTime() - sunrise.getTime()) / 60000);
    return NextResponse.json({
      date: input.date, place: input.place, timezone,
      weekday: report.panchang.vara,
      paksha: report.panchang.paksha, tithi: report.panchang.tithi,
      tithiNumber: report.panchang.tithiNumber, nakshatra: moon?.nakshatra || null,
      nakshatraPada: moon?.nakshatraPada || null, yoga: report.panchang.yoga,
      karana: report.panchang.karana, sunSign: sun?.sign || null, moonSign: moon?.sign || null,
      sunrise: formatTime(sunrise, timezone), sunset: formatTime(sunset, timezone),
      rahuKaal: muhurta(rahu.start, rahu.end, timezone),
      yamaganda: muhurta(yama.start, yama.end, timezone),
      gulikaKaal: muhurta(gulika.start, gulika.end, timezone),
      abhijitMuhurta: muhurta(abhijit.start, abhijit.end, timezone),
      dayDuration: Math.floor(dayDurationMinutes / 60) + "h " + (dayDurationMinutes % 60) + "m",
      calculatedAt: new Date().toISOString(),
      engine: report.engine, engineVersion: report.engineVersion,
      experimental: true,
      note: "Panchang is calculated for the selected location and date using Astronomy Engine with an approximate Lahiri sidereal conversion and a NOAA-style solar-event approximation. Rahu Kaal, Yamaganda, Gulika and Abhijit are derived from local sunrise/sunset and weekday. Cross-check against a trusted local Panchang for ritual-critical timing.",
    }, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid date, place, latitude and longitude." }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Panchang calculation failed. Please check the location and date." }, { status: 422 });
  }
}
