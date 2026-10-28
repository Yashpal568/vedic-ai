import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./light-mode-fix.css";
import "./light-theme.css";
import ThemeSync from "@/components/theme-sync";

export const metadata: Metadata = {
  title: { default: "Vedic AI — Your Personal Vedic Astrology Companion", template: "%s | Vedic AI" },
  description: "Explore your Vedic birth chart through a thoughtful AI astrology experience. Understand planetary placements, nakshatras, dashas, and traditional Jyotish concepts in one calm, conversational workspace.",
  applicationName: "Vedic AI",
  keywords: ["Vedic astrology", "Kundli", "Birth chart", "Jyotish", "Nakshatra", "AI astrologer", "Vimshottari dasha"],
  openGraph: {
    title: "Vedic AI — A clearer way to explore your kundli",
    description: "A premium, chat-first Vedic astrology experience built around structured birth-chart data and thoughtful explanations.",
    type: "website",
    siteName: "Vedic AI",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#10110f", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ThemeSync />{children}</body></html>;
}
