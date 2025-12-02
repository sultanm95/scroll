import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import Pagination from "../../components/ui/Pagination";
import './MusicSearchPage.css';

const ITEMS_PER_PAGE = 20;

const MusicSearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const gridRef = useRef(null);

  const searchMusic = async (page) => {
    if (!query) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3001/api/discogs/search?q=${encodeURIComponent(query)}&type=release&page=${page}&per_page=${ITEMS_PER_PAGE}`
      );
      const data = await response.json();

      if (data.success) {
        setResults(data.data || []);
        setTotalCount(data.pagination?.total || 0);
        const pages = Math.ceil((data.pagination?.total || 0) / ITEMS_PER_PAGE);
        setTotalPages(pages);
      } else {
        setError(data.error || 'Ошибка при поиске музыки');
        setResults([]);
      }
    } catch (err) {
      setError('Произошла ошибка при поиске. Пожалуйста, попробуйте снова.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMusicClick = (release) => {
    navigate(`/music/${release.id}`);
  };

  // Initial search and page reset when query changes
  useEffect(() => {
    setCurrentPage(1);
    searchMusic(1);
  }, [query]);

  // Search when page changes
  useEffect(() => {
    searchMusic(currentPage);
  }, [currentPage]);

  // Animate items when they change
  useLayoutEffect(() => {
    if (!gridRef.current) return;

    const cards = Array.from(gridRef.current.children);
    if (cards.length === 0) return;
    
    gsap.fromTo(
      cards,
      { 
        opacity: 0,
        y: 20,
        scale: 0.95
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'all'
      }
    );
  }, [results]);

  const getImage = (release) => {
    if (release.thumb) return release.thumb;
    if (release.cover_image) return release.cover_image;
    return '/default-album.png';
  };

  const getTitle = (release) => {
    return release.title || release.name || 'Unknown';
  };

  const getArtist = (release) => {
    if (release.artists && release.artists.length > 0) {
      return release.artists[0].name;
    }
    if (release.artist) return release.artist;
    return '';
  };

  const getYear = (release) => {
    return release.year || release.release_date?.split('-')[0] || '';
  };

  return (
    <div className="music-search-page">
      <main className="search-content">
        <div className="search-header">
          <h1>
            {query ? `Результаты поиска: ${query}` : 'Поиск музыки'}
          </h1>
          {totalCount > 0 && (
            <span className="results-count">
              Найдено: {totalCount}
            </span>
          )}
        </div>

        {loading && results.length === 0 ? (
          <div className="loading-state">
            <span className="loader"></span>
            <p>Загрузка результатов...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <div ref={gridRef} className="music-search-grid">
              {results.map(release => (
                <div 
                  key={`${release.id}-music`} 
                  className="music-card"
                  onClick={() => handleMusicClick(release)}
                >
                  <div className="music-cover">
                    <img 
                      src={getImage(release)} 
                      alt={getTitle(release)}
                      onError={(e) => {
                        e.target.src = '/default-album.png';
                      }}
                    />
                  </div>
                  <div className="music-info">
                    <h3>{getTitle(release)}</h3>
                    {getArtist(release) && (
                      <p className="artist">{getArtist(release)}</p>
                    )}
                    {getYear(release) && (
                      <p className="year">{getYear(release)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {loading && (
              <div className="pagination-loading">
                <span className="loader"></span>
              </div>
            )}
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : query ? (
          <div className="no-results">
            <p>По вашему запросу ничего не найдено</p>
            <p>Попробуйте изменить запрос или проверить правильность написания</p>
          </div>
        ) : (
          <div className="empty-state">
            <p>Введите поисковый запрос чтобы найти музыку</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicSearchPage;
