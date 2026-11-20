import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./light-mode-fix.css";
import "./light-theme.css";
import "./kundli-report.css";
import ThemeSync from "@/components/theme-sync";
import { LanguageProvider } from "@/lib/i18n/language-context";
import WelcomeVoiceGreeting from "@/components/voice/welcome-voice-greeting";
import CelestialCosmicBackground from "@/components/celestial-cosmic-background";

export const metadata: Metadata = {
  title: { default: "Vedic AI — Your Personal Vedic Astrology Companion", template: "%s | Vedic AI" },
  description: "Explore your Vedic birth chart through a thoughtful AI astrology experience. Understand planetary placements, nakshatras, dashas, and traditional Jyotish concepts in one calm, conversational workspace.",
  applicationName: "Vedic AI",
  icons: { icon: "/vedic-ai-emblem.svg", shortcut: "/vedic-ai-emblem.svg", apple: "/vedic-ai-emblem.svg" },
  keywords: ["Vedic astrology", "Kundli", "Birth chart", "Jyotish", "Nakshatra", "AI astrologer", "Vimshottari dasha"],
  openGraph: {
    title: "Vedic AI — A clearer way to explore your kundli",
    description: "A premium, chat-first Vedic astrology experience built around structured birth-chart data and thoughtful explanations.",
    type: "website",
    siteName: "Vedic AI",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#11131a", colorScheme: "light dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var urlTheme = new URLSearchParams(window.location.search).get('theme');
                var saved = window.localStorage.getItem('vedic-chat-theme');
                var theme = urlTheme === 'light' || (urlTheme !== 'dark' && saved === 'light') ? 'light' : 'dark';
                document.documentElement.dataset.theme = theme;
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeSync />
        <LanguageProvider>
          <CelestialCosmicBackground />
          <WelcomeVoiceGreeting />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
