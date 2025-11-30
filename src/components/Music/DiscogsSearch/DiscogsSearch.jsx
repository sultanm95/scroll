import React, { useState, useCallback } from 'react';
import './DiscogsSearch.css';

const DiscogsSearch = ({ onSelect, isLoading = false }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchType, setSearchType] = useState('release');
  const [page, setPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const handleSearch = useCallback(async (searchQuery = query, searchPage = 1) => {
    if (!searchQuery.trim()) {
      setError('Пожалуйста, введите поисковую строку');
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3001/api/discogs/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}&page=${searchPage}&per_page=20`
      );
      const data = await response.json();

      if (data.success) {
        setResults(data.data || []);
        setPagination(data.pagination);
        setPage(searchPage);
      } else {
        setError(data.error || 'Ошибка поиска');
        setResults([]);
      }
    } catch (err) {
      setError('Ошибка при подключении к серверу');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query, searchType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(query, 1);
  };

  const handleTypeChange = (e) => {
    setSearchType(e.target.value);
    setResults([]);
    setPagination(null);
  };

  const handlePageChange = (newPage) => {
    handleSearch(query, newPage);
  };

  const getResultImage = (result) => {
    if (result.thumb) return result.thumb;
    if (result.cover_image) return result.cover_image;
    return '/default-album.png';
  };

  const getResultTitle = (result) => {
    if (result.title) return result.title;
    if (result.name) return result.name;
    return 'Unknown';
  };

  const getResultSubtitle = (result) => {
    const parts = [];
    
    if (result.year) parts.push(result.year);
    if (result.type) {
      const typeLabel = {
        'release': 'Релиз',
        'artist': 'Артист',
        'master': 'Мастер',
        'label': 'Лейбл'
      };
      parts.push(typeLabel[result.type] || result.type);
    }
    if (result.format) parts.push(result.format);
    if (result.resource_url && result.type === 'artist') {
      parts.push('Артист');
    }

    return parts.join(' • ');
  };

  return (
    <div className="discogs-search">
      <form onSubmit={handleSearchSubmit} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск артиста, альбома, трека..."
            className="search-input"
            disabled={searching}
          />
          <button
            type="submit"
            className="search-btn"
            disabled={searching || !query.trim()}
          >
            {searching ? 'Поиск...' : 'Найти'}
          </button>
        </div>

        <div className="search-filters">
          <label htmlFor="type-filter">Тип поиска:</label>
          <select
            id="type-filter"
            value={searchType}
            onChange={handleTypeChange}
            className="type-filter"
          >
            <option value="release">Релизы (Альбомы)</option>
            <option value="artist">Артисты</option>
            <option value="master">Мастер-релизы</option>
            <option value="label">Лейблы</option>
          </select>
        </div>
      </form>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="search-results">
        {results.length === 0 && !searching && (
          <div className="empty-state">
            Введите поисковый запрос, чтобы начать поиск
          </div>
        )}

        {results.map((result, index) => (
          <div
            key={`${result.id}-${index}`}
            className="result-item"
            onClick={() => onSelect?.(result)}
          >
            <div className="result-image">
              <img
                src={getResultImage(result)}
                alt={getResultTitle(result)}
                onError={(e) => {
                  e.target.src = '/default-album.png';
                }}
              />
            </div>
            <div className="result-info">
              <h3 className="result-title">{getResultTitle(result)}</h3>
              <p className="result-subtitle">{getResultSubtitle(result)}</p>
              {result.basic_information?.labels && (
                <p className="result-label">
                  {result.basic_information.labels[0]?.name}
                </p>
              )}
            </div>
            <div className="result-action">
              <button className="select-btn">
                Выбрать
              </button>
            </div>
          </div>
        ))}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
            className="page-btn"
          >
            ⇤ Первая
          </button>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="page-btn"
          >
            ← Назад
          </button>

          <span className="page-info">
            Страница {page} из {pagination.pages}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === pagination.pages}
            className="page-btn"
          >
            Вперед →
          </button>
          <button
            onClick={() => handlePageChange(pagination.pages)}
            disabled={page === pagination.pages}
            className="page-btn"
          >
            Последняя ⇥
          </button>
        </div>
      )}
    </div>
  );
};

export default DiscogsSearch;
