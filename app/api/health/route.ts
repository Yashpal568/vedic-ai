import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    application: "vedic-ai",
    stage: "preview",
    integrations: {
      aiConfigured: Boolean(
        (process.env.AI_PROVIDER || "gemini").toLowerCase() === "openai"
          ? process.env.OPENAI_API_KEY
          : process.env.GEMINI_API_KEY,
      ),
      supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      kundliEngineConfigured: false,
    },
    note: "Health status does not validate provider credentials or confirm calculation accuracy.",
  });
}
