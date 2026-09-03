import { getSpotlight, getTrending, getPopular, getTopMovies } from "@/lib/anilist";
import { getTopMal } from "@/lib/jikan";
import Site from "@/components/Site";

// Revalidate the whole page every 30 min; per-fetch caches govern the rest.
export const revalidate = 1800;

export default async function Page() {
  const [spotlight, trending, popular, movies, topMal] = await Promise.all([
    getSpotlight(8).catch(() => []),
    getTrending(12).catch(() => []),
    getPopular(12).catch(() => []),
    getTopMovies(8).catch(() => []),
    getTopMal(10), // never throws — returns [] on failure
  ]);

  return (
    <Site
      spotlight={spotlight}
      trending={trending}
      popular={popular}
      movies={movies}
      topMal={topMal}
    />
  );
}
