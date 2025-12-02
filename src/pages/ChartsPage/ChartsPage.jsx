import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChartsPage.css';

const ChartsPage = () => {
  const navigate = useNavigate();
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadCharts(currentPage);
  }, [currentPage]);

  const loadCharts = async (page) => {
    setLoading(true);
    try {
      const perPage = itemsPerPage;
      const response = await fetch(
        `http://localhost:3001/api/discogs/charts?sort=popularity&page=${page}&per_page=${perPage}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log('Charts loaded:', data);
        setCharts(data.results || []);
        
        // Вычисляем количество страниц (примерно 100 чартов)
        const total = data.pagination?.total || 100;
        setTotalPages(Math.ceil(total / perPage));
      } else {
        console.error('Response not ok:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error data:', errorData);
        alert(`Ошибка при загрузке: ${response.status}`);
      }
    } catch (err) {
      console.error('Error loading charts:', err);
      alert('Ошибка при загрузке чартов: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="charts-page">
      <div className="charts-container">
        <div className="charts-header">
          <h1>TOP 100 CHARTS</h1>
          <p className="charts-subtitle">Самые популярные альбомы на Discogs</p>
        </div>

        {loading ? (
          <div className="charts-loading">
            <div className="spinner"></div>
            <p>Загрузка чартов...</p>
          </div>
        ) : charts.length === 0 ? (
          <div className="charts-empty">
            <p>Нет доступных чартов</p>
          </div>
        ) : (
          <>
            <div className="charts-list">
              {charts.map((chart, idx) => {
                const chartNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                return (
                  <div key={idx} className="chart-item">
                    <div className="chart-cover">
                      <img 
                        src={chart.thumb || chart.cover_image || 'https://via.placeholder.com/80?text=No+Image'}
                        alt={chart.title}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                        }}
                      />
                    </div>
                    <div className="chart-rank">
                      <span className="rank-number">#{chartNumber}</span>
                    </div>
                    <div className="chart-info">
                      <h3 className="chart-title">{chart.title}</h3>
                      <p className="chart-details">
                        {chart.year && <span className="chart-year">{chart.year}</span>}
                        {chart.resource_url && <span className="chart-source">Discogs</span>}
                      </p>
                    </div>
                    <div className="chart-actions">
                      <button 
                        className="chart-btn"
                        onClick={() => {
                          if (chart.id) {
                            navigate(`/music/${chart.id}`);
                          } else {
                            alert('ID альбома не найден');
                          }
                        }}
                      >
                        Подробнее
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pagination">
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Предыдущая
              </button>

              <div className="pagination-info">
                <span>Страница {currentPage} из {totalPages}</span>
              </div>

              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Следующая →
              </button>
            </div>

            <div className="pagination-numbers">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const pageNum = currentPage > 5 ? currentPage - 5 + i : i + 1;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChartsPage;
