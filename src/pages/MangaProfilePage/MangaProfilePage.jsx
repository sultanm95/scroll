import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import MangaDetails from '../components/MangaDetails/MangaDetails';
import { useAuth } from '../components/Auth/AuthContext';
import './MangaProfilePage.css';

const MangaProfilePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [manga, setManga] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [listStatus, setListStatus] = useState(null);
  const [showListModal, setShowListModal] = useState(false);
  const [highlightReviewId, setHighlightReviewId] = useState(null);

  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/manga/${id}`);
        const data = await response.json();
        setManga(data);

        // Проверяем статус в списке пользователя если он авторизован
        if (user) {
          const userResponse = await fetch(`http://localhost:3001/api/user/manga-status/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          const userData = await userResponse.json();
          setIsFavorite(userData.isFavorite);
          setListStatus(userData.status);
        }
      } catch (error) {
        console.error('Error fetching manga data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMangaData();
  }, [id, user]);

  useEffect(() => {
    // Получаем highlightReviewId из state навигации
    if (location.state?.state?.highlightReviewId) {
      setHighlightReviewId(location.state.state.highlightReviewId);
      // Скроллим до секции отзывов через 500ms
      setTimeout(() => {
        const reviewsSection = document.querySelector('[data-section="reviews"]');
        if (reviewsSection) {
          reviewsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, [location.state?.state?.highlightReviewId]);

  const handleToggleFavorite = async () => {
    if (!user) {
      // Показать модальное окно входа
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/manga/${id}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setIsFavorite(data.isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!user) {
      // Показать модальное окно входа
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/manga/${id}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      setListStatus(data.status);
      setShowListModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="manga-profile-page">
      {manga && (
        <>
          <MangaDetails manga={manga} highlightReviewId={highlightReviewId} />
          
          <div className="manga-actions">
            <button className="read-button">
              Читать
            </button>
            
            <button 
              className={`favorite-button ${isFavorite ? 'active' : ''}`}
              onClick={handleToggleFavorite}
            >
              <svg 
                viewBox="0 0 24 24" 
                className="heart-icon"
                fill={isFavorite ? '#ff4c4c' : 'none'}
                stroke={isFavorite ? 'none' : 'currentColor'}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>

            <button 
              className="list-button"
              onClick={() => setShowListModal(true)}
            >
              <svg viewBox="0 0 24 24" className="list-icon">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
            </button>
          </div>

          {showListModal && (
            <div className="list-modal">
              <div className="list-modal-content">
                <h3>Добавить в список</h3>
                <button 
                  className={`status-button ${listStatus === 'reading' ? 'active' : ''}`}
                  onClick={() => handleUpdateStatus('reading')}
                >
                  Читаю
                </button>
                <button 
                  className={`status-button ${listStatus === 'completed' ? 'active' : ''}`}
                  onClick={() => handleUpdateStatus('completed')}
                >
                  Прочитано
                </button>
                <button 
                  className={`status-button ${listStatus === 'planToRead' ? 'active' : ''}`}
                  onClick={() => handleUpdateStatus('planToRead')}
                >
                  Хочу прочитать
                </button>
                <button 
                  className={`status-button ${listStatus === 'dropped' ? 'active' : ''}`}
                  onClick={() => handleUpdateStatus('dropped')}
                >
                  Брошено
                </button>
                <button 
                  className="close-button"
                  onClick={() => setShowListModal(false)}
                >
                  Закрыть
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MangaProfilePage;