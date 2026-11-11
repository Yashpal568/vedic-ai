"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import SiteHeader from "@/components/site-header";
import AppDesktopSidebar from "@/components/app-desktop-sidebar";
import PalmReportHeader from "@/components/palm/palm-report-header";
import PalmBiometricPlate from "@/components/palm/palm-biometric-plate";
import PalmPersonalisedReport from "@/components/palm/palm-personalised-report";
import PalmThreeLayerAnalysis from "@/components/palm/palm-three-layer-analysis";
import PalmRemediesUpaya from "@/components/palm/palm-remedies-upaya";
import PalmDisclaimerMeta from "@/components/palm/palm-disclaimer-meta";
import PalmChatDock from "@/components/palm/palm-chat-dock";
import DossierPreviewModal from "@/components/dossier-preview-modal";
import { PalmCameraGuide } from "@/components/palm/palm-camera-guide";
import { PalmPreScanModal } from "@/components/palm/palm-pre-scan-modal";
import { PalmCapturePreviewModal } from "@/components/palm/palm-capture-preview-modal";
import PalmVoiceAssistant from "@/components/palm/palm-voice-assistant";
import { usePalmVoiceNarrator } from "@/hooks/use-palm-voice-narrator";
import { useLanguage } from "@/lib/i18n/language-context";
import { parsePalmReading, type ParsedPalmReport } from "@/lib/palm-parser";
import { derivePalmFeatures, type PalmAnalysisFeatures } from "@/lib/palm-feature-detector";
import {
  evaluatePalmScannerFrame,
  normalizeMediaPipeHandedness,
  type PalmReadinessState,
  type Landmark21,
} from "@/lib/palm-camera-scanner";
import {
  getHandLandmarker,
  detectHandInVideo,
  detectHandInImage,
  resetHandLandmarker,
  type HandDetectionOutput,
} from "@/lib/mediapipe-hand-landmarker";
import type { HandLandmarker as HandLandmarkerInstance } from "@mediapipe/tasks-vision";
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
  FileDown,
} from "lucide-react";

export default function PalmReadingPage() {
  const [image, setImage] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSizeStr, setFileSizeStr] = useState<string>("");
  const [hand, setHand] = useState<"left" | "right" | "unsure">("unsure");
  const [question, setQuestion] = useState("");
  const [reading, setReading] = useState("");
  const [parsedReport, setParsedReport] = useState<ParsedPalmReport | null>(null);
  const [palmFeatures, setPalmFeatures] = useState<PalmAnalysisFeatures | null>(null);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState("");
  const [loading, setLoading] = useState(false);

  const { language } = useLanguage();
  // Spoken AI Voice Narrator Controller
  const voiceNarrator = usePalmVoiceNarrator({ initialLanguage: language });

  useEffect(() => {
    if (voiceNarrator.language !== language && parsedReport) {
      voiceNarrator.switchLanguage(language, parsedReport, hand);
    }
  }, [language, parsedReport, hand, voiceNarrator]);

  // Modal controls
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [isPreScanModalOpen, setIsPreScanModalOpen] = useState(false);
  const [isCapturePreviewOpen, setIsCapturePreviewOpen] = useState(false);
  const [capturedImageTemp, setCapturedImageTemp] = useState<string>("");
  const [capturedFeaturesTemp, setCapturedFeaturesTemp] = useState<PalmAnalysisFeatures | null>(null);
  const [isAutoCaptured, setIsAutoCaptured] = useState(false);

  // Live camera modal states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraResolution, setCameraResolution] = useState<{
    label: "4K" | "Full HD" | "HD" | "Standard";
    width: number;
    height: number;
    fps?: number;
  }>({ label: "Standard", width: 0, height: 0 });
  const [cameraError, setCameraError] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [landmarkerError, setLandmarkerError] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("Show your open hand to the camera");
  const [guideColor, setGuideColor] = useState<"red" | "amber" | "green">("amber");
  const [detectionState, setDetectionState] = useState<PalmReadinessState>("NO_HAND");
  const [autoCapturing, setAutoCapturing] = useState(false);
  const scannerRef = useRef({ lastCenter: null as { x: number; y: number } | null, stableFrames: 0, capturing: false });
  const lastDetectedLandmarksRef = useRef<Landmark21[] | null>(null);

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
  const closeCameraModal = useCallback(() => {
    stopCameraStream();
    setIsCameraActive(false);
    setCameraError("");
    setCameraLoading(false);
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Capture current video frame to preview state with high-resolution ImageCapture & canvas fallback
  const capturePhotoFromStream = useCallback(async (isAuto = false) => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    try {
      let dataUrl = "";
      let width = video.videoWidth || 1280;
      let height = video.videoHeight || 720;
      let rawPixelData: { data: Uint8ClampedArray; width: number; height: number } | undefined = undefined;

      // 1. Attempt native sensor full-resolution photo via ImageCapture API if supported
      const videoTrack = mediaStreamRef.current?.getVideoTracks()[0];
      let imageCaptureSuccess = false;

      if (
        videoTrack &&
        typeof window !== "undefined" &&
        "ImageCapture" in window
      ) {
        try {
          const ImageCaptureCtor = (
            window as unknown as {
              ImageCapture?: new (track: MediaStreamTrack) => {
                takePhoto: (options?: { fillLightMode?: string }) => Promise<Blob>;
              };
            }
          ).ImageCapture;

          if (ImageCaptureCtor) {
            const imageCapture = new ImageCaptureCtor(videoTrack);
            const blob: Blob = await imageCapture.takePhoto({ fillLightMode: "off" });
            if (blob && blob.size > 0) {
              dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });

              // Decode image to inspect dimensions & extract pixel data for crease extraction
              const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const el = new Image();
                el.onload = () => resolve(el);
                el.onerror = reject;
                el.src = dataUrl;
              });

              width = img.naturalWidth || width;
              height = img.naturalHeight || height;

              const maxDim = 1600;
              const scale = Math.min(1, maxDim / Math.max(width, height));
              const targetWidth = Math.max(1, Math.round(width * scale));
              const targetHeight = Math.max(1, Math.round(height * scale));

              const canvas = document.createElement("canvas");
              canvas.width = targetWidth;
              canvas.height = targetHeight;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
                rawPixelData = {
                  data: imgData.data,
                  width: targetWidth,
                  height: targetHeight,
                };
                // Optimized JPEG quality for ultra-fast upload & crisp palm analysis
                dataUrl = canvas.toDataURL("image/jpeg", 0.88);
                imageCaptureSuccess = true;
              }
            }
          }
        } catch {
          imageCaptureSuccess = false;
        }
      }

      // 2. Fallback to full-resolution video canvas at high JPEG quality (0.88)
      if (!imageCaptureSuccess) {
        width = video.videoWidth || 1280;
        height = video.videoHeight || 720;

        const maxDim = 1600;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not capture frame");

        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        rawPixelData = {
          data: imgData.data,
          width: targetWidth,
          height: targetHeight,
        };

        dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      }

      // Derive genuine image-grounded features directly from frame pixels and landmarks
      const features = derivePalmFeatures(
        hand,
        undefined,
        rawPixelData,
        lastDetectedLandmarksRef.current || undefined
      );

      // Stop active video stream immediately to release camera hardware
      stopCameraStream();
      setIsCameraActive(false);

      // Open captured image preview dialog with Retake / Continue options
      setCapturedImageTemp(dataUrl);
      setCapturedFeaturesTemp(features);
      setIsAutoCaptured(isAuto);
      setIsCapturePreviewOpen(true);
    } catch (e) {
      setCameraError(e instanceof Error ? e.message : "Failed to capture photograph.");
    }
  }, [hand]);

  // User confirms captured photo in preview modal
  const confirmCapturedPhoto = useCallback(() => {
    if (!capturedImageTemp) return;
    const sizeKB = Math.round((capturedImageTemp.length * 0.75) / 1024);
    setImage(capturedImageTemp);
    setFileName("camera-capture.jpg");
    setFileSizeStr(sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`);
    setError("");
    setQuality("");
    setReading("");
    setParsedReport(null);
    if (capturedFeaturesTemp) {
      setPalmFeatures(capturedFeaturesTemp);
    }
    setIsCapturePreviewOpen(false);
  }, [capturedImageTemp, capturedFeaturesTemp]);

  // Start live getUserMedia camera
  const startLiveCamera = useCallback(async (facing: "environment" | "user" = cameraFacing) => {
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
      const resolutionTiers: MediaTrackConstraints[] = [
        // Tier 1: 4K UHD (3840x2160 @ 30fps)
        {
          facingMode: { ideal: facing },
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          frameRate: { ideal: 30 },
        },
        // Tier 2: Full HD (1920x1080 @ 30fps)
        {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        // Tier 3: HD (1280x720 @ 30fps)
        {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        // Tier 4: Device default fallback
        {
          facingMode: { ideal: facing },
        },
      ];

      let stream: MediaStream | null = null;
      let lastErr: unknown = null;

      for (const constraints of resolutionTiers) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: constraints,
            audio: false,
          });
          if (stream) break;
        } catch (tierErr) {
          lastErr = tierErr;
        }
      }

      if (!stream) {
        throw lastErr || new Error("Failed to initialize camera stream");
      }

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Read actual hardware track settings & capabilities
      const videoTrack = stream.getVideoTracks()[0];
      let resLabel: "4K" | "Full HD" | "HD" | "Standard" = "Standard";
      let actualW = 0;
      let actualH = 0;
      let actualFps: number | undefined = undefined;

      if (videoTrack) {
        const settings = typeof videoTrack.getSettings === "function" ? videoTrack.getSettings() : {};
        actualW = settings.width || 0;
        actualH = settings.height || 0;
        actualFps = settings.frameRate ? Math.round(settings.frameRate) : undefined;

        // Attempt continuous focus if camera sensor supports it
        if (typeof videoTrack.getCapabilities === "function") {
          try {
            const caps = videoTrack.getCapabilities() as { focusMode?: string[] };
            if (caps?.focusMode && caps.focusMode.includes("continuous")) {
              await videoTrack.applyConstraints({
                // @ts-expect-error advanced focusMode constraint
                advanced: [{ focusMode: "continuous" }],
              });
            }
          } catch {
            // Focus constraint is optional; non-fatal
          }
        }
      }

      // Derive genuine resolution label (do not manufacture 4K unless actual dimensions confirm)
      const maxDim = Math.max(actualW, actualH);
      const minDim = Math.min(actualW, actualH);
      if (maxDim >= 3840 || minDim >= 2160 || (actualW * actualH >= 3840 * 2000)) {
        resLabel = "4K";
      } else if (maxDim >= 1920 || minDim >= 1080 || (actualW * actualH >= 1920 * 1000)) {
        resLabel = "Full HD";
      } else if (maxDim >= 1280 || minDim >= 720) {
        resLabel = "HD";
      } else {
        resLabel = "Standard";
      }

      setCameraResolution({
        label: resLabel,
        width: actualW,
        height: actualH,
        fps: actualFps,
      });

      setCameraLoading(false);
    } catch (err: unknown) {
      console.warn("[palm-reading] getUserMedia error:", err);
      setCameraLoading(false);
      let message = "Could not access device camera.";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          message = "Camera permission was denied. Please allow camera access in browser site settings or choose a photo from your gallery.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          message = "No camera was detected on this device. You can choose a photo from your gallery.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          message = "Your camera is already in use by another application or browser tab. Please close other camera apps and retry.";
        } else if (err.name === "OverconstrainedError") {
          message = "Requested camera configuration is not supported on this device. Please retry or choose from gallery.";
        } else {
          message = `Camera error: ${err.message || "Failed to initialize video stream"}. You can choose a photo from your gallery.`;
        }
      }
      setCameraError(message);
    }
  }, [cameraFacing]);

  // User retakes photo from preview modal
  const retakeCapturedPhoto = useCallback(() => {
    setIsCapturePreviewOpen(false);
    void startLiveCamera("environment");
  }, [startLiveCamera]);

  // Live browser-side palm tracking powered by Google MediaPipe Tasks Vision
  useEffect(() => {
    if (!isCameraActive || cameraLoading || cameraError || !videoRef.current) return;
    let cancelled = false;
    let animationFrame = 0;
    let lastProcessAt = 0;
    const offscreen = document.createElement("canvas");
    scannerRef.current = { lastCenter: null, stableFrames: 0, capturing: false };
    setScanProgress(0);
    setScanStatus("Show your open palm in front of the camera");
    setAutoCapturing(false);
    setLandmarkerError("");

    let landmarker: HandLandmarkerInstance | null = null;
    void (async () => {
      try {
        landmarker = await getHandLandmarker();
        if (!landmarker && !cancelled) {
          setLandmarkerError("Hand detection could not be initialized. You can retry or take a photo manually.");
        }
      } catch (err) {
        console.warn("[palm-scanner] MediaPipe loader warning:", err);
        if (!cancelled) {
          setLandmarkerError("Hand detection could not be initialized. You can retry or take a photo manually.");
        }
      }
    })();

    // detectForVideo receives the raw, unmirrored video pixels on both cameras.
    // Normalize MediaPipe handedness separately below; CSS mirroring is presentation-only.
    const isMirrored = false;

    const processFrame = (timestamp: number) => {
      if (cancelled) return;
      if (timestamp - lastProcessAt > 70 && videoRef.current && videoRef.current.readyState >= 2) {
        lastProcessAt = timestamp;
        const video = videoRef.current;

        let handDetection: HandDetectionOutput | null = null;
        if (landmarker) {
          handDetection = detectHandInVideo(landmarker, video, timestamp);
          if (handDetection && handDetection.totalHandsDetected === 1) {
            // Rear/environment and front camera video pixels are passed unmirrored to
            // detectForVideo. Normalize MediaPipe's selfie-mirrored handedness convention
            // for every selected-hand mode, not only when the user chooses "Not sure".
            handDetection = {
              ...handDetection,
              handedness: normalizeMediaPipeHandedness(handDetection.handedness, false),
            };
          }
          if (handDetection?.landmarks && handDetection.landmarks.length >= 21) {
            lastDetectedLandmarksRef.current = handDetection.landmarks;
          }
        }

        const isModelLoading = landmarker === null && !landmarkerError;
        const { metrics, center, steadyCount } = evaluatePalmScannerFrame(
          video,
          offscreen,
          handDetection,
          scannerRef.current.lastCenter,
          scannerRef.current.stableFrames,
          isMirrored,
          hand,
          isModelLoading
        );

        scannerRef.current.lastCenter = center;
        scannerRef.current.stableFrames = steadyCount;
        setScanProgress(metrics.readinessScore);
        setScanStatus(metrics.statusMessage);
        setGuideColor(metrics.guideColor);
        setDetectionState(metrics.state);

        if (metrics.state === "READY_TO_CAPTURE" && !scannerRef.current.capturing) {
          scannerRef.current.capturing = true;
          setAutoCapturing(true);
          setScanProgress(100);
          setScanStatus("Perfect! Hold still, capturing automatically...");
          window.setTimeout(() => {
            if (!cancelled) {
              capturePhotoFromStream(true);
            }
          }, 350);
          return;
        }
      }
      if (!cancelled) {
        animationFrame = window.requestAnimationFrame(processFrame);
      }
    };

    animationFrame = window.requestAnimationFrame(processFrame);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
    };
  }, [isCameraActive, cameraLoading, cameraError, cameraFacing, capturePhotoFromStream, hand, landmarkerError]);

  // Switch between rear and front camera in modal
  function toggleCameraFacing() {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    void startLiveCamera(nextFacing);
  }



  // Handle file input selection from Gallery or Native Camera Fallback
  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setError("");
    setQuality("");
    setReading("");
    setParsedReport(null);
    setImage("");
    setFileName("");
    setFileSizeStr("");

    // Maximum 20 MB size threshold
    if (file.size > 20 * 1024 * 1024) {
      setError("This photo is larger than 20 MB. Please select a smaller photo.");
      if (input) input.value = "";
      return;
    }

    // Permissive check for mobile gallery files
    const isImageMime = !file.type || file.type.startsWith("image/") || file.type === "application/octet-stream";
    const isImageExt = !file.name || /\.(jpe?g|png|webp|heic|heif|bmp|tiff?)$/i.test(file.name) || !file.name.includes(".");
    if (!isImageMime && !isImageExt) {
      setError("Please choose a valid photo (JPG, PNG, WebP, or HEIC).");
      if (input) input.value = "";
      return;
    }

    try {
      // 1. Universal FileReader reading (safest across all mobile WebViews and detached file handles)
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Unable to read image bytes from file."));
          }
        };
        reader.onerror = () => reject(new Error("Could not read image from device gallery."));
        reader.readAsDataURL(file);
      });

      // 2. Decode into HTMLImageElement
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Could not decode image format. Please select a standard JPG or PNG photo."));
        image.src = dataUrl;
      });

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) {
        throw new Error("The selected image has unreadable dimensions. Please choose another photo.");
      }

      const maxDimension = 1920;
      const scale = Math.min(1, maxDimension / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Browser canvas is unavailable. Please try another image.");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);

      let q = 0.88;
      let prepared = canvas.toDataURL("image/jpeg", q);
      while (prepared.length > 5_200_000 && q > 0.45) {
        q -= 0.08;
        prepared = canvas.toDataURL("image/jpeg", q);
      }

      if (prepared.length > 5_200_000) {
        throw new Error("This photo is still too large after compression. Please choose a smaller photo.");
      }

      const sizeKB = Math.round((prepared.length * 0.75) / 1024);
      const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
      setImage(prepared);
      setFileName(file.name || "palm-photo.jpg");
      setFileSizeStr(sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`);

      // Detect hand landmarks directly on the uploaded image
      const detection = await detectHandInImage(canvas).catch(() => null);
      const landmarks =
        detection?.landmarks && detection.landmarks.length >= 21
          ? detection.landmarks
          : undefined;
      if (landmarks) {
        lastDetectedLandmarksRef.current = landmarks;
      }

      setPalmFeatures(
        derivePalmFeatures(
          hand,
          undefined,
          {
            data: imgData.data,
            width: canvas.width,
            height: canvas.height,
          },
          landmarks
        )
      );
    } catch (e) {
      console.error("[chooseImage error]", e);
      setError(e instanceof Error ? e.message : "Could not prepare this photo. Please try another image.");
    } finally {
      try {
        if (input) input.value = "";
      } catch {}
    }
  }

  function removePhoto() {
    setImage("");
    setFileName("");
    setFileSizeStr("");
    setError("");
    setQuality("");
    setReading("");
    setParsedReport(null);
    voiceNarrator.resetVoice();
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
    // Prime audio context on user gesture for seamless unmuted playback permission
    voiceNarrator.primeAudio();
    setLoading(true);
    setError("");
    setQuality("");
    setReading("");
    setParsedReport(null);

    try {
      const response = await fetch("/api/palm-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, hand, question, language }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 504) {
          throw new Error("The analysis timed out on the server. Please try again with a clear photo.");
        }
        throw new Error(typeof data.error === "string" ? data.error : "Could not analyse the image. Please try again.");
      }

      if (data.clear !== true) {
        setQuality(data.reason || "The palm lines are not clear enough to assess. Please upload a brighter, sharper photo.");
        return;
      }

      if (typeof data.reading !== "string" || !data.reading.trim()) {
        throw new Error("The AI returned an empty reading. Please try again with a clearer palm photo.");
      }

      const rawReading = data.reading.trim();
      setReading(rawReading);
      const parsed = parsePalmReading(rawReading, hand);
      setParsedReport(parsed);
      const features = derivePalmFeatures(
        hand,
        {
          heartLine: data.detectedLines?.heartLine,
          headLine: data.detectedLines?.headLine,
          lifeLine: data.detectedLines?.lifeLine,
          fateLine: data.detectedLines?.fateLine,
          mounts: data.mounts,
        },
        undefined,
        lastDetectedLandmarksRef.current || undefined
      );
      setPalmFeatures(features);

      // Automatically trigger spoken AI voice narration immediately
      voiceNarrator.autoNarrate(parsed, hand);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not analyse the image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function loadSampleProfile() {
    const sampleImg = "/realistic-palm.jpg";
    const sampleMarkdown = `## 1. Palm Overview & Photo Observations
Authentic left hand with earth-type squared palm and balanced finger length indicating grounded pragmatism, stability, and thoughtful deliberate action.

## 2. Heart Line (Emotions & Connection)
Curved upward toward Jupiter mount; reveals deep loyalty, genuine emotional warmth, and selective intimate boundaries.

## 3. Head Line (Thinking & Focus)
Long, clear, and gently sloping; strong analytical focus paired with creative problem-solving and flexible adaptability.

## 4. Life Line (Energy & Vitality)
Deep and well-demarcated arc enclosing the Venus mount; indicates robust vitality, strong physical resilience, and perseverance.

## 5. Fate Line & Other Visible Features
Clear vertical progression showing independent vocation, self-directed drive, and growing clarity in mid-career transitions.

## 6. Overall Traditional Reading
High congruency between passive (inherited traits) and active hands, signifying authentic self-actualization and balanced life choices.

## 7. Limitations & Guidance
These are traditional symbolic interpretations, not scientifically validated personality tests. Personal efforts and conscious choices always shape your path.`;

    setImage(sampleImg);
    setFileName("sample-palm-profile.jpg");
    setFileSizeStr("1.2 MB");
    setHand("left");
    setReading(sampleMarkdown);
    const parsed = parsePalmReading(sampleMarkdown, "left");
    setParsedReport(parsed);
    setPalmFeatures(derivePalmFeatures("left"));
    setError("");
    setQuality("");
    voiceNarrator.primeAudio();
    voiceNarrator.autoNarrate(parsed, "left");
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans-luxury">
      {/* Universal Hidden File Inputs (Mounted persistently at DOM root for reliable mobile gallery & camera access) */}
      <input
        id="palm-gallery-input"
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={chooseImage}
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0.001,
        }}
        tabIndex={-1}
        aria-label="Upload palm photo from device gallery"
      />
      <input
        id="palm-camera-input"
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={chooseImage}
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0.001,
        }}
        tabIndex={-1}
        aria-label="Capture palm photo with device camera"
      />

      {/* 280px Left Sidebar on Desktop (Reference #9) */}
      <AppDesktopSidebar onNewConsultation={() => { removePhoto(); setQuestion(""); }} />

      {/* Main Panel Offset for 280px Sidebar on Large Screens */}
      <div className="flex-1 flex flex-col app-sidebar-offset min-w-0">
        <SiteHeader
          section="header.traditionalPalmistry"
        />

        {/* WORKSPACE AREA */}
        <main className="flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
          {/* IF READING IS READY: Show Approved Vedic Cosmic Luxury Report Design (Ref #2, #3, #9) */}
          {reading && parsedReport ? (
            <div className="space-y-6">
              {/* Report Header */}
              <PalmReportHeader onOpenExportModal={() => setIsDossierModalOpen(true)} />

              {/* Vedic AI Spoken Voice Assistant (Automatic Narration & Interactive Voice Q&A) */}
              <PalmVoiceAssistant
                status={voiceNarrator.status}
                script={voiceNarrator.script}
                language={voiceNarrator.language}
                sections={voiceNarrator.sections}
                currentSectionIndex={voiceNarrator.currentSectionIndex}
                currentSection={voiceNarrator.currentSection}
                playbackSpeed={voiceNarrator.playbackSpeed}
                errorMessage={voiceNarrator.errorMessage}
                report={parsedReport}
                hand={hand}
                onStopVoice={voiceNarrator.stopVoice}
                onPauseVoice={voiceNarrator.pauseVoice}
                onResumeVoice={voiceNarrator.resumeVoice}
                onReplaySection={voiceNarrator.replaySection}
                onNextSection={voiceNarrator.nextSection}
                onPrevSection={voiceNarrator.prevSection}
                onSetPlaybackSpeed={voiceNarrator.setPlaybackSpeed}
                onSwitchLanguage={voiceNarrator.switchLanguage}
                isRecordingQuestion={voiceNarrator.isRecordingQuestion}
                isAnsweringQuestion={voiceNarrator.isAnsweringQuestion}
                isAnsweringAudioPlaying={voiceNarrator.isAnsweringAudioPlaying}
                lastQuestion={voiceNarrator.lastQuestion}
                lastAnswer={voiceNarrator.lastAnswer}
                hasInterruptedNarration={voiceNarrator.hasInterruptedNarration}
                onStartRecordingQuestion={voiceNarrator.startRecordingQuestion}
                onStopRecordingQuestion={voiceNarrator.stopRecordingAndAsk}
                onAskTextQuestion={voiceNarrator.askTextQuestion}
                onResumeNarrationAfterQA={voiceNarrator.resumeNarrationAfterQA}
              />

              {/* Responsive Layout: Split (5-col Biometric HUD + 7-col Report) on Desktop, Vertical Stack on Mobile */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN (5 Cols on LG): Sticky Biometric Palm HUD & Plate */}
                <div className="lg:col-span-5 lg:sticky lg:top-24">
                  <PalmBiometricPlate
                    imageSrc={image}
                    hand={hand}
                    features={palmFeatures || undefined}
                    highlightedFeature={voiceNarrator.highlightedSection}
                    onRetake={() => {
                      voiceNarrator.resetVoice();
                      setReading("");
                      setParsedReport(null);
                      startLiveCamera("environment");
                    }}
                  />

                  {/* Desktop Quick Dossier Download Button */}
                  <div className="hidden lg:block mt-4 p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-sm text-center">
                    <span className="text-xs text-[var(--muted)] block mb-2">
                      Astrological Biometric Dossier (A4)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDossierModalOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[var(--gold)] hover:brightness-110 text-[#0A0C13] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <FileDown size={16} />
                      <span>Export Hastarekha PDF</span>
                    </button>
                  </div>
                </div>

                {/* RIGHT COLUMN (7 Cols on LG): Structured Report Stream */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Section A: 10-Point Personalised Report */}
                  <PalmPersonalisedReport
                    report={parsedReport}
                    highlightedSection={voiceNarrator.highlightedSection}
                  />

                  {/* Section B: Three-Layer Analytical Framework */}
                  <PalmThreeLayerAnalysis report={parsedReport} />

                  {/* Part C: Prescribed Karmic Harmonization & Upaya Remedies */}
                  <PalmRemediesUpaya remedies={parsedReport.remedies} />

                  {/* Metadata and Ethical Boundaries Disclaimer */}
                  <PalmDisclaimerMeta />
                </div>
              </div>

              {/* Floating Bottom Input Dock (Ref #2 & #3) */}
              <PalmChatDock
                onSendMessage={(msg) => {
                  setQuestion(msg);
                  analyse();
                }}
                onUploadClick={openGalleryPicker}
              />
            </div>
          ) : (
            /* BEFORE READING: Photo Selection / Capture Viewport */
            <div className="palm-content">
              <div className="text-center mb-6 pt-2" data-purpose="report-heading">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--raised)] border border-[var(--line2)] mb-3 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#52FEB8] animate-pulse" />
                  <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--gold)]">
                    Vedic Astrological Insight
                  </span>
                </div>
                <h1 className="text-[26px] md:text-[34px] tracking-widest uppercase font-serif-luxury font-bold text-[var(--gold)] drop-shadow-[0_2px_12px_rgba(229,196,107,0.2)]">
                  YOUR PALMISTRY PROFILE
                </h1>
                <p className="text-[13px] md:text-[14px] text-[var(--muted)] font-normal mt-1.5 tracking-wide font-sans-luxury max-w-lg mx-auto">
                  Upload or capture a clear photo of your open palm. Our vision AI verifies major lines and creases before generating an authentic Hastarekha analysis.
                </p>
              </div>

              <div className="palm-grid mt-6">
                <section className="palm-upload-card">
                  <div className="palm-card-title">
                    <Camera size={18} /> Your palm photo
                  </div>

                  {/* Photo preview / upload dropzone */}
                  <div
                    className={"palm-dropzone cursor-pointer" + (image ? " has-image" : "")}
                    onClick={openGalleryPicker}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openGalleryPicker();
                      }
                    }}
                    title="Click or tap to upload a palm photo"
                  >
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

                  {/* File inputs are mounted persistently at root of view */}

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
                      <label
                        htmlFor="palm-gallery-input"
                        className="palm-picker-button palm-gallery-button cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RefreshCw size={16} />
                        <span>Replace from Gallery</span>
                      </label>
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
                        onClick={() => setIsPreScanModalOpen(true)}
                      >
                        <Camera size={17} />
                        <span>Take photo</span>
                      </button>
                      <label
                        htmlFor="palm-gallery-input"
                        className="palm-picker-button palm-gallery-button cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ImagePlus size={17} />
                        <span>Choose from gallery</span>
                      </label>
                    </div>
                  )}

                  {!image && (
                    <div className="mt-2.5 text-center">
                      <button
                        type="button"
                        onClick={loadSampleProfile}
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--gold)] hover:text-[var(--gold2)] underline underline-offset-4 transition-colors opacity-85 hover:opacity-100 cursor-pointer"
                      >
                        <Sparkles size={13} />
                        <span>Preview sample Vedic palmistry profile</span>
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
            </div>
          )}
        </main>
      </div>

      {/* Live Camera Viewfinder Modal */}
      {isCameraActive && (
        <div className="palm-camera-overlay" role="dialog" aria-modal="true" aria-label="Take palm photo">
          <div className="palm-camera-modal">
            <div className="palm-camera-header">
              <div className="palm-camera-header-left">
                <span className="palm-camera-title">
                  <Camera size={16} /> Palm Camera Viewfinder
                </span>
                {cameraResolution.width > 0 && (
                  <span
                    className="palm-camera-res-badge"
                    title={`Live Camera: ${cameraResolution.width}×${cameraResolution.height}${cameraResolution.fps ? ` @ ${cameraResolution.fps}fps` : ""}`}
                  >
                    <span className="palm-res-dot" />
                    {cameraResolution.label}
                  </span>
                )}
              </div>
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

              {/* Strict palm CV anatomical alignment guide with dynamic status & live percentage */}
              <div className="palm-guide-outline absolute inset-0 pointer-events-none">
                <PalmCameraGuide
                  progress={scanProgress}
                  status={scanStatus}
                  state={detectionState}
                  guideColor={guideColor}
                  autoCapturing={autoCapturing}
                  onShowInstructions={() => setIsPreScanModalOpen(true)}
                  resolutionBadge={
                    cameraResolution.width > 0
                      ? `${cameraResolution.label}${cameraResolution.width ? ` ${cameraResolution.width}p` : ""}`
                      : undefined
                  }
                />
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

              {landmarkerError && !cameraError && (
                <div className="palm-camera-error-banner" style={{ background: "rgba(35, 20, 15, 0.94)", border: "1px solid rgba(212, 183, 122, 0.4)" }}>
                  <AlertTriangle size={18} className="text-[var(--gold)]" />
                  <p style={{ color: "#f5e6c8", fontSize: "12px", lineHeight: 1.4 }}>{landmarkerError}</p>
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap", justifyContent: "center" }}>
                    <button
                      type="button"
                      className="palm-camera-fallback-btn"
                      onClick={() => {
                        resetHandLandmarker();
                        setLandmarkerError("");
                        setScanStatus("Retrying hand detection initialization...");
                        void (async () => {
                          const l = await getHandLandmarker();
                          if (!l) {
                            setLandmarkerError("Hand detection could not be initialized. You can retry or take a photo manually.");
                          } else {
                            setScanStatus("Show your open palm in front of the camera");
                          }
                        })();
                      }}
                    >
                      Retry Hand Detection
                    </button>
                    <button
                      type="button"
                      className="palm-camera-fallback-btn"
                      onClick={() => capturePhotoFromStream(false)}
                    >
                      Take photo manually
                    </button>
                  </div>
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
                onClick={() => capturePhotoFromStream(false)}
                disabled={cameraLoading || Boolean(cameraError) || autoCapturing}
                aria-label="Capture photo manually"
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

      {/* Pre-Scan Instructions Guidance Modal */}
      <PalmPreScanModal
        isOpen={isPreScanModalOpen}
        onClose={() => setIsPreScanModalOpen(false)}
        onStartScan={() => {
          setIsPreScanModalOpen(false);
          startLiveCamera("environment");
        }}
      />

      {/* Captured Image Preview Modal with Retake / Continue actions */}
      <PalmCapturePreviewModal
        isOpen={isCapturePreviewOpen}
        imageSrc={capturedImageTemp}
        isAutoCaptured={isAutoCaptured}
        onRetake={retakeCapturedPhoto}
        onConfirm={confirmCapturedPhoto}
        onClose={() => setIsCapturePreviewOpen(false)}
      />

      {/* 3-Column Desktop Dossier Preview & Export Modal (Ref #5) */}
      {parsedReport && (
        <DossierPreviewModal
          isOpen={isDossierModalOpen}
          onClose={() => setIsDossierModalOpen(false)}
          report={parsedReport}
          imageSrc={image}
          hand={hand}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
}
