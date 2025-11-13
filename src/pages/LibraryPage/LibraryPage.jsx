import React, { useState, useEffect } from 'react';
import { useAuth } from "../../hooks/useAuth";
import './LibraryPage.css';

const LIBRARY_TABS = {
  FAVORITES: 'favorites',
  READING: 'reading',
  COMPLETED: 'completed',
  PLAN_TO_READ: 'plan_to_read',
  DROPPED: 'dropped'
};

export function LibraryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(LIBRARY_TABS.FAVORITES);
  const [mangaLists, setMangaLists] = useState({
    favorites: [],
    reading: [],
    completed: [],
    plan_to_read: [],
    dropped: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Здесь будет запрос к AniList API
        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query {
                MediaListCollection(userId: ${user.id}, type: MANGA) {
                  lists {
                    name
                    entries {
                      media {
                        id
                        title {
                          romaji
                          english
                          native
                        }
                        coverImage {
                          large
                        }
                        description
                        status
                      }
                      status
                    }
                  }
                }
              }
            `
          })
        });

        const data = await response.json();
        // Обработка данных из AniList
        // TODO: Преобразование данных в нужный формат
        setMangaLists({
          favorites: [], // Заполнить данными
          reading: [],  // Заполнить данными
          completed: [], // Заполнить данными
          plan_to_read: [], // Заполнить данными
          dropped: [] // Заполнить данными
        });
      } catch (error) {
        console.error('Error fetching library:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibrary();
  }, [user]);

  const renderMangaGrid = (mangas) => (
    <div className="manga-grid">
      {mangas.map(manga => (
        <div key={manga.id} className="manga-card">
          <div className="manga-cover">
            <img src={manga.coverImage} alt={manga.title} />
          </div>
          <div className="manga-info">
            <h3>{manga.title}</h3>
            <p>{manga.description}</p>
            <div className="manga-actions">
              <button onClick={() => window.location.href = `/manga/${manga.id}`}>
                Читать
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="library-page">
      <div className="library-tabs">
        <button 
          className={activeTab === LIBRARY_TABS.FAVORITES ? 'active' : ''} 
          onClick={() => setActiveTab(LIBRARY_TABS.FAVORITES)}
        >
          Избранное
        </button>
        <button 
          className={activeTab === LIBRARY_TABS.READING ? 'active' : ''} 
          onClick={() => setActiveTab(LIBRARY_TABS.READING)}
        >
          Читаю
        </button>
        <button 
          className={activeTab === LIBRARY_TABS.COMPLETED ? 'active' : ''} 
          onClick={() => setActiveTab(LIBRARY_TABS.COMPLETED)}
        >
          Прочитано
        </button>
        <button 
          className={activeTab === LIBRARY_TABS.PLAN_TO_READ ? 'active' : ''} 
          onClick={() => setActiveTab(LIBRARY_TABS.PLAN_TO_READ)}
        >
          В планах
        </button>
        <button 
          className={activeTab === LIBRARY_TABS.DROPPED ? 'active' : ''} 
          onClick={() => setActiveTab(LIBRARY_TABS.DROPPED)}
        >
          Брошено
        </button>
      </div>

      <div className="library-content">
        {renderMangaGrid(mangaLists[activeTab])}
      </div>
    </div>
  );
}