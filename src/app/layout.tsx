import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
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
  themeColor: "#E11D2A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-dvh">
        {/* Colour field the glass panes refract; see .aurora in globals.css. */}
        <div className="aurora" aria-hidden />
        {children}
      </body>
    </html>
  );
}
