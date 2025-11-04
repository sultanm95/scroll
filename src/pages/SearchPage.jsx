import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import MangaCard from '../components/MangaCard/MangaCard';
import Header from '../components/Header/Header';
import Pagination from '../components/ui/Pagination';
import './SearchPage.css';

const ITEMS_PER_PAGE = 25;

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const gridRef = useRef(null);

  const searchManga = async (page) => {
    if (!query) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query ($search: String, $page: Int, $perPage: Int) {
              Page(page: $page, perPage: $perPage) {
                pageInfo {
                  total
                  currentPage
                  lastPage
                }
                media(search: $search, type: MANGA, sort: SEARCH_MATCH, isAdult: false) {
                  id
                  title {
                    english
                    romaji
                    native
                  }
                  coverImage {
                    large
                    medium
                  }
                  averageScore
                  startDate {
                    year
                  }
                  genres
                }
              }
            }
          `,
          variables: { 
            search: query,
            page: page,
            perPage: ITEMS_PER_PAGE
          }
        })
      });

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      if (data.data) {
        setResults(data.data.Page.media);
        setTotalCount(data.data.Page.pageInfo.total);
        setTotalPages(data.data.Page.pageInfo.lastPage);
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

  // Initial search and page reset when query changes
  useEffect(() => {
    setCurrentPage(1);
    searchManga(1);
  }, [query]);

  // Search when page changes
  useEffect(() => {
    searchManga(currentPage);
  }, [currentPage]);

  // Animate items when they change
  useLayoutEffect(() => {
    if (!gridRef.current) return;

    const cards = Array.from(gridRef.current.children);
    
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

  return (
    <div className="search-page">
      <main className="search-content">
        <div className="search-header">
          <h1>
            {query ? `Результаты поиска для: ${query}` : 'Поиск манги'}
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
            <div ref={gridRef} className="manga-grid">
              {results.map(manga => (
                <MangaCard key={manga.id} manga={manga} />
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
            <p>Введите поисковый запрос чтобы найти мангу</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;