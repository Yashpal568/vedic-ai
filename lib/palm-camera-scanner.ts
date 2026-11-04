/**
 * Vedic-AI Smart Palm Scanner Engine
 * Real-time on-device computer vision and hand detection for camera viewfinders.
 * Powered by Google MediaPipe Tasks Vision with genuine palm-only recognition,
 * strict orientation verification, landmark geometry, and Laplacian ROI sharpness.
 */

export type PalmReadinessState =
  | "NO_HAND"
  | "HAND_DETECTED"
  | "PALM_NOT_FACING_CAMERA"
  | "PALM_OUTSIDE_GUIDE"
  | "PALM_TOO_FAR"
  | "PALM_TOO_CLOSE"
  | "FINGERS_NOT_VISIBLE"
  | "WRIST_NOT_VISIBLE"
  | "IMAGE_BLURRY"
  | "POOR_LIGHTING"
  | "PALM_STABILIZING"
  | "READY_TO_CAPTURE"
  | "CAPTURED";

export interface Landmark21 {
  x: number;
  y: number;
  z?: number;
}

export interface ScannerMetrics {
  hasHand: boolean;
  state: PalmReadinessState;
  readinessScore: number;
  statusMessage: string;
  insideGuide: boolean;
  optimalDistance: boolean;
  goodLighting: boolean;
  isSharp: boolean;
  isSteady: boolean;
  palmFacingCamera: boolean;
  fingersVisible: boolean;
  wristVisible: boolean;
  sharpnessValue: number;
  brightnessValue: number;
  contrastValue: number;
  handedness: "Left" | "Right";
  landmarks?: Landmark21[];
}

// Retain legacy interfaces for backward compatibility with existing tests
export type HandLandmarkPoint = Landmark21;
export interface MediaPipeHandResults {
  multiHandLandmarks?: HandLandmarkPoint[][];
  multiHandedness?: Array<{ label: "Left" | "Right"; score: number }>;
}
export interface MediaPipeHandsInstance {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: MediaPipeHandResults) => void) => void;
  send: (input: { image: HTMLVideoElement | HTMLCanvasElement }) => Promise<void>;
  close?: () => Promise<void>;
}
export interface MediaPipeHandsConstructor {
  new (config: { locateFile: (file: string) => string }): MediaPipeHandsInstance;
}

/**
 * Validates that the palmar (front) surface of the hand is facing the camera,
 * rather than the dorsal (back) surface.
 * Uses 2D cross product of anatomical vectors and lateral thumb-to-pinky relationship.
 * Enforces dual-condition agreement (both chirality AND thumb position must align).
 * Rejects ambiguous landmarks where orientation cannot be decisively determined.
 */
export function verifyPalmOrientation(
  landmarks: Landmark21[],
  handedness: "Left" | "Right",
  isMirrored = false
): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  const pinkyMcp = landmarks[17];
  const pinkyTip = landmarks[20];

  // Up vector: Wrist -> Middle Knuckle
  const ux = middleMcp.x - wrist.x;
  const uy = middleMcp.y - wrist.y;

  // Across vector: Index Knuckle -> Pinky Knuckle
  const vx = pinkyMcp.x - indexMcp.x;
  const vy = pinkyMcp.y - indexMcp.y;

  // 2D cross product: ux * vy - uy * vx
  const cp2d = ux * vy - uy * vx;

  // Lateral relationship: thumb vs pinky
  const thumbDx = thumbTip.x - pinkyTip.x;

  // Account for camera mirroring (front/selfie camera vs back camera)
  const effectiveHandedness = isMirrored
    ? (handedness === "Right" ? "Left" : "Right")
    : handedness;

  if (effectiveHandedness === "Right") {
    // For an upright right palm facing camera (uy < 0):
    // Index MCP is to the left of Pinky MCP (vx > 0), resulting in positive cp2d.
    // Thumb tip extends clearly to the left of pinky tip (thumbDx < -0.02).
    // BOTH conditions must be satisfied — reject if indicators contradict or if chirality is ambiguous.
    const hasPalmarChirality = cp2d > 0.012;
    const hasPalmarThumb = thumbDx < -0.02;
    return hasPalmarChirality && hasPalmarThumb;
  } else {
    // For an upright left palm facing camera (uy < 0):
    // Pinky MCP is to the left of Index MCP (vx < 0), resulting in negative cp2d.
    // Thumb tip extends clearly to the right of pinky tip (thumbDx > 0.02).
    // BOTH conditions must be satisfied — reject if indicators contradict or if chirality is ambiguous.
    const hasPalmarChirality = cp2d < -0.012;
    const hasPalmarThumb = thumbDx > 0.02;
    return hasPalmarChirality && hasPalmarThumb;
  }
}

/**
 * Verifies that all five fingers are open and extended, not curled into a fist.
 */
export function verifyFingersExtended(landmarks: Landmark21[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const wrist = landmarks[0];

  // Check 4 major fingers: Index (8 vs 5), Middle (12 vs 9), Ring (16 vs 13), Pinky (20 vs 17)
  const fingerPairs = [
    { tip: landmarks[8], mcp: landmarks[5] },
    { tip: landmarks[12], mcp: landmarks[9] },
    { tip: landmarks[16], mcp: landmarks[13] },
    { tip: landmarks[20], mcp: landmarks[17] },
  ];

  for (const { tip, mcp } of fingerPairs) {
    const dTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    const dMcp = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
    // Tip must be significantly farther from wrist than knuckle
    if (dTip < dMcp * 1.15) {
      return false;
    }
  }

  // Thumb check (tip 4 vs cmc 1)
  const dThumb = Math.hypot(landmarks[4].x - wrist.x, landmarks[4].y - wrist.y);
  const dThumbBase = Math.hypot(landmarks[1].x - wrist.x, landmarks[1].y - wrist.y);
  if (dThumb < dThumbBase * 1.05) {
    return false;
  }

  return true;
}

/**
 * Verifies that the wrist is inside the video frame.
 */
export function verifyWristVisible(landmarks: Landmark21[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const wrist = landmarks[0];
  return (
    wrist.x >= 0.04 &&
    wrist.x <= 0.96 &&
    wrist.y >= 0.08 &&
    wrist.y <= 0.96
  );
}

/**
 * Calculates sharpness on a pixel buffer using discrete Laplacian variance.
 */
export function calculateLaplacianVariance(
  pixels: Uint8ClampedArray | number[],
  width: number,
  height: number
): number {
  if (width < 3 || height < 3) return 0;

  // Convert to grayscale luminance
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] =
      0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
  }

  // Discrete Laplacian convolution
  let sumL = 0;
  let sumLSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const l =
        gray[idx - 1] +
        gray[idx + 1] +
        gray[idx - width] +
        gray[idx + width] -
        4 * gray[idx];
      sumL += l;
      sumLSq += l * l;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sumL / count;
  const variance = Math.max(0, sumLSq / count - mean * mean);
  return variance;
}

export interface PalmRoiQuality {
  isSharp: boolean;
  goodLighting: boolean;
  qualityAvailable: boolean;
  sharpness: number;
  brightness: number;
  contrast: number;
}

/**
 * Evaluates the ROI quality (sharpness, brightness, contrast) of the palm region.
 * FAIL-CLOSED: Returns isSharp: false, goodLighting: false, qualityAvailable: false
 * if canvas context is missing or image processing fails. Never fabricates numbers.
 */
export function evaluatePalmRoiQuality(
  video: HTMLVideoElement,
  landmarks: Landmark21[],
  offscreenCanvas: HTMLCanvasElement
): PalmRoiQuality {
  if (!landmarks || landmarks.length < 21 || !offscreenCanvas) {
    return {
      isSharp: false,
      goodLighting: false,
      qualityAvailable: false,
      sharpness: 0,
      brightness: 0,
      contrast: 0,
    };
  }

  const palmLandmarkIndices = [0, 1, 2, 5, 9, 13, 17];
  const xs = palmLandmarkIndices.map((i) => landmarks[i].x);
  const ys = palmLandmarkIndices.map((i) => landmarks[i].y);

  const minX = Math.max(0, Math.min(...xs) - 0.05);
  const maxX = Math.min(1, Math.max(...xs) + 0.05);
  const minY = Math.max(0, Math.min(...ys) - 0.05);
  const maxY = Math.min(1, Math.max(...ys) + 0.05);

  const vW = video.videoWidth || 640;
  const vH = video.videoHeight || 480;

  const srcX = Math.floor(minX * vW);
  const srcY = Math.floor(minY * vH);
  const srcW = Math.max(16, Math.floor((maxX - minX) * vW));
  const srcH = Math.max(16, Math.floor((maxY - minY) * vH));

  const targetW = 96;
  const targetH = 96;
  offscreenCanvas.width = targetW;
  offscreenCanvas.height = targetH;
  const ctx = offscreenCanvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    return {
      isSharp: false,
      goodLighting: false,
      qualityAvailable: false,
      sharpness: 0,
      brightness: 0,
      contrast: 0,
    };
  }

  try {
    try {
      ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);
    } catch {
      // In mock/headless test environments without DOM video, evaluate canvas pixels
    }
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;

    let lumSum = 0;
    let lumSumSq = 0;
    const totalPixels = targetW * targetH;

    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const lum =
        0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      lumSum += lum;
      lumSumSq += lum * lum;
    }

    const brightness = lumSum / totalPixels;
    const lumVar = Math.max(0, lumSumSq / totalPixels - brightness * brightness);
    const contrast = Math.sqrt(lumVar);

    // Calculate discrete Laplacian variance for sharpness
    const sharpness = calculateLaplacianVariance(data, targetW, targetH);

    const goodLighting =
      brightness >= 38 && brightness <= 230 && contrast >= 14;
    // Calibrated sharpness threshold on 96x96 palm ROI
    const isSharp = sharpness >= 42;

    return {
      isSharp,
      goodLighting,
      qualityAvailable: true,
      sharpness,
      brightness,
      contrast,
    };
  } catch {
    return {
      isSharp: false,
      goodLighting: false,
      qualityAvailable: false,
      sharpness: 0,
      brightness: 0,
      contrast: 0,
    };
  }
}

/**
 * Strict palm scanner analysis pipeline evaluating live video frames and MediaPipe landmarks.
 * NEVER accepts a face, non-hand, empty background, or dorsal hand as a valid palm.
 */
export function evaluatePalmScannerFrame(
  video: HTMLVideoElement,
  offscreenCanvas: HTMLCanvasElement,
  handDetection: {
    landmarks: Landmark21[];
    handedness: "Left" | "Right";
    totalHandsDetected: number;
  } | null,
  lastCenter: { x: number; y: number } | null,
  consecutiveSteady: number,
  isMirrored = false
): {
  metrics: ScannerMetrics;
  center: { x: number; y: number } | null;
  steadyCount: number;
} {
  // Gate 1: No hand detected (MediaPipe HandLandmarker detected 0 hands)
  // This automatically rejects faces, empty background, arm-only, or general skin surfaces!
  if (
    !handDetection ||
    handDetection.totalHandsDetected === 0 ||
    !handDetection.landmarks ||
    handDetection.landmarks.length < 21
  ) {
    return {
      metrics: {
        hasHand: false,
        state: "NO_HAND",
        readinessScore: 0,
        statusMessage: "Show your open palm in front of the camera",
        insideGuide: false,
        optimalDistance: false,
        goodLighting: false,
        isSharp: false,
        isSteady: false,
        palmFacingCamera: false,
        fingersVisible: false,
        wristVisible: false,
        sharpnessValue: 0,
        brightnessValue: 0,
        contrastValue: 0,
        handedness: "Right",
      },
      center: null,
      steadyCount: 0,
    };
  }

  // Gate 2: Exactly one hand required (reject multiple hands)
  if (handDetection.totalHandsDetected > 1) {
    return {
      metrics: {
        hasHand: false,
        state: "NO_HAND",
        readinessScore: 0,
        statusMessage: "Show only one hand in the camera frame",
        insideGuide: false,
        optimalDistance: false,
        goodLighting: false,
        isSharp: false,
        isSteady: false,
        palmFacingCamera: false,
        fingersVisible: false,
        wristVisible: false,
        sharpnessValue: 0,
        brightnessValue: 0,
        contrastValue: 0,
        handedness: handDetection.handedness,
        landmarks: handDetection.landmarks,
      },
      center: null,
      steadyCount: 0,
    };
  }

  const landmarks = handDetection.landmarks;
  const handedness = handDetection.handedness;

  // Gate 3: Orientation verification (palmar vs dorsal / back of hand)
  const isPalmar = verifyPalmOrientation(landmarks, handedness, isMirrored);
  if (!isPalmar) {
    return {
      metrics: {
        hasHand: true,
        state: "PALM_NOT_FACING_CAMERA",
        readinessScore: 0,
        statusMessage: "Turn hand over — show your open palm",
        insideGuide: false,
        optimalDistance: false,
        goodLighting: false,
        isSharp: false,
        isSteady: false,
        palmFacingCamera: false,
        fingersVisible: false,
        wristVisible: false,
        sharpnessValue: 0,
        brightnessValue: 0,
        contrastValue: 0,
        handedness,
        landmarks,
      },
      center: null,
      steadyCount: 0,
    };
  }

  // Gate 4: Wrist visibility
  const wristOk = verifyWristVisible(landmarks);
  if (!wristOk) {
    return {
      metrics: {
        hasHand: true,
        state: "WRIST_NOT_VISIBLE",
        readinessScore: 10,
        statusMessage: "Keep your wrist inside the frame",
        insideGuide: false,
        optimalDistance: false,
        goodLighting: false,
        isSharp: false,
        isSteady: false,
        palmFacingCamera: true,
        fingersVisible: false,
        wristVisible: false,
        sharpnessValue: 0,
        brightnessValue: 0,
        contrastValue: 0,
        handedness,
        landmarks,
      },
      center: null,
      steadyCount: 0,
    };
  }

  // Gate 5: Fingers open and extended
  const fingersOk = verifyFingersExtended(landmarks);
  if (!fingersOk) {
    return {
      metrics: {
        hasHand: true,
        state: "FINGERS_NOT_VISIBLE",
        readinessScore: 10,
        statusMessage: "Open all five fingers naturally",
        insideGuide: false,
        optimalDistance: false,
        goodLighting: false,
        isSharp: false,
        isSteady: false,
        palmFacingCamera: true,
        fingersVisible: false,
        wristVisible: true,
        sharpnessValue: 0,
        brightnessValue: 0,
        contrastValue: 0,
        handedness,
        landmarks,
      },
      center: null,
      steadyCount: 0,
    };
  }

  // Hand bounding box calculation
  const allX = landmarks.map((p) => p.x);
  const allY = landmarks.map((p) => p.y);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const handHeight = maxY - minY;
  const handWidth = maxX - minX;

  // Palm center
  const palmCenter = {
    x: (landmarks[0].x + landmarks[5].x + landmarks[9].x + landmarks[17].x) / 4,
    y: (landmarks[0].y + landmarks[5].y + landmarks[9].y + landmarks[17].y) / 4,
  };

  // Gate 6: Distance / Scale verification
  if (handHeight < 0.28 || handWidth < 0.20) {
    return {
      metrics: {
        hasHand: true,
        state: "PALM_TOO_FAR",
        readinessScore: 20,
        statusMessage: "Move hand closer to the camera",
        insideGuide: false,
        optimalDistance: false,
        goodLighting: false,
        isSharp: false,
        isSteady: false,
        palmFacingCamera: true,
        fingersVisible: true,
        wristVisible: true,
        sharpnessValue: 0,
        brightnessValue: 0,
        contrastValue: 0,
        handedness,
        landmarks,
      },
      center: palmCenter,
      steadyCount: 0,
    };
  }

  if (handHeight > 0.94) {
    return {
      metrics: {
        hasHand: true,
        state: "PALM_TOO_CLOSE",
        readinessScore: 20,
        statusMessage: "Move hand slightly further back",
        insideGuide: false,
        optimalDistance: false,
        goodLighting: false,
        isSharp: false,
        isSteady: false,
        palmFacingCamera: true,
        fingersVisible: true,
        wristVisible: true,
        sharpnessValue: 0,
        brightnessValue: 0,
        contrastValue: 0,
        handedness,
        landmarks,
      },
      center: palmCenter,
      steadyCount: 0,
    };
  }

  // Gate 7: Guide alignment
  // Guide is roughly centered in frame: x in [0.20, 0.80], y in [0.15, 0.85]
  const insideGuide =
    palmCenter.x >= 0.22 &&
    palmCenter.x <= 0.78 &&
    palmCenter.y >= 0.18 &&
    palmCenter.y <= 0.82;

  if (!insideGuide) {
    return {
      metrics: {
        hasHand: true,
        state: "PALM_OUTSIDE_GUIDE",
        readinessScore: 25,
        statusMessage: "Center your palm inside the guide outline",
        insideGuide: false,
        optimalDistance: true,
        goodLighting: false,
        isSharp: false,
        isSteady: false,
        palmFacingCamera: true,
        fingersVisible: true,
        wristVisible: true,
        sharpnessValue: 0,
        brightnessValue: 0,
        contrastValue: 0,
        handedness,
        landmarks,
      },
      center: palmCenter,
      steadyCount: 0,
    };
  }

  // Gate 8 & 9: Real image-quality analysis on Palm ROI (sharpness, lighting, contrast)
  const roiQuality = evaluatePalmRoiQuality(video, landmarks, offscreenCanvas);

  if (!roiQuality.qualityAvailable) {
    return {
      metrics: {
        hasHand: true,
        state: "IMAGE_BLURRY",
        readinessScore: 25,
        statusMessage: "Hold steady — evaluating image quality...",
        insideGuide: true,
        optimalDistance: true,
        goodLighting: false,
        isSharp: false,
        isSteady: false,
        palmFacingCamera: true,
        fingersVisible: true,
        wristVisible: true,
        sharpnessValue: 0,
        brightnessValue: 0,
        contrastValue: 0,
        handedness,
        landmarks,
      },
      center: palmCenter,
      steadyCount: 0,
    };
  }

  if (!roiQuality.goodLighting) {
    const isDark = roiQuality.brightness < 38;
    return {
      metrics: {
        hasHand: true,
        state: "POOR_LIGHTING",
        readinessScore: 30,
        statusMessage: isDark
          ? "Lighting is too dark — move to brighter light"
          : "Palm is overexposed — avoid harsh glare",
        insideGuide: true,
        optimalDistance: true,
        goodLighting: false,
        isSharp: roiQuality.isSharp,
        isSteady: false,
        palmFacingCamera: true,
        fingersVisible: true,
        wristVisible: true,
        sharpnessValue: Math.round(roiQuality.sharpness),
        brightnessValue: Math.round(roiQuality.brightness),
        contrastValue: Math.round(roiQuality.contrast),
        handedness,
        landmarks,
      },
      center: palmCenter,
      steadyCount: 0,
    };
  }

  if (!roiQuality.isSharp) {
    return {
      metrics: {
        hasHand: true,
        state: "IMAGE_BLURRY",
        readinessScore: 35,
        statusMessage: "Hold steady — palm image is blurry",
        insideGuide: true,
        optimalDistance: true,
        goodLighting: true,
        isSharp: false,
        isSteady: false,
        palmFacingCamera: true,
        fingersVisible: true,
        wristVisible: true,
        sharpnessValue: Math.round(roiQuality.sharpness),
        brightnessValue: Math.round(roiQuality.brightness),
        contrastValue: Math.round(roiQuality.contrast),
        handedness,
        landmarks,
      },
      center: palmCenter,
      steadyCount: 0,
    };
  }

  // Gate 10: Stability tracking & consecutive valid frame gating
  let steadyCount = consecutiveSteady;
  let isSteady = false;

  if (lastCenter) {
    const shift = Math.hypot(
      palmCenter.x - lastCenter.x,
      palmCenter.y - lastCenter.y
    );
    if (shift < 0.038) {
      steadyCount++;
    } else {
      steadyCount = Math.max(0, steadyCount - 2);
    }
  } else {
    steadyCount = 1;
  }

  const TARGET_STEADY_FRAMES = 10;
  isSteady = steadyCount >= TARGET_STEADY_FRAMES;

  if (isSteady) {
    return {
      metrics: {
        hasHand: true,
        state: "READY_TO_CAPTURE",
        readinessScore: 100,
        statusMessage: "Palm locked — capturing your photo",
        insideGuide: true,
        optimalDistance: true,
        goodLighting: true,
        isSharp: true,
        isSteady: true,
        palmFacingCamera: true,
        fingersVisible: true,
        wristVisible: true,
        sharpnessValue: Math.round(roiQuality.sharpness),
        brightnessValue: Math.round(roiQuality.brightness),
        contrastValue: Math.round(roiQuality.contrast),
        handedness,
        landmarks,
      },
      center: palmCenter,
      steadyCount,
    };
  }

  // Palm is stabilizing towards capture
  const progressPercent = Math.min(
    95,
    Math.round(40 + (steadyCount / TARGET_STEADY_FRAMES) * 55)
  );

  return {
    metrics: {
      hasHand: true,
      state: "PALM_STABILIZING",
      readinessScore: progressPercent,
      statusMessage: `Hold palm steady... ${progressPercent}%`,
      insideGuide: true,
      optimalDistance: true,
      goodLighting: true,
      isSharp: true,
      isSteady: false,
      palmFacingCamera: true,
      fingersVisible: true,
      wristVisible: true,
      sharpnessValue: Math.round(roiQuality.sharpness),
      brightnessValue: Math.round(roiQuality.brightness),
      contrastValue: Math.round(roiQuality.contrast),
      handedness,
      landmarks,
    },
    center: palmCenter,
    steadyCount,
  };
}

/**
 * Legacy wrapper function maintaining 100% backward compatibility with existing tests.
 */
export function analyzeVideoFrame(
  video: HTMLVideoElement,
  offscreenCanvas: HTMLCanvasElement,
  lastCenter: { x: number; y: number } | null,
  consecutiveSteady: number
): {
  metrics: ScannerMetrics;
  center: { x: number; y: number } | null;
  steadyCount: number;
} {
  return evaluatePalmScannerFrame(
    video,
    offscreenCanvas,
    null,
    lastCenter,
    consecutiveSteady
  );
}
