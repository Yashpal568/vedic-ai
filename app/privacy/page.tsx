import Link from "next/link";
import { ArrowLeft, MoonStar } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description: "How Vedic AI handles birth details, chart data, AI requests, and saved account information.",
};

export default function PrivacyPage() {
  return <main className="legal-shell">
    <header className="legal-header"><Link href="/" className="auth-back"><ArrowLeft size={15}/> Back to Vedic AI</Link><div className="auth-brand"><span className="brand-mark"><MoonStar size={18}/></span><span className="brand-name">vedic<span style={{ color: "var(--gold)" }}>.</span>ai</span></div></header>
    <article className="legal-content"><div className="eyebrow"><span className="eyebrow-line"/> YOUR DATA, YOUR CHOICE</div><h1>Privacy <span>policy.</span></h1><p className="legal-updated">Last updated: 24 October 2026 · MVP policy draft</p>
      <p>Vedic AI is an early-stage Vedic astrology web application. This page explains the data practices intended for the current MVP. Before a public commercial launch, the operator should review and adapt this policy to the actual hosting region, applicable law, vendor contracts, and support contact details.</p>
      <h2>Information you provide</h2><p>When you create a chart, the app processes your birth date, local birth time, birthplace, coordinates, timezone, and the resulting chart data. Your name is optional. Do not enter information about another person unless you have the right to do so.</p>
      <h2>How the app uses it</h2><ul><li>Birth details are used to resolve the location and calculate a chart.</li><li>If an AI provider is configured, chat messages and relevant birth/chart context may be sent to that provider to generate a response.</li><li>If you sign in and save a report, the birth profile and calculated chart are stored in the connected Supabase database under your account.</li><li>Authenticated conversations can be stored in Supabase so you can reopen them later.</li></ul>
      <h2>Third-party services</h2><p>Birthplace lookup currently uses the public OpenStreetMap Nominatim service and must follow its usage policy. AI responses use the provider selected by the operator (Gemini or OpenAI). Sign-in and saved reports use Supabase. These services process requests under their own terms and privacy practices; review their current terms before using the product.</p>
      <h2>Retention and control</h2><p>Unauthenticated chart requests are not intentionally stored by the app. Saved reports and conversations remain in your account until deleted or until the operator changes its retention practices. The MVP supports deletion of individual saved kundli reports. Account-wide deletion and a complete data-export workflow still need to be implemented and tested before a production launch.</p>
      <h2>Security</h2><p>The app is designed to keep AI provider secrets on the server and to use Supabase Row Level Security for account-owned records. No online service can guarantee absolute security. Do not share passwords or secrets in chat. Security policies must be tested in the deployed environment.</p>
      <h2>Children and high-stakes decisions</h2><p>Vedic AI is not designed to make decisions about employment, credit, insurance, healthcare, legal matters, or other high-stakes outcomes. Astrology is a traditional interpretive practice, not a substitute for professional medical, legal, financial, or mental-health support.</p>
      <h2>Contact and changes</h2><p>A public contact address and data-controller details have not yet been configured. Before opening the service to the public, add an accountable operator/contact address and an effective process for privacy requests. This draft may change as features and providers are added.</p>
      <p className="legal-back-links"><Link href="/terms">Read terms of use</Link><span>·</span><Link href="/">Return to Vedic AI</Link></p>
    </article>
  </main>;
}
