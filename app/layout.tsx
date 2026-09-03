import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kitsune — Discover Your Next Obsession",
  description:
    "Trending anime, trailers in one click. Discover 20,000+ anime powered by AniList. No sign-up, no key.",
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
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/kitsune.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
