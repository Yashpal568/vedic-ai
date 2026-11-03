"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import SiteHeader from "@/components/site-header";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Camera,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  SwitchCamera,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function PalmReadingPage() {
  const [image, setImage] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSizeStr, setFileSizeStr] = useState<string>("");
  const [hand, setHand] = useState<"left" | "right" | "unsure">("unsure");
  const [question, setQuestion] = useState("");
  const [reading, setReading] = useState("");
  const [error, setError] = useState("");
  const [quality, setQuality] = useState("");
  const [loading, setLoading] = useState(false);

  // Live camera modal states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Stop media stream tracks cleanly
  function stopCameraStream() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  // Close live camera modal
  function closeCameraModal() {
    stopCameraStream();
    setIsCameraActive(false);
    setCameraError("");
    setCameraLoading(false);
  }

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Start live getUserMedia camera
  async function startLiveCamera(facing: "environment" | "user" = cameraFacing) {
    setError("");
    setCameraError("");
    setCameraLoading(true);
    setIsCameraActive(true);
    stopCameraStream();

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      // Fallback directly to native capture file input
      setCameraLoading(false);
      setIsCameraActive(false);
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        setError("Camera is not directly accessible in this browser. Please choose an image from your gallery.");
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraLoading(false);
    } catch (err: unknown) {
      console.warn("[palm-reading] getUserMedia error:", err);
      setCameraLoading(false);
      let message = "Could not access device camera.";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          message = "Camera permission was denied. Please allow camera access in browser site settings or use file upload.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          message = "No camera was detected on this device.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          message = "Your camera is already in use by another app or browser tab.";
        }
      }
      setCameraError(message);
    }
  }

  // Switch between rear and front camera in modal
  function toggleCameraFacing() {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    startLiveCamera(nextFacing);
  }

  // Capture current video frame to image
  function capturePhotoFromStream() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    try {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not capture frame");

      // Draw video frame onto canvas
      ctx.drawImage(video, 0, 0, width, height);

      let qualityVal = 0.88;
      let dataUrl = canvas.toDataURL("image/jpeg", qualityVal);
      while (dataUrl.length > 5_000_000 && qualityVal > 0.5) {
        qualityVal -= 0.08;
        dataUrl = canvas.toDataURL("image/jpeg", qualityVal);
      }

      const sizeKB = Math.round((dataUrl.length * 0.75) / 1024);
      setImage(dataUrl);
      setFileName("camera-capture.jpg");
      setFileSizeStr(sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`);
      setError("");
      setQuality("");
      setReading("");
      closeCameraModal();
    } catch (e) {
      setCameraError(e instanceof Error ? e.message : "Failed to capture photograph.");
    }
  }

  // Handle file input selection from Gallery or Native Camera Fallback
  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setError("");
    setQuality("");
    setReading("");
    setImage("");
    setFileName("");
    setFileSizeStr("");

    if (file.size > 15 * 1024 * 1024) {
      setError("This photo is larger than 15 MB. Please select a smaller photo.");
      return;
    }

    const isImageMime = file.type && file.type.startsWith("image/");
    const isImageExt = /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
    if (!isImageMime && !isImageExt) {
      setError("Please choose a valid photo (JPG, PNG, WebP, or HEIC).");
      return;
    }

    let objectUrl = "";
    let bitmap: ImageBitmap | null = null;
    try {
      let source: CanvasImageSource;
      let sourceWidth = 0;
      let sourceHeight = 0;

      try {
        bitmap = await createImageBitmap(file);
        source = bitmap;
        sourceWidth = bitmap.width;
        sourceHeight = bitmap.height;
      } catch {
        objectUrl = URL.createObjectURL(file);
        const decoded = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Unable to decode this image format. Please choose a JPG or PNG image."));
          img.src = objectUrl;
        });
        source = decoded;
        sourceWidth = decoded.naturalWidth;
        sourceHeight = decoded.naturalHeight;
      }

      if (!sourceWidth || !sourceHeight) {
        throw new Error("The selected image has unreadable dimensions. Please choose another photo.");
      }

      const maxDimension = 1920;
      const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sourceWidth * scale));
      canvas.height = Math.max(1, Math.round(sourceHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Browser canvas is unavailable. Please try another image.");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      bitmap?.close();
      bitmap = null;

      let q = 0.88;
      let prepared = canvas.toDataURL("image/jpeg", q);
      while (prepared.length > 5_200_000 && q > 0.5) {
        q -= 0.08;
        prepared = canvas.toDataURL("image/jpeg", q);
      }

      if (prepared.length > 5_200_000) {
        throw new Error("This photo is still too large after compression. Please choose a smaller photo.");
      }

      const sizeKB = Math.round((prepared.length * 0.75) / 1024);
      setImage(prepared);
      setFileName(file.name || "palm-photo.jpg");
      setFileSizeStr(sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`);
    } catch (e) {
      bitmap?.close();
      setError(e instanceof Error ? e.message : "Could not prepare this photo. Please try another image.");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }

  function removePhoto() {
    setImage("");
    setFileName("");
    setFileSizeStr("");
    setError("");
    setQuality("");
    setReading("");
  }

  // Open native gallery input
  function openGalleryPicker() {
    setError("");
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  }

  // Analyse selected palm photo
  async function analyse() {
    if (!image || loading) return;
    setLoading(true);
    setError("");
    setQuality("");
    setReading("");

    try {
      const response = await fetch("/api/palm-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, hand, question }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not analyse the image. Please try again.");
      }

      if (data.clear !== true) {
        setQuality(data.reason || "The palm lines are not clear enough to assess. Please upload a brighter, sharper photo.");
        return;
      }

      if (typeof data.reading !== "string" || !data.reading.trim()) {
        throw new Error("The AI returned an empty reading. Please try again with a clearer palm photo.");
      }

      setReading(data.reading.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not analyse the image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="palm-shell">
      <SiteHeader section="Traditional Palmistry" backHref="/chat" />
      <section className="palm-content">
        <div className="palm-kicker">
          <Sparkles size={14} /> TRADITIONAL PALMISTRY · IMAGE-BASED
        </div>
        <h1>
          Read the lines.<br />
          <em>Keep perspective.</em>
        </h1>
        <p className="palm-intro">
          Upload a clear photo of your open palm. Our vision model verifies the major creases in bright, even lighting
          before preparing a structured, beginner-friendly palm report. If lines cannot be confidently seen, it will
          cautiously ask for a clearer photo rather than guessing.
        </p>

        <div className="palm-grid">
          <section className="palm-upload-card">
            <div className="palm-card-title">
              <Camera size={18} /> Your palm photo
            </div>

            {/* Photo preview / upload dropzone */}
            <div className={"palm-dropzone" + (image ? " has-image" : "")}>
              {image ? (
                <div className="palm-preview-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Selected palm preview" className="palm-preview-img" />
                  <div className="palm-preview-meta">
                    <CheckCircle2 size={14} className="palm-preview-icon" />
                    <span className="palm-filename">{fileName}</span>
                    {fileSizeStr && <span className="palm-filesize">({fileSizeStr})</span>}
                  </div>
                </div>
              ) : (
                <div className="palm-placeholder">
                  <span className="palm-upload-icon">
                    <ImagePlus size={24} />
                  </span>
                  <strong>Take or upload a palm photo</strong>
                  <span>Use bright, shadow-free lighting with your open palm facing the camera</span>
                </div>
              )}
            </div>

            {/* Native file inputs (rendered accessible in DOM without blocking click events) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={chooseImage}
              style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
              aria-label="Take a photo with your device camera"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={chooseImage}
              style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
              aria-label="Choose a palm photo from your gallery"
            />

            {/* Main Action buttons */}
            {image ? (
              <div className="palm-preview-actions">
                <button
                  type="button"
                  className="palm-picker-button palm-replace-button"
                  onClick={() => startLiveCamera("environment")}
                >
                  <Camera size={16} />
                  <span>Retake with Camera</span>
                </button>
                <button
                  type="button"
                  className="palm-picker-button palm-gallery-button"
                  onClick={openGalleryPicker}
                >
                  <RefreshCw size={16} />
                  <span>Replace from Gallery</span>
                </button>
                <button
                  type="button"
                  className="palm-remove-button"
                  onClick={removePhoto}
                  aria-label="Remove selected photo"
                >
                  <Trash2 size={16} />
                  <span>Remove</span>
                </button>
              </div>
            ) : (
              <div className="palm-picker-actions">
                <button
                  type="button"
                  className="palm-picker-button palm-camera-button"
                  onClick={() => startLiveCamera("environment")}
                >
                  <Camera size={17} />
                  <span>Take photo</span>
                </button>
                <button
                  type="button"
                  className="palm-picker-button palm-gallery-button"
                  onClick={openGalleryPicker}
                >
                  <ImagePlus size={17} />
                  <span>Choose from gallery</span>
                </button>
              </div>
            )}

            <p className="palm-picker-hint">
              Take photo opens your device camera. Choose from gallery selects a saved photo.
            </p>

            {/* Hand Selection */}
            <label className="palm-field-label">Which hand is shown?</label>
            <div className="palm-hand-options">
              {(["left", "right", "unsure"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={hand === value ? "selected" : ""}
                  onClick={() => setHand(value)}
                >
                  {value === "left" ? "Left hand" : value === "right" ? "Right hand" : "Not sure"}
                </button>
              ))}
            </div>

            {/* Optional question */}
            <label className="palm-field-label" htmlFor="palm-question">
              What would you like to explore? <span>(optional)</span>
            </label>
            <textarea
              id="palm-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={800}
              placeholder="e.g. Explain my visible heart, head, life and fate lines in simple terms…"
              rows={3}
            />

            {/* Analyse Submission */}
            <button
              type="button"
              className="palm-analyse-button"
              disabled={!image || loading}
              onClick={analyse}
            >
              {loading ? (
                <>
                  <LoaderCircle className="palm-spin" size={17} /> Assessing palm features…
                </>
              ) : (
                <>
                  <Sparkles size={17} /> Analyse my palm
                </>
              )}
            </button>

            {error && (
              <p className="palm-error" role="alert">
                <AlertTriangle size={15} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: "6px" }} />
                {error}
              </p>
            )}

            {quality && (
              <div className="palm-quality" role="alert">
                <div className="palm-quality-title">
                  <Info size={16} />
                  <strong>Photo needs another look</strong>
                </div>
                <p>{quality}</p>
                <div className="palm-quality-actions">
                  <button type="button" onClick={() => startLiveCamera("environment")}>
                    <Camera size={14} /> Retake photo
                  </button>
                  <button type="button" onClick={openGalleryPicker}>
                    <RefreshCw size={14} /> Choose different photo
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Guidance card */}
          <aside className="palm-guidance">
            <div className="palm-guidance-icon">
              <Sparkles size={20} />
            </div>
            <h2>How to get a clear palm reading</h2>
            <ul>
              <li>Open your hand naturally with the palm facing directly toward the camera.</li>
              <li>Use bright, balanced daylight or indoor light; avoid harsh shadows across the palm.</li>
              <li>Keep the wrist crease and fingertips clearly within the frame.</li>
              <li>Ensure the camera focuses sharply on the major creases without beautify filters.</li>
            </ul>
            <div className="palm-note">
              <strong>Notice:</strong> Traditional palmistry is an interpretive cultural art, not a scientific or medical
              discipline. It cannot determine exact lifespan, health outcomes, marriage dates, wealth, or future events.
            </div>
          </aside>
        </div>

        {/* Structured Reading Results */}
        {reading && (
          <section className="palm-result">
            <div className="palm-result-kicker">
              <Sparkles size={14} /> STRUCTURED PALM READING
            </div>
            <h2>What your palm reveals</h2>
            <div className="palm-reading-card">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{reading}</ReactMarkdown>
            </div>
            <p className="palm-note">
              This report provides traditional symbolic interpretations of visible creases. Decisions and personal
              efforts remain the primary influences in shaping your life.
            </p>
          </section>
        )}
      </section>

      {/* Live Camera Viewfinder Modal */}
      {isCameraActive && (
        <div className="palm-camera-overlay" role="dialog" aria-modal="true" aria-label="Take palm photo">
          <div className="palm-camera-modal">
            <div className="palm-camera-header">
              <span className="palm-camera-title">
                <Camera size={16} /> Palm Camera Viewfinder
              </span>
              <button
                type="button"
                className="palm-camera-close"
                onClick={closeCameraModal}
                aria-label="Close camera"
              >
                <X size={18} />
              </button>
            </div>

            <div className="palm-camera-viewfinder">
              <video ref={videoRef} autoPlay playsInline muted className="palm-camera-video" />
              {/* Palm alignment silhouette guide */}
              <div className="palm-camera-guide" aria-hidden="true">
                <div className="palm-guide-outline" />
                <span className="palm-guide-hint">Align your open palm inside the frame</span>
              </div>

              {cameraLoading && (
                <div className="palm-camera-loader">
                  <LoaderCircle className="palm-spin" size={32} />
                  <span>Starting camera…</span>
                </div>
              )}

              {cameraError && (
                <div className="palm-camera-error-banner">
                  <AlertTriangle size={18} />
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    className="palm-camera-fallback-btn"
                    onClick={() => {
                      closeCameraModal();
                      cameraInputRef.current?.click();
                    }}
                  >
                    Use native file capture instead
                  </button>
                </div>
              )}
            </div>

            <div className="palm-camera-controls">
              <button
                type="button"
                className="palm-camera-flip-btn"
                onClick={toggleCameraFacing}
                title="Switch camera"
                aria-label="Switch camera"
              >
                <SwitchCamera size={20} />
              </button>

              <button
                type="button"
                className="palm-camera-shutter-btn"
                onClick={capturePhotoFromStream}
                disabled={cameraLoading || Boolean(cameraError)}
                aria-label="Capture photo"
              >
                <div className="palm-shutter-ring">
                  <div className="palm-shutter-dot" />
                </div>
              </button>

              <button
                type="button"
                className="palm-camera-cancel-btn"
                onClick={closeCameraModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </main>
  );
}
