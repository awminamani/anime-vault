import { NextResponse } from "next/server";
import { browseAnime } from "@/lib/anilist";

const SORTS = new Set(["POPULARITY_DESC", "SCORE_DESC", "TRENDING_DESC", "FAVOURITES_DESC"]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const sortParam = searchParams.get("sort") || "POPULARITY_DESC";
  const sort = SORTS.has(sortParam) ? [sortParam, "POPULARITY_DESC"] : ["POPULARITY_DESC"];
  const genre = searchParams.get("genre") || undefined;
  const format = searchParams.get("format") || undefined;
  try {
    const { items, hasNextPage } = await browseAnime({
      page,
      perPage: 24,
      sort,
      genre,
      format,
    });
    return NextResponse.json({ results: items, hasNextPage });
  } catch (e) {
    return NextResponse.json(
      { results: [], error: e instanceof Error ? e.message : "Browse failed" },
      { status: 502 }
    );
  }
}
