import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import MusicActionButtons from './MusicActionButtons';
import TrackList from './TrackList/TrackList';
import './MusicDetails.css';

function MusicDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [releaseData, setReleaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'tracks'
  const [inLibrary, setInLibrary] = useState(false);

  useEffect(() => {
    loadReleaseDetails();
  }, [id]);

  useEffect(() => {
    if (releaseData && user) {
      checkIfInLibrary();
    }
  }, [releaseData, user]);

  const loadReleaseDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/discogs/release/${id}`
      );
      const data = await response.json();
      
      if (data.success) {
        setReleaseData(data.data);
      } else {
        setError(data.error || 'Ошибка при загрузке релиза');
      }
    } catch (err) {
      setError('Ошибка при подключении к серверу');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkIfInLibrary = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://localhost:3001/api/users/${user.id}/music-library`);
      if (response.ok) {
        const data = await response.json();
        
        // Обработка различных форматов ответа
        let libraryItems = Array.isArray(data) ? data : (data.data || data.library || []);
        
        const releaseId = String(releaseData?.id);
        const found = libraryItems.some(item => String(item.discogs_id) === releaseId);
        setInLibrary(found);
      }
    } catch (err) {
      console.error('Error checking library:', err);
    }
  };

  const handleAddToLibrary = async () => {
    if (!user) {
      alert('Пожалуйста, войдите в аккаунт');
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');

    try {
      const response = await fetch(
        `http://localhost:3001/api/users/${user.id}/music-library`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            discogs_id: releaseData.id,
            title: releaseData.title,
            artist: releaseData.artists?.[0]?.name || 'Unknown',
            image: releaseData.images?.[0]?.uri || releaseData.thumb,
            year: releaseData.year,
            added_at: new Date().toISOString()
          })
        }
      );

      if (response.ok) {
        setInLibrary(true);
        alert('✅ Альбом добавлен в библиотеку!');
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при добавлении альбома');
      }
    } catch (err) {
      console.error('Error adding to library:', err);
      alert('Ошибка при подключении');
    }
  };

  const handleRemoveFromLibrary = async () => {
    if (!user) return;

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');

    try {
      const response = await fetch(
        `http://localhost:3001/api/users/${user.id}/music-library/${releaseData.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        alert('✅ Альбом удален из библиотеки');
        setInLibrary(false);
      } else {
        alert('Ошибка при удалении альбома');
      }
    } catch (err) {
      console.error('Error removing from library:', err);
      alert('Ошибка при удалении');
    }
  };

  if (loading) {
    return <div className="music-details-loading">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="music-details-error">
        <p>{error}</p>
        <button onClick={loadReleaseDetails}>Попробовать снова</button>
      </div>
    );
  }

  if (!releaseData) {
    return <div className="music-details-not-found">Релиз не найден</div>;
  }

  return (
    <div className="music-details-page">
      <div className="music-details-content">
        <div className="music-main-info">
          <div className="music-left-column">
            <div className="music-cover">
              {releaseData.images && releaseData.images.length > 0 ? (
                <img 
                  src={releaseData.images[0].uri} 
                  alt={releaseData.title}
                  className="cover-image"
                />
              ) : (
                <div className="cover-placeholder">
                  🎵 Нет изображения
                </div>
              )}
            </div>
            <MusicActionButtons 
              releaseId={releaseData.id}
              inLibrary={inLibrary}
              onAdd={handleAddToLibrary}
              onRemove={handleRemoveFromLibrary}
              user={user}
            />
          </div>

          <div className="music-info">
            <h1>{releaseData.title}</h1>
            
            {releaseData.artists && releaseData.artists.length > 0 && (
              <p className="artist-name">
                {releaseData.artists.map(a => a.name).join(', ')}
              </p>
            )}
            
            <div className="music-stats">
              {releaseData.year && (
                <div className="stat">
                  <span className="label">Год:</span>
                  <span className="value">{releaseData.year}</span>
                </div>
              )}
              {releaseData.format && releaseData.format.length > 0 && (
                <div className="stat">
                  <span className="label">Формат:</span>
                  <span className="value">{releaseData.format.join(', ')}</span>
                </div>
              )}
              {releaseData.tracklist && (
                <div className="stat">
                  <span className="label">Треков:</span>
                  <span className="value">{releaseData.tracklist.length}</span>
                </div>
              )}
            </div>

            {releaseData.genres && releaseData.genres.length > 0 && (
              <div className="music-genres">
                {releaseData.genres.map(genre => (
                  <span key={genre} className="genre-tag">{genre}</span>
                ))}
              </div>
            )}

            {releaseData.styles && releaseData.styles.length > 0 && (
              <div className="music-styles">
                <p className="styles-label">Стили:</p>
                {releaseData.styles.map(style => (
                  <span key={style} className="style-tag">{style}</span>
                ))}
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="music-tabs">
              <button 
                className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                Информация
              </button>
              {releaseData.tracklist && releaseData.tracklist.length > 0 && (
                <button 
                  className={`tab-btn ${activeTab === 'tracks' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tracks')}
                >
                  Треки ({releaseData.tracklist.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="music-tabs-content">
          {activeTab === 'info' && (
            <div className="tab-pane info-pane">
              <div className="info-section">
                <h3>О релизе</h3>
                {releaseData.notes && (
                  <p className="release-notes">{releaseData.notes}</p>
                )}
                {releaseData.labels && releaseData.labels.length > 0 && (
                  <div className="info-field">
                    <span className="field-label">Лейбл:</span>
                    <span className="field-value">
                      {releaseData.labels.map(l => l.name).join(', ')}
                    </span>
                  </div>
                )}
                {releaseData.country && (
                  <div className="info-field">
                    <span className="field-label">Страна:</span>
                    <span className="field-value">{releaseData.country}</span>
                  </div>
                )}
                {releaseData.released && (
                  <div className="info-field">
                    <span className="field-label">Дата релиза:</span>
                    <span className="field-value">{releaseData.released}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tracks' && releaseData.tracklist && (
            <div className="tab-pane tracks-pane">
              <TrackList tracks={releaseData.tracklist} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MusicDetails;
