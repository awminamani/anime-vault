# Kitsune

Discover your next obsession — trending anime, top movies, trailers in one click.

A cinematic, scroll-driven anime discovery site powered by **two free APIs, zero keys**:

| Source | Role | Quota |
|---|---|---|
| [AniList GraphQL](https://anilist.co) | Primary — search, trending, popular, movies, trailers | 90 req/min, no key |
| [Jikan / MyAnimeList](https://jikan.moe) | Top-MAL rankings only | 3 req/sec, no key, retry-safe |

## Features

- **Hero** — canvas starfield, floating posters, scroll hint
- **Spotlight reel** — sticky horizontal-scroll showcase driven by native CSS `animation-timeline`
- **Trending / Popular / Top movies** — live from AniList, ISR-cached
- **Top of MAL** — Jikan with timeout + retry; section hides gracefully if MAL is down
- **Live search** — debounced, hits a cached `/api/search` route
- **Detail modal** — banner, cover, score, genres, synopsis, in-page YouTube trailer (privacy-nocookie)
- **Motion** — scroll progress bar, scroll reveals, parallax banner, card hover physics, cursor glow, spring modal
- **Zero emoji icons** — all inline SVG

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm start
```

## Deploy on Vercel

Import `awminamani/anime-vault` → Deploy. No env vars, no config — the framework preset handles everything.

## API resilience

- AniList fetches run **server-side** with `next: { revalidate }` (30 min trending/search, 24 h movies/spotlight/MAL), so onecold load fans out to 5 cached fetches and browsers never hit rate limits directly.
- Jikan 504/429/503 → one retry, then `[]` — the MAL section hides instead of erroring.
- AniList 429 → one polite retry after 1.5 s.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · native CSS scroll animations · no animation libs · no UI framework.
