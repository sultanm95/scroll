import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MangaActionButtons from './MangaActionButtons';
import { MangaReader } from '../MangaReader/MangaReader';
import './MangaDetails.css';

function MangaDetails() {
  const { id } = useParams();
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReader, setShowReader] = useState(false);

  useEffect(() => {
    fetchMangaDetails();
  }, [id]);

  const fetchMangaDetails = async () => {
    try {
      setLoading(true);
      const query = `
        query ($id: Int) {
          Media(id: $id, type: MANGA) {
            id
            title {
              english
              romaji
              native
            }
            coverImage {
              large
              extraLarge
            }
            bannerImage
            description
            averageScore
            popularity
            genres
            tags {
              name
              rank
            }
            status
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            chapters
            volumes
            staff {
              edges {
                role
                node {
                  name {
                    full
                  }
                }
              }
            }
            characters {
              edges {
                role
                node {
                  name {
                    full
                  }
                  image {
                    medium
                  }
                }
              }
            }
            recommendations {
              edges {
                node {
                  mediaRecommendation {
                    id
                    title {
                      romaji
                      english
                    }
                    coverImage {
                      medium
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { id: parseInt(id) }
        })
      });

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].message || 'Ошибка при загрузке манги');
      }

      setManga(data.data.Media);
    } catch (err) {
      setError(err.message || 'Произошла ошибка при загрузке информации о манге');
      console.error('Error fetching manga details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="manga-details-loading">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="manga-details-error">
        <p>{error}</p>
        <button onClick={fetchMangaDetails}>Попробовать снова</button>
      </div>
    );
  }

  if (!manga) {
    return <div className="manga-details-not-found">Манга не найдена</div>;
  }

  return (
    <div className="manga-details-page">
      {manga.bannerImage && (
        <div className="banner-container">
          <img src={manga.bannerImage} alt="Banner" className="banner-image" />
        </div>
      )}
      
      <div className={`manga-details-content ${manga.bannerImage ? 'with-banner' : ''}`}>
        <div className="manga-main-info">
          <div className="manga-cover">
            <img 
              src={manga.coverImage.large} 
              alt={manga.title.english || manga.title.romaji} 
              className="cover-image"
            />
          </div>
          
          <div className="manga-info">
            <h1>{manga.title.english || manga.title.romaji}</h1>
            {manga.title.native && <h2 className="native-title">{manga.title.native}</h2>}
            
            <div className="manga-stats">
              {manga.averageScore && (
                <div className="stat">
                  <span className="label">Рейтинг:</span>
                  <span className="value">{manga.averageScore}%</span>
                </div>
              )}
              <div className="stat">
                <span className="label">Популярность:</span>
                <span className="value">{manga.popularity}</span>
              </div>
              {manga.chapters && (
                <div className="stat">
                  <span className="label">Главы:</span>
                  <span className="value">{manga.chapters}</span>
                </div>
              )}
              {manga.volumes && (
                <div className="stat">
                  <span className="label">Тома:</span>
                  <span className="value">{manga.volumes}</span>
                </div>
              )}
            </div>

            <div className="manga-genres">
              {manga.genres.map(genre => (
                <span key={genre} className="genre-tag">{genre}</span>
              ))}
            </div>

            <div className="manga-description" 
              dangerouslySetInnerHTML={{ __html: manga.description }} 
            />

            <MangaActionButtons mangaId={manga.id} mangaData={manga} />
            
            <button 
              className="read-manga-button"
              onClick={() => setShowReader(!showReader)}
            >
              {showReader ? 'Скрыть читалку' : 'Читать мангу'}
            </button>
          </div>
        </div>

        {showReader && (
          <div className="manga-reader-container">
            <MangaReader 
              anilistTitle={manga.title.english || manga.title.romaji}
              anilistData={manga}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MangaDetails;