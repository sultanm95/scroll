import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import './MangaActionButtons.css';

const MangaActionButtons = ({ mangaId, mangaData }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const statusOptions = [
    { id: 'reading', label: 'Читаю' },
    { id: 'completed', label: 'Прочитано' },
    { id: 'dropped', label: 'Брошено' },
    { id: 'planToRead', label: 'В планах' }
  ];

  // Загрузить текущий статус манги из библиотеки пользователя
  useEffect(() => {
    if (user?.id) {
      loadMangaStatus();
    }
  }, [user?.id, mangaId]);

  const loadMangaStatus = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!token) {
        console.warn('No auth token found');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/users/${user.id}/library`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        console.warn('Unauthorized - invalid or expired token');
        return;
      }

      if (response.ok) {
        const library = await response.json();
        
        // Проверить в избранном
        const isFav = library.favorites?.some(m => m.id === parseInt(mangaId));
        setIsFavorite(isFav);

        // Найти в каком списке находится манга
        for (const [key, mangas] of Object.entries(library)) {
          if (key !== 'favorites' && mangas?.some(m => m.id === parseInt(mangaId))) {
            setCurrentStatus(key);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error loading manga status:', error);
    }
  };

  const handleReadClick = () => {
    navigate(`/reader/${mangaId}/1`);
  };

  const handleFavoriteClick = async () => {
    if (!user?.id) {
      alert('Пожалуйста, войдите в аккаунт');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const mangaToSend = mangaData || {
        id: parseInt(mangaId),
        title: { romaji: 'Unknown' },
        coverImage: { large: '' }
      };

      const response = await fetch(`http://localhost:3001/api/users/${user.id}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          mangaId: parseInt(mangaId),
          manga: mangaToSend
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update favorite status: ${response.status}`);
      }

      const result = await response.json();
      setIsFavorite(result.isFavorite);
    } catch (error) {
      console.error('Error updating favorite status:', error);
      alert('Ошибка при добавлении в избранное');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!user?.id) {
      alert('Пожалуйста, войдите в аккаунт');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const mangaToSend = mangaData || {
        id: parseInt(mangaId),
        title: { romaji: 'Unknown' },
        coverImage: { large: '' }
      };

      const response = await fetch(`http://localhost:3001/api/users/${user.id}/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          mangaId: parseInt(mangaId),
          status,
          manga: mangaToSend
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update reading status: ${response.status}`);
      }

      setCurrentStatus(status);
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating reading status:', error);
      alert('Ошибка при добавлении в список');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manga-action-buttons">
      <button 
        className="read-button" 
        onClick={handleReadClick}
        disabled={loading}
      >
        Читать
      </button>
      
      <button 
        className={`favorite-button ${isFavorite ? 'active' : ''}`}
        onClick={handleFavoriteClick}
        disabled={loading}
        title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
      >
        <svg 
          viewBox="0 0 24 24" 
          fill={isFavorite ? 'currentColor' : 'none'}
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>

      <button 
        className="status-button"
        onClick={() => setShowStatusModal(true)}
        disabled={loading}
      >
        {currentStatus ? statusOptions.find(s => s.id === currentStatus)?.label : 'Добавить в список'}
      </button>

      {showStatusModal && (
        <div className="status-modal">
          <div className="status-modal-content">
            <h3>Выберите статус</h3>
            {statusOptions.map(option => (
              <button
                key={option.id}
                className={`status-option ${currentStatus === option.id ? 'active' : ''}`}
                onClick={() => handleStatusChange(option.id)}
                disabled={loading}
              >
                {option.label}
              </button>
            ))}
            <button 
              className="close-modal"
              onClick={() => setShowStatusModal(false)}
              disabled={loading}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MangaActionButtons;