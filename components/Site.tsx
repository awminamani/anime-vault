"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Anime } from "@/lib/types";
import AnimeCard from "./AnimeCard";
import DetailModal from "./DetailModal";
import Starfield from "./Starfield";
import { GithubIcon, LogoMark, PlayIcon, SearchIcon, SectionIcon } from "./icons";

interface Props {
  spotlight: Anime[];
  trending: Anime[];
  popular: Anime[];
  movies: Anime[];
  topMal: Anime[];
}

function Skeleton({ count, rail = false }: { count: number; rail?: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div className={rail ? "skel" : "skel"} key={i}>
          <div className="skel-img shimmer" />
          <div className="skel-line shimmer" />
          <div className="skel-line short shimmer" />
        </div>
      ))}
    </>
  );
}

export default function Site({ spotlight, trending, popular, movies, topMal }: Props) {
  const [open, setOpen] = useState<Anime | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Anime[] | null>(null);
  const [searching, setSearching] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cursor glow follows the mouse (desktop only, cheap transform)
  useEffect(() => {
    const glow = document.getElementById("cursorGlow");
    if (!glow || window.matchMedia("(pointer: coarse)").matches) {
      if (glow) glow.style.display = "none";
      return;
    }
    const move = (e: MouseEvent) => {
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // Spotlight horizontal distance: needs a real px value from layout
  useEffect(() => {
    const track = document.getElementById("htrack");
    if (!track) return;
    const set = () =>
      track.style.setProperty(
        "--maxx",
        `${Math.max(0, track.scrollWidth - window.innerWidth + 64)}px`
      );
    set();
    window.addEventListener("resize", set);
    const t = setTimeout(set, 1500); // after banner images load
    return () => {
      window.removeEventListener("resize", set);
      clearTimeout(t);
    };
  }, []);

  // Debounced live search against our own API route (cached server-side)
  const onSearch = useCallback((value: string) => {
    setQ(value);
    if (debounce.current) clearTimeout(debounce.current);
    const query = value.trim();
    if (query.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setResults(json.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
  }, []);

  const clearSearch = () => {
    setQ("");
    setResults(null);
    setSearching(false);
  };

  const showSearch = results !== null || searching;
  const banner = spotlight.find((s) => s.banner) ?? spotlight[0];
  const heroPosters = trending.slice(0, 3);

  return (
    <>
      <div className="progress" aria-hidden="true" />
      <div className="cursor-glow" id="cursorGlow" aria-hidden="true" />

      <header className="nav">
        <a className="brand" href="#top" aria-label="AnimeVault home">
          <LogoMark />
          <span>
            Anime<b>Vault</b>
          </span>
        </a>
        <nav className="nav-links" aria-label="Sections">
          <a href="#spotlight">Spotlight</a>
          <a href="#trending">Trending</a>
          <a href="#popular">Popular</a>
          <a href="#movies">Movies</a>
          <a href="#mal">Top MAL</a>
        </nav>
        <div className="nav-search">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search 20,000+ anime…"
            autoComplete="off"
            aria-label="Search anime"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <Starfield />
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-inner">
            <p className="eyebrow">
              <span className="pulse-dot" /> Live data · AniList + MyAnimeList
            </p>
            <h1 className="hero-title">
              Discover your next
              <br />
              <span className="grad">obsession.</span>
            </h1>
            <p className="hero-sub">
              Trending series, top movies, trailers in one click — a vault of
              20,000+ anime with cinematic browsing. No sign-up, no key, just
              press play.
            </p>
            <div className="hero-cta">
              <a href="#trending" className="btn btn-primary">
                <PlayIcon /> Explore trending
              </a>
              <a href="#spotlight" className="btn btn-ghost">
                Spotlight reel
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <strong>20k+</strong>
                <span>titles indexed</span>
              </div>
              <div className="stat">
                <strong>2</strong>
                <span>free APIs, zero keys</span>
              </div>
              <div className="stat">
                <strong>60fps</strong>
                <span>native scroll FX</span>
              </div>
            </div>
          </div>
          <div className="hero-posters" aria-hidden="true">
            {heroPosters.map((a) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={a.id} src={a.cover} alt="" loading="eager" />
            ))}
          </div>
          <a className="scroll-hint" href="#spotlight" aria-label="Scroll to spotlight">
            <span />
          </a>
        </section>

        {/* SEARCH */}
        {showSearch && (
          <section className="section" id="search">
            <div className="section-head">
              <div>
                <p className="kicker">{searching ? "Searching…" : `${results?.length ?? 0} hits`}</p>
                <h2>
                  Results for “<span>{q.trim()}</span>”
                </h2>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={clearSearch}>
                Clear
              </button>
            </div>
            <div className="grid">
              {searching && results === null ? (
                <Skeleton count={6} />
              ) : (
                (results ?? []).map((a) => (
                  <AnimeCard key={a.id} anime={a} onOpen={setOpen} />
                ))
              )}
            </div>
            {!searching && results?.length === 0 && (
              <p className="muted" style={{ marginTop: 12 }}>
                Nothing found — try another title or spelling.
              </p>
            )}
          </section>
        )}

        {/* SPOTLIGHT */}
        {spotlight.length > 0 && (
          <section className="section" id="spotlight">
            <div className="section-head reveal">
              <div>
                <p className="kicker">Cinematic scroll</p>
                <h2>Spotlight reel</h2>
                <p className="muted">
                  Keep scrolling — the reel slides sideways while you move down.
                </p>
              </div>
            </div>
            <div className="hwrap" id="hwrap">
              <div className="hstage">
                <div className="htrack" id="htrack">
                  {spotlight.map((a, i) => (
                    <article
                      key={a.id}
                      className="spot"
                      onClick={() => setOpen(a)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="bg"
                        src={a.banner || a.cover}
                        alt=""
                        loading="lazy"
                      />
                      <div className="spot-veil" />
                      <span className="spot-num">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="spot-info">
                        <h3>{a.title}</h3>
                        <p>{a.synopsis}</p>
                        <div className="spot-tags">
                          {a.genres.map((g) => (
                            <span key={g} className="chip">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TRENDING */}
        <section className="section" id="trending">
          <div className="section-head reveal">
            <div>
              <p className="kicker">Updated live</p>
              <h2>Trending now</h2>
              <p className="muted">
                What the community is watching this week · via AniList
              </p>
            </div>
            <SectionIcon kind="trending" />
          </div>
          <div className="rail">
            {trending.length === 0 ? (
              <Skeleton count={6} rail />
            ) : (
              trending.map((a, i) => (
                <AnimeCard key={a.id} anime={a} rank={i + 1} onOpen={setOpen} />
              ))
            )}
          </div>
        </section>

        {/* POPULAR */}
        <section className="section" id="popular">
          <div className="section-head reveal">
            <div>
              <p className="kicker">All-time favourites</p>
              <h2>Most popular</h2>
              <p className="muted">The most-listed anime of all time · via AniList</p>
            </div>
            <SectionIcon kind="popular" />
          </div>
          <div className="grid">
            {popular.length === 0 ? (
              <Skeleton count={12} />
            ) : (
              popular.map((a) => (
                <AnimeCard key={a.id} anime={a} onOpen={setOpen} />
              ))
            )}
          </div>
        </section>

        {/* PARALLAX BANNER */}
        {banner?.banner && (
          <section className="banner" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner.banner} alt="" loading="lazy" />
            <div className="banner-veil" />
            <p className="banner-quote">“Every frame a painting.”</p>
          </section>
        )}

        {/* MOVIES */}
        <section className="section" id="movies">
          <div className="section-head reveal">
            <div>
              <p className="kicker">Big screen</p>
              <h2>Top movies</h2>
              <p className="muted">Highest-rated anime films · via AniList</p>
            </div>
            <SectionIcon kind="movies" />
          </div>
          <div className="grid">
            {movies.length === 0 ? (
              <Skeleton count={8} />
            ) : (
              movies.map((a) => (
                <AnimeCard key={a.id} anime={a} onOpen={setOpen} />
              ))
            )}
          </div>
        </section>

        {/* TOP MAL */}
        {topMal.length > 0 && (
          <section className="section" id="mal">
            <div className="section-head reveal">
              <div>
                <p className="kicker">MyAnimeList rankings</p>
                <h2>Top of MAL</h2>
                <p className="muted">
                  Legendary scores, straight from MyAnimeList · via Jikan{" "}
                  <span className="pill">fallback-safe</span>
                </p>
              </div>
              <SectionIcon kind="mal" />
            </div>
            <div className="rail">
              {topMal.map((a, i) => (
                <AnimeCard key={a.id} anime={a} rank={i + 1} onOpen={setOpen} />
              ))}
            </div>
          </section>
        )}

        {/* API STRIP */}
        <section className="section apis reveal">
          <div className="api-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
            <div>
              <strong>AniList GraphQL</strong>
              <span>Primary · search, trending, trailers · 90 req/min · no key</span>
            </div>
          </div>
          <div className="api-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <div>
              <strong>Jikan · MyAnimeList</strong>
              <span>MAL scores &amp; ranks · cached, retry-safe · no key</span>
            </div>
          </div>
          <div className="api-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <path d="M10 9l5 3-5 3z" />
            </svg>
            <div>
              <strong>YouTube embeds</strong>
              <span>Trailers play in-page, privacy-nocookie mode</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="foot-inner">
          <a className="brand" href="#top">
            <LogoMark size={26} />
            <span>
              Anime<b>Vault</b>
            </span>
          </a>
          <p>
            Data by <a href="https://anilist.co" rel="noopener">AniList</a> &amp;{" "}
            <a href="https://jikan.moe" rel="noopener">Jikan / MyAnimeList</a>.
            Trailers via YouTube. Static Next.js — no backend, no tracking.
          </p>
          <a
            className="gh"
            href="https://github.com/awminamani/anime-vault"
            rel="noopener"
            aria-label="GitHub repo"
          >
            <GithubIcon />
          </a>
        </div>
      </footer>

      <DetailModal anime={open} onClose={() => setOpen(null)} />
    </>
  );
}
