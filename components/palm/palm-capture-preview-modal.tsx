"use client";

import React from "react";
import Image from "next/image";
import { CheckCircle2, Camera, RefreshCw, ArrowRight, X } from "lucide-react";

interface PalmCapturePreviewModalProps {
  isOpen: boolean;
  imageSrc: string;
  isAutoCaptured: boolean;
  onRetake: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function PalmCapturePreviewModal({
  isOpen,
  imageSrc,
  isAutoCaptured,
  onRetake,
  onConfirm,
  onClose,
}: PalmCapturePreviewModalProps) {
  if (!isOpen || !imageSrc) return null;

  return (
    <div
      className="palm-camera-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Palm Photo Preview"
    >
      <div className="palm-preview-modal">
        {/* Header */}
        <div className="palm-preview-header">
          <div className="palm-preview-badge-row">
            {isAutoCaptured ? (
              <span className="palm-preview-status-badge is-verified">
                <CheckCircle2 size={13} />
                Verified Palm Scan — 100% Quality Passed
              </span>
            ) : (
              <span className="palm-preview-status-badge is-manual">
                <Camera size={13} />
                Manual Photo Capture
              </span>
            )}
          </div>
          <button
            type="button"
            className="palm-camera-close"
            onClick={onClose}
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* Captured Image Display */}
        <div className="palm-preview-image-container">
          <Image
            src={imageSrc}
            alt="Captured palm preview"
            className="palm-preview-image"
            width={640}
            height={480}
            unoptimized
          />
        </div>

        {/* Footer Guidance and Actions */}
        <div className="palm-preview-footer">
          <p className="palm-preview-instruction">
            {isAutoCaptured
              ? "All 9 biometric and image quality checks verified. Proceed to generate your traditional Hastarekha dossier."
              : "Photo captured manually. For highest accuracy, ensure major creases and mounts are sharp."}
          </p>

          <div className="palm-preview-actions">
            <button
              type="button"
              className="palm-preview-retake-btn"
              onClick={onRetake}
            >
              <RefreshCw size={16} />
              Retake Photo
            </button>
            <button
              type="button"
              className="palm-preview-confirm-btn"
              onClick={onConfirm}
            >
              Continue to Palm Analysis
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

