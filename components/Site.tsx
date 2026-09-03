"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Anime } from "@/lib/types";
import AnimeCard from "./AnimeCard";
import DetailModal from "./DetailModal";
import Starfield from "./Starfield";
import { useSentinel } from "./useInfinite";
import {
  CompassIcon,
  HomeIcon,
  LogoMark,
  SearchIcon,
  SlidersIcon,
} from "./icons";

interface Props {
  trending: Anime[];
  genres: string[];
}

interface Filters {
  genre: string;
  format: string;
  sort: string;
  year: string;
}

const EMPTY_F: Filters = { genre: "", format: "", sort: "POPULARITY_DESC", year: "" };
const FORMATS = ["TV", "MOVIE", "OVA", "ONA", "SPECIAL"];
const SORTS = [
  { v: "POPULARITY_DESC", l: "Popular" },
  { v: "SCORE_DESC", l: "Top rated" },
  { v: "TRENDING_DESC", l: "Trending" },
  { v: "TITLE_ENGLISH", l: "A–Z" },
];
// Sorts supported by /api/browse (explore feed)
const EXPLORE_SORTS = [
  { v: "POPULARITY_DESC", l: "Popular" },
  { v: "SCORE_DESC", l: "Top rated" },
  { v: "TRENDING_DESC", l: "Trending" },
  { v: "FAVOURITES_DESC", l: "Most loved" },
];
const FALLBACK_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy",
  "Horror", "Mahou Shoujo", "Mecha", "Music", "Mystery",
  "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports",
  "Supernatural", "Thriller",
];
const QUICK_GENRES = ["Action", "Romance", "Fantasy", "Thriller", "Comedy", "Horror", "Sci-Fi", "Drama"];

const activeCount = (f: Filters) => (f.genre ? 1 : 0) + (f.format ? 1 : 0) + (f.year ? 1 : 0);
const wantsSearch = (q: string, f: Filters) =>
  q.trim().length >= 2 || !!f.genre || !!f.format || !!f.year;

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  return sp.toString();
}

export default function Site({ trending, genres }: Props) {
  const [open, setOpen] = useState<Anime | null>(null);

  // ---- search (hero console) ----
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_F);
  const [adv, setAdv] = useState(false);
  const [allGenres, setAllGenres] = useState(false);
  const [results, setResults] = useState<Anime[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchMore, setSearchMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeq = useRef(0);

  const runSearch = useCallback(async (query: string, f: Filters, page: number, append: boolean) => {
    const seq = ++searchSeq.current;
    if (append) setLoadingMore(true);
    else setSearching(true);
    try {
      const res = await fetch(
        `/api/search?${qs({ q: query.trim() || undefined, page, genre: f.genre || undefined, format: f.format || undefined, sort: f.sort, year: f.year || undefined })}`
      );
      const json = await res.json();
      if (seq !== searchSeq.current) return; // stale
      setResults((prev) => (append ? [...prev, ...(json.results ?? [])] : (json.results ?? [])));
      setSearchPage(page);
      setSearchMore(!!json.hasNextPage);
    } catch {
      if (seq !== searchSeq.current) return;
      if (!append) setResults([]);
      setSearchMore(false);
    } finally {
      if (seq === searchSeq.current) {
        setSearching(false);
        setLoadingMore(false);
      }
    }
  }, []);

  const onType = useCallback(
    (value: string) => {
      setQ(value);
      if (debounce.current) clearTimeout(debounce.current);
      if (!wantsSearch(value, filters)) {
        setResults([]);
        setSearchMore(false);
        setSearching(false);
        return;
      }
      setSearching(true);
      debounce.current = setTimeout(() => runSearch(value, filters, 1, false), 450);
    },
    [filters, runSearch]
  );

  const applyFilters = (f: Filters) => {
    setFilters(f);
    setAdv(false);
    if (wantsSearch(q, f)) runSearch(q, f, 1, false);
    else {
      setResults([]);
      setSearchMore(false);
    }
  };

  const showResults = wantsSearch(q, filters);

  const loadMoreSearch = useCallback(() => {
    if (loadingMore || searching || !searchMore) return;
    runSearch(q, filters, searchPage + 1, true);
  }, [loadingMore, searching, searchMore, runSearch, q, filters, searchPage]);
  const searchSentinel = useSentinel(loadMoreSearch, showResults && searchMore && !searching);

  // ---- explore (single infinite feed, driven by the same genre state) ----
  const [eSort, setESort] = useState("POPULARITY_DESC");
  const [eItems, setEItems] = useState<Anime[]>([]);
  const [ePage, setEPage] = useState(1);
  const [eMore, setEMore] = useState(true);
  const [eLoading, setELoading] = useState(false);
  const [eFirst, setEFirst] = useState(true);
  const exploreSeq = useRef(0);

  const loadExplore = useCallback(async (genre: string, sort: string, page: number, append: boolean) => {
    const seq = ++exploreSeq.current;
    if (append) setELoading(true);
    else setEFirst(true);
    try {
      const res = await fetch(`/api/browse?${qs({ page, genre: genre || undefined, sort })}`);
      const json = await res.json();
      if (seq !== exploreSeq.current) return;
      setEItems((prev) => (append ? [...prev, ...(json.results ?? [])] : (json.results ?? [])));
      setEPage(page);
      setEMore(!!json.hasNextPage);
    } catch {
      if (seq !== exploreSeq.current) return;
      if (!append) setEItems([]);
      setEMore(false);
    } finally {
      if (seq === exploreSeq.current) {
        setELoading(false);
        setEFirst(false);
      }
    }
  }, []);

  // One feed: reload whenever the shared genre or explore sort changes.
  useEffect(() => {
    loadExplore(filters.genre, eSort, 1, false);
  }, [filters.genre, eSort, loadExplore]);

  const loadMoreExplore = useCallback(() => {
    if (eLoading || eFirst || !eMore) return;
    loadExplore(filters.genre, eSort, ePage + 1, true);
  }, [eLoading, eFirst, eMore, loadExplore, filters.genre, eSort, ePage]);
  const exploreSentinel = useSentinel(loadMoreExplore, eMore && !eFirst);

  // ---- cursor glow (fine pointers only) ----
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

  // ---- reveal-on-scroll (transform only — never leaves cards half-faded) ----
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.in)");
    if (els.length === 0) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [trending.length, showResults]);

  // ---- lock scroll when sheet open ----
  useEffect(() => {
    document.body.style.overflow = adv ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [adv]);

  useEffect(() => {
    if (!adv) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAdv(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [adv]);

  // ---- nav: transparent over the hero (seamless), glass once scrolled ----
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const genreList = genres.length > 0 ? genres : FALLBACK_GENRES;
  // Rotating hero banners — varied artwork, never one image on loop.
  const heroBanners = trending
    .map((a) => a.banner)
    .filter((b): b is string => !!b)
    .filter((b, i, arr) => arr.indexOf(b) === i)
    .slice(0, 6);

  return (
    <>
      <div className="cursor-glow" id="cursorGlow" aria-hidden="true" />

      <header className={scrolled ? "nav scrolled" : "nav"}>
        <a className="brand" href="#top" aria-label="AnimeVault home">
          <LogoMark />
          <span>
            Anime<b>Vault</b>
          </span>
        </a>
        <nav className="anchors" aria-label="Sections">
          <a href="#trending">Trending</a>
          <a href="#explore">Explore</a>
        </nav>
        <a
          className="ghlink"
          href="https://github.com/awminamani/anime-vault"
          rel="noopener"
          aria-label="GitHub repo"
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.9 10.9c.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C16.4 4.7 17.4 5 17.4 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
          </svg>
        </a>
      </header>

      <main id="top">
        {/* SEARCH CONSOLE */}
        <section className="console">
          <Starfield />
          <HeroBg banners={heroBanners} />
          <div className="orbs" aria-hidden="true">
            <span className="orb orb-a" />
            <span className="orb orb-b" />
          </div>
          <div className="console-veil" aria-hidden="true" />
          <div className="console-inner">
            <p className="console-kicker">What are you in the mood for?</p>
            <div className="searchbar">
              <SearchIcon />
              <input
                type="search"
                placeholder="Search anime… try “frieren”"
                autoComplete="off"
                aria-label="Search anime"
                value={q}
                onChange={(e) => onType(e.target.value)}
              />
              <button
                className={activeCount(filters) > 0 ? "advbtn has" : "advbtn"}
                onClick={() => setAdv(true)}
                aria-label="Advanced search"
              >
                <SlidersIcon />
                {activeCount(filters) > 0 && <span className="count">{activeCount(filters)}</span>}
              </button>
            </div>
            <div className="quickchips">
              {QUICK_GENRES.map((g) => (
                <button
                  key={g}
                  className={filters.genre === g ? "qchip on" : "qchip"}
                  onClick={() =>
                    applyFilters({ ...filters, genre: filters.genre === g ? "" : g })
                  }
                >
                  {g}
                </button>
              ))}
              <button
                className={allGenres ? "qchip more on" : "qchip more"}
                onClick={() => setAllGenres((v) => !v)}
                aria-expanded={allGenres}
              >
                {allGenres ? "Less ✕" : "All genres ▾"}
              </button>
            </div>
            {allGenres && (
              <div className="genrecloud full">
                {genreList
                  .filter((g) => !QUICK_GENRES.includes(g))
                  .map((g) => (
                    <button
                      key={g}
                      className={filters.genre === g ? "gchip sm on" : "gchip sm"}
                      onClick={() =>
                        applyFilters({ ...filters, genre: filters.genre === g ? "" : g })
                      }
                    >
                      {g}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* SEARCH RESULTS */}
        {showResults && (
          <section className="section slim" id="results">
            <div className="results-meta">
              <h2>{searching && results.length === 0 ? "Searching…" : `${results.length}${searchMore ? "+" : ""} found`}</h2>
              {(q.trim() || activeCount(filters) > 0) && (
                <button
                  className="clearbtn"
                  onClick={() => {
                    setQ("");
                    setFilters(EMPTY_F);
                    setResults([]);
                    setSearchMore(false);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            {(activeCount(filters) > 0 || filters.sort !== "POPULARITY_DESC") && (
              <div className="actives">
                {filters.genre && (
                  <button className="apill" onClick={() => applyFilters({ ...filters, genre: "" })}>
                    {filters.genre} ✕
                  </button>
                )}
                {filters.format && (
                  <button className="apill" onClick={() => applyFilters({ ...filters, format: "" })}>
                    {filters.format} ✕
                  </button>
                )}
                {filters.year && (
                  <button className="apill" onClick={() => applyFilters({ ...filters, year: "" })}>
                    {filters.year} ✕
                  </button>
                )}
              </div>
            )}
            <div className="grid">
              {searching && results.length === 0 ? (
                <SkeletonGrid count={12} />
              ) : (
                results.map((a) => <AnimeCard key={a.id} anime={a} onOpen={setOpen} />)
              )}
            </div>
            {loadingMore && (
              <div className="grid" style={{ marginTop: 20 }}>
                <SkeletonGrid count={8} />
              </div>
            )}
            {!searching && !loadingMore && results.length === 0 && (
              <p className="empty">Nothing found — try another title or loosen the filters.</p>
            )}
            {!searchMore && results.length > 0 && <p className="endmark">— end —</p>}
            <div ref={searchSentinel} className="sentinel" aria-hidden="true" />
          </section>
        )}

        {/* TRENDING */}
        <section className="section slim" id="trending">
          <div className="sechead reveal">
            <h2>Trending now</h2>
          </div>
          <div className="rail">
            {trending.length === 0 ? (
              <SkeletonRail count={6} />
            ) : (
              trending.map((a, i) => (
                <AnimeCard key={a.id} anime={a} rank={i + 1} onOpen={setOpen} />
              ))
            )}
          </div>
        </section>

        {/* EXPLORE — the one infinite feed */}
        <section className="section slim" id="explore">
          <div className="sechead explore-head reveal">
            <h2>Explore{filters.genre ? ` · ${filters.genre}` : ""}</h2>
            {filters.genre && (
              <button className="clearbtn" onClick={() => applyFilters({ ...filters, genre: "" })}>
                Clear ✕
              </button>
            )}
          </div>
          <div className="sortpills">
            {EXPLORE_SORTS.map((s) => (
              <button
                key={s.v}
                className={eSort === s.v ? "spill on" : "spill"}
                onClick={() => setESort(s.v)}
              >
                {s.l}
              </button>
            ))}
          </div>
          <div className="grid feed">
            {eFirst ? (
              <SkeletonGrid count={12} />
            ) : (
              eItems.map((a) => <AnimeCard key={a.id} anime={a} onOpen={setOpen} />)
            )}
          </div>
          {eLoading && (
            <div className="grid feed" style={{ marginTop: 20 }}>
              <SkeletonGrid count={8} />
            </div>
          )}
          {!eFirst && eItems.length === 0 && <p className="empty">Nothing here yet.</p>}
          {!eMore && eItems.length > 0 && <p className="endmark">— end —</p>}
          <div ref={exploreSentinel} className="sentinel" aria-hidden="true" />
        </section>
      </main>

      {/* mobile bottom nav — anchor jumps on the single page */}
      <nav className="bottomnav" aria-label="Sections">
        <a className="bnav" href="#top">
          <SearchIcon />
          <span>Search</span>
        </a>
        <a className="bnav" href="#trending">
          <HomeIcon />
          <span>Trending</span>
        </a>
        <a className="bnav" href="#explore">
          <CompassIcon />
          <span>Explore</span>
        </a>
      </nav>

      {/* ADVANCED SHEET */}
      {adv && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setAdv(false)}>
          <AdvancedSheet
            initial={filters}
            genres={genreList}
            onApply={applyFilters}
            onClose={() => setAdv(false)}
          />
        </div>
      )}

      <DetailModal anime={open} onClose={() => setOpen(null)} />
    </>
  );
}

/** Rotating hero backdrop — crossfades through varied banners, never one image on loop. */
function HeroBg({ banners }: { banners: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 7000);
    return () => clearInterval(t);
  }, [banners.length]);
  if (banners.length === 0) return null;
  return (
    <>
      {banners.map((b, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${b}-${i}`}
          src={b}
          alt=""
          aria-hidden="true"
          className={i === idx ? "console-bgimg on" : "console-bgimg"}
        />
      ))}
    </>
  );
}

function SkeletonGrid({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div className="skel" key={i}>
          <div className="skel-img shimmer" />
          <div className="skel-line shimmer" />
          <div className="skel-line short shimmer" />
        </div>
      ))}
    </>
  );
}

function SkeletonRail({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div className="skel" key={i} style={{ width: 190, flex: "0 0 auto" }}>
          <div className="skel-img shimmer" />
          <div className="skel-line shimmer" />
          <div className="skel-line short shimmer" />
        </div>
      ))}
    </>
  );
}

function AdvancedSheet({
  initial,
  genres,
  onApply,
  onClose,
}: {
  initial: Filters;
  genres: string[];
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Filters>(initial);
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Advanced search">
      <div className="sheet-grip" aria-hidden="true" />
      <div className="sheet-head">
        <h3>Refine search</h3>
        <button className="clearbtn" onClick={onClose}>
          Close
        </button>
      </div>

      <p className="sheet-label">Genre</p>
      <div className="fpills scroll">
        <button
          className={!draft.genre ? "fpill on" : "fpill"}
          onClick={() => setDraft({ ...draft, genre: "" })}
        >
          Any
        </button>
        {genres.map((g) => (
          <button
            key={g}
            className={draft.genre === g ? "fpill on" : "fpill"}
            onClick={() => setDraft({ ...draft, genre: draft.genre === g ? "" : g })}
          >
            {g}
          </button>
        ))}
      </div>

      <p className="sheet-label">Format</p>
      <div className="fpills">
        <button
          className={!draft.format ? "fpill on" : "fpill"}
          onClick={() => setDraft({ ...draft, format: "" })}
        >
          Any
        </button>
        {FORMATS.map((f) => (
          <button
            key={f}
            className={draft.format === f ? "fpill on" : "fpill"}
            onClick={() => setDraft({ ...draft, format: draft.format === f ? "" : f })}
          >
            {f}
          </button>
        ))}
      </div>

      <p className="sheet-label">Sort by</p>
      <div className="fpills">
        {SORTS.map((s) => (
          <button
            key={s.v}
            className={draft.sort === s.v ? "fpill on" : "fpill"}
            onClick={() => setDraft({ ...draft, sort: s.v })}
          >
            {s.l}
          </button>
        ))}
      </div>

      <p className="sheet-label">Year</p>
      <input
        className="yearinput"
        type="number"
        inputMode="numeric"
        min={1970}
        max={2030}
        placeholder="Any year — e.g. 2024"
        value={draft.year}
        onChange={(e) => setDraft({ ...draft, year: e.target.value.replace(/\D/g, "").slice(0, 4) })}
      />

      <div className="sheet-foot">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setDraft(EMPTY_F);
          }}
        >
          Reset
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            const y = Number(draft.year);
            onApply({ ...draft, year: y >= 1970 && y <= 2030 ? draft.year : "" });
          }}
        >
          Show results
        </button>
      </div>
    </div>
  );
}
