import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchManga = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const graphqlQuery = `
          query ($search: String) {
            Page(perPage: 5) {
              media(search: $search, type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
                id
                title {
                  romaji
                  english
                }
                coverImage {
                  medium
                }
                startDate {
                  year
                }
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
          body: JSON.stringify({
            query: graphqlQuery,
            variables: { search: query }
          })
        });

        const data = await response.json();
        setResults(data.data.Page.media);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        searchManga();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleMangaClick = (id) => {
    navigate(`/manga/${id}`);
    setShowDropdown(false);
    setQuery('');
  };

  return (
    <div className="search-bar" ref={searchRef}>
      <form onSubmit={handleSubmit}>
        <input 
          type="search" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          placeholder="Поиск манги..." 
          className="search-input"
          aria-label="Поиск манги"
        />
        <button type="submit" className="search-button" aria-label="Искать">
          <svg 
            className="search-icon" 
            viewBox="0 0 24 24" 
            width="24" 
            height="24"
          >
            <path 
              fill="currentColor" 
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </svg>
        </button>
      </form>

      {showDropdown && (query.length >= 2 || isLoading) && (
        <div className="search-dropdown">
          {isLoading ? (
            <div className="search-loading">
              Загрузка...
            </div>
          ) : results.length === 0 ? (
            <div className="search-no-results">
              Манга не найдена
            </div>
          ) : (
            <div className="search-results">
              {results.map((manga) => (
                <div
                  key={manga.id}
                  onClick={() => handleMangaClick(manga.id)}
                  className="search-result-item"
                >
                  <img
                    src={manga.coverImage.medium}
                    alt={manga.title.romaji}
                    className="result-cover"
                  />
                  <div className="result-info">
                    <h3>{manga.title.english || manga.title.romaji}</h3>
                    {manga.startDate?.year && (
                      <p className="result-year">{manga.startDate.year}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;