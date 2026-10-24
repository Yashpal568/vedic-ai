import { NextResponse } from "next/server";
import { z } from "zod";
import tzlookup from "@photostructure/tz-lookup";
import { calculateKundli } from "@/lib/astrology";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  place: z.string().trim().min(2).max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "kundli", 15, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many chart calculations. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  try {
    const body = schema.parse(await request.json());
    const timezone = tzlookup(body.latitude, body.longitude);
    const report = calculateKundli({ ...body, timezone });
    return NextResponse.json({ report }, {
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Please provide a valid date, local birth time, and selected birthplace." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "";
    if (message.includes("time zone") || message.includes("timezone")) {
      return NextResponse.json({ error: "We could not resolve the birthplace timezone. Please select a more specific location." }, { status: 422 });
    }
    return NextResponse.json({ error: message || "Kundli calculation failed. Please verify the birth details." }, { status: 422 });
  }
}
