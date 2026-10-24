import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpen, CalendarDays, MoonStar, Orbit, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { KundliReport } from "@/lib/astrology";

type SavedReport = {
  id: string;
  calculation_engine: string;
  engine_version: string | null;
  created_at: string;
  calculation_payload: KundliReport;
};

export const metadata = { title: "Saved Kundlis" };

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return <main className="reports-shell"><Link className="auth-back" href="/"><ArrowLeft size={15}/> Back to Vedic AI</Link><section className="reports-empty"><MoonStar size={28}/><h1>Saved kundlis</h1><p>Connect Supabase to enable secure account-based report storage.</p><Link className="primary-button" href="/login">Sign in <ArrowUpRight size={14}/></Link></section></main>;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("kundli_reports")
    .select("id, calculation_engine, engine_version, created_at, calculation_payload")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  const reports = (data || []) as unknown as SavedReport[];

  return <main className="reports-shell">
    <header className="reports-header"><Link className="auth-back" href="/"><ArrowLeft size={15}/> Back to Vedic AI</Link><div className="auth-brand"><span className="brand-mark"><MoonStar size={19}/></span><span className="brand-name">vedic<span style={{ color: "var(--gold)" }}>.</span>ai</span></div></header>
    <section className="reports-content">
      <div className="eyebrow"><span className="eyebrow-line"/> YOUR PERSONAL LIBRARY</div>
      <h1 className="reports-title">Saved <span>kundlis.</span></h1>
      <p className="reports-description">Your birth charts, stored privately in your account.</p>
      {error ? <div className="reports-alert">We couldn't load saved reports. Check the Supabase migration and Row Level Security policies.</div> :
        reports.length === 0 ? <div className="reports-empty"><BookOpen size={25}/><h2>Your library is waiting.</h2><p>Calculate a birth chart, then select <strong>Save kundli</strong> to keep it here.</p><Link className="primary-button" href="/">Create your first kundli <ArrowUpRight size={14}/></Link></div> :
        <div className="reports-grid">{reports.map((report) => {
          const chart = report.calculation_payload;
          return <article className="report-card" key={report.id}>
            <div className="report-card-top"><span className="report-icon"><Orbit size={17}/></span><span className="report-date"><CalendarDays size={12}/>{new Date(report.created_at).toLocaleDateString()}</span></div>
            <h2>{chart?.ascendant?.sign || "Vedic birth chart"} Ascendant</h2>
            <p className="report-place">{chart?.birth?.place || "Birthplace not available"}</p>
            <div className="report-details"><div><span>Moon nakshatra</span><strong>{chart?.planets?.find((planet) => planet.name === "Moon")?.nakshatra || "—"}</strong></div><div><span>Mahadasha at save</span><strong>{chart?.vimshottari?.currentMahadasha?.lord || "—"}</strong></div></div>
            <details className="report-payload"><summary>View planetary placements</summary><div className="chart-table-wrap"><table className="chart-table"><thead><tr><th>Graha</th><th>Rashi</th><th>House</th><th>Degree</th></tr></thead><tbody>{(chart?.planets || []).map((planet) => <tr key={planet.name}><td>{planet.name}</td><td>{planet.sign}</td><td>{planet.house}</td><td>{planet.degreeInSign.toFixed(2)}°</td></tr>)}</tbody></table></div><p className="chart-disclaimer"><ShieldCheck size={13}/>{chart?.disclaimer}</p><pre>{JSON.stringify(chart, null, 2)}</pre></details>
          </article>;
        })}</div>}
    </section>
  </main>;
}
