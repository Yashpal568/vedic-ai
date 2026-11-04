/**
 * Vedic-AI MediaPipe Hand Landmarker Loader
 * Initializes and manages Google's @mediapipe/tasks-vision Hand Landmarker.
 * Uses locally bundled wasm and model assets with reliable CDN fallback.
 */

import type {
  HandLandmarker as HandLandmarkerType,
  HandLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export type { HandLandmarkerResult, NormalizedLandmark };

export interface HandDetectionOutput {
  landmarks: NormalizedLandmark[];
  handedness: "Left" | "Right";
  handednessScore: number;
  totalHandsDetected: number;
}

let landmarkerInstance: HandLandmarkerType | null = null;
let initPromise: Promise<HandLandmarkerType | null> | null = null;
let initializationError: string | null = null;

export function getInitializationError(): string | null {
  return initializationError;
}

export function resetHandLandmarker(): void {
  landmarkerInstance = null;
  initPromise = null;
  initializationError = null;
}

/**
 * Initializes the MediaPipe Tasks Vision HandLandmarker singleton.
 * Pinned against @mediapipe/tasks-vision resolved runtime (0.10.14).
 */
export async function getHandLandmarker(): Promise<HandLandmarkerType | null> {
  if (typeof window === "undefined") return null;
  if (landmarkerInstance) return landmarkerInstance;
  if (initPromise) return initPromise;

  initializationError = null;
  initPromise = (async () => {
    try {
      const { FilesetResolver, HandLandmarker } = await import(
        "@mediapipe/tasks-vision"
      );

      // Attempt 1: Local wasm path, Attempt 2: Version-pinned CDN wasm path
      let visionFileset;
      try {
        visionFileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      } catch (localWasmErr) {
        console.warn(
          "[mediapipe] Local wasm failed, falling back to version-pinned CDN:",
          localWasmErr
        );
        visionFileset = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
      }

      // Attempt 1: Local model asset, Attempt 2: Google storage CDN asset
      try {
        landmarkerInstance = await HandLandmarker.createFromOptions(
          visionFileset,
          {
            baseOptions: {
              modelAssetPath: "/mediapipe/hand_landmarker.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.62,
            minHandPresenceConfidence: 0.62,
            minTrackingConfidence: 0.6,
          }
        );
      } catch (localModelErr) {
        console.warn(
          "[mediapipe] GPU/local model failed, trying CPU and fallback URL:",
          localModelErr
        );
        landmarkerInstance = await HandLandmarker.createFromOptions(
          visionFileset,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.6,
            minHandPresenceConfidence: 0.6,
            minTrackingConfidence: 0.55,
          }
        );
      }

      console.log("[mediapipe] Hand Landmarker initialized successfully");
      return landmarkerInstance;
    } catch (err) {
      initializationError =
        err instanceof Error ? err.message : "MediaPipe initialization failed";
      console.error("[mediapipe] Failed to initialize Hand Landmarker:", err);
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Detects hand landmarks in a live video element.
 */
export function detectHandInVideo(
  landmarker: HandLandmarkerType,
  video: HTMLVideoElement,
  timestampMs: number
): HandDetectionOutput | null {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    return null;
  }

  try {
    const results: HandLandmarkerResult = landmarker.detectForVideo(
      video,
      timestampMs
    );

    const totalHands = results.landmarks?.length || 0;
    if (totalHands === 0 || !results.landmarks[0] || results.landmarks[0].length < 21) {
      return {
        landmarks: [],
        handedness: "Right",
        handednessScore: 0,
        totalHandsDetected: totalHands,
      };
    }

    const firstHand = results.landmarks[0];
    const rawCategory =
      results.handednesses?.[0]?.[0]?.categoryName || "Right";
    const handedness = rawCategory === "Left" ? "Left" : "Right";
    const handednessScore = results.handednesses?.[0]?.[0]?.score || 0.9;

    return {
      landmarks: firstHand,
      handedness,
      handednessScore,
      totalHandsDetected: totalHands,
    };
  } catch (err) {
    console.warn("[mediapipe] detectForVideo frame skipped:", err);
    return null;
  }
}

/**
 * Detects hand landmarks in a static HTMLImageElement or HTMLCanvasElement.
 */
export async function detectHandInImage(
  image: HTMLImageElement | HTMLCanvasElement
): Promise<HandDetectionOutput | null> {
  const landmarker = await getHandLandmarker();
  if (!landmarker) return null;

  try {
    const results: HandLandmarkerResult = landmarker.detect(image);
    const totalHands = results.landmarks?.length || 0;
    if (totalHands === 0 || !results.landmarks[0] || results.landmarks[0].length < 21) {
      return {
        landmarks: [],
        handedness: "Right",
        handednessScore: 0,
        totalHandsDetected: totalHands,
      };
    }

    const firstHand = results.landmarks[0];
    const rawCategory =
      results.handednesses?.[0]?.[0]?.categoryName || "Right";
    const handedness = rawCategory === "Left" ? "Left" : "Right";
    const handednessScore = results.handednesses?.[0]?.[0]?.score || 0.9;

    return {
      landmarks: firstHand,
      handedness,
      handednessScore,
      totalHandsDetected: totalHands,
    };
  } catch (err) {
    console.warn("[mediapipe] detect image error:", err);
    return null;
  }
}

export function getMediaPipeError(): string | null {
  return initializationError;
}

