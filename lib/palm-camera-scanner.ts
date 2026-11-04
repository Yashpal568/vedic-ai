/**
 * Vedic-AI Smart Palm Scanner Engine
 * Real-time on-device computer vision and hand detection for camera viewfinders.
 * Combines pixel-level skin-tone / framing analysis with MediaPipe hand landmark tracking.
 */

export interface ScannerMetrics {
  hasHand: boolean;
  insideGuide: boolean;
  optimalDistance: boolean;
  goodLighting: boolean;
  isSharp: boolean;
  isSteady: boolean;
  readinessScore: number;
  statusMessage: string;
}

export interface HandLandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface MediaPipeHandResults {
  multiHandLandmarks?: HandLandmarkPoint[][];
  multiHandedness?: Array<{ label: "Left" | "Right"; score: number }>;
}

export interface MediaPipeHandsInstance {
  setOptions: (options: {
    maxNumHands?: number;
    modelComplexity?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }) => void;
  onResults: (callback: (results: MediaPipeHandResults) => void) => void;
  send: (input: { image: HTMLVideoElement | HTMLCanvasElement }) => Promise<void>;
  close?: () => Promise<void>;
}

export interface MediaPipeHandsConstructor {
  new (config: { locateFile: (file: string) => string }): MediaPipeHandsInstance;
}

/**
 * Evaluates video frame quality, skin-tone mass, centering, and exposure using offscreen canvas.
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
  const width = 64;
  const height = 64;
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  const ctx = offscreenCanvas.getContext("2d", { willReadFrequently: true });

  if (!ctx || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    return {
      metrics: {
        hasHand: false,
        insideGuide: false,
        optimalDistance: false,
        goodLighting: false,
        isSharp: false,
        isSteady: false,
        readinessScore: 0,
        statusMessage: "Starting camera sensor...",
      },
      center: null,
      steadyCount: 0,
    };
  }

  // Draw downscaled frame
  ctx.drawImage(video, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let skinPixels = 0;
  let sumX = 0;
  let sumY = 0;
  let lumSum = 0;
  let lumSumSq = 0;
  let highFreqDelta = 0;

  // Center ROI guide boundaries in 64x64:
  // Guide outline is roughly middle 60% horizontal, 70% vertical
  const guideMinX = width * 0.2;
  const guideMaxX = width * 0.8;
  const guideMinY = height * 0.15;
  const guideMaxY = height * 0.85;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      lumSum += lum;
      lumSumSq += lum * lum;

      // Simple horizontal sharpness (high frequency gradient)
      if (x > 0) {
        const prevIdx = (y * width + (x - 1)) * 4;
        const prevLum = 0.299 * data[prevIdx] + 0.587 * data[prevIdx + 1] + 0.114 * data[prevIdx + 2];
        highFreqDelta += Math.abs(lum - prevLum);
      }

      // Normalized skin-tone detection heuristic (permissive across all skin complexions)
      const isSkin =
        r > 50 &&
        g > 35 &&
        b > 25 &&
        r > b &&
        r >= g - 10 &&
        Math.abs(r - g) > 8 &&
        r - Math.min(g, b) > 10;

      if (isSkin) {
        skinPixels++;
        sumX += x;
        sumY += y;
      }
    }
  }

  const totalPixels = width * height;
  const skinRatio = skinPixels / totalPixels;
  const meanLum = lumSum / totalPixels;
  const lumVariance = Math.max(0, lumSumSq / totalPixels - meanLum * meanLum);
  const contrast = Math.sqrt(lumVariance);
  const sharpness = highFreqDelta / totalPixels;

  const hasHand = skinRatio >= 0.08;
  const rawCenterX = skinPixels > 0 ? sumX / skinPixels / width : 0.5;
  const rawCenterY = skinPixels > 0 ? sumY / skinPixels / height : 0.5;
  const currentCenter = hasHand ? { x: rawCenterX, y: rawCenterY } : null;

  // Guide alignment: center-of-mass should be near (0.5, 0.5)
  const insideGuide =
    hasHand &&
    rawCenterX >= guideMinX / width &&
    rawCenterX <= guideMaxX / width &&
    rawCenterY >= guideMinY / height &&
    rawCenterY <= guideMaxY / height;

  // Optimal distance: palm should occupy 14% to 55% of the camera frame
  const optimalDistance = skinRatio >= 0.14 && skinRatio <= 0.58;
  const goodLighting = meanLum >= 42 && meanLum <= 225 && contrast >= 16;
  const isSharp = sharpness >= 4.5;

  // Stability detection
  let steadyCount = consecutiveSteady;
  let isSteady = false;
  if (hasHand && lastCenter && currentCenter) {
    const shift = Math.hypot(currentCenter.x - lastCenter.x, currentCenter.y - lastCenter.y);
    if (shift < 0.038) {
      steadyCount++;
    } else {
      steadyCount = Math.max(0, steadyCount - 2);
    }
  } else {
    steadyCount = 0;
  }
  isSteady = steadyCount >= 8;

  // Weighted score (0 - 100)
  let score = 0;
  if (hasHand) score += 25;
  if (insideGuide) score += 25;
  if (optimalDistance) score += 20;
  else if (skinRatio > 0.05) score += 10;
  if (goodLighting) score += 15;
  if (isSharp) score += 5;
  const stabilityFactor = Math.min(1, steadyCount / 14);
  score += Math.round(stabilityFactor * 10);

  // Status message
  let status = "Position your open palm inside the guide";
  if (!hasHand) {
    status = "Show your full open palm to the camera";
  } else if (!insideGuide) {
    status = "Move your palm inside the guide outline";
  } else if (skinRatio < 0.14) {
    status = "Move your palm a little closer";
  } else if (skinRatio > 0.58) {
    status = "Move your palm slightly back";
  } else if (!goodLighting) {
    status = "Improve lighting — avoid harsh shadows";
  } else if (!isSteady) {
    status = "Hold your hand steady — scanning creases";
  } else {
    status = "Palm locked — capturing your photo";
  }

  return {
    metrics: {
      hasHand,
      insideGuide,
      optimalDistance,
      goodLighting,
      isSharp,
      isSteady,
      readinessScore: Math.min(100, Math.max(0, score)),
      statusMessage: status,
    },
    center: currentCenter,
    steadyCount,
  };
}
