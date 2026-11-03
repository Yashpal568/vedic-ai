import { describe, it, expect } from "vitest";
import { parsePalmReading } from "../lib/palm-parser";
import fs from "fs";
import path from "path";

describe("Vedic Cosmic Luxury — Palm Reading UI Reference Architecture", () => {
  const sampleMarkdown = `## 1. Palm Overview & Photo Observations
Clear left hand with square palm shape, firm skin texture, and prominent Venus mount.

## 2. Heart Line (Emotions & Connection)
Curved upward ending between Jupiter and Saturn mounts, indicating balanced emotional warmth, fidelity, and healthy personal boundaries.

## 3. Head Line (Thinking & Focus)
Clear and slightly sloping toward the lower Moon mount, indicating analytical discipline paired with creative intuition.

## 4. Life Line (Energy & Vitality)
Deep, unbroken curve around the thumb base symbolizing steady stamina, robust physical constitution, and calm daily routine.

## 5. Fate Line & Other Visible Features
A distinct vertical fate line starts from the wrist and proceeds steadily toward Saturn, showing strong self-directed career focus.

## 6. Overall Traditional Reading
The palm indicates a grounded, persistent nature with strong ethical standards and practical problem-solving capability.

## 7. Limitations & Guidance
Traditional palmistry reflects symbolic tendencies rather than set-in-stone outcomes. Real-life effort and choices remain primary.`;

  it("correctly parses AI vision output into the 10-point personalised report format", () => {
    const report = parsePalmReading(sampleMarkdown, "left");

    expect(report.overallStructure).toContain("square palm shape");
    expect(report.heartLine).toContain("Jupiter and Saturn");
    expect(report.headLine).toContain("creative intuition");
    expect(report.lifeLine).toContain("thumb base");
    expect(report.fateLine).toContain("Saturn");
    expect(report.synthesis).toContain("grounded, persistent nature");
    expect(report.disclaimer).toContain("symbolic tendencies");
  });

  it("populates the 3-layer analytical framework with appropriate structured layers", () => {
    const report = parsePalmReading(sampleMarkdown, "left");

    expect(report.layer1Structure.length).toBeGreaterThanOrEqual(4);
    expect(report.layer2Lines.length).toBe(4);
    expect(report.layer3Interpretation.length).toBeGreaterThanOrEqual(4);
    expect(report.remedies.length).toBeGreaterThanOrEqual(2);
  });

  it("handles empty or sparse AI responses gracefully without crashing", () => {
    const emptyReport = parsePalmReading("", "unsure");

    expect(emptyReport.overallStructure).toBeTruthy();
    expect(emptyReport.heartLine).toBeTruthy();
    expect(emptyReport.headLine).toBeTruthy();
    expect(emptyReport.lifeLine).toBeTruthy();
    expect(emptyReport.disclaimer).toBeTruthy();
    expect(emptyReport.layer1Structure.length).toBeGreaterThan(0);
  });

  it("verifies component files exist and match approved Stitch Vedic Cosmic Luxury tokens", () => {
    const headerCode = fs.readFileSync(path.resolve(__dirname, "../components/palm/palm-report-header.tsx"), "utf-8");
    expect(headerCode).toContain("YOUR PALMISTRY PROFILE");
    expect(headerCode).toContain("Vedic Astrological Insight");

    const plateCode = fs.readFileSync(path.resolve(__dirname, "../components/palm/palm-biometric-plate.tsx"), "utf-8");
    expect(plateCode).toContain("Verified Hastarekha Scan");
    expect(plateCode).toContain("AI Biometrics");
    expect(plateCode).toContain("Heart Line");
    expect(plateCode).toContain("Head Line");
    expect(plateCode).toContain("Life Line");

    const modalCode = fs.readFileSync(path.resolve(__dirname, "../components/dossier-preview-modal.tsx"), "utf-8");
    expect(modalCode).toContain("Export Hastarekha PDF Dossier");
    expect(modalCode).toContain("Vedic Parchment");
    expect(modalCode).toContain("Clean White");
    expect(modalCode).toContain("Cosmic Void");
    expect(modalCode).toContain("Download Archival PDF (A4)");
  });
});

