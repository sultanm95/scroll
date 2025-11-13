import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import MangaCard from "../MangaDetails/MangaCard/MangaCard";
import Pagination from '../ui/Pagination';
import './Catalog.css';

const ITEMS_PER_PAGE = 48;

function Catalog() {
  const [manga, setManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const gridRef = useRef(null);

  // GraphQL запрос для получения манги
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
          }
          description
          averageScore
          popularity
          genres
          status
          startDate {
            year
          }
        }
      }
    }
  `;

  const fetchManga = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            page: currentPage,
            perPage: ITEMS_PER_PAGE
          }
        })
      });

      const data = await response.json();
      
      if (data.errors) {
        setError(data.errors[0].message);
        return;
      }

      setManga(data.data.Page.media);
      setTotalPages(data.data.Page.pageInfo.lastPage);
    } catch (err) {
      setError('Произошла ошибка при загрузке данных');
      console.error('Error fetching manga:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch manga when page changes
  useEffect(() => {
    fetchManga();
  }, [currentPage]);

  // Animate items when they change
  useLayoutEffect(() => {
    if (!gridRef.current || !manga.length) return;

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
  }, [manga]);

  if (error) {
    return (
      <div className="catalog-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <button onClick={() => { setError(null); fetchManga(); }}>
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="catalog-container">
      <h1>Каталог манги</h1>
      
      {/* Здесь будут фильтры */}
      <div className="catalog-filters">
        {/* Фильтры будут добавлены позже */}
      </div>

      {loading && manga.length === 0 ? (
        <div className="loading-spinner">
          <span className="loader"></span>
          <p>Загрузка манги...</p>
        </div>
      ) : (
        <>
          <div ref={gridRef} className="manga-grid">
            {manga.map(item => (
              <MangaCard key={item.id} manga={item} />
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
      )}
    </div>
  );
}

export default Catalog;