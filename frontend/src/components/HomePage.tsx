"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Camera, Check, File, Logo } from "./Icons";
import { Button, ProductVisual } from "./Design";

export default function HomePage() {
  const router = useRouter();
  const navigate = () => router.push("/claims");
  const sectionRef = useRef<HTMLElement>(null);
  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero-photo" />
        <div className="hero-vignette" />
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="wave-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="hero-content">
          <div className="eyebrow eyebrow--light reveal delay-1">
            <Sparkles /> AI-powered claims, thoughtfully guided
          </div>
          <h1 className="reveal delay-2">
            Your Journey to
            <br />
            <em>Resolution</em> Starts Here.
          </h1>
          <p className="reveal delay-3">
            Turn damaged deliveries into clear, compelling claims.
            <br />
            Claimly guides every step, so you can move forward.
          </p>
          <div className="hero-actions reveal delay-4">
            <Button onClick={() => navigate()} icon={<ArrowRight />}>
              Review your claim
            </Button>
            <button
              className="text-link"
              onClick={() => sectionRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              See how it works <span>↓</span>
            </button>
          </div>
        </div>
        <div className="hero-marker">
          <span>01</span>
          <i />
          <span>03</span>
        </div>
      </section>

      <section className="how-section" id="how-it-works" ref={sectionRef}>
        <div className="section-intro">
          <div>
            <div className="eyebrow">
              <span className="gold-line" /> A calm path forward
            </div>
            <h2>
              Three steps to a<br />
              <em>stronger claim.</em>
            </h2>
          </div>
          <p>
            From the first sign of damage to a polished claim, Claimly brings clarity to every step
            of the process.
          </p>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <div className="step-icon">
              <Camera />
            </div>
            <h3>Capture the evidence</h3>
            <p>
              During your AI video call, your agent guides the conversation and documents the
              details that matter.
            </p>
            <div className="mini-window video-window">
              <div className="video-scene">
                <ProductVisual type="luggage" />
              </div>
              <span className="scan-corner corner-1" />
              <span className="scan-corner corner-2" />
              <span className="scan-corner corner-3" />
              <span className="scan-corner corner-4" />
              <div className="recording">
                <i /> Documenting damage
              </div>
            </div>
          </article>
          <article className="step-card step-card--raised">
            <span className="step-number">02</span>
            <div className="step-icon">
              <Sparkles />
            </div>
            <h3>Let AI build your case</h3>
            <p>
              Your agent organizes the evidence, prepares your request, and submits your
              claim during the conversation.
            </p>
            <div className="mini-window summary-window">
              <span className="illustration-label">Example workflow</span>
              <div className="summary-top">
                <span>
                  <Sparkles /> AI claim analysis
                </span>
                <i>Complete</i>
              </div>
              <div className="summary-score">
                <span>Claim preparation</span>
                <strong>Ready</strong>
              </div>
              <div className="score-track">
                <i />
              </div>
              <div className="check-row">
                <Check /> Evidence organized
              </div>
              <div className="check-row">
                <Check /> Product details captured
              </div>
            </div>
          </article>
          <article className="step-card">
            <span className="step-number">03</span>
            <div className="step-icon">
              <File />
            </div>
            <h3>Review and track</h3>
            <p>
              Your agent files the claim during your call. Visit your dashboard afterward to
              review the request, evidence, and confirmation receipt.
            </p>
            <div className="mini-window claim-window">
              <div className="paper">
                <Logo />
                <span className="paper-line wide" />
                <span className="paper-line" />
                <span className="paper-line short" />
                <div className="paper-check">
                  <Check />
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
      <section className="home-cta">
        <div>
          <span className="eyebrow eyebrow--light">Your next step</span>
          <h2>
            A better outcome begins
            <br />
            with a <em>clear story.</em>
          </h2>
        </div>
        <Button onClick={() => navigate()} icon={<ArrowRight />}>
          Review your AI-prepared claim
        </Button>
      </section>
    </main>
  );
}

