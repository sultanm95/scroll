import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './MangaReader.css';

export default function MangaReader() {
    const { mangaId, chapter } = useParams();
    const navigate = useNavigate();
    const [pages, setPages] = useState([]);
    const [mangaInfo, setMangaInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentChapter, setCurrentChapter] = useState('');
    const [availableChapters, setAvailableChapters] = useState([]);

    // Загрузка информации о манге и главах
    useEffect(() => {
        const loadMangaData = async () => {
            try {
                const [mangaRes, chaptersRes] = await Promise.all([
                    fetch(`/api/mangadex/manga/${mangaId}`),
                    fetch(`/api/mangadex/manga/${mangaId}/chapters`)
                ]);

                // Check if responses are ok before parsing JSON
                if (!mangaRes.ok || !chaptersRes.ok) {
                    throw new Error('Failed to fetch manga data');
                }

                const mangaData = await mangaRes.json();
                const chaptersData = await chaptersRes.json();

                setMangaInfo(mangaData);

                if (chaptersData.data) {
                    // Filter out chapters without chapter numbers and sort them
                    const validChapters = chaptersData.data.filter(ch => ch.attributes.chapter);
                    const sortedChapters = validChapters
                        .sort((a, b) => parseFloat(a.attributes.chapter) - parseFloat(b.attributes.chapter));
                    setAvailableChapters(sortedChapters);

                    // Check if we have any chapters
                    if (sortedChapters.length > 0) {
                        // If no chapter specified or requested chapter doesn't exist
                        if (!chapter || !sortedChapters.find(ch => ch.attributes.chapter === chapter)) {
                            const firstChapter = sortedChapters[0];
                            navigate(`/reader/${mangaId}/${firstChapter.attributes.chapter}`, { replace: true });
                            setCurrentChapter(firstChapter.attributes.chapter);
                        } else {
                            setCurrentChapter(chapter);
                        }
                    } else {
                        setError('No chapters available for this manga');
                    }
                } else {
                    setError('No chapters data available');
                }
            } catch (err) {
                setError('Failed to load manga information');
                console.error(err);
            }
        };

        loadMangaData();
    }, [mangaId, chapter, navigate]);

    useEffect(() => {
        if (currentChapter) {
            fetchChapterPages();
        }
    }, [currentChapter]);

    const fetchChapterPages = async () => {
        if (!currentChapter) return;
        
        setLoading(true);
        try {
            const chapterData = availableChapters.find(ch => ch.attributes.chapter === currentChapter);
            if (!chapterData) {
                throw new Error('Chapter not found');
            }

            const res = await fetch(`/api/mangadex/chapter/${chapterData.id}/pages`);
            if (!res.ok) {
                throw new Error('Failed to fetch chapter pages');
            }
            const data = await res.json();
            
            if (data.chapter?.data) {
                const baseUrl = data.baseUrl;
                const hash = data.chapter.hash;
                const pageUrls = data.chapter.data.map(filename => 
                    `${baseUrl}/data/${hash}/${filename}`
                );
                setPages(pageUrls);
                setError(null);
            }
        } catch (err) {
            setError('Failed to load chapter pages');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChapterChange = (chapterNumber) => {
        setCurrentChapter(chapterNumber);
        navigate(`/reader/${mangaId}/${chapterNumber}`);
    };

    if (error) {
        return <div className="reader-error">{error}</div>;
    }

    return (
        <div className="manga-reader">
            <header className="reader-header">
                <h1>{mangaInfo?.attributes?.title?.en || 'Reading Manga'}</h1>
                <div className="chapter-navigation">
                    {availableChapters.length > 0 && (
                        <select 
                            value={currentChapter || ''}
                            onChange={(e) => handleChapterChange(e.target.value)}
                            className="chapter-select"
                        >
                            <option value="" disabled>Select Chapter</option>
                            {availableChapters.map(chapter => (
                                <option 
                                    key={chapter.id} 
                                    value={chapter.attributes.chapter}
                                >
                                    Chapter {chapter.attributes.chapter}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </header>

            <div className="reader-content">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <div className="pages-container">
                        {pages.map((pageUrl, index) => (
                            <img
                                key={index}
                                src={pageUrl}
                                alt={`Page ${index + 1}`}
                                className="manga-page"
                                loading="lazy"
                            />
                        ))}
                    </div>
                )}
            </div>

            <footer className="reader-footer">
                <button
                    className="nav-button"
                    disabled={!availableChapters.find(ch => 
                        parseFloat(ch.attributes.chapter) < parseFloat(currentChapter)
                    )}
                    onClick={() => {
                        const prevChapter = availableChapters.find(ch => 
                            parseFloat(ch.attributes.chapter) < parseFloat(currentChapter)
                        );
                        if (prevChapter) {
                            handleChapterChange(prevChapter.attributes.chapter);
                        }
                    }}
                >
                    Previous Chapter
                </button>
                <button
                    className="nav-button"
                    disabled={!availableChapters.find(ch => 
                        parseFloat(ch.attributes.chapter) > parseFloat(currentChapter)
                    )}
                    onClick={() => {
                        const nextChapter = availableChapters.find(ch => 
                            parseFloat(ch.attributes.chapter) > parseFloat(currentChapter)
                        );
                        if (nextChapter) {
                            handleChapterChange(nextChapter.attributes.chapter);
                        }
                    }}
                >
                    Next Chapter
                </button>
            </footer>
        </div>
    );
}