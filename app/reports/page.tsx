import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { BookOpen, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppDesktopSidebar from "@/components/app-desktop-sidebar";
import SiteHeader from "@/components/site-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import FloatingChatDock from "@/components/chat/floating-chat-dock";
import ReportsLibraryClient, { type SavedReportItem } from "@/components/reports/reports-library-client";
import enJson from "@/locales/en.json";
import hiJson from "@/locales/hi.json";

export const metadata = {
  title: "Saved Kundlis & Reports — Vedic AI",
  description: "Personal astrological library of calculated Janam Kundlis, palm dossiers, and consultation records.",
  robots: { index: false, follow: false },
};

export default async function ReportsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("vedic_language")?.value as "en" | "hi") || "en";
  const t = (keyPath: string, fallback: string) => {
    const dict = lang === "hi" ? hiJson : enJson;
    const parts = keyPath.split(".");
    let cur: unknown = dict;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return fallback;
      }
    }
    return typeof cur === "string" ? cur : fallback;
  };

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans-luxury">
        <AppDesktopSidebar />
        <div className="flex-1 flex flex-col app-sidebar-offset min-w-0">
          <SiteHeader section="nav.savedReports" />
          <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 py-12 pb-44 text-center">
            <div className="p-10 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] max-w-md mx-auto">
              <BookOpen size={36} className="text-[var(--gold)] mx-auto mb-4" />
              <h1 className="text-xl font-bold font-serif-luxury text-[var(--text)]">
                {t("reports.secureStorage", "Secure Account Storage")}
              </h1>
              <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
                {t("reports.secureStorageDescription", "Connect your account to save, search, and export Janam Kundlis and Palmistry Dossiers in your private vault.")}
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--gold)] text-[#11131A] text-xs font-bold hover:bg-[var(--gold2)] transition-colors"
              >
                {t("reports.signInToView", "Sign In to View Library")}
              </Link>
            </div>
          </main>

          <FloatingChatDock />
          <MobileBottomNav />
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("kundli_reports")
    .select("id, calculation_engine, engine_version, created_at, calculation_payload")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const reports = (data || []) as unknown as SavedReportItem[];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans-luxury">
      {/* 280px Left Navigation Sidebar for Desktop PC */}
      <AppDesktopSidebar />

      {/* Main Panel Offset for 280px Sidebar on Large Screens */}
      <div className="flex-1 flex flex-col app-sidebar-offset min-w-0">
        <SiteHeader section="nav.savedReports" />

        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-44">
          {/* Page Header */}
          <section className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--gold)] flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck size={14} />
                  <span>{lang === "hi" ? "आपकी व्यक्तिगत लाइब्रेरी · सुरक्षित तिजोरी" : "Your Personal Library · Secure Vault"}</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[var(--text)] tracking-tight">
                  {t("reports.title", "Saved Kundlis & Reports")}
                </h1>
                <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 max-w-[720px] leading-relaxed">
                  {t("reports.subtitle", "Your calculated birth charts, palm dossiers, and consultation records, stored securely in your celestial vault.")}
                </p>
              </div>

              {/* Vault Storage Status Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--panel)] border border-[var(--line2)] text-xs text-[var(--muted)]">
                <span className="w-2 h-2 rounded-full bg-[#52FEB8] animate-pulse" />
                <span className="font-semibold text-[var(--text)]">{t("reports.vaultSynced", "Vault Synced")}</span>
                <span className="text-[10px] text-[var(--quiet)] font-mono">
                  ({reports.length} records)
                </span>
              </div>
            </div>
          </section>

          {/* Interactive Client Library (Search, Filter, Sort & 3-Col PC Grid) */}
          <ReportsLibraryClient initialReports={reports} />
        </main>

        <FloatingChatDock />
        <MobileBottomNav />
      </div>
    </div>
  );
}
