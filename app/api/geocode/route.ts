import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ query: z.string().trim().min(2).max(180) });
type Place = { id: string; label: string; latitude: number; longitude: number; type: string; importance: number };
const cache = new Map<string, { expires: number; places: Place[] }>();

function fromNominatim(data: unknown): Place[] {
  return (Array.isArray(data) ? data : []).map((item: Record<string, unknown>) => ({
    id: String(item.place_id),
    label: String(item.display_name || ""),
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    type: String(item.type || "place"),
    importance: Number(item.importance || 0),
  })).filter((place: Place) => place.label && Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
}

function fromPhoton(data: unknown): Place[] {
  const features = (data as { features?: Array<{ properties?: Record<string, unknown>; geometry?: { coordinates?: unknown[] } }> })?.features;
  if (!Array.isArray(features)) return [];
  return features.map((feature, index) => {
    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates || [];
    const latitude = Number(coords[1]);
    const longitude = Number(coords[0]);
    const label = [props.name, props.street, props.city || props.town || props.village, props.state, props.country]
      .filter((value, i, arr): value is string => typeof value === "string" && value.trim().length > 0 && arr.indexOf(value) === i)
      .join(", ");
    return {
      id: String(props.osm_id || props.place_id || `photon-${index}-${latitude}-${longitude}`),
      label,
      latitude,
      longitude,
      type: String(props.type || props.osm_value || "place"),
      importance: Number(props.extent ? 0.5 : 0.25),
    };
  }).filter((place) => place.label && Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
}

async function searchNominatim(query: string): Promise<Place[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");
  const response = await fetch(url, {
    headers: { "User-Agent": "VedicAI/0.1 (+https://github.com/Yashpal568/vedic-ai)", "Accept-Language": "en" },
    signal: AbortSignal.timeout(6500),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("NOMINATIM_UNAVAILABLE");
  return fromNominatim(await response.json());
}

async function searchPhoton(query: string): Promise<Place[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");
  url.searchParams.set("lang", "en");
  const response = await fetch(url, {
    headers: { "User-Agent": "VedicAI/0.1 (+https://github.com/Yashpal568/vedic-ai)", "Accept": "application/json" },
    signal: AbortSignal.timeout(6500),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("PHOTON_UNAVAILABLE");
  return fromPhoton(await response.json());
}

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "geocode", 8, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many birthplace searches. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  try {
    const { query } = schema.parse(await request.json());
    const key = query.toLocaleLowerCase();
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return NextResponse.json({ places: hit.places });
    let places: Place[] = [];
    try {
      places = await searchNominatim(query);
    } catch {
      // Public geocoding services can throttle or have transient outages; try the alternate provider.
    }
    if (!places.length) {
      try {
        places = await searchPhoton(query);
      } catch {
        if (!places.length) return NextResponse.json({ error: "Birthplace lookup is temporarily unavailable. Check your connection and try again in a moment." }, { status: 502 });
      }
    }
    cache.set(key, { expires: Date.now() + 6 * 60 * 60 * 1000, places });
    return NextResponse.json({ places }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid city or birthplace." }, { status: 400 });
    return NextResponse.json({ error: "Birthplace lookup failed. Please try again." }, { status: 502 });
  }
}
