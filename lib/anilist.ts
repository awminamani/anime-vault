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
    titleRomaji: m.title?.romaji || undefined,
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

interface PageResult {
  media: AniMedia[];
  hasNextPage: boolean;
}

async function fetchPage(
  queryText: string,
  variables: Record<string, unknown>,
  revalidateSeconds = 3600
): Promise<PageResult> {
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
      return {
        media: json?.data?.Page?.media ?? [],
        hasNextPage: json?.data?.Page?.pageInfo?.hasNextPage ?? false,
      };
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    }
  }
  throw lastErr;
}

const LIST_BASE = `
  query (__VARDEFS__) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(__MEDIAARGS__) {
        __FIELDS__
      }
    }
  }
`;

function buildListQuery(o: {
  sort?: string[];
  format?: string;
  genre?: string;
  year?: number;
  status?: string;
  search?: string;
}): { text: string; variables: Record<string, unknown> } {
  // AniList treats explicit null filters as "match nothing" (empty media),
  // so only declare + send args that are actually set. Root cause of the
  // all-empty-sections bug.
  const varDefs = ["$page: Int", "$perPage: Int"];
  const mediaArgs = ["type: ANIME", "isAdult: false"];
  const variables: Record<string, unknown> = {};
  if (o.sort?.length) {
    varDefs.push("$sort: [MediaSort]");
    mediaArgs.push("sort: $sort");
    variables.sort = o.sort;
  }
  if (o.format) {
    varDefs.push("$format: MediaFormat");
    mediaArgs.push("format: $format");
    variables.format = o.format;
  }
  if (o.genre) {
    varDefs.push("$genre: String");
    mediaArgs.push("genre: $genre");
    variables.genre = o.genre;
  }
  if (o.year) {
    varDefs.push("$year: Int");
    mediaArgs.push("seasonYear: $year");
    variables.year = o.year;
  }
  if (o.status) {
    varDefs.push("$status: MediaStatus");
    mediaArgs.push("status: $status");
    variables.status = o.status;
  }
  if (o.search) {
    varDefs.push("$q: String");
    mediaArgs.push("search: $q");
    variables.q = o.search;
  }
  const text = LIST_BASE.replace("__VARDEFS__", varDefs.join(", "))
    .replace("__MEDIAARGS__", mediaArgs.join(", "))
    .replace("__FIELDS__", MEDIA_FIELDS);
  return { text, variables };
}

export interface BrowseOpts {
  page?: number;
  perPage?: number;
  sort?: string[];
  format?: string;
  genre?: string;
  year?: number;
  status?: string;
  revalidate?: number;
}

export async function browseAnime(
  o: BrowseOpts = {}
): Promise<{ items: Anime[]; hasNextPage: boolean }> {
  const { text, variables } = buildListQuery({
    sort: o.sort ?? ["POPULARITY_DESC"],
    format: o.format,
    genre: o.genre,
    year: o.year,
    status: o.status,
  });
  const { media, hasNextPage } = await fetchPage(
    text,
    { page: o.page ?? 1, perPage: o.perPage ?? 18, ...variables },
    o.revalidate ?? 3600
  );
  return { items: media.map(toAnime), hasNextPage };
}

export async function getTrending(perPage = 12): Promise<Anime[]> {
  const { items } = await browseAnime(
    {
      perPage,
      sort: ["TRENDING_DESC", "POPULARITY_DESC"],
      revalidate: 1800, // 30 min — trending moves
    }
  );
  return items;
}

export async function getTopMovies(perPage = 12): Promise<Anime[]> {
  const { items } = await browseAnime(
    { perPage, sort: ["SCORE_DESC"], format: "MOVIE", revalidate: 86400 }
  );
  return items;
}

export async function getSpotlight(perPage = 7): Promise<Anime[]> {
  // High-score titles with banners for the cinematic reel
  const { text, variables } = buildListQuery({
    sort: ["SCORE_DESC", "POPULARITY_DESC"],
  });
  const { media } = await fetchPage(
    text,
    { page: 1, perPage: perPage + 6, ...variables },
    86400
  );
  const withBanners = media.filter((m) => m.bannerImage);
  return (withBanners.length >= 5 ? withBanners : media)
    .slice(0, perPage)
    .map(toAnime);
}

export interface SearchOpts {
  page?: number;
  perPage?: number;
  genre?: string;
  format?: string;
  sort?: string[];
  year?: number;
}

export async function searchAnime(
  q: string,
  o: SearchOpts = {}
): Promise<{ items: Anime[]; hasNextPage: boolean }> {
  const { text, variables } = buildListQuery({
    sort: o.sort ?? ["POPULARITY_DESC"],
    genre: o.genre,
    format: o.format,
    year: o.year,
    search: q || undefined,
  });
  const { media, hasNextPage } = await fetchPage(
    text,
    { page: o.page ?? 1, perPage: o.perPage ?? 18, ...variables },
    600
  );
  return { items: media.map(toAnime), hasNextPage };
}

/** Full genre list for filter UI. Cached a week — it barely changes. */
export async function getGenreCollection(): Promise<string[]> {
  let lastErr: unknown = new Error("AniList unreachable");
  for (let attempt = 0; attempt < 3; attempt++) {
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
          body: JSON.stringify({ query: "{ GenreCollection }" }),
          signal: controller.signal,
          next: { revalidate: 604800 },
        } as RequestInit & { next: { revalidate: number } }
      );
      clearTimeout(timer);
      if (!res.ok) throw new Error(`AniList ${res.status}`);
      const json = await res.json();
      const list = (json?.data?.GenreCollection ?? []) as string[];
      return list.filter((g) => g !== "Hentai");
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    }
  }
  throw lastErr;
}
