/**
 * Vedic-AI Palm Feature & Landmark Detector
 * Analyzes uploaded or captured palm images to identify palm landmarks,
 * visible crease paths (Heart, Head, Life, Fate lines), and planetary mounts.
 * Grounded in actual image pixel analysis and anatomical Hastarekha geometry.
 * Normalizes all coordinates to [0..1000] space matching the SVG overlay.
 */

import {
  extractGroundedPalmFeatures,
  pointsToSvgPath as extractPointsToSvgPath,
  type ExtractedPoint,
  type ExtractedLineResult,
  type ExtractedMountResult,
  type GroundedPalmExtraction,
} from "./palm-crease-extractor";

export type PalmPoint = ExtractedPoint;
export type DetectedLine = ExtractedLineResult;
export type PlanetaryMount = ExtractedMountResult;
export type PalmAnalysisFeatures = GroundedPalmExtraction;

export const pointsToSvgPath = extractPointsToSvgPath;

/**
 * Derives anatomically accurate palm landmark coordinates and line trajectories
 * grounded in the hand orientation (left vs right), vision detection metadata,
 * and optional pixel-level image data.
 */
export function derivePalmFeatures(
  hand: "left" | "right" | "unsure" = "unsure",
  apiDetections?: {
    heartLine?: { visible?: boolean; points?: PalmPoint[]; clarity?: string };
    headLine?: { visible?: boolean; points?: PalmPoint[]; clarity?: string };
    lifeLine?: { visible?: boolean; points?: PalmPoint[]; clarity?: string };
    fateLine?: { visible?: boolean; points?: PalmPoint[]; clarity?: string };
    mounts?: Record<string, PalmPoint>;
  },
  imageData?: {
    data: Uint8ClampedArray | number[];
    width: number;
    height: number;
  } | null
): PalmAnalysisFeatures {
  return extractGroundedPalmFeatures(hand, imageData, apiDetections);
}
