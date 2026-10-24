import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("shared rate-limit contract", () => {
  it("rejects requests beyond the configured window budget", async () => {
    const request = () => new Request("https://vedic-ai.test/api/chat", {
      headers: { "x-real-ip": "198.51.100.22" },
    });
    const scope = "test-window-budget-" + Date.now();
    expect((await checkRateLimit(request(), scope, 2, 60_000)).allowed).toBe(true);
    expect((await checkRateLimit(request(), scope, 2, 60_000)).allowed).toBe(true);
    const limited = await checkRateLimit(request(), scope, 2, 60_000);
    expect(limited.allowed).toBe(false);
    expect(limited.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("applies a user-scoped quota across different client IPs", async () => {
    const scope = "test-user-budget-" + Date.now();
    const first = new Request("https://vedic-ai.test/api/chat", { headers: { "x-real-ip": "198.51.100.1" } });
    const second = new Request("https://vedic-ai.test/api/chat", { headers: { "x-real-ip": "198.51.100.2" } });
    expect((await checkRateLimit(first, scope, 1, 60_000, "test-user-uuid")).allowed).toBe(true);
    expect((await checkRateLimit(second, scope, 1, 60_000, "test-user-uuid")).allowed).toBe(false);
  });
});
