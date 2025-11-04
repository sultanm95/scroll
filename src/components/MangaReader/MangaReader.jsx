import React, { useState, useEffect } from 'react';
import { findMangaByTitle, getMangaChapters, getChapterPages } from '../../api/mangadex';
import './MangaReader.css';

export function MangaReader({ anilistTitle, anilistData }) {
    const [mangadexData, setMangadexData] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Find matching manga on MangaDex
    useEffect(() => {
        async function matchManga() {
            if (!anilistTitle) return;
            
            setLoading(true);
            try {
                const manga = await findMangaByTitle(anilistTitle);
                if (manga) {
                    setMangadexData(manga);
                    const chaptersData = await getMangaChapters(manga.id);
                    setChapters(chaptersData);
                }
            } catch (err) {
                setError('Failed to find manga on MangaDex');
                console.error(err);
            }
            setLoading(false);
        }

        matchManga();
    }, [anilistTitle]);

    // Load chapter pages
    useEffect(() => {
        async function loadChapterPages() {
            if (!selectedChapter) return;
            
            setLoading(true);
            try {
                const pageUrls = await getChapterPages(selectedChapter.id);
                setPages(pageUrls);
            } catch (err) {
                setError('Failed to load chapter pages');
                console.error(err);
            }
            setLoading(false);
        }

        loadChapterPages();
    }, [selectedChapter]);

    if (error) {
        return <div className="manga-reader-error">{error}</div>;
    }

    if (loading) {
        return <div className="manga-reader-loading">Loading...</div>;
    }

    return (
        <div className="manga-reader">
            {mangadexData && (
                <div className="chapters-list">
                    <h3>Chapters</h3>
                    <div className="chapters-grid">
                        {chapters.map(chapter => (
                            <button
                                key={chapter.id}
                                className={`chapter-button ${selectedChapter?.id === chapter.id ? 'selected' : ''}`}
                                onClick={() => setSelectedChapter(chapter)}
                            >
                                Chapter {chapter.attributes.chapter}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {selectedChapter && (
                <div className="reader-view">
                    <h3>Chapter {selectedChapter.attributes.chapter}</h3>
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
                </div>
            )}
        </div>
    );
}