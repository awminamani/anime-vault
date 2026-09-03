import type { Anime } from "@/lib/types";

/** "8.7" for MAL, "87%" for AniList. */
export function scoreLabel(a: Anime): string {
  if (a.score == null) return "—";
  return a.scoreSource === "mal" ? a.score.toFixed(2).replace(/\.?0+$/, "") : `${a.score}%`;
}

/** "2024 · 24 EP" style meta line. */
export function metaLine(a: Anime): string {
  const parts: string[] = [];
  if (a.year) parts.push(String(a.year));
  if (a.episodes) parts.push(`${a.episodes} EP`);
  return parts.join(" · ");
}
