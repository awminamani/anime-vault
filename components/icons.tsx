"use client";

import type { Anime } from "@/lib/types";
import { scoreLabel } from "./format";

export function StarIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
    </svg>
  );
}

export function PlayIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="brand-mark"
    >
      <defs>
        <linearGradient id="av-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#av-g)" />
      <path
        d="M16 6l2.6 6.9L26 14l-6.6 1.5L16 22l-3.4-6.5L6 14l7.4-1.1z"
        fill="#fff"
      />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function GithubIcon() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.9 10.9c.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C16.4 4.7 17.4 5 17.4 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
    </svg>
  );
}

export function SectionIcon({ kind }: { kind: "trending" | "popular" | "movies" | "mal" }) {
  const paths: Record<string, React.ReactNode> = {
    trending: (
      <>
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </>
    ),
    popular: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    ),
    movies: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M7 4v16M17 4v16M2 9h5M2 15h5M17 9h5M17 15h5" />
      </>
    ),
    mal: (
      <>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.7V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2.3" />
        <path d="M18 4H6v5a6 6 0 0 0 12 0V4z" />
      </>
    ),
  };
  return (
    <svg
      className="head-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[kind]}
    </svg>
  );
}

export function ScoreBadge({ anime }: { anime: Anime }) {
  if (anime.score == null) return null;
  return (
    <span className="card-score">
      <StarIcon />
      {scoreLabel(anime)}
    </span>
  );
}
