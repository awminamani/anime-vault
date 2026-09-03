// Jikan (MyAnimeList) client — used ONLY for Top-MAL rankings.
// Jikan is flaky by design (MAL scraper, random 504s), so: short timeout,
// one retry, and callers must tolerate total failure (section hides itself).

import type { Anime } from "./types";

const BASE = "https://api.jikan.moe/v4";

interface JikanItem {
  mal_id: number;
  url: string;
  title: string;
  title_english?: string;
  images?: { jpg?: { large_image_url?: string; image_url?: string } };
  score?: number;
  rank?: number;
  episodes?: number;
  year?: number;
  aired?: { prop?: { from?: { year?: number } } };
  genres?: { name: string }[];
  synopsis?: string;
  trailer?: { youtube_id?: string };
}

function toAnime(item: JikanItem): Anime {
  return {
    id: `mal:${item.mal_id}`,
    source: "mal",
    title: item.title_english || item.title,
    cover:
      item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || "",
    score: item.score || undefined,
    scoreSource: "mal",
    episodes: item.episodes || undefined,
    year: item.year || item.aired?.prop?.from?.year || undefined,
    genres: (item.genres || []).map((g) => g.name).slice(0, 4),
    synopsis: (item.synopsis || "").slice(0, 300),
    trailerYoutubeId: item.trailer?.youtube_id || undefined,
    siteUrl: item.url,
    rank: item.rank || undefined,
  };
}

async function fetchOnce(url: string, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 86400 }, // 24h — MAL top barely moves
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Returns [] on any failure — the section hides instead of erroring. */
export async function getTopMal(limit = 10): Promise<Anime[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchOnce(`${BASE}/top/anime?limit=${limit}&sfw=true`);
      if (res.status === 504 || res.status === 429 || res.status === 503) {
        await new Promise((r) => setTimeout(r, 2000));
        continue; // known Jikan flakiness — retry once
      }
      if (!res.ok) return [];
      const json = await res.json();
      const data = (json?.data || []) as JikanItem[];
      return data.map(toAnime);
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      return [];
    }
  }
  return [];
}
