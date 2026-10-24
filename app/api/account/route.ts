import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ confirmation: z.literal("DELETE MY ACCOUNT") });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  if (origin && origin !== requestOrigin) {
    return NextResponse.json({ error: "Cross-origin account deletion requests are not allowed." }, { status: 403 });
  }

  const rate = await checkRateLimit(request, "auth-account-delete", 2, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many account deletion attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in before deleting your account." }, { status: 401 });

  // Require a recent sign-in, so a stale session alone cannot authorize irreversible deletion.
  const lastSignIn = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : 0;
  if (!lastSignIn || Date.now() - lastSignIn > 10 * 60 * 1000) {
    return NextResponse.json({ error: "For your security, sign out and sign in again before deleting your account." }, { status: 428 });
  }

  let body: unknown;
  try {
    body = await request.json();
    schema.parse(body);
  } catch {
    return NextResponse.json({ error: "Type DELETE MY ACCOUNT exactly to confirm permanent account deletion." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Account deletion is not configured. The server operator must set SUPABASE_SERVICE_ROLE_KEY as a server-only environment variable." }, { status: 503 });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[vedic-ai] Auth account deletion failed.", error.message);
    return NextResponse.json({ error: "We could not delete the account. No success has been reported; contact support or try again." }, { status: 500 });
  }

  return NextResponse.json({
    deleted: true,
    message: "Your Vedic AI account and database records have been deleted. Sign in again only if you intend to create a new account.",
  }, { headers: { "Cache-Control": "private, no-store" } });
}
