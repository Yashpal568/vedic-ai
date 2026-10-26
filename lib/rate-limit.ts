import { createHash } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Bucket = { count: number; resetAt: number };
type RateLimitResult = { allowed: boolean; retryAfterSeconds: number; remaining: number; durable: boolean; available: boolean };

const buckets = new Map<string, Bucket>();

function fallbackLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (buckets.size > 5000) {
    for (const [bucketKey, value] of buckets) if (value.resetAt <= now) buckets.delete(bucketKey);
  }
  return {
    allowed: bucket.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    remaining: Math.max(0, limit - bucket.count),
    durable: false,
    available: process.env.NODE_ENV !== "production",
  };
}

function requestIdentity(request: Request) {
  // Prefer the platform-provided single IP header. For forwarded chains, use the
  // final address added by the hosting proxy rather than a caller-controlled first value.
  const realIp = request.headers.get("x-real-ip")?.trim();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
  return realIp || (forwarded && forwarded[forwarded.length - 1]) || "unknown";
}

/**
 * Shared Postgres-backed limiter. Raw IPs and user IDs are never stored in the table;
 * the RPC receives only a SHA-256 digest of scope + identity.
 *
 * Requires migration 004 and server-only SUPABASE_SERVICE_ROLE_KEY in production.
 * A process-local fallback keeps local development usable, but is not production-grade.
 */
export async function checkRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
  identity?: string,
): Promise<RateLimitResult> {
  const keyMaterial = scope + ":" + (identity || requestIdentity(request));
  const bucketKey = createHash("sha256").update(keyMaterial).digest("hex");
  const admin = getSupabaseAdminClient();
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  if (admin) {
    try {
      // The generated Supabase Database type may lag behind migration 004.
      // Narrow this one RPC call locally until database types are regenerated.
      const consumeRateLimit = (admin as unknown as {
        rpc: (functionName: string, args: Record<string, string | number>) => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      }).rpc;
      const { data, error } = await consumeRateLimit("consume_rate_limit", {
        p_bucket_key: bucketKey,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      });
      if (!error) {
        const result = Array.isArray(data) ? data[0] : data;
        if (result && typeof result.allowed === "boolean") {
          return {
            allowed: result.allowed,
            retryAfterSeconds: Number(result.retry_after_seconds) || windowSeconds,
            remaining: Number(result.remaining) || 0,
            durable: true,
            available: true,
          };
        }
      } else {
        console.error("[vedic-ai] Durable rate limiter unavailable; using process-local fallback.", error.message);
      }
    } catch (error) {
      console.error("[vedic-ai] Durable rate limiter request failed; using process-local fallback.", error);
    }
  }

  return fallbackLimit(bucketKey, limit, windowMs);
}
