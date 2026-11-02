"use client";

import { ChangeEvent, useRef, useState } from "react";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import SiteHeader from "@/components/site-header";
import { Camera, ImagePlus, LoaderCircle, RefreshCw, Sparkles, Upload } from "lucide-react";

export default function PalmReadingPage() {
  const [image, setImage] = useState<string>("");
  const [hand, setHand] = useState<"left" | "right" | "unsure">("unsure");
  const [question, setQuestion] = useState("");
  const [reading, setReading] = useState("");
  const [error, setError] = useState("");
  const [quality, setQuality] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setQuality(""); setReading(""); setImage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Photo must be under 4 MB. Resize it and upload again.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.startsWith("data:image/")) {
        setImage(reader.result);
      } else {
        setError("This photo could not be prepared for analysis. Please select it again.");
      }
    };
    reader.onerror = () => setError("Could not read this image. Please select it again.");
    reader.onabort = () => setError("Image reading was cancelled. Please select the photo again.");
    reader.readAsDataURL(file);
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
          <button type="button" className={"palm-dropzone" + (image ? " has-image" : "")} onClick={() => inputRef.current?.click()} aria-label="Choose palm photo">
            {image ? <><img src={image} alt="Selected palm preview"/><span className="palm-change"><RefreshCw size={14}/> Change photo</span></> : <><span className="palm-upload-icon"><ImagePlus size={24}/></span><strong>Upload a palm photo</strong><span>JPG, PNG or WebP · up to 4 MB</span><span className="palm-choose"><Upload size={15}/> Choose image</span></>}
          </button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={chooseImage} hidden/>
          <label className="palm-field-label">Which hand is shown?</label>
          <div className="palm-hand-options">
            {(["left","right","unsure"] as const).map(value => <button key={value} type="button" className={hand === value ? "selected" : ""} onClick={() => setHand(value)}>{value === "left" ? "Left hand" : value === "right" ? "Right hand" : "Not sure"}</button>)}
          </div>
          <label className="palm-field-label" htmlFor="palm-question">What would you like to explore? <span>(optional)</span></label>
          <textarea id="palm-question" value={question} onChange={e => setQuestion(e.target.value)} maxLength={800} placeholder="e.g. Explain my visible heart, head and life lines…" rows={3}/>
          <button type="button" className="palm-analyse-button" disabled={!image || loading} onClick={analyse}>{loading ? <><LoaderCircle className="palm-spin" size={17}/> Checking image and lines…</> : <><Sparkles size={17}/> Analyse my palm</>}</button>
          {error && <p className="palm-error" role="alert">{error}</p>}
          {quality && <div className="palm-quality" role="alert"><strong>Photo needs another look</strong><p>{quality}</p><button type="button" onClick={() => inputRef.current?.click()}><RefreshCw size={14}/> Upload a clearer photo</button></div>}
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
