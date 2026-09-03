import { getTrending, getGenreCollection } from "@/lib/anilist";
import Site from "@/components/Site";

// Revalidate the whole page every 30 min; per-fetch caches govern the rest.
export const revalidate = 1800;

export default async function Page() {
  const [trending, genres] = await Promise.all([
    getTrending(12).catch(() => []),
    getGenreCollection().catch(() => [] as string[]),
  ]);

  return <Site trending={trending} genres={genres} />;
}
