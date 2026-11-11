"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Filter,
  Calendar,
  Compass,
  Hand,
  Heart,
  Download,
  Plus,
  Eye,
  Trash2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { KundliReport } from "@/lib/astrology";
import { printKundliReport } from "@/lib/print-report";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/language-context";

export interface SavedReportItem {
  id: string;
  calculation_engine: string;
  engine_version: string | null;
  created_at: string;
  calculation_payload: KundliReport;
}

interface ReportsLibraryClientProps {
  initialReports: SavedReportItem[];
}

export default function ReportsLibraryClient({
  initialReports,
}: ReportsLibraryClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [reports, setReports] = useState<SavedReportItem[]>(initialReports);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "kundli" | "palm" | "synastry">("all");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "name">("recent");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter logic
  let filtered = reports.filter((item) => {
    const chart = item.calculation_payload;
    const name = (chart?.birth as { name?: string })?.name || chart?.birth?.place || "Janam Kundli";
    const place = chart?.birth?.place || "";
    const lagna = chart?.ascendant?.sign || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lagna.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === "kundli") return true;
    if (activeFilter === "palm") return false; // palm dossiers stored separately
    if (activeFilter === "synastry") return false;
    return true;
  });

  // Sort logic
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortBy === "name") {
      const nameA = (a.calculation_payload?.birth as { name?: string })?.name || a.calculation_payload?.birth?.place || "";
      const nameB = (b.calculation_payload?.birth as { name?: string })?.name || b.calculation_payload?.birth?.place || "";
      return nameA.localeCompare(nameB);
    }
    return 0;
  });

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this saved kundli from your library?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/saved-kundli?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        router.refresh();
      }
    } catch {
    } finally {
      setDeletingId(null);
    }
  }

  function handlePrint(report: KundliReport, id: string) {
    try {
      printKundliReport(report, id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not open printable PDF report.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Search, Filter Tabs & Sorting Header */}
      <div className="p-4 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--quiet)] pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, place, or ascendant..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-xs text-[var(--text)] placeholder-[var(--quiet)] outline-none focus:border-[var(--gold)] transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: t("reports.allReports"), icon: Filter },
            { id: "kundli", label: t("kundli.title"), icon: Compass },
            { id: "palm", label: t("reports.palmReadings"), icon: Hand },
            { id: "synastry", label: "Synastry", icon: Heart },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[var(--gold)] text-[#11131A] shadow-xs"
                    : "bg-[var(--raised)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--line)]"
                }`}
              >
                <Icon size={12} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[var(--quiet)] hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 rounded-lg bg-[var(--raised)] border border-[var(--line)] text-xs text-[var(--text)] outline-none focus:border-[var(--gold)] cursor-pointer"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Reports Grid (3 Columns on Desktop PC) */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const chart = item.calculation_payload;
            const nativeName = (chart?.birth as { name?: string })?.name || chart?.birth?.place || "Vedic Birth Chart";
            const lagna = chart?.ascendant?.sign || "Aries";
            const lagnaDeg = chart?.ascendant?.degreeInSign?.toFixed(2) || "0.00";
            const moonPlanet = chart?.planets?.find((p) => p.name === "Moon");
            const moonNakshatra = moonPlanet?.nakshatra || "Rohini";
            const moonPada = moonPlanet?.nakshatraPada || 1;
            const dashaLord = chart?.vimshottari?.currentMahadasha?.lord || "Jupiter";

            return (
              <article
                key={item.id}
                className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--gold)]/50 transition-all flex flex-col justify-between shadow-sm hover:shadow-md group"
              >
                <div>
                  {/* Card Header: Type badge & date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--wash)] text-[var(--gold)] border border-[var(--line2)] text-[10px] font-bold uppercase tracking-wider">
                      <Compass size={11} />
                      <span>Janam Kundli</span>
                    </span>
                    <span className="text-[11px] text-[var(--quiet)] font-mono flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Title & Place */}
                  <h3 className="text-base font-bold text-[var(--text)] group-hover:text-[var(--gold)] transition-colors font-serif-luxury truncate">
                    {nativeName}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
                    {chart?.birth?.place || "Birthplace Recorded"}
                  </p>

                  {/* Astrological Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-[var(--raised)] border border-[var(--line)] text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--quiet)] block">Lagna (Ascendant)</span>
                      <strong className="text-xs font-bold text-[var(--gold)]">
                        {lagna} · {lagnaDeg}°
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--quiet)] block">Moon Nakshatra</span>
                      <strong className="text-xs font-bold text-[var(--text)]">
                        {moonNakshatra} (P{moonPada})
                      </strong>
                    </div>
                    <div className="col-span-2 pt-1.5 border-t border-[var(--line)] flex items-center justify-between">
                      <span className="text-[10px] text-[var(--quiet)]">Current Dasha:</span>
                      <strong className="text-[11px] text-[#52FEB8] font-semibold">
                        {dashaLord} Mahadasha
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-3.5 border-t border-[var(--line)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrint(chart, item.id)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--wash)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[#11131A] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Export printable PDF report"
                    >
                      <Download size={13} />
                      <span>{t("reports.exportPdf")}</span>
                    </button>
                    <Link
                      href={`/chat?openBirth=1`}
                      className="px-3 py-1.5 rounded-lg bg-[var(--raised)] text-[var(--muted)] hover:text-[var(--text)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Inspect full birth chart"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-1.5 rounded-lg text-[var(--quiet)] hover:text-red-400 hover:bg-[var(--raised)] transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-10 rounded-2xl bg-[var(--panel)] border-2 border-dashed border-[var(--line2)] text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-[var(--wash)] text-[var(--gold)] flex items-center justify-center mx-auto mb-3">
            <BookOpen size={24} />
          </div>
          <h3 className="text-base font-bold text-[var(--text)] font-serif-luxury">
            {searchQuery || activeFilter !== "all"
              ? "No matching records found"
              : "Your celestial library is waiting"}
          </h3>
          <p className="text-xs text-[var(--muted)] mt-1.5 max-w-xs mx-auto leading-relaxed">
            {searchQuery || activeFilter !== "all"
              ? "Try clearing your search query or switching filters to view your saved charts."
              : "Calculate a Janam Kundli or Palm Dossier, then select Save to archive it securely in your personal vault."}
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            {(searchQuery || activeFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="px-4 py-2 rounded-xl bg-[var(--raised)] text-xs font-semibold text-[var(--text)] border border-[var(--line)] hover:border-[var(--gold)] transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <Link
              href="/chat?openBirth=1"
              className="px-5 py-2 rounded-xl bg-[var(--gold)] text-[#11131A] text-xs font-bold hover:bg-[var(--gold2)] transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>{t("kundli.calculateChart")}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Calculate New Kundli Hero Panel */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[var(--wash)] via-[var(--panel)] to-[var(--panel)] border border-[var(--line2)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mt-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/20 border border-[var(--gold)]/40 flex items-center justify-center text-[var(--gold)] shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text)] font-serif-luxury">
              Ready to generate a new astrological dossier?
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Enter birth coordinates to calculate natal lagna, planetary telemetry, and Parashara synthesis.
            </p>
          </div>
        </div>
        <Link
          href="/chat?openBirth=1"
          className="px-5 py-2.5 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold2)] text-[#11131A] text-xs font-bold transition-all shadow-md flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <span>{t("kundli.calculateChart")}</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
