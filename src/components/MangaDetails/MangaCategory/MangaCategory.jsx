import React, { useState } from "react";
import MiniMangaCard from "../MiniMangaCard/MiniMangaCard";
import "./MangaCategory.css";

export default function MangaCategory({ title, data = [], emptyMessage, onOpen }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="manga-category">
      <div
        className="manga-category__header"
        onClick={() => setOpen(!open)}
      >
        <span className={`manga-category__arrow ${open ? "manga-category__arrow--open" : ""}`}>
          ▶
        </span>
        <h2 className="manga-category__title">{title}</h2>
      </div>

      {open && (
        <div className="manga-category__content">
          {data.length === 0 ? (
            <p className="manga-category__empty">
              {emptyMessage}
            </p>
          ) : (
            <div className="manga-category__grid">
              {data.map((m) => (
                <MiniMangaCard key={m.id} manga={m} onOpen={onOpen} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
