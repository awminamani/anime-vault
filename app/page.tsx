import { getSpotlight, getTrending, getTopMovies, getGenreCollection } from "@/lib/anilist";
import { getTopMal } from "@/lib/jikan";
import Site from "@/components/Site";

// Revalidate the whole page every 30 min; per-fetch caches govern the rest.
export const revalidate = 1800;

export default async function Page() {
  const [spotlight, trending, movies, topMal, genres] = await Promise.all([
    getSpotlight(7).catch(() => []),
    getTrending(12).catch(() => []),
    getTopMovies(12).catch(() => []),
    getTopMal(12), // never throws — returns [] on failure
    getGenreCollection().catch(() => [] as string[]),
  ]);

  return (
    <Site
      spotlight={spotlight}
      trending={trending}
      movies={movies}
      topMal={topMal}
      genres={genres}
    />
  );
}
