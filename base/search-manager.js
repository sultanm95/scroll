import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { dataCache } from './cache-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Поисковый индекс
const searchIndex = {
    titles: new Map(),
    authors: new Map(),
    genres: new Map(),
    tags: new Map()
};

/**
 * Обновляет поисковый индекс
 * @param {Array} mangas - Массив манг для индексации
 */
export function updateSearchIndex(mangas) {
    // Очищаем текущий индекс
    searchIndex.titles.clear();
    searchIndex.authors.clear();
    searchIndex.genres.clear();
    searchIndex.tags.clear();

    for (const manga of mangas) {
        // Индексируем все варианты названий
        const titles = [
            manga.title,
            ...(manga.alternativeTitles ? Object.values(manga.alternativeTitles) : [])
        ].filter(Boolean);

        for (const title of titles) {
            const lowerTitle = title.toLowerCase();
            if (!searchIndex.titles.has(lowerTitle)) {
                searchIndex.titles.set(lowerTitle, new Set());
            }
            searchIndex.titles.get(lowerTitle).add(manga.id);
        }

        // Индексируем автора
        if (manga.author) {
            const lowerAuthor = manga.author.toLowerCase();
            if (!searchIndex.authors.has(lowerAuthor)) {
                searchIndex.authors.set(lowerAuthor, new Set());
            }
            searchIndex.authors.get(lowerAuthor).add(manga.id);
        }

        // Индексируем жанры
        for (const genre of manga.genres || []) {
            const lowerGenre = genre.toLowerCase();
            if (!searchIndex.genres.has(lowerGenre)) {
                searchIndex.genres.set(lowerGenre, new Set());
            }
            searchIndex.genres.get(lowerGenre).add(manga.id);
        }

        // Индексируем теги
        for (const tag of manga.tags || []) {
            const lowerTag = tag.toLowerCase();
            if (!searchIndex.tags.has(lowerTag)) {
                searchIndex.tags.set(lowerTag, new Set());
            }
            searchIndex.tags.get(lowerTag).add(manga.id);
        }
    }
}

/**
 * Выполняет поиск по манге
 * @param {string} query - Поисковый запрос
 * @param {string} type - Тип поиска (title, author, genre, tag)
 * @param {Array} mangas - Массив манг для поиска
 * @returns {Array} Результаты поиска
 */
export function searchManga(query, type, mangas) {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    let matchingIds = new Set();

    switch (type) {
        case 'title':
            for (const [title, ids] of searchIndex.titles.entries()) {
                if (title.includes(q)) {
                    ids.forEach(id => matchingIds.add(id));
                }
            }
            break;

        case 'author':
            for (const [author, ids] of searchIndex.authors.entries()) {
                if (author.includes(q)) {
                    ids.forEach(id => matchingIds.add(id));
                }
            }
            break;

        case 'genre':
            for (const [genre, ids] of searchIndex.genres.entries()) {
                if (genre.includes(q)) {
                    ids.forEach(id => matchingIds.add(id));
                }
            }
            break;

        case 'tag':
            for (const [tag, ids] of searchIndex.tags.entries()) {
                if (tag.includes(q)) {
                    ids.forEach(id => matchingIds.add(id));
                }
            }
            break;

        default:
            // Комбинированный поиск по всем полям
            for (const index of [searchIndex.titles, searchIndex.authors, searchIndex.genres, searchIndex.tags]) {
                for (const [key, ids] of index.entries()) {
                    if (key.includes(q)) {
                        ids.forEach(id => matchingIds.add(id));
                    }
                }
            }
    }

    // Получаем манги по найденным ID
    const results = Array.from(matchingIds)
        .map(id => mangas.find(m => m.id === id))
        .filter(Boolean)
        .sort((a, b) => {
            // Приоритизируем точные совпадения в названиях
            const aMatch = a.title.toLowerCase() === q || 
                          (a.alternativeTitles && Object.values(a.alternativeTitles)
                           .some(title => title.toLowerCase() === q));
            const bMatch = b.title.toLowerCase() === q || 
                          (b.alternativeTitles && Object.values(b.alternativeTitles)
                           .some(title => title.toLowerCase() === q));
            
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        })
        .slice(0, 20); // Ограничиваем количество результатов

    return results;
}

// Инициализация индекса при запуске
const mangasFile = path.join(__dirname, 'mangas.json');
if (fs.existsSync(mangasFile)) {
    const mangas = JSON.parse(fs.readFileSync(mangasFile, 'utf-8'));
    updateSearchIndex(mangas);
}

// Функция для переиндексации
export function reindexMangas() {
    const mangas = JSON.parse(fs.readFileSync(mangasFile, 'utf-8'));
    updateSearchIndex(mangas);
}