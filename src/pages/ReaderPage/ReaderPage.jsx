import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './ReaderPage.css';

// Simple ReaderPage: searches AniList for title, then MangaDex for manga and chapters,
// loads first chapter pages and displays a minimal viewer.
export default function ReaderPage() {
  const [searchParams] = useSearchParams();
  const title = searchParams.get('title') || '';

  const [query, setQuery] = useState(title);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pages, setPages] = useState([]);
  const [index, setIndex] = useState(0);
  const [mangaTitle, setMangaTitle] = useState('');

  useEffect(() => {
    if (title) {
      doSearch(title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  async function searchAniList(q) {
    const query = `query($search:String){Media(search:$search,type:MANGA){id title{romaji english native}}}`;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { search: q } }),
    });
    if (!res.ok) throw new Error('AniList search failed');
    const data = await res.json();
    return data?.data?.Media;
  }

  async function searchMangaDexByTitle(q) {
    const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(q)}&limit=10`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('MangaDex search failed');
    const data = await res.json();
    return data?.data || [];
  }

  async function getChapters(mangaId, limit = 10) {
    // Fetch multiple chapters to find one with available pages
    // Note: status parameter is not available for chapter endpoint, so we just get all
    const url = `https://api.mangadex.org/chapter?manga=${mangaId}&translatedLanguage[]=en&order[chapter]=asc&limit=${limit}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch chapters: ${res.status}`);
      const data = await res.json();
      const chapters = data?.data || [];
      console.log(`Found ${chapters.length} chapters for manga ${mangaId}`);
      return chapters;
    } catch (err) {
      console.error('Error fetching chapters:', err);
      return [];
    }
  }

  async function getPagesForChapter(chapterId) {
    try {
      // First try the data-saver endpoint (more reliable)
      const res = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}?forcePort443=false`);
      
      if (res.status === 404) {
        console.warn(`Chapter ${chapterId} not available on MangaDex at-home server (404)`);
        return null;
      }
      
      if (!res.ok) {
        console.warn(`Failed to get pages for chapter ${chapterId}: ${res.status}`);
        return null;
      }
      
      const data = await res.json();
      
      if (data?.result === 'error') {
        console.warn(`MangaDex error for chapter ${chapterId}:`, data?.errors);
        return null;
      }
      
      // Handle different response structures from MangaDex API
      const baseUrl = data?.baseUrl;
      const chapterData = data?.chapter;
      
      if (!baseUrl || !chapterData) {
        console.warn(`Invalid chapter data for ${chapterId}:`, { baseUrl, chapterData });
        return null;
      }
      
      const hash = chapterData?.hash;
      const filenames = chapterData?.data || [];
      
      if (!hash || filenames.length === 0) {
        console.warn(`No pages found for chapter ${chapterId}: hash=${hash}, pages=${filenames.length}`);
        return null;
      }
      
      const pages = filenames.map((fname) => `${baseUrl}/data/${hash}/${fname}`);
      console.log(`✓ Got ${pages.length} pages from chapter ${chapterId}`);
      return pages;
    } catch (err) {
      console.error(`Error fetching pages for chapter ${chapterId}:`, err.message);
      return null;
    }
  }

  async function doSearch(q) {
    setLoading(true);
    setError(null);
    setPages([]);
    setIndex(0);
    try {
      // First try AniList to normalize title
      let searchTitle = q;
      try {
        const ani = await searchAniList(q);
        if (ani?.title) {
          searchTitle = ani.title.english || ani.title.romaji || q;
          console.log('AniList normalized title to:', searchTitle);
        }
      } catch (err) {
        console.warn('AniList search failed, using original title:', err.message);
      }
      
      // Search MangaDex by that title
      const mdResults = await searchMangaDexByTitle(searchTitle);
      if (!mdResults || mdResults.length === 0) {
        throw new Error('No manga found on MangaDex');
      }
      const manga = mdResults[0];
      const displayTitle = manga?.attributes?.title?.en || manga?.attributes?.title?.en_jp || searchTitle;
      setMangaTitle(displayTitle);
      console.log('Found manga:', { id: manga.id, title: displayTitle });
      
      // Try to find a chapter with available pages
      const chapters = await getChapters(manga.id, 20); // Get more chapters to improve success rate
      if (!chapters || chapters.length === 0) {
        throw new Error('No chapters found');
      }
      
      let successPages = null;
      let successChapter = null;
      
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const chapterId = chapter.id;
        const chapterNum = chapter?.attributes?.chapter || `#${i + 1}`;
        console.log(`[${i + 1}/${chapters.length}] Trying chapter ${chapterNum} (${chapterId})...`);
        
        const p = await getPagesForChapter(chapterId);
        if (p && p.length > 0) {
          console.log(`✓✓✓ SUCCESS! Chapter ${chapterNum} has ${p.length} pages`);
          successPages = p;
          successChapter = chapterId;
          break;
        }
        
        // Add small delay to avoid rate limiting
        if (i < chapters.length - 1) {
          await new Promise(r => setTimeout(r, 100));
        }
      }
      
      if (!successPages || successPages.length === 0) {
        throw new Error(`No chapters with available pages found (tried ${chapters.length} chapters)`);
      }
      
      setPages(successPages);
      console.log('Successfully loaded', successPages.length, 'pages from chapter', successChapter);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reader-page">
      <div className="reader-header">
        <h2>Reader</h2>
        <div className="reader-search">
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search manga title" />
          <button onClick={()=>doSearch(query)} disabled={loading}>Search</button>
        </div>
      </div>

      {loading && <div className="reader-status">Loading...</div>}
      {error && <div className="reader-status error">{error}</div>}

      {mangaTitle && <h3 className="reader-manga-title">{mangaTitle}</h3>}

      {pages.length > 0 && (
        <div className="reader-viewer">
          <div className="reader-controls">
            <button onClick={()=>setIndex(i=>Math.max(0,i-1))} disabled={index<=0}>Prev</button>
            <span>{index+1} / {pages.length}</span>
            <button onClick={()=>setIndex(i=>Math.min(pages.length-1,i+1))} disabled={index>=pages.length-1}>Next</button>
          </div>
          <div className="reader-image-wrap">
            <img src={pages[index]} alt={`Page ${index+1}`} />
          </div>
        </div>
      )}

      {!loading && pages.length===0 && !error && (
        <div className="reader-empty">Enter a title and press Search.</div>
      )}
    </div>
  );
}
