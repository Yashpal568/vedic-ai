import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured. Add the Supabase URL and anon key first." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in before saving your kundli." }, { status: 401 });
  try {
    const { profile, report } = schema.parse(await request.json());
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
    return NextResponse.json({ saved: true, id: saved.id, createdAt: saved.created_at }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid kundli report payload." }, { status: 400 });
    return NextResponse.json({ error: "Unable to save this kundli report." }, { status: 500 });
  }
}
