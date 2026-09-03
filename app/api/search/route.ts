import { NextResponse } from "next/server";
import { searchAnime } from "@/lib/anilist";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });
  try {
    const results = await searchAnime(q, 12);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { results: [], error: e instanceof Error ? e.message : "Search failed" },
      { status: 502 }
    );
  }
}
