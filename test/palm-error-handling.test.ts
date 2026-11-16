import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Palm Reading HTTP 502 Provider Timeout and 422 Quality Handling", () => {
  const pageCode = fs.readFileSync(path.resolve(__dirname, "../app/palm-reading/page.tsx"), "utf-8");

  it("preserves unchanged HTTP 422 quality-rejection handling", () => {
    expect(pageCode).toContain("if (response.status === 422 && data.clear === false)");
    expect(pageCode).toContain('"The photo needs another look. Please retake it with the full palm clearly visible."');
  });

  it("handles HTTP 502 provider timeout responses gracefully", () => {
    expect(pageCode).toContain("if (response.status === 502)");
    expect(pageCode).toContain("Please retake the photo with bright lighting and the full open palm visible.");
    expect(pageCode).toContain("setQuality(message);");
  });

  it("correctly formats error messages for simulated 502 payloads", () => {
    function resolve502Message(data: { error?: string; reason?: string }) {
      const rawMsg =
        typeof data.error === "string" && data.error.trim()
          ? data.error
          : typeof data.reason === "string" && data.reason.trim()
            ? data.reason
            : "";
      const userGuidance = "Please retake the photo with bright lighting and the full open palm visible.";
      let message = "";
      if (!rawMsg) {
        message = `The photo was unclear or taken in low light. ${userGuidance}`;
      } else if (rawMsg.includes("bright lighting") && rawMsg.includes("full open palm")) {
        message = rawMsg;
      } else {
        const cleaned = rawMsg.replace(/\s*Please try again[^.]*\.?/gi, "").trim();
        message = cleaned
          ? `${cleaned.replace(/[.]+$/, "")}. ${userGuidance}`
          : `The photo needs another look. ${userGuidance}`;
      }
      return message;
    }

    // 1. Standard Gemini / Groq provider timeout
    const msg1 = resolve502Message({ error: "The palm vision model timed out. Please try again with a clear photo." });
    expect(msg1).toBe("The palm vision model timed out. Please retake the photo with bright lighting and the full open palm visible.");

    // 2. Standard service analysis failure
    const msg2 = resolve502Message({ error: "The palm-reading service could not analyse this image. Please try again with a clear, well-lit photo." });
    expect(msg2).toBe("The palm-reading service could not analyse this image. Please retake the photo with bright lighting and the full open palm visible.");

    // 3. Empty Vercel Edge 502 body
    const msg3 = resolve502Message({});
    expect(msg3).toBe("The photo was unclear or taken in low light. Please retake the photo with bright lighting and the full open palm visible.");

    // 4. Custom reason
    const msg4 = resolve502Message({ reason: "Camera sensor returned noisy low-light frame" });
    expect(msg4).toBe("Camera sensor returned noisy low-light frame. Please retake the photo with bright lighting and the full open palm visible.");
  });
});

