"use client";

import { useEffect } from "react";
import type { Anime } from "@/lib/types";
import { metaLine, scoreLabel } from "./format";
import { PlayIcon, StarIcon } from "./icons";

export default function DetailModal({
  anime,
  onClose,
}: {
  anime: Anime | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!anime) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [anime, onClose]);

  if (!anime) return null;

  const trailerUrl = anime.trailerYoutubeId
    ? `https://www.youtube-nocookie.com/embed/${anime.trailerYoutubeId}?rel=0&autoplay=1`
    : null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={anime.title}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="modal-banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {anime.banner ? <img src={anime.banner} alt="" /> : null}
        </div>
        <div className="modal-body">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="modal-cover"
            src={anime.cover || "/placeholder.svg"}
            alt="Cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
          <div className="modal-info">
            <h3>{anime.title}</h3>
            <p className="muted">{metaLine(anime)}</p>
            {anime.score != null && (
              <div className="m-score">
                <StarIcon size={18} />
                {scoreLabel(anime)}
                <small>
                  · via {anime.scoreSource === "mal" ? "MyAnimeList" : "AniList"}
                </small>
              </div>
            )}
            {anime.genres.length > 0 && (
              <div className="chips">
                {anime.genres.map((g) => (
                  <span key={g} className="chip">
                    {g}
                  </span>
                ))}
              </div>
            )}
            {anime.synopsis && <p className="m-desc">{anime.synopsis}</p>}
            <div className="m-actions">
              {trailerUrl && (
                <a
                  className="btn btn-primary btn-sm"
                  href={`https://www.youtube.com/watch?v=${anime.trailerYoutubeId}`}
                  target="_blank"
                  rel="noopener"
                >
                  <PlayIcon />
                  Watch on YouTube
                </a>
              )}
              <a
                className="btn btn-ghost btn-sm"
                href={anime.siteUrl}
                target="_blank"
                rel="noopener"
              >
                Open on {anime.source === "mal" ? "MyAnimeList" : "AniList"}
              </a>
            </div>
            {trailerUrl && (
              <div className="m-player">
                <iframe
                  src={trailerUrl}
                  title={`${anime.title} trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
