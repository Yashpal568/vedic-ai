"use client";

import { ChangeEvent, useRef, useState } from "react";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import SiteHeader from "@/components/site-header";
import { Camera, ImagePlus, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";

export default function PalmReadingPage() {
  const [image, setImage] = useState<string>("");
  const [hand, setHand] = useState<"left" | "right" | "unsure">("unsure");
  const [question, setQuestion] = useState("");
  const [reading, setReading] = useState("");
  const [error, setError] = useState("");
  const [quality, setQuality] = useState("");
  const [loading, setLoading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setError(""); setQuality(""); setReading(""); setImage("");
    if (file.size > 15 * 1024 * 1024) {
      setError("This photo is larger than 15 MB. Please choose a smaller image.");
      return;
    }
    if (file.type && !file.type.startsWith("image/") && !/\\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      setError("Please choose an image from your gallery (JPG, PNG, WebP or HEIC).");
      return;
    }

    let objectUrl = "";
    let bitmap: ImageBitmap | null = null;
    try {
      // Decode camera/gallery images and normalize them to a compact JPEG.
      // The HTMLImageElement fallback covers browsers without createImageBitmap.
      let source: CanvasImageSource;
      let sourceWidth: number;
      let sourceHeight: number;
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
          img.onerror = () => reject(new Error("This browser cannot open this photo format. Please choose a JPG or PNG image."));
          img.src = objectUrl;
        });
        source = decoded;
        sourceWidth = decoded.naturalWidth;
        sourceHeight = decoded.naturalHeight;
      }

      if (!sourceWidth || !sourceHeight) throw new Error("The selected image has no readable dimensions. Please choose another photo.");
      const maxDimension = 1800;
      const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sourceWidth * scale));
      canvas.height = Math.max(1, Math.round(sourceHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not prepare this photo. Please try another image.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      bitmap?.close();
      bitmap = null;

      let quality = 0.88;
      let prepared = canvas.toDataURL("image/jpeg", quality);
      while (prepared.length > 5_300_000 && quality > 0.55) {
        quality -= 0.08;
        prepared = canvas.toDataURL("image/jpeg", quality);
      }
      if (prepared.length > 5_300_000) throw new Error("This photo is still too large after resizing. Please choose another photo.");
      setImage(prepared);
    } catch (e) {
      bitmap?.close();
      setError(e instanceof Error ? e.message : "Could not prepare this photo. Please try another image.");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }

  async function analyse() {
    if (!image || loading) return;
    setLoading(true); setError(""); setQuality(""); setReading("");
    try {
      const response = await fetch("/api/palm-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, hand, question }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not analyse the image. Please try again.");
      if (data.clear !== true) {
        setQuality(data.reason || "The palm lines are not clear enough. Please upload another photo.");
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

  return <main className="palm-shell">
    <SiteHeader section="Traditional Palmistry" backHref="/chat" />
    <section className="palm-content">
      <div className="palm-kicker"><Sparkles size={14}/> TRADITIONAL PALMISTRY · IMAGE-BASED</div>
      <h1>Read the lines.<br/><em>Keep perspective.</em></h1>
      <p className="palm-intro">Upload a clear photo of your open palm. The AI checks whether the main lines are visible before preparing a detailed, beginner-friendly report. If the photo is unclear, it will ask you to upload another instead of guessing.</p>
      <div className="palm-grid">
        <section className="palm-upload-card">
          <div className="palm-card-title"><Camera size={18}/> Your palm photo</div>
          <div className={"palm-dropzone" + (image ? " has-image" : "")}>
            {image ? <><img src={image} alt="Selected palm preview"/><span className="palm-change"><RefreshCw size={14}/> Photo selected</span></> : <><span className="palm-upload-icon"><ImagePlus size={24}/></span><strong>Upload a palm photo</strong><span>Take a new palm photo or choose one from your gallery</span></>}
          </div>
          <div className="palm-picker-actions">
            <label className="palm-picker-label palm-camera-button">
              <Camera size={17}/><span>Take photo</span>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={chooseImage} aria-label="Take a palm photo with your rear camera"/>
            </label>
            <label className="palm-picker-label palm-gallery-button">
              <ImagePlus size={17}/><span>Choose from gallery</span>
              <input id="palm-gallery-retry" ref={galleryInputRef} type="file" accept="image/*" onChange={chooseImage} aria-label="Choose a palm photo from your gallery"/>
            </label>
          </div>
          <p className="palm-picker-hint">Take photo opens your rear camera. Choose from gallery opens saved photos.</p>
          <label className="palm-field-label">Which hand is shown?</label>
          <div className="palm-hand-options">
            {(["left","right","unsure"] as const).map(value => <button key={value} type="button" className={hand === value ? "selected" : ""} onClick={() => setHand(value)}>{value === "left" ? "Left hand" : value === "right" ? "Right hand" : "Not sure"}</button>)}
          </div>
          <label className="palm-field-label" htmlFor="palm-question">What would you like to explore? <span>(optional)</span></label>
          <textarea id="palm-question" value={question} onChange={e => setQuestion(e.target.value)} maxLength={800} placeholder="e.g. Explain my visible heart, head and life lines…" rows={3}/>
          <button type="button" className="palm-analyse-button" disabled={!image || loading} onClick={analyse}>{loading ? <><LoaderCircle className="palm-spin" size={17}/> Checking image and lines…</> : <><Sparkles size={17}/> Analyse my palm</>}</button>
          {error && <p className="palm-error" role="alert">{error}</p>}
          {quality && <div className="palm-quality" role="alert"><strong>Photo needs another look</strong><p>{quality}</p><button type="button" onClick={() => document.getElementById("palm-gallery-retry")?.click()}><RefreshCw size={14}/> Upload a clearer photo</button></div>}
        </section>
        <aside className="palm-guidance">
          <div className="palm-guidance-icon"><Sparkles size={20}/></div><h2>How to get a useful photo</h2>
          <ul><li>Open your hand naturally, palm facing the camera.</li><li>Use bright, even light without harsh shadows.</li><li>Keep the wrist and fingertips inside the frame.</li><li>Focus clearly on the palm lines; avoid filters.</li></ul>
          <div className="palm-note">Palmistry is a traditional interpretive practice, not a scientifically validated prediction method. This tool cannot reliably predict lifespan, health, marriage dates, wealth, or exact future events.</div>
        </aside>
      </div>
      {reading && <section className="palm-result"><div className="palm-result-kicker"><Sparkles size={14}/> YOUR READING</div><h2>What is visible in your palm</h2><div className="palm-reading-text">{reading}</div><p className="palm-note">This is a cautious interpretation of visible features and traditional symbolism—not a factual guarantee about your life.</p></section>}
    </section>
    <MobileBottomNav />
  </main>;
}
