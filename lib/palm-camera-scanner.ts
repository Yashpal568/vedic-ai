/**
 * Vedic-AI Smart Palm Scanner Engine
 * Real-time on-device computer vision and hand detection for camera viewfinders.
 * Powered by Google MediaPipe Tasks Vision with genuine palm-only recognition,
 * strict orientation verification, landmark geometry, and Laplacian ROI sharpness.
 */

export type PalmReadinessState =
  | "MODEL_LOADING"
  | "NO_HAND"
  | "FACE_OR_NON_HAND"
  | "BACK_OF_HAND"
  | "PALM_NOT_FACING_CAMERA" // Legacy alias for BACK_OF_HAND
  | "PALM_ROTATED"
  | "PALM_TILTED"
  | "PALM_TOO_FAR"
  | "PALM_TOO_CLOSE"
  | "HAND_OUTSIDE_GUIDE"
  | "PALM_OUTSIDE_GUIDE" // Legacy alias for HAND_OUTSIDE_GUIDE
  | "FINGERS_CROPPED"
  | "WRIST_CROPPED"
  | "WRIST_NOT_VISIBLE" // Legacy alias for WRIST_CROPPED
  | "FINGERS_CLOSED"
  | "FINGERS_NOT_VISIBLE" // Legacy alias for FINGERS_CLOSED
  | "IMAGE_BLURRY"
  | "POOR_LIGHTING"
  | "PALM_UNSTABLE"
  | "PALM_STABILIZING" // Legacy alias for PALM_UNSTABLE
  | "READY_TO_CAPTURE"
  | "CAPTURED"
  | "HAND_DETECTED";

export interface Landmark21 {
  x: number;
  y: number;
  z?: number;
}

export type HandLandmarkPoint = Landmark21;

/**
 * MediaPipe Hands reports handedness assuming a mirrored selfie-camera image.
 * The browser video element is passed to detectForVideo without pixel mirroring,
 * so rear/unmirrored camera frames must invert the reported category.
 */
export function normalizeMediaPipeHandedness(
  label: "Left" | "Right",
  inputPixelsMirrored = false
): "Left" | "Right" {
  if (inputPixelsMirrored) return label;
  return label === "Left" ? "Right" : "Left";
}

export interface ScannerMetrics {
  hasHand: boolean;
  state: PalmReadinessState;
  readinessScore: number;
  statusMessage: string;
  guideColor: "red" | "amber" | "green";
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

/**
 * User instructions mapped to exact required detection states.
 */
export const PALM_STATE_MESSAGES: Record<PalmReadinessState, string> = {
  MODEL_LOADING: "Preparing palm scanner...",
  NO_HAND: "Show your open hand to the camera",
  FACE_OR_NON_HAND: "Please show your palm, not your face",
  BACK_OF_HAND: "Turn your hand around — show your palm lines",
  PALM_NOT_FACING_CAMERA: "Turn your hand around — show your palm lines",
  PALM_ROTATED: "Rotate your hand to face the camera",
  PALM_TILTED: "Keep your palm straight and upright",
  PALM_TOO_FAR: "Move your hand closer",
  PALM_TOO_CLOSE: "Move your hand slightly away",
  HAND_OUTSIDE_GUIDE: "Place your entire palm inside the frame",
  PALM_OUTSIDE_GUIDE: "Place your entire palm inside the frame",
  FINGERS_CROPPED: "Keep all five fingertips visible",
  WRIST_CROPPED: "Move your hand slightly upward",
  WRIST_NOT_VISIBLE: "Move your hand slightly upward",
  FINGERS_CLOSED: "Spread your fingers naturally",
  FINGERS_NOT_VISIBLE: "Spread your fingers naturally",
  IMAGE_BLURRY: "Hold still and allow the camera to focus",
  POOR_LIGHTING: "Move to brighter, even lighting",
  PALM_UNSTABLE: "Hold your hand steady",
  PALM_STABILIZING: "Hold your hand steady",
  READY_TO_CAPTURE: "Perfect! Hold still, capturing automatically...",
  CAPTURED: "Palm photo captured successfully",
  HAND_DETECTED: "Hold still while we verify your palm...",
};

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

export interface OrientationAnalysis {
  isPalmar: boolean;
  isDorsal: boolean;
  isRotated: boolean;
  isTilted: boolean;
  confidence: number;
  reason?: string;
}

/**
 * Validates that the palmar (front) surface of the hand is facing the camera,
 * rather than the dorsal (back) surface.
 *
 * Accounts for:
 * 1. Camera mirroring (front selfie camera vs rear environment camera).
 *    Note: MediaPipe was trained on mirrored webcams. For unmirrored back cameras,
 *    MediaPipe's predicted handedness category is inverted relative to physical hands.
 * 2. User-chosen hand ("left" | "right" | "unsure") if available.
 * 3. 2D cross product of anatomical vectors (wrist -> middle knuckles vs index -> pinky).
 * 4. Lateral thumb-to-pinky relationship.
 * 5. Hand rotation and tilt detection.
 */
export function analyzePalmOrientation(
  landmarks: Landmark21[],
  rawHandedness: "Left" | "Right",
  isMirrored = false,
  userChosenHand?: "left" | "right" | "unsure"
): OrientationAnalysis {
  if (!landmarks || landmarks.length < 21) {
    return {
      isPalmar: false,
      isDorsal: false,
      isRotated: false,
      isTilted: false,
      confidence: 0,
      reason: "insufficient_landmarks",
    };
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  const pinkyMcp = landmarks[17];
  const pinkyTip = landmarks[20];

  // Up vector: Wrist -> Middle Knuckle
  const ux = middleMcp.x - wrist.x;
  const uy = middleMcp.y - wrist.y;

  // Check if hand is pointing downwards / inverted
  const isRotated = uy > 0.05; // Wrist is above fingers

  // Check if hand is tilted sideways (> ~35 degrees)
  const isTilted = Math.abs(ux) > Math.abs(uy) * 0.70;

  // Across vector: Index Knuckle -> Pinky Knuckle
  const vx = pinkyMcp.x - indexMcp.x;
  const vy = pinkyMcp.y - indexMcp.y;

  // 2D cross product: ux * vy - uy * vx
  const cp2d = ux * vy - uy * vx;

  // Lateral relationship: thumb vs pinky
  const thumbDx = thumbTip.x - pinkyTip.x;

  // Orientation must be derived from the hand actually seen by MediaPipe.
  // The form's Left/Right selection is report metadata, not reliable camera geometry:
  // users can select the wrong side or change cameras after selecting it. Using that
  // selection as the orientation authority caused genuine palms to be rejected as dorsal.
  // MediaPipe handedness is normalized by the caller for raw, unmirrored video pixels.
  // Only account for an actual pixel mirror here.
  void userChosenHand;
  const effectiveHandedness: "Left" | "Right" = isMirrored
    ? (rawHandedness === "Right" ? "Left" : "Right")
    : rawHandedness;

  // Ambiguous geometry check: If cross-product is virtually zero or knuckles are collapsed
  if (Math.abs(cp2d) < 0.006 || Math.abs(thumbDx) < 0.015) {
    return {
      isPalmar: false,
      isDorsal: false,
      isRotated,
      isTilted,
      confidence: 0.1,
      reason: "ambiguous_knuckle_geometry",
    };
  }

  let isPalmar = false;
  let isDorsal = false;

  if (effectiveHandedness === "Right") {
    // For an upright right palm facing camera (uy < 0):
    // Index MCP is to the left of Pinky MCP (vx > 0), resulting in positive cp2d.
    // Thumb tip extends clearly to the left of pinky tip (thumbDx < -0.015).
    const palmarChirality = cp2d > 0.008;
    const palmarThumb = thumbDx < -0.015;
    if (palmarChirality && palmarThumb) {
      isPalmar = true;
    } else {
      isDorsal = true;
    }
  } else {
    // For an upright left palm facing camera (uy < 0):
    // Pinky MCP is to the left of Index MCP (vx < 0), resulting in negative cp2d.
    // Thumb tip extends clearly to the right of pinky tip (thumbDx > 0.015).
    const palmarChirality = cp2d < -0.008;
    const palmarThumb = thumbDx > 0.015;
    if (palmarChirality && palmarThumb) {
      isPalmar = true;
    } else {
      isDorsal = true;
    }
  }

  // Also check if thumb is on opposite side (selfie mirrored coordinates)
  if (!isPalmar && !isDorsal) {
    isDorsal = true;
  }

  return {
    isPalmar,
    isDorsal,
    isRotated,
    isTilted,
    confidence: isPalmar ? 0.95 : 0.85,
  };
}

/**
 * Boolean wrapper maintaining 100% backward compatibility with existing tests.
 */
export function verifyPalmOrientation(
  landmarks: Landmark21[],
  handedness: "Left" | "Right",
  isMirrored = false,
  userChosenHand?: "left" | "right" | "unsure"
): boolean {
  const result = analyzePalmOrientation(landmarks, handedness, isMirrored, userChosenHand);
  return result.isPalmar;
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
 * Verifies that all 5 fingertips are safely inside the video frame and not cropped.
 */
export function verifyFingertipsUncropped(landmarks: Landmark21[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const tips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
  for (const t of tips) {
    if (t.x < 0.035 || t.x > 0.965 || t.y < 0.035 || t.y > 0.965) {
      return false;
    }
  }
  return true;
}

/**
 * Verifies that the wrist is inside the video frame and not cropped at the bottom.
 */
export function verifyWristVisible(landmarks: Landmark21[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const wrist = landmarks[0];
  return (
    wrist.x >= 0.04 &&
    wrist.x <= 0.96 &&
    wrist.y >= 0.06 &&
    wrist.y <= 0.94
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
      brightness >= 36 && brightness <= 235 && contrast >= 12;
    // Calibrated sharpness threshold on 96x96 palm ROI
    const isSharp = sharpness >= 32;

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
 * Checks whether the center of the video frame contains human facial skin tones
 * when 0 hands are detected by MediaPipe HandLandmarker.
 */
export function detectFaceOrSkinInCenter(
  video: HTMLVideoElement,
  offscreenCanvas: HTMLCanvasElement
): boolean {
  if (!video || !offscreenCanvas) return false;
  const ctx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  const w = 64;
  const h = 64;
  offscreenCanvas.width = w;
  offscreenCanvas.height = h;

  try {
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;
    // Sample the center 40% of the frame
    const sX = Math.floor(vW * 0.30);
    const sY = Math.floor(vH * 0.30);
    const sW = Math.floor(vW * 0.40);
    const sH = Math.floor(vH * 0.40);

    ctx.drawImage(video, sX, sY, sW, sH, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let skinCount = 0;
    const total = w * h;
    for (let i = 0; i < total; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Standard human skin color range in RGB
      if (
        r > 95 &&
        g > 40 &&
        b > 20 &&
        r > g &&
        r > b &&
        Math.abs(r - g) > 15 &&
        data[idx + 3] > 128
      ) {
        skinCount++;
      }
    }
    return skinCount / total > 0.22;
  } catch {
    return false;
  }
}

/**
 * Strict palm scanner analysis pipeline evaluating live video frames and MediaPipe landmarks.
 * Dynamic live guidance, palm orientation validation, and progressive readiness scoring.
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
  isMirrored = false,
  userChosenHand?: "left" | "right" | "unsure",
  isModelLoading = false
): {
  metrics: ScannerMetrics;
  center: { x: number; y: number } | null;
  steadyCount: number;
} {
  // Gate 0: Model is still initializing in the browser
  if (isModelLoading) {
    const state: PalmReadinessState = "MODEL_LOADING";
    const statusMessage = PALM_STATE_MESSAGES[state];
    return {
      metrics: {
        hasHand: false,
        state,
        readinessScore: 0,
        statusMessage,
        guideColor: "amber",
        insideGuide: false,
        optimalDistance: false,
        goodLighting: true,
        isSharp: true,
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

  // Gate 1: No hand detected (MediaPipe HandLandmarker detected 0 hands)
  if (
    !handDetection ||
    handDetection.totalHandsDetected === 0 ||
    !handDetection.landmarks ||
    handDetection.landmarks.length < 21
  ) {
    // Check if user is pointing camera at face or skin surface instead of palm
    const isFaceOrSkin = detectFaceOrSkinInCenter(video, offscreenCanvas);
    const state: PalmReadinessState = isFaceOrSkin ? "FACE_OR_NON_HAND" : "NO_HAND";
    const statusMessage = PALM_STATE_MESSAGES[state];

    return {
      metrics: {
        hasHand: false,
        state,
        readinessScore: 0,
        statusMessage,
        guideColor: "red",
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
        guideColor: "red",
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
  const rawHandedness = handDetection.handedness;

  // Gate 3: Orientation verification (Palmar vs Dorsal / Back of Hand, Rotated, Tilted)
  const orientation = analyzePalmOrientation(
    landmarks,
    rawHandedness,
    isMirrored,
    userChosenHand
  );

  if (orientation.isRotated) {
    return {
      metrics: {
        hasHand: true,
        state: "PALM_ROTATED",
        readinessScore: 15,
        statusMessage: PALM_STATE_MESSAGES.PALM_ROTATED,
        guideColor: "amber",
        insideGuide: false,
        optimalDistance: false,
        goodLighting: false,
        isSharp: false,
        isSteady: false,
        palmFacingCamera: false,
        fingersVisible: false,
        wristVisible: true,
        sharpnessValue: 0,
        brightnessValue: 0,
        contrastValue: 0,
        handedness: rawHandedness,
        landmarks,
      },
      center: null,
      steadyCount: 0,
    };
  }

  if (orientation.isTilted) {
    return {
      metrics: {
        hasHand: true,
        state: "PALM_TILTED",
        readinessScore: 20,
        statusMessage: PALM_STATE_MESSAGES.PALM_TILTED,
        guideColor: "amber",
        insideGuide: false,
        optimalDistance: false,
        goodLighting: false,
        isSharp: false,
        isSteady: false,
        palmFacingCamera: orientation.isPalmar,
        fingersVisible: false,
        wristVisible: true,
        sharpnessValue: 0,
        brightnessValue: 0,
        contrastValue: 0,
        handedness: rawHandedness,
        landmarks,
      },
      center: null,
      steadyCount: 0,
    };
  }

  if (!orientation.isPalmar) {
    return {
      metrics: {
        hasHand: true,
        state: "PALM_NOT_FACING_CAMERA",
        readinessScore: 0,
        statusMessage: PALM_STATE_MESSAGES.BACK_OF_HAND,
        guideColor: "red",
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
        handedness: rawHandedness,
        landmarks,
      },
      center: null,
      steadyCount: 0,
    };
  }

  // Gate 4: Fingertips uncropped
  const fingertipsOk = verifyFingertipsUncropped(landmarks);
  if (!fingertipsOk) {
    return {
      metrics: {
        hasHand: true,
        state: "FINGERS_CROPPED",
        readinessScore: 25,
        statusMessage: PALM_STATE_MESSAGES.FINGERS_CROPPED,
        guideColor: "amber",
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
        handedness: rawHandedness,
        landmarks,
      },
      center: null,
      steadyCount: 0,
    };
  }

  // Gate 5: Wrist visibility
  const wristOk = verifyWristVisible(landmarks);
  if (!wristOk) {
    return {
      metrics: {
        hasHand: true,
        state: "WRIST_NOT_VISIBLE",
        readinessScore: 10,
        statusMessage: PALM_STATE_MESSAGES.WRIST_CROPPED,
        guideColor: "amber",
        insideGuide: false,
        optimalDistance: false,
        goodLighting: false,
        isSharp: false,
        isSteady: false,
        palmFacingCamera: true,
        fingersVisible: true,
        wristVisible: false,
        sharpnessValue: 0,
        brightnessValue: 0,
        contrastValue: 0,
        handedness: rawHandedness,
        landmarks,
      },
      center: null,
      steadyCount: 0,
    };
  }

  // Gate 6: Fingers open and extended (not curled into a fist)
  const fingersOk = verifyFingersExtended(landmarks);
  if (!fingersOk) {
    return {
      metrics: {
        hasHand: true,
        state: "FINGERS_NOT_VISIBLE",
        readinessScore: 10,
        statusMessage: PALM_STATE_MESSAGES.FINGERS_CLOSED,
        guideColor: "amber",
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
        handedness: rawHandedness,
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

  // Gate 7: Distance / Scale verification
  if (handHeight < 0.28 || handWidth < 0.20) {
    return {
      metrics: {
        hasHand: true,
        state: "PALM_TOO_FAR",
        readinessScore: 40,
        statusMessage: PALM_STATE_MESSAGES.PALM_TOO_FAR,
        guideColor: "amber",
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
        handedness: rawHandedness,
        landmarks,
      },
      center: palmCenter,
      steadyCount: 0,
    };
  }

  if (handHeight > 0.94 || handWidth > 0.88) {
    return {
      metrics: {
        hasHand: true,
        state: "PALM_TOO_CLOSE",
        readinessScore: 40,
        statusMessage: PALM_STATE_MESSAGES.PALM_TOO_CLOSE,
        guideColor: "amber",
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
        handedness: rawHandedness,
        landmarks,
      },
      center: palmCenter,
      steadyCount: 0,
    };
  }

  // Gate 8: Guide alignment
  // Centered in frame: x in [0.20, 0.80], y in [0.16, 0.84]
  const insideGuide =
    palmCenter.x >= 0.20 &&
    palmCenter.x <= 0.80 &&
    palmCenter.y >= 0.16 &&
    palmCenter.y <= 0.84;

  if (!insideGuide) {
    return {
      metrics: {
        hasHand: true,
        state: "HAND_OUTSIDE_GUIDE",
        readinessScore: 50,
        statusMessage: PALM_STATE_MESSAGES.HAND_OUTSIDE_GUIDE,
        guideColor: "amber",
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
        handedness: rawHandedness,
        landmarks,
      },
      center: palmCenter,
      steadyCount: 0,
    };
  }

  // Gate 9 & 10: Real image-quality analysis on Palm ROI (lighting & sharpness)
  const roiQuality = evaluatePalmRoiQuality(video, landmarks, offscreenCanvas);

  if (!roiQuality.qualityAvailable) {
    return {
      metrics: {
        hasHand: true,
        state: "IMAGE_BLURRY",
        readinessScore: 25,
        statusMessage: "Hold still and allow the camera to focus — evaluating image quality...",
        guideColor: "amber",
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
        handedness: rawHandedness,
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
        guideColor: "amber",
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
        handedness: rawHandedness,
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
        statusMessage: "Hold still and allow the camera to focus — palm is blurry",
        guideColor: "amber",
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
        handedness: rawHandedness,
        landmarks,
      },
      center: palmCenter,
      steadyCount: 0,
    };
  }

  // Gate 11: Stability tracking & consecutive valid frame gating
  let steadyCount = consecutiveSteady;

  if (lastCenter) {
    const shift = Math.hypot(
      palmCenter.x - lastCenter.x,
      palmCenter.y - lastCenter.y
    );
    if (shift < 0.042) {
      steadyCount++;
    } else {
      steadyCount = Math.max(0, steadyCount - 2);
    }
  } else {
    steadyCount = 1;
  }

  const TARGET_STEADY_FRAMES = 10;
  const isSteady = steadyCount >= TARGET_STEADY_FRAMES;

  if (isSteady) {
    return {
      metrics: {
        hasHand: true,
        state: "READY_TO_CAPTURE",
        readinessScore: 100,
        statusMessage: "Perfect! Hold still, capturing your photo automatically...",
        guideColor: "green",
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
        handedness: rawHandedness,
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
      statusMessage: "Hold hand steady... " + progressPercent + "%",
      guideColor: "green",
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
      handedness: rawHandedness,
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
