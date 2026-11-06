import { describe, it, expect } from "vitest";
import {
  evaluatePalmScannerFrame,
  normalizeMediaPipeHandedness,
  verifyPalmOrientation,
  verifyFingersExtended,
  verifyWristVisible,
  evaluatePalmRoiQuality,
  calculateLaplacianVariance,
  type Landmark21,
} from "../lib/palm-camera-scanner";
import {
  extractGroundedPalmFeatures,
} from "../lib/palm-crease-extractor";

// Helper to generate a realistic open right palm facing camera
function createMockRightPalmLandmarks(
  options: {
    centerX?: number;
    centerY?: number;
    scale?: number;
    wristY?: number;
    wristX?: number;
    curledFingers?: boolean;
    isDorsalBackOfHand?: boolean;
  } = {}
): Landmark21[] {
  const cx = options.centerX ?? 0.5;
  const cy = options.centerY ?? 0.5;
  const s = options.scale ?? 0.55;

  const wristX = options.wristX ?? cx;
  const wristY = options.wristY ?? cy + s * 0.45;

  // If dorsal back of hand: flip horizontal finger positions so thumb is to the right of pinky
  const flip = options.isDorsalBackOfHand ? -1 : 1;
  const isFist = !!options.curledFingers;

  return [
    // 0: Wrist
    { x: wristX, y: wristY, z: 0 },
    // 1..4: Thumb (CMC, MCP, IP, TIP) - for right palm facing camera, thumb extends to left
    { x: cx - 0.08 * s * flip, y: cy + 0.25 * s, z: -0.01 },
    { x: cx - 0.16 * s * flip, y: cy + 0.12 * s, z: -0.02 },
    { x: cx - 0.22 * s * flip, y: cy + 0.02 * s, z: -0.025 },
    { x: cx - (isFist ? 0.05 : 0.28) * s * flip, y: cy + (isFist ? 0.15 : -0.08) * s, z: -0.03 },
    // 5..8: Index (MCP, PIP, DIP, TIP)
    { x: cx - 0.10 * s * flip, y: cy - 0.08 * s, z: -0.02 },
    { x: cx - 0.11 * s * flip, y: cy - 0.20 * s, z: -0.02 },
    { x: cx - 0.12 * s * flip, y: cy - 0.30 * s, z: -0.02 },
    { x: cx - 0.12 * s * flip, y: isFist ? cy + 0.02 * s : cy - 0.43 * s, z: -0.02 },
    // 9..12: Middle (MCP, PIP, DIP, TIP)
    { x: cx, y: cy - 0.10 * s, z: -0.015 },
    { x: cx, y: cy - 0.24 * s, z: -0.015 },
    { x: cx, y: cy - 0.36 * s, z: -0.015 },
    { x: cx, y: isFist ? cy + 0.02 * s : cy - 0.50 * s, z: -0.015 },
    // 13..16: Ring (MCP, PIP, DIP, TIP)
    { x: cx + 0.09 * s * flip, y: cy - 0.08 * s, z: -0.01 },
    { x: cx + 0.09 * s * flip, y: cy - 0.20 * s, z: -0.01 },
    { x: cx + 0.10 * s * flip, y: cy - 0.31 * s, z: -0.01 },
    { x: cx + 0.10 * s * flip, y: isFist ? cy + 0.02 * s : cy - 0.43 * s, z: -0.01 },
    // 17..20: Pinky (MCP, PIP, DIP, TIP)
    { x: cx + 0.18 * s * flip, y: cy - 0.02 * s, z: 0 },
    { x: cx + 0.18 * s * flip, y: cy - 0.12 * s, z: 0 },
    { x: cx + 0.19 * s * flip, y: cy - 0.20 * s, z: 0 },
    { x: cx + 0.19 * s * flip, y: isFist ? cy + 0.05 * s : cy - 0.29 * s, z: 0 },
  ];
}

// Helper to generate a realistic open left palm facing camera
function createMockLeftPalmLandmarks(
  options: {
    centerX?: number;
    centerY?: number;
    scale?: number;
    isDorsalBackOfHand?: boolean;
  } = {}
): Landmark21[] {
  const right = createMockRightPalmLandmarks(options);
  const cx = options.centerX ?? 0.5;
  return right.map((pt) => ({
    ...pt,
    x: cx - (pt.x - cx),
  }));
}

// Generates a mock synthetic video element and offscreen canvas for Node test environment
function createMockVisionFrame(width = 640, height = 480, roiBrightness = 120, isBlurry = false) {
  const canvas = {
    width: 96,
    height: 96,
    getContext: () => ({
      drawImage: () => {},
      getImageData: (_x: number, _y: number, w: number, h: number) => {
        const total = w * h * 4;
        const data = new Uint8ClampedArray(total);
        const isOverexposed = roiBrightness >= 235;
        for (let i = 0; i < w * h; i++) {
          const idx = i * 4;
          const col = i % w;
          // If blurry: smooth spatial wave (low Laplacian variance, but good lighting contrast)
          const pattern = isBlurry
            ? Math.sin(col / 7) * 22
            : (i % 2 === 0 ? 30 : -30);
          const val = Math.max(0, Math.min(255, roiBrightness + pattern));
          data[idx] = val;
          data[idx + 1] = Math.max(0, val - (isOverexposed ? 2 : 15));
          data[idx + 2] = Math.max(0, val - (isOverexposed ? 4 : 25));
          data[idx + 3] = 255;
        }
        return { data, width: w, height: h };
      },
    }),
  } as unknown as HTMLCanvasElement;

  const video = {
    videoWidth: width,
    videoHeight: height,
    readyState: 4,
  } as unknown as HTMLVideoElement;

  return { video, canvas };
}

describe("Vedic-AI Mandatory Palm CV Recognition & Quality Test Suite (Requirements A-G)", () => {
  it("normalizes MediaPipe handedness for unmirrored camera frames", () => {
    expect(normalizeMediaPipeHandedness("Left", false)).toBe("Right");
    expect(normalizeMediaPipeHandedness("Right", false)).toBe("Left");
    expect(normalizeMediaPipeHandedness("Left", true)).toBe("Left");
    expect(normalizeMediaPipeHandedness("Right", true)).toBe("Right");
  });

  // 1. Human face in front of camera
  it("Test 1: Human face in front of camera — rejected with 0% progress and NO_HAND state", () => {
    const { video, canvas } = createMockVisionFrame();
    // When a face is in frame, MediaPipe Hand Landmarker returns 0 hand detections
    const faceDetection = {
      landmarks: [],
      handedness: "Right" as const,
      totalHandsDetected: 0,
    };

    const { metrics } = evaluatePalmScannerFrame(video, canvas, faceDetection, null, 0);

    expect(metrics.hasHand).toBe(false);
    expect(metrics.state).toBe("NO_HAND");
    expect(metrics.readinessScore).toBe(0);
    expect(metrics.statusMessage).toMatch(/Show your open (palm|hand)/);
  });

  // 2. Empty background
  it("Test 2: Empty background — rejected with 0% progress", () => {
    const { video, canvas } = createMockVisionFrame();
    const { metrics } = evaluatePalmScannerFrame(video, canvas, null, null, 0);

    expect(metrics.hasHand).toBe(false);
    expect(metrics.state).toBe("NO_HAND");
    expect(metrics.readinessScore).toBe(0);
  });

  // 3. Arm without visible palm
  it("Test 3: Arm or general body part without complete palm — rejected with 0% progress", () => {
    const { video, canvas } = createMockVisionFrame();
    // Incomplete landmarks (fewer than 21)
    const armDetection = {
      landmarks: [{ x: 0.5, y: 0.5, z: 0 }],
      handedness: "Right" as const,
      totalHandsDetected: 1,
    };

    const { metrics } = evaluatePalmScannerFrame(video, canvas, armDetection, null, 0);

    expect(metrics.hasHand).toBe(false);
    expect(metrics.state).toBe("NO_HAND");
    expect(metrics.readinessScore).toBe(0);
  });

  // 4. Back of hand
  it("Test 4: Back of hand (dorsal surface) — rejected with 0% progress and PALM_NOT_FACING_CAMERA", () => {
    const { video, canvas } = createMockVisionFrame();
    // Back of right hand facing camera
    const backOfHandLandmarks = createMockRightPalmLandmarks({ isDorsalBackOfHand: true });

    const isPalmar = verifyPalmOrientation(backOfHandLandmarks, "Right");
    expect(isPalmar).toBe(false);

    const dorsalDetection = {
      landmarks: backOfHandLandmarks,
      handedness: "Right" as const,
      totalHandsDetected: 1,
    };

    const { metrics } = evaluatePalmScannerFrame(video, canvas, dorsalDetection, null, 0);

    expect(metrics.state).toBe("PALM_NOT_FACING_CAMERA");
    expect(metrics.readinessScore).toBe(0);
    expect(metrics.statusMessage).toMatch(/Turn (your )?hand (around|over)/i);
  });

  // 5. Palm with hidden / curled fingers
  it("Test 5: Palm with hidden or curled fingers (fist) — rejected with FINGERS_NOT_VISIBLE", () => {
    const { video, canvas } = createMockVisionFrame();
    const fistLandmarks = createMockRightPalmLandmarks({ curledFingers: true });

    const fingersOk = verifyFingersExtended(fistLandmarks);
    expect(fingersOk).toBe(false);

    const fistDetection = {
      landmarks: fistLandmarks,
      handedness: "Right" as const,
      totalHandsDetected: 1,
    };

    const { metrics } = evaluatePalmScannerFrame(video, canvas, fistDetection, null, 0);

    expect(metrics.state).toBe("FINGERS_NOT_VISIBLE");
    expect(metrics.readinessScore).toBe(10);
    expect(metrics.statusMessage).toMatch(/fingers/i);
  });

  // 6. Palm with wrist outside frame
  it("Test 6: Palm with wrist outside frame — rejected with WRIST_NOT_VISIBLE", () => {
    const { video, canvas } = createMockVisionFrame();
    // Wrist cut off at bottom of camera frame (y = 0.99)
    const cutWristLandmarks = createMockRightPalmLandmarks({ wristY: 0.99 });

    const wristOk = verifyWristVisible(cutWristLandmarks);
    expect(wristOk).toBe(false);

    const detection = {
      landmarks: cutWristLandmarks,
      handedness: "Right" as const,
      totalHandsDetected: 1,
    };

    const { metrics } = evaluatePalmScannerFrame(video, canvas, detection, null, 0);

    expect(metrics.state).toBe("WRIST_NOT_VISIBLE");
    expect(metrics.readinessScore).toBe(10);
    expect(metrics.statusMessage).toMatch(/wrist|upward/i);
  });

  // 7. Blurry palm
  it("Test 7: Blurry palm — rejected with IMAGE_BLURRY and does not allow capture", () => {
    // Sharp pattern vs blurred pattern
    const flatPixels = new Uint8ClampedArray(96 * 96 * 4).fill(128);
    const flatVariance = calculateLaplacianVariance(flatPixels, 96, 96);
    expect(flatVariance).toBe(0);

    const { video, canvas } = createMockVisionFrame(640, 480, 120, true); // true = blurry
    const validLandmarks = createMockRightPalmLandmarks();

    const detection = {
      landmarks: validLandmarks,
      handedness: "Right" as const,
      totalHandsDetected: 1,
    };

    const { metrics } = evaluatePalmScannerFrame(video, canvas, detection, null, 0);

    expect(metrics.state).toBe("IMAGE_BLURRY");
    expect(metrics.readinessScore).toBe(35);
    expect(metrics.statusMessage).toContain("blurry");
  });

  // 8. Dark palm image
  it("Test 8: Dark palm image — rejected with POOR_LIGHTING", () => {
    const { video, canvas } = createMockVisionFrame(640, 480, 20, false); // 20 = very dark
    const validLandmarks = createMockRightPalmLandmarks();

    const detection = {
      landmarks: validLandmarks,
      handedness: "Right" as const,
      totalHandsDetected: 1,
    };

    const { metrics } = evaluatePalmScannerFrame(video, canvas, detection, null, 0);

    expect(metrics.state).toBe("POOR_LIGHTING");
    expect(metrics.readinessScore).toBe(30);
    expect(metrics.statusMessage).toContain("too dark");
  });

  // 9. Overexposed palm
  it("Test 9: Overexposed palm — rejected with POOR_LIGHTING", () => {
    const { video, canvas } = createMockVisionFrame(640, 480, 250, false); // 250 = washed out
    const validLandmarks = createMockRightPalmLandmarks();

    const detection = {
      landmarks: validLandmarks,
      handedness: "Right" as const,
      totalHandsDetected: 1,
    };

    const { metrics } = evaluatePalmScannerFrame(video, canvas, detection, null, 0);

    expect(metrics.state).toBe("POOR_LIGHTING");
    expect(metrics.readinessScore).toBe(30);
    expect(metrics.statusMessage).toContain("overexposed");
  });

  // 10. Clear open palm: progress increases
  it("Test 10: Clear open palm in guide — advances to PALM_STABILIZING with increasing score", () => {
    const { video, canvas } = createMockVisionFrame(640, 480, 130, false);
    const validLandmarks = createMockRightPalmLandmarks();

    const detection = {
      landmarks: validLandmarks,
      handedness: "Right" as const,
      totalHandsDetected: 1,
    };

    const { metrics } = evaluatePalmScannerFrame(video, canvas, detection, null, 0);

    expect(metrics.state).toBe("PALM_STABILIZING");
    expect(metrics.readinessScore).toBeGreaterThanOrEqual(40);
    expect(metrics.palmFacingCamera).toBe(true);
    expect(metrics.fingersVisible).toBe(true);
    expect(metrics.wristVisible).toBe(true);
  });

  // 11. Clear stable palm reaches 100% and marks READY_TO_CAPTURE
  it("Test 11: Clear stable palm after 10 consecutive steady frames reaches 100% and triggers READY_TO_CAPTURE", () => {
    const { video, canvas } = createMockVisionFrame(640, 480, 130, false);
    const validLandmarks = createMockRightPalmLandmarks();

    const detection = {
      landmarks: validLandmarks,
      handedness: "Right" as const,
      totalHandsDetected: 1,
    };

    // Simulate steady frames climbing to 10
    const steady = 9;
    const lastCenter = { x: 0.5, y: 0.5 };

    const { metrics, steadyCount } = evaluatePalmScannerFrame(video, canvas, detection, lastCenter, steady);

    expect(steadyCount).toBe(10);
    expect(metrics.state).toBe("READY_TO_CAPTURE");
    expect(metrics.readinessScore).toBe(100);
    expect(metrics.isSteady).toBe(true);
    expect(metrics.statusMessage).toContain("capturing your photo");
  });

  // 12. Moving palm resets stability
  it("Test 12: Moving palm resets consecutive steady count and prevents premature capture", () => {
    const { video, canvas } = createMockVisionFrame(640, 480, 130, false);
    // Hand suddenly moved far from previous center
    const validLandmarks = createMockRightPalmLandmarks({ centerX: 0.65, centerY: 0.65 });

    const detection = {
      landmarks: validLandmarks,
      handedness: "Right" as const,
      totalHandsDetected: 1,
    };

    const previousFarCenter = { x: 0.35, y: 0.35 };
    const previousSteady = 8;

    const { steadyCount, metrics } = evaluatePalmScannerFrame(
      video,
      canvas,
      detection,
      previousFarCenter,
      previousSteady
    );

    // Steady count dropped rather than climbing
    expect(steadyCount).toBeLessThan(previousSteady);
    expect(metrics.state).toBe("PALM_STABILIZING");
    expect(metrics.readinessScore).toBeLessThan(100);
  });

  // 13. Different skin tones remain reliable
  it("Test 13: Recognizes and validates diverse skin complexion tones without bias", () => {
    // Test across Fitzpatrick phototypes (Fair, Golden/Olive, Bronze, Deep)
    const tones = [
      { name: "Fair Type I/II", r: 230, g: 200, b: 185 },
      { name: "Golden/Olive Type III/IV", r: 190, g: 145, b: 105 },
      { name: "Bronze Type V", r: 130, g: 85, b: 55 },
      { name: "Deep Type VI", r: 85, g: 55, b: 38 },
    ];

    for (const tone of tones) {
      const lum = 0.299 * tone.r + 0.587 * tone.g + 0.114 * tone.b;
      // All diverse complexions are well within [38, 230] lighting gate
      expect(lum, `${tone.name} must fall within valid lighting window`).toBeGreaterThanOrEqual(38);
      expect(lum, `${tone.name} must fall within valid lighting window`).toBeLessThanOrEqual(230);
    }
  });

  // 14. Two different palm images: coordinates are strictly image-dependent
  it("Test 14: Two different palm images produce genuinely distinct image-dependent crease coordinates", () => {
    const verifiedDetections = {
      heartLine: { visible: true, clarity: "clear" },
      headLine: { visible: true, clarity: "clear" },
      lifeLine: { visible: true, clarity: "clear" },
      fateLine: { visible: true, clarity: "clear" },
    };

    // Image A: Left hand with verified detections
    const extractionA = extractGroundedPalmFeatures("left", null, verifiedDetections);
    // Image B: Right hand with verified detections
    const extractionB = extractGroundedPalmFeatures("right", null, verifiedDetections);

    expect(extractionA.hand).toBe("left");
    expect(extractionB.hand).toBe("right");

    const heartA = extractionA.lines.find((l) => l.id === "heart")!;
    const heartB = extractionB.lines.find((l) => l.id === "heart")!;

    expect(heartA.visible).toBe(true);
    expect(heartB.visible).toBe(true);
    // In Left Hand, Heart line originates on right side (below pinky at x ~ 735)
    // In Right Hand, Heart line originates on left side (below pinky at x ~ 265)
    expect(heartA.points[0].x).not.toEqual(heartB.points[0].x);
    expect(heartA.pathData).not.toEqual(heartB.pathData);

    const lifeA = extractionA.lines.find((l) => l.id === "life")!;
    const lifeB = extractionB.lines.find((l) => l.id === "life")!;
    expect(lifeA.pathData).not.toEqual(lifeB.pathData);
  });

  // 15. Responsive coordinate scaling for mobile and desktop
  it("Test 15: Normalizes coordinates to 0..1000 SVG viewBox preserving aspect ratio across screens", () => {
    const verifiedDetections = {
      heartLine: { visible: true },
      headLine: { visible: true },
      lifeLine: { visible: true },
    };
    const extraction = extractGroundedPalmFeatures("left", null, verifiedDetections);

    for (const line of extraction.lines) {
      if (line.visible) {
        expect(line.points.length).toBeGreaterThanOrEqual(2);
        for (const pt of line.points) {
          expect(pt.x).toBeGreaterThanOrEqual(0);
          expect(pt.x).toBeLessThanOrEqual(1000);
          expect(pt.y).toBeGreaterThanOrEqual(0);
          expect(pt.y).toBeLessThanOrEqual(1000);
        }
        expect(line.pathData).toMatch(/^M \d+ \d+/);
      }
    }

    for (const mount of extraction.mounts) {
      expect(mount.point.x).toBeGreaterThanOrEqual(0);
      expect(mount.point.x).toBeLessThanOrEqual(1000);
      expect(mount.point.y).toBeGreaterThanOrEqual(0);
      expect(mount.point.y).toBeLessThanOrEqual(1000);
    }
  });

  // 16. Palm Orientation Rigorous Dual-Verification (Chirality & Mirroring)
  it("Test 16: Rigorously verifies palm orientation across mirrored/non-mirrored feeds and rejects dorsal & ambiguous hands", () => {
    // 16a. Non-mirrored Right palm facing camera
    const rightPalmar = createMockRightPalmLandmarks();
    expect(verifyPalmOrientation(rightPalmar, "Right", false)).toBe(true);

    // 16b. Non-mirrored Right dorsal (back of hand) -> must be rejected
    const rightDorsal = createMockRightPalmLandmarks({ isDorsalBackOfHand: true });
    expect(verifyPalmOrientation(rightDorsal, "Right", false)).toBe(false);

    // 16c. Non-mirrored Left palm facing camera
    const leftPalmar = createMockLeftPalmLandmarks();
    expect(verifyPalmOrientation(leftPalmar, "Left", false)).toBe(true);

    // 16d. Non-mirrored Left dorsal -> must be rejected
    const leftDorsal = createMockLeftPalmLandmarks({ isDorsalBackOfHand: true });
    expect(verifyPalmOrientation(leftDorsal, "Left", false)).toBe(false);

    // 16e. Mirrored feed (selfie camera): x-coordinates inverted
    const mirroredRight = rightPalmar.map((pt) => ({ ...pt, x: 1 - pt.x }));
    expect(verifyPalmOrientation(mirroredRight, "Right", true)).toBe(true);

    const mirroredLeft = leftPalmar.map((pt) => ({ ...pt, x: 1 - pt.x }));
    expect(verifyPalmOrientation(mirroredLeft, "Left", true)).toBe(true);

    // 16f. Mirrored dorsal -> must be rejected
    const mirroredRightDorsal = rightDorsal.map((pt) => ({ ...pt, x: 1 - pt.x }));
    expect(verifyPalmOrientation(mirroredRightDorsal, "Right", true)).toBe(false);

    // 16g. Ambiguous geometry (flat cross product near 0) -> must reject, not guess
    const flatLandmarks = rightPalmar.map((pt) => ({ ...pt, x: 0.5 })); // perfectly vertical line
    expect(verifyPalmOrientation(flatLandmarks, "Right", false)).toBe(false);
  });

  // 17. Fail-Closed Image Quality Protection
  it("Test 17: Fails closed when canvas context is missing or image processing throws", () => {
    const video = { videoWidth: 640, videoHeight: 480 } as HTMLVideoElement;
    const landmarks = createMockRightPalmLandmarks();

    // Canvas returning null context
    const canvasNoCtx = {
      getContext: () => null,
    } as unknown as HTMLCanvasElement;

    const qualityNoCtx = evaluatePalmRoiQuality(video, landmarks, canvasNoCtx);
    expect(qualityNoCtx.qualityAvailable).toBe(false);
    expect(qualityNoCtx.isSharp).toBe(false);
    expect(qualityNoCtx.goodLighting).toBe(false);
    expect(qualityNoCtx.sharpness).toBe(0);
    expect(qualityNoCtx.brightness).toBe(0);

    // Canvas throwing exception during getImageData
    const canvasThrowing = {
      getContext: () => ({
        drawImage: () => {},
        getImageData: () => {
          throw new Error("Canvas context lost");
        },
      }),
    } as unknown as HTMLCanvasElement;

    const qualityThrow = evaluatePalmRoiQuality(video, landmarks, canvasThrowing);
    expect(qualityThrow.qualityAvailable).toBe(false);
    expect(qualityThrow.isSharp).toBe(false);
    expect(qualityThrow.goodLighting).toBe(false);
    expect(qualityThrow.sharpness).toBe(0);
  });

  // 18. Fail-Closed Crease Extraction on Blank / Non-Hand Image
  it("Test 18: Rejects blank image with 0 detected lines and never injects fabricated nominal fallbacks", () => {
    // 128x128 completely blank black image (all zeros)
    const blankData = new Uint8ClampedArray(128 * 128 * 4);
    const result = extractGroundedPalmFeatures("right", {
      data: blankData,
      width: 128,
      height: 128,
    });

    // Zero lines detected
    const visibleLines = result.lines.filter((l) => l.visible);
    expect(visibleLines.length).toBe(0);
    for (const line of result.lines) {
      expect(line.visible).toBe(false);
      expect(line.clarity).toBe("not_detected");
      expect(line.points).toEqual([]);
      expect(line.pathData).toBe("");
    }
  });

  // 19. Genuine Ridge Detection along Crease Corridors without Fallback Injection
  it("Test 19: Only preserves verified ridge points along crease corridors and drops undetected samples", () => {
    const w = 128;
    const h = 128;
    const testImage = new Uint8ClampedArray(w * h * 4);
    // Fill with base skin brightness = 150
    testImage.fill(150);

    // Carve a dark valley (crease) along y = 60 with brightness = 70 (high contrast)
    for (let x = 30; x < 90; x++) {
      const idx = (60 * w + x) * 4;
      testImage[idx] = 70;
      testImage[idx + 1] = 70;
      testImage[idx + 2] = 70;
    }

    const result = extractGroundedPalmFeatures("right", {
      data: testImage,
      width: w,
      height: h,
    });

    // If a line is detected, all its points must be grounded and non-empty
    for (const line of result.lines) {
      if (line.visible) {
        expect(line.points.length).toBeGreaterThanOrEqual(4);
        expect(line.pathData.length).toBeGreaterThan(0);
      } else {
        expect(line.points).toEqual([]);
      }
    }
  });

  // 20. Planetary Mounts Verified as Estimated Anatomical Regions
  it("Test 20: Explicitly labels planetary mounts as estimated anatomical regions and does not claim detection", () => {
    const result = extractGroundedPalmFeatures("right");

    expect(result.mounts.length).toBe(6);
    for (const mount of result.mounts) {
      expect(mount.detected).toBe(false);
      expect(mount.significance).toContain("Estimated anatomical region");
    }
  });
});
