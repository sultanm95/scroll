import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Auth/AuthContext';
import './SearchBar.css';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchMode, setSearchMode] = useState('manga'); // 'manga' or 'music'
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const searchContent = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        if (searchMode === 'manga') {
          // Search manga via AniList
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
        } else if (searchMode === 'music') {
          // Search music via Discogs with full pagination and filtering
          const response = await fetch(
            `http://localhost:3001/api/discogs/search?q=${encodeURIComponent(query)}&type=release&page=1&per_page=20`
          );
          const data = await response.json();
          console.log('Discogs response:', data);
          if (data.success) {
            setResults(data.data || []);
          } else {
            setResults([]);
          }
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        searchContent();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      if (searchMode === 'manga') {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
      setShowDropdown(false);
    }
  };

  const handleMangaClick = (id) => {
    navigate(`/manga/${id}`);
    setShowDropdown(false);
    setQuery('');
  };

  const handleMusicClick = (release) => {
    // Переходим на страницу деталей музыки с ID релиза
    navigate(`/music/${release.id}`);
    setShowDropdown(false);
    setQuery('');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="search-bar" ref={searchRef}>
      <div className="search-container">
        {/* Toggle search mode */}
        {user && (
          <div className="search-mode-toggle">
            <button 
              className={`mode-btn ${searchMode === 'manga' ? 'active' : ''}`}
              onClick={() => {
                setSearchMode('manga');
                setQuery('');
                setResults([]);
              }}
              title="Поиск манги"
            >
              📚
            </button>
            <button 
              className={`mode-btn ${searchMode === 'music' ? 'active' : ''}`}
              onClick={() => {
                setSearchMode('music');
                setQuery('');
                setResults([]);
              }}
              title="Поиск музыки"
            >
              🎵
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input 
            type="search" 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            placeholder={searchMode === 'manga' ? 'Поиск манги...' : 'Поиск музыки...'} 
            className="search-input"
            aria-label={searchMode === 'manga' ? 'Поиск манги' : 'Поиск музыки'}
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
      </div>

      {showDropdown && (query.length >= 2 || isLoading) && (
        <div className="search-dropdown">
          {isLoading ? (
            <div className="search-loading">
              Загрузка...
            </div>
          ) : results.length === 0 ? (
            <div className="search-no-results">
              {searchMode === 'manga' ? 'Манга не найдена' : 'Музыка не найдена'}
            </div>
          ) : (
            <div className="search-results">
              {searchMode === 'manga' ? (
                // Manga results
                results.map((manga) => (
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
                ))
              ) : (
                // Music results
                results.map((release) => {
                  const getImage = () => {
                    if (release.thumb) return release.thumb;
                    if (release.cover_image) return release.cover_image;
                    return '/default-album.png';
                  };

                  const getTitle = () => {
                    return release.title || release.name || 'Unknown';
                  };

                  const getSubtitle = () => {
                    const parts = [];
                    if (release.year) parts.push(release.year);
                    if (release.type) {
                      const typeLabel = {
                        'release': 'Релиз',
                        'artist': 'Артист',
                        'master': 'Мастер',
                        'label': 'Лейбл'
                      };
                      parts.push(typeLabel[release.type] || release.type);
                    }
                    return parts.join(' • ') || 'Музыка';
                  };

                  return (
                    <div
                      key={`${release.id}-music`}
                      onClick={() => handleMusicClick(release)}
                      className="search-result-item"
                    >
                      <img
                        src={getImage()}
                        alt={getTitle()}
                        className="result-cover"
                        onError={(e) => {
                          e.target.src = '/default-album.png';
                        }}
                      />
                      <div className="result-info">
                        <h3>{getTitle()}</h3>
                        <p className="result-subtitle">{getSubtitle()}</p>
                        {release.basic_information?.labels && (
                          <p className="result-label">
                            {release.basic_information.labels[0]?.name}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;