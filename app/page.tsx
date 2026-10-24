"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, ArrowUpRight, Check, ChevronDown, Compass, Heart, Menu, MoonStar,
  Orbit, ShieldCheck, Sparkles, Stars, Sun, X, MessageCircle,
} from "lucide-react";

const features = [
  { icon: Orbit, title: "Your birth chart, made clearer", copy: "Explore grahas, houses, nakshatras and chart patterns with explanations that feel human—not overwhelming." },
  { icon: MessageCircle, title: "Ask follow-up questions", copy: "Keep the conversation going. Ask what a placement traditionally means and get a grounded, readable explanation." },
  { icon: Compass, title: "Start with the right details", copy: "Choose your birthplace and local birth time to build a structured chart before exploring its traditional meaning." },
  { icon: Stars, title: "Learn Jyotish at your pace", copy: "Understand Sanskrit terms and classical concepts one idea at a time, in English or Hindi." },
];

const steps = [
  { n: "01", title: "Add your birth details", copy: "Enter date, local time and birthplace. Review the location before calculating your chart." },
  { n: "02", title: "Explore your chart", copy: "See a structured overview of placements, houses, nakshatras and traditional timing systems." },
  { n: "03", title: "Ask what it means", copy: "Use a conversational guide to learn the concepts and ask thoughtful follow-up questions." },
];

export default function MarketingHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main className="marketing-shell">
      <header className="marketing-nav">
        <Link href="/" className="marketing-brand" aria-label="Vedic AI home">
          <span className="marketing-brand-mark"><MoonStar size={21} strokeWidth={1.5} /></span>
          <span className="marketing-brand-name">vedic<span>.</span>ai</span>
        </Link>
        <nav className={"marketing-nav-links " + (menuOpen ? "open" : "")} aria-label="Main navigation">
          <a href="#experience" onClick={() => setMenuOpen(false)}>Experience</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#principles" onClick={() => setMenuOpen(false)}>Our approach</a>
          <Link href="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
          <Link href="/chat" className="marketing-nav-cta" onClick={() => setMenuOpen(false)}>Explore your chart <ArrowUpRight size={15} /></Link>
        </nav>
        <button className="marketing-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"}>{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
      </header>

      <section className="marketing-hero">
        <div className="marketing-hero-image" aria-hidden="true" />
        <div className="marketing-stars" aria-hidden="true" />
        <div className="marketing-hero-content">
          <div className="marketing-eyebrow"><span /> ANCIENT WISDOM. A MORE HUMAN INTERFACE.</div>
          <h1>Your cosmic story,<br /><em>explored with clarity.</em></h1>
          <p className="marketing-hero-copy">Discover the language of your Vedic birth chart through thoughtful explanations, structured chart data and a conversation that meets you where you are.</p>
          <div className="marketing-hero-actions">
            <Link href="/chat" className="marketing-button-primary">Explore your birth chart <ArrowRight size={17}/></Link>
            <a href="#how-it-works" className="marketing-button-secondary">See how it works <ChevronDown size={15}/></a>
          </div>
          <div className="marketing-proof-row">
            <span><ShieldCheck size={15}/> Privacy-aware by design</span>
            <span><Sparkles size={15}/> Learn at your own pace</span>
          </div>
        </div>
        <div className="marketing-chart-art" aria-hidden="true">
          <div className="chart-art-orbit orbit-one" /><div className="chart-art-orbit orbit-two" /><div className="chart-art-orbit orbit-three" />
          <div className="chart-art-core"><MoonStar size={48} strokeWidth={1}/></div>
          <span className="chart-art-star star-a">✦</span><span className="chart-art-star star-b">✧</span><span className="chart-art-star star-c">✦</span>
          <div className="chart-art-label"><span>SIDEREAL • JYOTISH</span><strong>A moment in the cosmos</strong><small>Explore the symbols. Understand the story.</small></div>
        </div>
        <a href="#experience" className="marketing-scroll-cue"><span /> SCROLL TO EXPLORE</a>
      </section>

      <section className="marketing-intro" id="experience">
        <div className="marketing-section-kicker">A DIFFERENT KIND OF ASTROLOGY EXPERIENCE</div>
        <div className="marketing-intro-grid">
          <h2>Tradition deserves<br /><em>a clearer conversation.</em></h2>
          <p>Vedic astrology has its own language, systems and symbolism. Vedic AI is being built to help you explore those ideas with a calm interface, structured calculations and explanations you can ask questions about.</p>
        </div>
      </section>

      <section className="marketing-feature-section">
        <div className="marketing-section-heading">
          <div><div className="marketing-section-kicker">MADE FOR CURIOSITY</div><h2>Explore beyond the horoscope.</h2></div>
          <p>Less noise. More context. A space to learn the concepts behind your chart.</p>
        </div>
        <div className="marketing-feature-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return <article className={"marketing-feature-card feature-card-" + index} key={feature.title}>
              <div className="marketing-feature-icon"><Icon size={21} strokeWidth={1.5}/></div>
              <div className="marketing-feature-number">0{index + 1}</div>
              <h3>{feature.title}</h3><p>{feature.copy}</p>
              <span className="marketing-feature-arrow"><ArrowUpRight size={17}/></span>
            </article>;
          })}
        </div>
      </section>

      <section className="marketing-visual-break">
        <div className="marketing-visual-photo" role="img" aria-label="A tranquil night sky filled with stars above distant mountains" />
        <div className="marketing-visual-overlay" />
        <div className="marketing-visual-copy"><div className="marketing-section-kicker">A SPACE TO REFLECT</div><h2>Look at the patterns.<br /><em>Stay curious about the meaning.</em></h2><p>Use traditional Jyotish as a lens for learning and reflection—not as a guarantee of what the future holds.</p><Link href="/chat" className="marketing-text-link">Start a conversation <ArrowRight size={16}/></Link></div>
      </section>

      <section className="marketing-steps-section" id="how-it-works">
        <div className="marketing-section-kicker">YOUR JOURNEY, IN THREE STEPS</div>
        <div className="marketing-section-heading"><h2>From birth details to better questions.</h2><p>A guided experience designed to keep the process understandable.</p></div>
        <div className="marketing-steps-grid">{steps.map((step) => <article className="marketing-step" key={step.n}><span className="marketing-step-number">{step.n}</span><div className="marketing-step-line" /><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div>
      </section>

      <section className="marketing-principles" id="principles">
        <div className="marketing-principles-art" aria-hidden="true"><div className="principles-sun"><Sun size={45} strokeWidth={1}/></div><div className="principles-ring ring-a"/><div className="principles-ring ring-b"/><div className="principles-ring ring-c"/></div>
        <div className="marketing-principles-copy"><div className="marketing-section-kicker">THOUGHTFUL BY DESIGN</div><h2>Wonder, with<br /><em>honesty built in.</em></h2><p>Astrology is a cultural and traditional interpretive practice. Our goal is to help you understand its concepts—not to promise certainty or replace professional advice.</p><ul><li><Check size={16}/> Explanations grounded in available chart data</li><li><Check size={16}/> Clear language, without unnecessary jargon</li><li><Check size={16}/> A visible distinction between interpretation and certainty</li></ul><Link href="/privacy" className="marketing-text-link">Read our privacy approach <ArrowRight size={16}/></Link></div>
      </section>

      <section className="marketing-final-cta">
        <div className="marketing-final-glow" aria-hidden="true" />
        <div className="marketing-section-kicker">YOUR EXPLORATION STARTS HERE</div>
        <h2>Every question can be<br /><em>a place to begin.</em></h2>
        <p>Explore Vedic concepts, build your chart and start a more thoughtful conversation.</p>
        <Link href="/chat" className="marketing-button-primary">Enter Vedic AI <ArrowRight size={17}/></Link>
        <div className="marketing-cta-note"><Heart size={13}/> Made for reflection, learning and curiosity.</div>
      </section>

      <footer className="marketing-footer">
        <Link href="/" className="marketing-brand"><span className="marketing-brand-mark"><MoonStar size={18}/></span><span className="marketing-brand-name">vedic<span>.</span>ai</span></Link>
        <p>Ancient insight, reimagined.</p>
        <div className="marketing-footer-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/chat">Open the app</Link></div>
        <small>© {new Date().getFullYear()} Vedic AI. Traditional interpretations are not guarantees or professional advice.</small>
      </footer>
    </main>
  );
}
