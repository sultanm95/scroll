import React from "react";
import PopularMangaSlider from "../PopularMangaSlider/PopularMangaSlider";
import "./MangaList.css";

function MangaList() {
  return (
    <div className="manga-list">
      <PopularMangaSlider title="Популярная манга" />
    </div>
  );
}

export default MangaList;
