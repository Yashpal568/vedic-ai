import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ query: z.string().trim().min(2).max(180) });
type Place = { id: string; label: string; latitude: number; longitude: number; type: string; importance: number };
const cache = new Map<string, { expires: number; places: Place[] }>();

export async function POST(request: Request) {
  const rate = checkRateLimit(request, "geocode", 8, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many birthplace searches. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  try {
    const { query } = schema.parse(await request.json());
    const key = query.toLocaleLowerCase();
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return NextResponse.json({ places: hit.places });
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");
    const response = await fetch(url, {
      headers: { "User-Agent": "VedicAI/0.1 (birthplace lookup; contact: repository owner)" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Birthplace lookup is temporarily unavailable. Please try again." }, { status: 502 });
    const data = await response.json();
    const places: Place[] = (Array.isArray(data) ? data : []).map((item: Record<string, unknown>) => ({
      id: String(item.place_id),
      label: String(item.display_name || ""),
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      type: String(item.type || "place"),
      importance: Number(item.importance || 0),
    })).filter((place: Place) => place.label && Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
    cache.set(key, { expires: Date.now() + 6 * 60 * 60 * 1000, places });
    return NextResponse.json({ places }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid city or birthplace." }, { status: 400 });
    return NextResponse.json({ error: "Birthplace lookup failed. Please try again." }, { status: 502 });
  }
}
