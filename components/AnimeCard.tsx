"use client";

import { useState } from "react";
import type { Anime } from "@/lib/types";
import { metaLine } from "./format";
import { PlayIcon, ScoreBadge } from "./icons";

export default function AnimeCard({
  anime,
  rank,
  onOpen,
}: {
  anime: Anime;
  rank?: number;
  onOpen: (a: Anime) => void;
}) {
  const [src, setSrc] = useState(anime.cover);
  return (
    <article className="card" onClick={() => onOpen(anime)}>
      <div className="card-img">
        {rank != null && <span className="card-rank">#{rank}</span>}
        <ScoreBadge anime={anime} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src || "/placeholder.svg"}
          alt={anime.title}
          loading="lazy"
          onError={() => setSrc("/placeholder.svg")}
        />
        <div className="card-play">
          <PlayIcon size={30} />
          Details{anime.trailerYoutubeId ? " + trailer" : ""}
        </div>
      </div>
      <div className="card-body">
        <h3>{anime.title}</h3>
        <p className="card-meta">{metaLine(anime)}</p>
      </div>
    </article>
  );
}
