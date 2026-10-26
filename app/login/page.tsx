"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail, MoonStar, ShieldCheck, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("error");
    if (code) {
      const messages: Record<string, string> = {
        auth_setup: "Sign-in setup is incomplete. Please try again from the official Vedic AI website.",
        auth_callback: "This sign-in link has expired or was already used. Request a fresh link below.",
        oauth_denied: "Sign-in was cancelled. You can try again whenever you're ready.",
      };
      setError(messages[code] || "Sign-in could not be completed. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
    const verified = params.get("verified");
    if (verified === "1") {
      setSent(false);
      setError("");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || resendSeconds > 0) return;
    setBusy(true);
    setError("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Secure sign-in is not configured. Please contact the site administrator.");
      setBusy(false);
      return;
    }
    // Local development may use localhost. Deployed builds must send links back to
    // the configured public application URL, never to a developer's localhost.
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
    const appBase = process.env.NODE_ENV === "development"
      ? window.location.origin
      : (configuredUrl || window.location.origin);
    let emailRedirectTo: string;
    try {
      const parsed = new URL(appBase);
      if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") throw new Error("Invalid app URL");
      emailRedirectTo = new URL("/auth/callback", parsed.origin).toString();
    } catch {
      setError("The sign-in destination is misconfigured. Please contact the site administrator.");
      setBusy(false);
      return;
    }
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo, shouldCreateUser: true },
    });
    if (authError) {
      setError("We couldn't send the secure link. Please check your email address and try again.");
    } else {
      setSent(true);
      setResendSeconds(30);
    }
    setBusy(false);
  }

  return (
    <main className="auth-shell auth-shell-premium">
      <Link href="/" className="auth-back"><ArrowLeft size={15} /> <span>Back to Vedic AI</span></Link>
      <div className="auth-layout">
        <section className="auth-story" aria-label="About Vedic AI">
          <Link href="/" className="auth-brand">
            <span className="brand-mark"><MoonStar size={21} /></span>
            <span><span className="brand-name">vedic<span style={{ color: "var(--gold)" }}>.</span>ai</span><span className="auth-brand-caption">ANCIENT INSIGHT, REIMAGINED</span></span>
          </Link>
          <div className="auth-story-content">
            <div className="auth-story-kicker"><Sparkles size={14} /> YOUR PERSONAL JYOTISH SPACE</div>
            <h1 className="auth-story-title">A little more<br /><em>clarity for your</em><br />cosmic journey.</h1>
            <p className="auth-story-copy">A thoughtful space to explore your birth chart, revisit conversations and keep your saved reports together.</p>
            <div className="auth-benefits">
              <div><span><ShieldCheck size={17} /></span><div><strong>Private by design</strong><small>Your personal workspace is tied to your account.</small></div></div>
              <div><span><Sparkles size={17} /></span><div><strong>Your journey, saved</strong><small>Return to your conversations and reports.</small></div></div>
              <div><span><LockKeyhole size={17} /></span><div><strong>No password to remember</strong><small>Use a one-time secure link sent to your inbox.</small></div></div>
            </div>
          </div>
          <p className="auth-story-foot">Traditional Jyotish, explored with curiosity—not certainty.</p>
        </section>

        <section className="auth-card auth-card-premium">
          {!sent ? <>
            <div className="auth-mobile-mark"><span className="brand-mark"><MoonStar size={20} /></span><span className="brand-name">vedic<span style={{ color: "var(--gold)" }}>.</span>ai</span></div>
            <div className="auth-step-label">WELCOME BACK</div>
            <h2 className="auth-title">Your space<br /><span>is waiting.</span></h2>
            <p className="auth-copy">Enter your email and we'll send you a secure sign-in button. No password needed.</p>
            <div className="auth-email-intro"><span className="auth-email-icon"><Mail size={17} /></span><span><strong>Email sign-in</strong><small>Private, passwordless access</small></span><span className="auth-email-secure"><LockKeyhole size={12} /> Secure</span></div>
            <form onSubmit={submit} className="auth-form">
              <label className="form-field"><span className="form-label">Email address</span><input className="form-input auth-email-input" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="primary-button auth-submit" type="submit" disabled={busy || resendSeconds > 0}>
                {busy ? "Sending secure link…" : "Email me a sign-in link"} {!busy && <ArrowRight size={16} />}
              </button>
            </form>
            <p className="auth-privacy"><ShieldCheck size={15} /> We’ll only use your email to sign you in.</p>
            <div className="auth-card-divider"><span>SAFE & SIMPLE</span></div>
            <p className="auth-fineprint">By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
          </> : <div className="auth-success auth-success-premium">
            <span className="auth-success-icon"><CheckCircle2 size={26} /></span>
            <div className="auth-step-label">ONE LAST STEP</div>
            <h2 className="auth-title">Check your<br /><span>inbox.</span></h2>
            <p className="auth-copy">A sign-in email is on its way to <strong>{email.trim()}</strong>. Open it and tap the <strong>Confirm email address</strong> button to securely return to Vedic AI.</p>
            <div className="auth-inbox-tip"><Mail size={17} /><span>Can't find it? Check your spam or promotions folder. The link may expire, so use the newest email.</span></div>
            <button className="primary-button auth-submit" onClick={() => { setSent(false); setError(""); }} disabled={resendSeconds > 0}>
              {resendSeconds > 0 ? `Send another link in ${resendSeconds}s` : "Send another sign-in link"} <ArrowRight size={15} />
            </button>
            <button className="auth-change-email" onClick={() => { setSent(false); setError(""); setResendSeconds(0); }}>Use a different email</button>
            {error && <p className="auth-error" role="alert">{error}</p>}
          </div>}
        </section>
      </div>
      <footer className="auth-footer auth-footer-premium"><span className="auth-footer-dot" /> Secure sign-in powered by Supabase Auth <span className="auth-footer-separator">·</span> <Link href="/">Explore without signing in</Link></footer>
    </main>
  );
}
