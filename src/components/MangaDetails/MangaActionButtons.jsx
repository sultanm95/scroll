import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MangaActionButtons.css';

const MangaActionButtons = ({ mangaId }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);

  const statusOptions = [
    { id: 'READING', label: 'Читаю' },
    { id: 'COMPLETED', label: 'Прочитано' },
    { id: 'ON_HOLD', label: 'Отложено' },
    { id: 'DROPPED', label: 'Брошено' },
    { id: 'PLAN_TO_READ', label: 'В планах' }
  ];

  const navigate = useNavigate();
  
  const handleReadClick = () => {
    navigate(`/reader/${mangaId}/1`);
  };

  const handleFavoriteClick = async () => {
    try {
      const response = await fetch(`/api/manga/${mangaId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isFavorite: !isFavorite })
      });

      if (!response.ok) {
        throw new Error('Failed to update favorite status');
      }

      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const response = await fetch(`/api/manga/${mangaId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update reading status');
      }

      setCurrentStatus(status);
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating reading status:', error);
    }
  };

  return (
    <div className="manga-action-buttons">
      <button className="read-button" onClick={handleReadClick}>
        Читать
      </button>
      
      <button 
        className={`favorite-button ${isFavorite ? 'active' : ''}`}
        onClick={handleFavoriteClick}
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
              >
                {option.label}
              </button>
            ))}
            <button 
              className="close-modal"
              onClick={() => setShowStatusModal(false)}
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