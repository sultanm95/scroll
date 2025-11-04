import React from 'react';
import { Link } from 'react-router-dom';
import './MangaCard.css';

function MangaCard({ manga }) {
  const {
    id,
    title,
    coverImage,
    averageScore,
    startDate,
    genres = []
  } = manga;

  // Выбираем наиболее подходящее название
  const displayTitle = title.english || title.romaji || title.native;
  
  return (
    <Link to={`/manga/${id}`} className="manga-card">
      <div className="manga-cover">
        <img 
          src={coverImage.large || coverImage.medium} 
          alt={displayTitle}
          loading="lazy"
        />
        {averageScore && (
          <div className="manga-score">
            <span>{averageScore}%</span>
          </div>
        )}
      </div>
      
      <div className="manga-info">
        <h3 title={displayTitle}>{displayTitle}</h3>
        
        <div className="manga-details">
          {startDate?.year && (
            <span className="manga-year">{startDate.year}</span>
          )}
          
          {genres && genres.length > 0 && (
            <div className="manga-genres">
              {genres.slice(0, 2).map((genre, index) => (
                <span key={index} className="genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default MangaCard;