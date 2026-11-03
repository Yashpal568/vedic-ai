import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const aiProvider = (process.env.AI_PROVIDER || "groq").trim().toLowerCase();
  const providerKey = aiProvider === "groq" ? process.env.GROQ_API_KEY
    : aiProvider === "openai" ? process.env.OPENAI_API_KEY
      : aiProvider === "gemini" ? process.env.GEMINI_API_KEY : undefined;
  const aiConfigured = Boolean(providerKey?.trim());

  return NextResponse.json({
    status: "ok",
    application: "vedic-ai",
    stage: "preview",
    integrations: {
      aiConfigured,
      aiProvider,
      supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      sharedRateLimitConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      permanentAccountDeletionConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      kundliEngineConfigured: true,
      kundliEngineAccuracy: "early implementation; reference-chart validation required",
    },
    note: "Health status does not validate provider credentials, migration state, live OAuth, or calculation accuracy. Missing service-role configuration disables durable shared limits and permanent account deletion.",
  });
}
