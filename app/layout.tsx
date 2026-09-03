import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnimeVault — Discover Your Next Obsession",
  description:
    "Trending anime, top movies, trailers in one click. A vault of 20,000+ anime powered by AniList + Jikan. No sign-up, no key.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%238b5cf6'/%3E%3Cstop offset='1' stop-color='%2306b6d4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='8' fill='url(%23g)'/%3E%3Cpath d='M16 6l2.6 6.9L26 14l-6.6 1.5L16 22l-3.4-6.5L6 14l7.4-1.1z' fill='white'/%3E%3C/svg%3E"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
