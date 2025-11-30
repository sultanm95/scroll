import { useState, useCallback } from "react";

const API = "https://api.mangadex.org";

// helper to build image url
const getPageUrl = (chapterId, hash, filename) =>
    `https://uploads.mangadex.org/data/${hash}/${filename}`;

export function useMangadex() {
    const [manga, setManga] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [pages, setPages] = useState([]);

    // 1. Find manga by name
    const searchManga = useCallback(async (title) => {
        const res = await fetch(`${API}/manga?title=${encodeURIComponent(title)}`);
        const json = await res.json();
        if (!json.data || json.data.length === 0) return null;

        const found = json.data[0];
        setManga(found);
        return found;
    }, []);

    // 2. Load chapters for manga
    const loadChapters = useCallback(async (mangaId) => {
        const res = await fetch(
            `${API}/chapter?manga=${mangaId}&translatedLanguage[]=en&limit=500&order[chapter]=asc`
        );
        const json = await res.json();
        setChapters(json.data);
        return json.data;
    }, []);

    // 3. Load chapter pages
    const loadPages = useCallback(async (chapterId) => {
        const res = await fetch(`${API}/at-home/server/${chapterId}`);
        const json = await res.json();

        const files = json.chapter.data; // page file names
        const hash = json.chapter.hash;

        const urls = files.map((file) => getPageUrl(chapterId, hash, file));

        setPages(urls);
        return urls;
    }, []);

    return {
        manga,
        chapters,
        pages,
        searchManga,
        loadChapters,
        loadPages,
    };
}
