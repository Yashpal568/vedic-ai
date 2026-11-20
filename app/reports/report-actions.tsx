"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LoaderCircle, Printer, Trash2 } from "lucide-react";
import type { KundliReport } from "@/lib/astrology";
import { printKundliReport, downloadKundliPdfFile } from "@/lib/print-report";

export default function ReportActions({ id, report }: { id: string; report: KundliReport }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [error, setError] = useState("");

  async function handleDownloadPdf() {
    setIsExportingPdf(true);
    setError("");
    try {
      await downloadKundliPdfFile(report, id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not generate PDF report.");
    } finally {
      setIsExportingPdf(false);
    }
  }

  function printReport() {
    setError("");
    try { printKundliReport(report, id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open report preview."); }
  }

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
    <button className="primary-button" onClick={handleDownloadPdf} disabled={isExportingPdf || busy}>
      {isExportingPdf ? <LoaderCircle size={13} className="spin-icon"/> : <Download size={13}/>}
      {isExportingPdf ? "Generating PDF…" : "Download Kundli PDF"}
    </button>
    <button className="secondary-button" onClick={printReport} disabled={busy}><Printer size={13}/> Print Sheet</button>
    <button className="secondary-button" onClick={downloadReport}><Download size={13}/> Export JSON</button>
    <button className="secondary-button report-delete" onClick={deleteReport} disabled={busy}>{busy ? <LoaderCircle size={13}/> : <Trash2 size={13}/>} Delete</button>
    {error && <p role="alert" className="report-action-error">{error}</p>}
  </div>;
}
