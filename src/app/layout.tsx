import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

/* Sports/Fitness pairing: Barlow Condensed for impact, Barlow for body.
   One family, two widths — headlines and text stay visibly related. */
const body = Barlow({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KickOff OS — Local eFootball League",
    template: "%s · KickOff OS",
  },
  description:
    "Tournament operating system for the Local eFootball League: fixtures, live standings, player stats and an AI match copilot.",
};

export const viewport: Viewport = {
  themeColor: "#0C0A0B",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="min-h-dvh">
        {/* Light through deep water; see .caustics in globals.css. */}
        <div className="caustics" aria-hidden />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
