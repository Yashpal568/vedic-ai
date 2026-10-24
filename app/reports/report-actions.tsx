"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LoaderCircle, Trash2 } from "lucide-react";
import type { KundliReport } from "@/lib/astrology";

export default function ReportActions({ id, report }: { id: string; report: KundliReport }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function downloadReport() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vedic-ai-kundli-" + id.slice(0, 8) + ".json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function deleteReport() {
    if (!window.confirm("Delete this saved kundli? This action cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/saved-kundli?id=" + encodeURIComponent(id), { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete report.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete report.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="report-actions">
    <button className="secondary-button" onClick={downloadReport}><Download size={13}/> Export JSON</button>
    <button className="secondary-button report-delete" onClick={deleteReport} disabled={busy}>{busy ? <LoaderCircle size={13}/> : <Trash2 size={13}/>} Delete</button>
    {error && <p role="alert" className="report-action-error">{error}</p>}
  </div>;
}
