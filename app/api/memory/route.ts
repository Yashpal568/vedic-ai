import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  memory: z.string().trim().max(6000, "Memory must be 6,000 characters or fewer."),
});

async function getAuthenticatedClient() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }), supabase: null, user: null };
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ error: "Sign in to manage your saved memory." }, { status: 401 }), supabase: null, user: null };
  return { response: null, supabase, user };
}

export async function GET() {
  const auth = await getAuthenticatedClient();
  if (auth.response || !auth.supabase || !auth.user) return auth.response;
  const { data, error } = await auth.supabase.from("user_memories")
    .select("memory_text, updated_at").eq("user_id", auth.user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load saved memory. Apply the user-memory migration in Supabase." }, { status: 500 });
  return NextResponse.json({ memory: data?.memory_text || "", updatedAt: data?.updated_at || null }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const rate = checkRateLimit(request, "user-memory-write", 10, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many memory updates. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const auth = await getAuthenticatedClient();
  if (auth.response || !auth.supabase || !auth.user) return auth.response;
  try {
    const body = schema.parse(await request.json());
    const { data, error } = await auth.supabase.from("user_memories").upsert({
      user_id: auth.user.id,
      memory_text: body.memory,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" }).select("memory_text, updated_at").single();
    if (error || !data) return NextResponse.json({ error: "Could not save memory. Confirm the user-memory migration has been applied." }, { status: 500 });
    return NextResponse.json({ saved: true, memory: data.memory_text, updatedAt: data.updated_at }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message || "Invalid memory." }, { status: 400 });
    return NextResponse.json({ error: "Could not save memory." }, { status: 500 });
  }
}

export async function DELETE() {
  const rate = checkRateLimit(new Request("https://memory.local"), "user-memory-delete", 5, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many memory deletion requests. Please wait and try again." }, { status: 429 });
  const auth = await getAuthenticatedClient();
  if (auth.response || !auth.supabase || !auth.user) return auth.response;
  const { error } = await auth.supabase.from("user_memories").delete().eq("user_id", auth.user.id);
  if (error) return NextResponse.json({ error: "Could not delete saved memory." }, { status: 500 });
  return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "private, no-store" } });
}
