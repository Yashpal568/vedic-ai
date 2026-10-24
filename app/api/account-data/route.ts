import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rate = await checkRateLimit(request, "personal-data-export", 5, 60 * 60 * 1000);
  if (!rate.available) return NextResponse.json({ error: "The shared rate-limiting service is unavailable. Configure migration 004 and the server-only service-role key, then retry." }, { status: 503 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many export requests. Try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to export your data." }, { status: 401 });

  const [profile, birthProfiles, conversations, messages, reports, memory] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("birth_profiles").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("conversations").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("chat_messages").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).limit(10000),
    supabase.from("kundli_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1000),
    supabase.from("user_memories").select("memory_text,updated_at").eq("user_id", user.id).maybeSingle(),
  ]);
  const failed = [profile, birthProfiles, conversations, messages, reports, memory].some((result) => result.error);
  if (failed) return NextResponse.json({ error: "Data export could not read every data category. Confirm all Supabase migrations are applied, then retry." }, { status: 500 });

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email || null, createdAt: user.created_at },
    profile: profile.data,
    birthProfiles: birthProfiles.data || [],
    conversations: conversations.data || [],
    messages: messages.data || [],
    kundliReports: reports.data || [],
    memory: memory.data || null,
    notice: "This export includes data stored by Vedic AI. It does not include provider-side logs or copies processed by the configured AI/geocoding providers.",
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vedic-ai-personal-data.json"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(request: Request) {
  const rate = await checkRateLimit(request, "personal-data-delete", 3, 60 * 60 * 1000);
  if (!rate.available) return NextResponse.json({ error: "The shared rate-limiting service is unavailable. Configure migration 004 and the server-only service-role key, then retry." }, { status: 503 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many data-deletion requests. Try again later." }, { status: 429 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to delete your saved data." }, { status: 401 });

  // Delete parent/child records in a deterministic order using the signed-in user's RLS session.
  // The authenticated account itself is intentionally not deleted by this endpoint.
  const operations = [
    () => supabase.from("kundli_reports").delete().eq("user_id", user.id),
    () => supabase.from("conversations").delete().eq("user_id", user.id),
    () => supabase.from("birth_profiles").delete().eq("user_id", user.id),
    () => supabase.from("user_memories").delete().eq("user_id", user.id),
    () => supabase.from("profiles").delete().eq("id", user.id),
  ];
  for (const operation of operations) {
    const { error } = await operation();
    if (error) {
      return NextResponse.json({
        error: "Some saved data could not be deleted. Confirm migrations and Row Level Security policies, then retry. Your sign-in account has not been deleted.",
      }, { status: 500 });
    }
  }
  return NextResponse.json({
    deleted: true,
    accountDeleted: false,
    message: "Saved Vedic AI data has been deleted. Your authentication account remains active; delete it separately through the configured account-support process.",
  }, { headers: { "Cache-Control": "private, no-store" } });
}
