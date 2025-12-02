import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import MangaActionButtons from './MangaActionButtons';
import MangaComments from './MangaComments/MangaComments';
import { useAniList } from '../../api/useAniList';
import './MangaDetails.css';

function MangaDetails({ highlightReviewId: propHighlightReviewId }) {
  const { id } = useParams();
  const location = useLocation();
  const [mediaData, setMediaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'characters', 'recommendations'
  const { fetchMediaDetails } = useAniList();
  
  // Получаем highlightReviewId либо из props, либо из location.state
  const highlightReviewId = propHighlightReviewId || location.state?.highlightReviewId;

  const loadMediaDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMediaDetails(parseInt(id), 'MANGA');
      setMediaData(data);
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке информации о манге');
      console.error('Error loading manga details:', err);
    } finally {
      setLoading(false);
    }
  }, [id, fetchMediaDetails]);

  useEffect(() => {
    loadMediaDetails();
  }, [loadMediaDetails]);

  useEffect(() => {
    // Если есть highlightReviewId, открываем вкладку отзывов
    if (highlightReviewId && !loading && mediaData) {
      setActiveTab('reviews');
      // Скроллим к секции отзывов через небольшую задержку
      setTimeout(() => {
        const reviewsSection = document.querySelector('.reviews-tab');
        const mangaDetailsPage = document.querySelector('.manga-details-page');
        if (reviewsSection) {
          reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (mangaDetailsPage) {
          mangaDetailsPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [highlightReviewId, loading, mediaData]);

  if (loading) {
    return <div className="manga-details-loading">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="manga-details-error">
        <p>{error}</p>
        <button onClick={loadMediaDetails}>Попробовать снова</button>
      </div>
    );
  }

  if (!mediaData) {
    return <div className="manga-details-not-found">Манга не найдена</div>;
  }

  const { media, characters, recommendations } = mediaData;

  return (
    <div className="manga-details-page">
      {media.banner && (
        <div className="banner-container">
          <img src={media.banner} alt="Banner" className="banner-image" />
        </div>
      )}
      
      <div className={`manga-details-content ${media.banner ? 'with-banner' : ''}`}>
        {media.banner && (
          <div className="manga-title-under-banner">
            {media.title.english && media.title.english !== media.title.display && (
              <p className="native-title">{media.title.english}</p>
            )}
          </div>
        )}
        <div className="manga-main-info">
          <div className="manga-left-column">
            <div className="manga-cover">
              <img 
                src={media.cover.large} 
                alt={media.title.display} 
                className="cover-image"
              />
            </div>
            <MangaActionButtons 
              mangaId={media.id} 
              mangaData={{
                id: media.id,
                title: { romaji: media.title.display, english: media.title.english },
                coverImage: { large: media.cover.large }
              }} 
            />
          </div>

          <div className="manga-info">
            <span className='probel'>.</span>
            <h1>{media.title.display}</h1>
            {media.title.english && media.title.english !== media.title.display && (
              <p className="native-title">{media.title.english}</p>
            )}
            {mediaData.staff && mediaData.staff.length > 0 && (
              <p className="author-name">
                {mediaData.staff.map(s => s.name).join(', ')}
              </p>
            )}
            
            <div className="manga-stats">
              {media.score10 && (
                <div className="stat">
                  <span className="label">Рейтинг:</span>
                  <span className="value">{media.score10}</span>
                </div>
              )}
              {media.chapters && (
                <div className="stat">
                  <span className="label">Главы:</span>
                  <span className="value">{media.chapters}</span>
                </div>
              )}
              {media.volumes && (
                <div className="stat">
                  <span className="label">Тома:</span>
                  <span className="value">{media.volumes}</span>
                </div>
              )}
            </div>

            <div className="manga-genres">
              {media.genres.map(genre => (
                <span key={genre} className="genre-tag">{genre}</span>
              ))}
            </div>

            {/* Tabs Navigation */}
            <div className="manga-tabs">
              <button 
                className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                Описание
              </button>
              {characters.list && characters.list.length > 0 && (
                <button 
                  className={`tab-btn ${activeTab === 'characters' ? 'active' : ''}`}
                  onClick={() => setActiveTab('characters')}
                >
                  Персонажи ({characters.list.length})
                </button>
              )}
              {recommendations && recommendations.length > 0 && (
                <button 
                  className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('recommendations')}
                >
                  Похожее ({recommendations.length})
                </button>
              )}
              <button 
                className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Отзывы
              </button>
            </div>

            {/* Tab Content - Description */}
            {activeTab === 'info' && (
              <div className="tab-content info-tab">
                <div className="manga-description" 
                  dangerouslySetInnerHTML={{ __html: media.description }} 
                />
              </div>
            )}

            {/* Tab Content - Characters */}
            {activeTab === 'characters' && characters.list && characters.list.length > 0 && (
              <div className="tab-content characters-tab">
                <div className="characters-grid">
                  {characters.list.map((character) => (
                    <div key={character.id} className="character-card">
                      {character.image && (
                        <img src={character.image} alt={character.name} />
                      )}
                      <p className="character-name">{character.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Content - Recommendations */}
            {activeTab === 'recommendations' && recommendations && recommendations.length > 0 && (
              <div className="tab-content recommendations-tab">
                <div className="recommendations-grid">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="recommendation-card">
                      {rec.cover && (
                        <img src={rec.cover} alt={rec.title} />
                      )}
                      <p>{rec.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Content - Reviews */}
            {activeTab === 'reviews' && (
              <div className="tab-content reviews-tab">
                <MangaComments mangaId={media.id} highlightReviewId={highlightReviewId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MangaDetails;