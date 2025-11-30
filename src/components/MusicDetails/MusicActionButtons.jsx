import React from 'react';
import './MusicActionButtons.css';

const MusicActionButtons = ({ releaseId, inLibrary, onAdd, onRemove, user }) => {
  return (
    <div className="music-action-buttons">
      {user ? (
        <>
          {inLibrary ? (
            <button 
              className="action-btn music-remove-btn"
              onClick={onRemove}
            >
              ❌ Удалить из библиотеки
            </button>
          ) : (
            <button 
              className="action-btn add-btn"
              onClick={onAdd}
            >
              ➕ Добавить в библиотеку
            </button>
          )}
        </>
      ) : (
        <button 
          className="action-btn disabled-btn"
          disabled
        >
          Войдите в аккаунт
        </button>
      )}
    </div>
  );
};

export default MusicActionButtons;
