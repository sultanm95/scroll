import React from "react";
import "./MiniMangaCard.css";

export default function MiniMangaCard({ manga, onOpen }) {
  return (
    <div
      className="mini-manga-card"
      onClick={() => onOpen(manga.id)}
    >
      <div className="mini-manga-card__image-container">
        <img
          src={manga.coverImage?.large}
          alt={manga.title?.romaji}
          className="mini-manga-card__image"
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/100x150?text=No+Cover";
          }}
        />
      </div>

      <div className="mini-manga-card__info">
        <p className="mini-manga-card__title">{manga.title?.romaji}</p>
      </div>
    </div>
  );
}
