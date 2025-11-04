import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RandomButton.css';

const RandomButton = () => {
  const navigate = useNavigate();

  // Здесь будет функция получения случайной манги
  const getRandomManga = async () => {
    try {
      const query = `
        query {
          Page(page: 1, perPage: 50) {
            media(type: MANGA, sort: POPULARITY_DESC) {
              id
            }
          }
        }
      `;

      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      const mangaList = data.data.Page.media;
      const randomManga = mangaList[Math.floor(Math.random() * mangaList.length)];
      
      if (randomManga) {
        navigate(`/manga/${randomManga.id}`);
      }
    } catch (error) {
      console.error('Error fetching random manga:', error);
    }
  };

return (
    <button 
        onClick={getRandomManga} 
        className="random-btn" 
        title="Случайная манга"
        aria-label="Получить случайную мангу"
    >
        <div className="random-tooltip">Случайная манга</div>
        <img 
          src="/random-1dice-svgrepo-com.svg" 
          alt="Случайная манга"
          className="random-icon"
        />
    </button>
);
};

export default RandomButton;