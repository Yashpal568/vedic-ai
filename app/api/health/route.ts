import { NextResponse } from "next/server";
import { getConfiguredAiProvider } from "@/lib/ai-config";
import { getTTSConfigurationStatus } from "@/lib/voice/tts-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const aiProvider = getConfiguredAiProvider();
  const stage = process.env.VERCEL_ENV || (process.env.NODE_ENV === "production" ? "production" : "development");
  const swissApiUrl = (process.env.SWISS_EPHEMERIS_API_URL || "https://vedic-ai-swiss-ephemeris-dvq8.onrender.com").replace(/\/+$/, "");
  const swissApiConfigured = /^https?:\/\/[^/]+$/i.test(swissApiUrl);
  const swissEphemerisHost = swissApiConfigured ? new URL(swissApiUrl).host : null;
  const tts = getTTSConfigurationStatus();

  return NextResponse.json({
    status: "ok",
    application: "vedic-ai",
    stage,
    integrations: {
      aiConfigured: Boolean(aiProvider),
      aiProvider: aiProvider || "not_configured",
      supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      sharedRateLimitConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      permanentAccountDeletionConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      kundliEngineConfigured: swissApiConfigured,
      swissEphemerisHost,
      kundliEngineAccuracy: "Mean Node convention matched direct Swiss Ephemeris across three production test profiles on 2026-11-17; broader independent Jyotish reference-chart validation remains separate.",
      palmVisionConfigured: Boolean(process.env.GEMINI_API_KEY?.trim() || process.env.GROQ_API_KEY?.trim()),
      serverTTSConfigured: tts.hasServerTTS,
      ttsPrimaryProvider: tts.primaryProvider,
      voiceTranscriptionConfigured: Boolean(process.env.GROQ_API_KEY?.trim()),
    },
    note: "Health reports environment configuration, not successful provider authentication, quota, model quality, database migration state, live OAuth, or cross-account isolation. Kundli verification is limited to the three documented production profiles. Missing service-role configuration means rate limiting uses a per-instance fallback and permanent account deletion is not configured.",
  });
}
