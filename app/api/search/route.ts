import { NextResponse } from "next/server";
import { searchAnime } from "@/lib/anilist";
import { bestScore } from "@/lib/fuzzy";

const SORTS = new Set(["POPULARITY_DESC", "SCORE_DESC", "TRENDING_DESC", "TITLE_ENGLISH"]);
const FORMATS = new Set(["TV", "MOVIE", "OVA", "ONA", "SPECIAL", "MUSIC"]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const genre = searchParams.get("genre") || undefined;
  const format = searchParams.get("format") || undefined;
  const sortParam = searchParams.get("sort") || "POPULARITY_DESC";
  const sort = SORTS.has(sortParam) ? [sortParam] : ["POPULARITY_DESC"];
  const yearRaw = Number(searchParams.get("year"));
  const year = yearRaw >= 1970 && yearRaw <= 2030 ? yearRaw : undefined;

  if (q.length < 2 && !genre && !format && !year) {
    return NextResponse.json({ results: [], hasNextPage: false });
  }
  if (format && !FORMATS.has(format)) {
    return NextResponse.json({ results: [], error: "Bad format" }, { status: 400 });
  }
  try {
    const { items, hasNextPage } = await searchAnime(q || "", {
      page,
      perPage: 24,
      genre,
      format,
      sort,
      year,
    });
    // Fuzzy re-rank on page 1 of text searches so the obvious match leads
    let results = items;
    if (q && page === 1) {
      results = [...items]
        .map((a) => ({
          a,
          s: bestScore(q, [a.title, a.titleRomaji || "", a.titleEnglish || ""].filter(Boolean)),
        }))
        .sort((x, y) => y.s - x.s || (y.a.score ?? 0) - (x.a.score ?? 0))
        .map((x) => x.a);
    }
    return NextResponse.json({ results, hasNextPage });
  } catch (e) {
    return NextResponse.json(
      { results: [], error: e instanceof Error ? e.message : "Search failed" },
      { status: 502 }
    );
  }
}
