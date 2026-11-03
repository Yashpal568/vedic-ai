export type AiProvider = "gemini" | "groq" | "openai";

const providerKeys: Record<AiProvider, string> = {
  gemini: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
  openai: "OPENAI_API_KEY",
};

/** Resolve only providers that actually have a server-side API key configured. */
export function getConfiguredAiProvider(env: NodeJS.ProcessEnv = process.env): AiProvider | null {
  const requested = (env.AI_PROVIDER || "gemini").trim().toLowerCase();
  const order: AiProvider[] = requested === "openai"
    ? ["openai", "gemini", "groq"]
    : requested === "groq"
      ? ["groq", "gemini", "openai"]
      : ["gemini", "groq", "openai"];

  return order.find((provider) => Boolean(env[providerKeys[provider]]?.trim())) || null;
}
