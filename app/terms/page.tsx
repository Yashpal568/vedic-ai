import Link from "next/link";
import { ArrowLeft, MoonStar } from "lucide-react";

export const metadata = {
  title: "Terms of Use",
  description: "Terms and limitations for using the Vedic AI astrology web application.",
};

export default function TermsPage() {
  return <main className="legal-shell">
    <header className="legal-header"><Link href="/" className="auth-back"><ArrowLeft size={15}/> Back to Vedic AI</Link><div className="auth-brand"><span className="brand-mark"><MoonStar size={18}/></span><span className="brand-name">vedic<span style={{ color: "var(--gold)" }}>.</span>ai</span></div></header>
    <article className="legal-content"><div className="eyebrow"><span className="eyebrow-line"/> PLEASE READ BEFORE USE</div><h1>Terms of <span>use.</span></h1><p className="legal-updated">Last updated: 24 October 2026 · MVP terms draft</p>
      <p>These draft terms describe the intended use of Vedic AI, an early-stage web application for exploring traditional Vedic astrology. The operator must review these terms with qualified counsel and add business identity, jurisdiction, support contact, and any consumer-law disclosures before commercial release.</p>
      <h2>What the service does</h2><p>Vedic AI provides general explanations of Jyotish concepts, birth-chart calculations, and AI-generated interpretations. The current calculation engine uses Astronomy Engine with an approximate Lahiri ayanamsha and a simplified lunar-node formula. It has not yet been validated against a comprehensive set of trusted reference charts. Outputs may be inaccurate or incomplete.</p>
      <h2>Traditional interpretation, not certainty</h2><p>Astrological interpretations are cultural and traditional perspectives, not scientifically established guarantees about your future. Do not rely on Vedic AI as the sole basis for decisions. The service does not provide medical, mental-health, legal, financial, investment, employment, or other professional advice.</p>
      <h2>Acceptable use</h2><ul><li>Use the service lawfully and do not attempt to disrupt, overload, reverse-engineer, or gain unauthorized access to it.</li><li>Do not submit other people&apos;s personal information without appropriate permission.</li><li>Do not use the service to make high-stakes decisions about other people.</li><li>Do not treat generated content as guaranteed or as a substitute for independent verification.</li></ul>
      <h2>Accounts and saved information</h2><p>You are responsible for maintaining access to your email account used for passwordless sign-in. Saved kundlis and conversations may be unavailable during outages or while integrations are misconfigured. You can delete individual saved kundli reports in the MVP; account-wide deletion features are not yet complete.</p>
      <h2>Third-party services and availability</h2><p>The application depends on third-party AI, geocoding, hosting, authentication, and database services. Those services may change, impose limits, or become unavailable. The MVP may be modified, interrupted, or withdrawn while it is under development.</p>
      <h2>Intellectual property and reuse</h2><p>No project-level open-source licence has been added to the repository. Unless the operator states otherwise in a signed agreement or a later licence, do not assume that you may copy, redistribute, or commercially reuse the application source code or branding.</p>
      <h2>Limitations and updates</h2><p>To the extent permitted by applicable law, the service is provided on an “as is” and “as available” basis. Nothing here excludes consumer rights or liabilities that cannot lawfully be excluded. These draft terms may be updated as the product evolves.</p>
      <p className="legal-back-links"><Link href="/privacy">Read privacy policy</Link><span>·</span><Link href="/">Return to Vedic AI</Link></p>
    </article>
  </main>;
}
