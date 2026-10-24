"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Mail, MoonStar, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment.");
      setBusy(false);
      return;
    }
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + "/auth/callback", shouldCreateUser: true },
    });
    if (authError) setError(authError.message);
    else setSent(true);
    setBusy(false);
  }

  return <main className="auth-shell">
    <Link href="/" className="auth-back"><ArrowLeft size={15}/> Back to Vedic AI</Link>
    <section className="auth-card">
      <div className="auth-brand"><span className="brand-mark"><MoonStar size={21}/></span><span className="brand-name">vedic<span style={{ color: "var(--gold)" }}>.</span>ai</span></div>
      {!sent ? <>
        <div className="eyebrow" style={{ marginTop: 35 }}><span className="eyebrow-line"/> YOUR PERSONAL ASTROLOGY SPACE</div>
        <h1 className="auth-title">Your journey,<br/><span>all in one place.</span></h1>
        <p className="auth-copy">Sign in to save your birth profile and keep your kundli reports and conversations together.</p>
        <form onSubmit={submit} className="auth-form">
          <label className="form-field"><span className="form-label">Email address</span><input className="form-input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"/></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? "Sending secure link…" : "Continue with email"} <ArrowUpRight size={15}/></button>
        </form>
        <p className="auth-privacy"><ShieldCheck size={14}/> Passwordless sign-in powered by Supabase Auth.</p>
      </> : <div className="auth-success">
        <span className="auth-success-icon"><CheckCircle2 size={25}/></span>
        <h1 className="auth-title">Check your inbox.</h1>
        <p className="auth-copy">We sent a sign-in link to <strong>{email}</strong>. Open it on this device to finish signing in.</p>
        <button className="secondary-button" onClick={() => setSent(false)}><Mail size={14}/> Use another email</button>
      </div>}
    </section>
    <p className="auth-footer">Traditional Jyotish, explained thoughtfully. <span>·</span> <Link href="/">Explore without signing in</Link></p>
  </main>;
}
