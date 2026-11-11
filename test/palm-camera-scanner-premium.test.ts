import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PALM_STATE_MESSAGES, type PalmReadinessState } from "../lib/palm-camera-scanner";

describe("Vedic-AI Palm Scanner Premium Redesign & Quality Upgrade Audit", () => {
  it("verifies PALM_STATE_MESSAGES match competition-ready live positioning guidance", () => {
    expect(PALM_STATE_MESSAGES.NO_HAND).toMatch(/Show your open (palm|hand)/);
    expect(PALM_STATE_MESSAGES.PALM_TOO_FAR).toBe("Move your hand closer");
    expect(PALM_STATE_MESSAGES.PALM_TOO_CLOSE).toBe("Move your hand slightly away");
    expect(PALM_STATE_MESSAGES.FINGERS_CROPPED).toBe("Keep all fingertips inside the guide");
    expect(PALM_STATE_MESSAGES.WRIST_CROPPED).toBe("Move your hand slightly upward");
    expect(PALM_STATE_MESSAGES.HAND_OUTSIDE_GUIDE).toBe("Center your palm inside the outline");
    expect(PALM_STATE_MESSAGES.PALM_TILTED).toBe("Keep your palm straight");
    expect(PALM_STATE_MESSAGES.IMAGE_BLURRY).toContain("blurry");
    expect(PALM_STATE_MESSAGES.POOR_LIGHTING).toContain("brighter lighting");
    expect(PALM_STATE_MESSAGES.PALM_NOT_FACING_CAMERA).toMatch(/Turn (your )?hand (around|over)/i);
    expect(PALM_STATE_MESSAGES.PALM_STABILIZING).toContain("Hold still while we scan");
    expect(PALM_STATE_MESSAGES.READY_TO_CAPTURE).toContain("capturing your photo");
  });

  it("verifies desktop scanner modal dimensions in globals.css provide immersive 900-1100px width and ~90vh height", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf-8");

    // Modal desktop width & height
    expect(css).toContain("width: min(94vw, 1080px)");
    expect(css).toContain("max-width: 1100px");
    expect(css).toContain("height: min(90vh, 880px)");
    expect(css).toContain("max-height: 92vh");

    // Viewfinder occupies majority of space
    expect(css).toContain(".palm-camera-viewfinder");
    expect(css).toContain("min-height: 480px");

    // Tablet responsive rules (~92vw)
    expect(css).toContain("width: 92vw !important");
    expect(css).toContain("max-width: 92vw !important");

    // Mobile nearly fullscreen rules (100vw, 100svh)
    expect(css).toContain("width: 100vw !important");
    expect(css).toContain("height: 100svh !important");
  });

  it("verifies biometric animated laser scanning beam styles and keyframes are implemented", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf-8");

    expect(css).toContain(".palm-scan-laser-line");
    expect(css).toContain(".palm-scan-laser-beam");
    expect(css).toContain("@keyframes palm-laser-sweep");
    expect(css).toContain("@keyframes palm-laser-lock");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("verifies progressive camera resolution negotiation and ImageCapture in page.tsx", () => {
    const pageCode = fs.readFileSync(path.resolve(__dirname, "../app/palm-reading/page.tsx"), "utf-8");

    // 4K UHD progressive tier
    expect(pageCode).toContain("width: { ideal: 3840 }");
    expect(pageCode).toContain("height: { ideal: 2160 }");

    // Full HD tier
    expect(pageCode).toContain("width: { ideal: 1920 }");
    expect(pageCode).toContain("height: { ideal: 1080 }");

    // HD tier
    expect(pageCode).toContain("width: { ideal: 1280 }");
    expect(pageCode).toContain("height: { ideal: 720 }");

    // Resolution classification
    expect(pageCode).toContain('"4K"');
    expect(pageCode).toContain('"Full HD"');
    expect(pageCode).toContain('"HD"');
    expect(pageCode).toContain('"Standard"');

    // Live resolution badge displayed in camera header
    expect(pageCode).toContain("palm-camera-res-badge");
    expect(pageCode).toContain("palm-res-dot");

    // High-resolution capture: ImageCapture with fallback to 0.95 quality canvas
    expect(pageCode).toContain("ImageCapture");
    expect(pageCode).toContain("takePhoto");
    expect(pageCode).toContain("image/jpeg");
  });

  it("verifies PalmCameraGuide renders resolution badge and animated laser beam", () => {
    const guideCode = fs.readFileSync(path.resolve(__dirname, "../components/palm/palm-camera-guide.tsx"), "utf-8");

    expect(guideCode).toContain("resolutionBadge");
    expect(guideCode).toContain("palm-scan-laser-line");
    expect(guideCode).toContain("palm-scan-laser-beam");
    expect(guideCode).toContain("palm-hud-resolution-pill");
    expect(guideCode).toContain("WRIST BASE");
    expect(guideCode).toContain("FINGERTIPS");
  });
});

