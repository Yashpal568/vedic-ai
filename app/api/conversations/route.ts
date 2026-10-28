import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().uuid().optional(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(12000),
  })).min(1).max(30),
});

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  // Guest users have no saved history. Return an empty collection for the history list;
  // detail reads still require authentication and never reveal another user's records.
  if (authError || !user) {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ conversations: [] }, { headers: { "Cache-Control": "private, no-store" } });
    return NextResponse.json({ error: "Sign in to access saved conversations." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid conversation ID." }, { status: 400 });
    const { data: conversation, error } = await supabase.from("conversations")
      .select("id,title,birth_profile_id,created_at,updated_at").eq("id", id).eq("user_id", user.id).single();
    if (error || !conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    const { data: messages, error: messageError } = await supabase.from("chat_messages")
      .select("id,role,content,created_at").eq("conversation_id", id).eq("user_id", user.id).order("created_at", { ascending: true }).limit(200);
    if (messageError) return NextResponse.json({ error: "Could not load conversation messages." }, { status: 500 });
    let chartReport = null;
    if (conversation.birth_profile_id) {
      const { data: report } = await supabase.from("kundli_reports").select("calculation_payload")
        .eq("birth_profile_id", conversation.birth_profile_id).eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      chartReport = report?.calculation_payload || null;
    }
    return NextResponse.json({ conversation, messages: messages || [], chartReport }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const { data, error } = await supabase.from("conversations")
    .select("id,title,created_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(30);
  if (error) return NextResponse.json({ error: "Could not load saved conversations." }, { status: 500 });
  return NextResponse.json({ conversations: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "conversations", 40, 60_000);
  if (!rate.available) return NextResponse.json({ error: "The shared rate-limiting service is unavailable. Configure migration 004 and the server-only service-role key, then retry." }, { status: 503 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many conversation updates. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to save conversations." }, { status: 401 });
  try {
    const body = schema.parse(await request.json());
    let conversationId = body.id;
    let created = false;
    const firstUserText = body.messages.find((message) => message.role === "user")?.content || "New conversation";
    const title = firstUserText.replace(/\s+/g, " ").slice(0, 64);
    if (conversationId) {
      const { data: owned, error } = await supabase.from("conversations").select("id")
        .eq("id", conversationId).eq("user_id", user.id).single();
      if (error || !owned) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    } else {
      const { data: conversation, error } = await supabase.from("conversations").insert({
        user_id: user.id, title,
      }).select("id,title,created_at,updated_at").single();
      if (error || !conversation) return NextResponse.json({ error: "Could not create conversation." }, { status: 500 });
      conversationId = conversation.id;
      created = true;
    }

    const rows = body.messages.map((message) => ({
      conversation_id: conversationId,
      user_id: user.id,
      role: message.role,
      content: message.content,
    }));
    const { error: insertError } = await supabase.from("chat_messages").insert(rows);
    if (insertError) {
      if (created) await supabase.from("conversations").delete().eq("id", conversationId).eq("user_id", user.id);
      return NextResponse.json({ error: "Could not save conversation messages." }, { status: 500 });
    }
    // Keep the conversation list ordered by most recently active chat, not just creation time.
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId).eq("user_id", user.id);
    const { data: conversation } = await supabase.from("conversations").select("id,title,created_at,updated_at")
      .eq("id", conversationId).eq("user_id", user.id).single();
    return NextResponse.json({ saved: true, conversation }, { status: created ? 201 : 200 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid conversation payload." }, { status: 400 });
    return NextResponse.json({ error: "Unable to save this conversation." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const rate = await checkRateLimit(request, "conversation-delete", 10, 60_000);
  if (!rate.available) return NextResponse.json({ error: "The shared rate-limiting service is unavailable. Please try again shortly." }, { status: 503 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many delete requests. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to delete conversations." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "A valid conversation ID is required." }, { status: 400 });
  const { data: deletedRows, error } = await supabase.from("conversations")
    .delete().eq("id", id).eq("user_id", user.id).select("id");
  if (error) return NextResponse.json({ error: "Could not delete conversation." }, { status: 500 });
  if (!deletedRows?.length) return NextResponse.json({ error: "Conversation not found or already deleted." }, { status: 404 });
  // chat_messages are removed by the conversation_id foreign-key cascade.
  return NextResponse.json({ deleted: true, id: deletedRows[0].id });
}
