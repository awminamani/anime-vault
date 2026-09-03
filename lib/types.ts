// Shared domain types. AniList-first; Jikan only for MAL score/rank.

export interface Anime {
  id: string; // "anilist:21" or "mal:21"
  source: "anilist" | "mal";
  title: string;
  titleRomaji?: string;
  titleEnglish?: string;
  cover: string;
  banner?: string;
  score?: number; // 0-100 (AniList) or 0-10 (MAL, normalized on display)
  scoreSource: "anilist" | "mal";
  episodes?: number;
  year?: number;
  genres: string[];
  synopsis: string;
  trailerYoutubeId?: string;
  siteUrl: string;
  rank?: number; // MAL rank when from Jikan
}
