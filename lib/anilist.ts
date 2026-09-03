// AniList GraphQL client — primary data source.
// Free, no key, 90 req/min. Server-side fetch with ISR-style cache.

import type { Anime } from "./types";

const ENDPOINT = "https://graphql.anilist.co";

const MEDIA_FIELDS = `
  id
  title { romaji english }
  coverImage { extraLarge large }
  bannerImage
  averageScore
  episodes
  seasonYear
  genres
  description(asHtml: false)
  trailer { id site }
  siteUrl
`;

interface AniMedia {
  id: number;
  title: { romaji?: string; english?: string };
  coverImage?: { extraLarge?: string; large?: string };
  bannerImage?: string;
  averageScore?: number;
  episodes?: number;
  seasonYear?: number;
  genres?: string[];
  description?: string;
  trailer?: { id?: string; site?: string };
  siteUrl?: string;
}

function toAnime(m: AniMedia): Anime {
  const title = m.title?.english || m.title?.romaji || "Unknown";
  return {
    id: `anilist:${m.id}`,
    source: "anilist",
    title,
    cover: m.coverImage?.extraLarge || m.coverImage?.large || "",
    banner: m.bannerImage || undefined,
    score: m.averageScore || undefined,
    scoreSource: "anilist",
    episodes: m.episodes || undefined,
    year: m.seasonYear || undefined,
    genres: (m.genres || []).slice(0, 4),
    synopsis: (m.description || "").replace(/<[^>]*>/g, "").slice(0, 300),
    trailerYoutubeId:
      m.trailer?.site === "youtube" ? m.trailer.id : undefined,
    siteUrl: m.siteUrl || `https://anilist.co/anime/${m.id}`,
  };
}

async function query(
  queryText: string,
  variables: Record<string, unknown>,
  revalidateSeconds = 3600
): Promise<AniMedia[]> {
  const body = JSON.stringify({ query: queryText, variables });
  let lastErr: unknown = new Error("AniList unreachable");
  // AniList route from some networks is flaky (first attempt often times
  // out) — retry with backoff. ISR cache means this runs rarely.
  for (let attempt = 0; attempt < 4; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(
        ENDPOINT,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body,
          signal: controller.signal,
          next: { revalidate: revalidateSeconds },
        } as RequestInit & { next: { revalidate: number } }
      );
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`AniList ${res.status}`);
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`AniList ${res.status}`);
      const json = await res.json();
      if (json.errors?.length)
        throw new Error(
          json.errors.map((e: { message: string }) => e.message).join("; ")
        );
      return json?.data?.Page?.media ?? [];
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    }
  }
  throw lastErr;
}

const LIST_QUERY = `
  query ($perPage: Int, $sort: [MediaSort], $format: MediaFormat) {
    Page(perPage: $perPage) {
      media(type: ANIME, sort: $sort, format: $format, isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

export async function getTrending(perPage = 12): Promise<Anime[]> {
  const media = await query(
    LIST_QUERY,
    { perPage, sort: ["TRENDING_DESC", "POPULARITY_DESC"] },
    1800 // 30 min — trending moves
  );
  return media.map(toAnime);
}

export async function getPopular(perPage = 12): Promise<Anime[]> {
  const media = await query(LIST_QUERY, {
    perPage,
    sort: ["POPULARITY_DESC"],
  });
  return media.map(toAnime);
}

export async function getTopMovies(perPage = 8): Promise<Anime[]> {
  const media = await query(
    LIST_QUERY,
    { perPage, sort: ["SCORE_DESC"], format: "MOVIE" },
    86400 // 24h — movies barely move
  );
  return media.map(toAnime);
}

export async function getSpotlight(perPage = 8): Promise<Anime[]> {
  // High-score recent TV with banners for the cinematic reel
  const media = await query(
    LIST_QUERY,
    { perPage: perPage + 6, sort: ["SCORE_DESC", "POPULARITY_DESC"] },
    86400
  );
  const withBanners = media.filter((m) => m.bannerImage);
  return (withBanners.length >= 5 ? withBanners : media)
    .slice(0, perPage)
    .map(toAnime);
}

const SEARCH_QUERY = `
  query ($q: String, $perPage: Int) {
    Page(perPage: $perPage) {
      media(search: $q, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

export async function searchAnime(q: string, perPage = 12): Promise<Anime[]> {
  const media = await query(SEARCH_QUERY, { q, perPage }, 600);
  return media.map(toAnime);
}
