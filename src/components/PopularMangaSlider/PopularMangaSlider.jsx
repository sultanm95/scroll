  import React, { useState, useEffect, useRef } from 'react';
  import MangaCard from '../MangaCard/MangaCard';
  import './PopularMangaSlider.css';

function PopularMangaSlider({ title = "Популярная манга" }) {
  const [manga, setManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPopularManga();
  }, []);    const fetchPopularManga = async () => {
      try {
        setLoading(true);
        const query = `
          query {
            Page(page: 1, perPage: 20) {
              media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
                id
                title {
                  english
                  romaji
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

        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Ошибка при загрузке манги');
        }

        const formattedManga = data.data.Page.media;

        setManga(formattedManga);
      } catch (err) {
        setError('Произошла ошибка при загрузке манги');
        console.error('Error fetching manga:', err);
      } finally {
        setLoading(false);
      }
    };



    if (error) {
      return (
        <div className="slider-error">
          <p>{error}</p>
          <button onClick={fetchPopularManga}>Попробовать снова</button>
        </div>
      );
    }

    return (
      <section className="popular-section">
        <div className="section-inner">
          <h2>{title}</h2>
          <div className="popular-container">
            <div className="popular-track">
              <div className="track-content">
                {loading ? (
                  <div className="slider-loading">Загрузка...</div>
                ) : (
                  <>
                    {manga.map(item => (
                      <div key={`first-${item.id}`} className="slide-item">
                        <MangaCard manga={item} />
                      </div>
                    ))}
                    {manga.map(item => (
                      <div key={`second-${item.id}`} className="slide-item">
                        <MangaCard manga={item} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  export default PopularMangaSlider;