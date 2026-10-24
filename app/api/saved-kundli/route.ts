import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  profile: z.object({
    name: z.string().max(100).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    place: z.string().trim().min(2).max(300),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timezone: z.string().min(1).max(100),
  }),
  conversationId: z.string().uuid().optional(),
  report: z.object({
    engine: z.string(),
    engineVersion: z.string(),
    ayanamsha: z.object({ name: z.string(), degrees: z.number() }),
    zodiac: z.string(),
    houseSystem: z.string(),
  }).passthrough(),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to view saved kundlis." }, { status: 401 });
  const { data, error } = await supabase.from("kundli_reports")
    .select("id, calculation_engine, engine_version, ayanamsha, zodiac_system, house_system, calculation_payload, created_at")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: "Could not load saved kundlis." }, { status: 500 });
  return NextResponse.json({ reports: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "saved-kundli-write", 10, 60_000);
  if (!rate.available) return NextResponse.json({ error: "The shared rate-limiting service is unavailable. Configure migration 004 and the server-only service-role key, then retry." }, { status: 503 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many save requests. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured. Add the Supabase URL and anon key first." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in before saving your kundli." }, { status: 401 });
  try {
    const parsed = schema.parse(await request.json());
    const { profile, report, conversationId } = parsed;
    const { data: birth, error: birthError } = await supabase.from("birth_profiles").insert({
      user_id: user.id,
      display_name: profile.name || null,
      birth_date: profile.date,
      local_birth_time: profile.time,
      birthplace_label: profile.place,
      latitude: profile.latitude,
      longitude: profile.longitude,
      timezone_id: profile.timezone,
      time_accuracy: "unknown",
    }).select("id").single();
    if (birthError || !birth) return NextResponse.json({ error: "Could not save birth profile. Please check the database migration and policies." }, { status: 500 });

    const { data: saved, error: reportError } = await supabase.from("kundli_reports").insert({
      user_id: user.id,
      birth_profile_id: birth.id,
      calculation_engine: report.engine,
      engine_version: report.engineVersion,
      ayanamsha: report.ayanamsha.name,
      zodiac_system: report.zodiac,
      house_system: report.houseSystem,
      calculation_payload: report,
    }).select("id, created_at").single();
    if (reportError || !saved) {
      await supabase.from("birth_profiles").delete().eq("id", birth.id).eq("user_id", user.id);
      return NextResponse.json({ error: "Could not save the kundli report. Please check the database migration and policies." }, { status: 500 });
    }
    if (conversationId) {
      await supabase.from("conversations").update({ birth_profile_id: birth.id })
        .eq("id", conversationId).eq("user_id", user.id);
    }
    return NextResponse.json({ saved: true, id: saved.id, createdAt: saved.created_at }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid kundli report payload." }, { status: 400 });
    return NextResponse.json({ error: "Unable to save this kundli report." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const rate = await checkRateLimit(request, "saved-kundli-delete", 10, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many delete requests. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to delete saved kundlis." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "A valid report ID is required." }, { status: 400 });

  const { data: report, error: findError } = await supabase.from("kundli_reports")
    .select("id, birth_profile_id").eq("id", id).eq("user_id", user.id).single();
  if (findError || !report) return NextResponse.json({ error: "Saved kundli not found." }, { status: 404 });
  const { error: deleteError } = await supabase.from("kundli_reports").delete().eq("id", id).eq("user_id", user.id);
  if (deleteError) return NextResponse.json({ error: "Could not delete this report." }, { status: 500 });
  const { count } = await supabase.from("kundli_reports").select("id", { count: "exact", head: true }).eq("birth_profile_id", report.birth_profile_id);
  if (count === 0) await supabase.from("birth_profiles").delete().eq("id", report.birth_profile_id).eq("user_id", user.id);
  return NextResponse.json({ deleted: true });
}
