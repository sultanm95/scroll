const MANGADEX_API_BASE = 'https://api.mangadex.org';

export async function findMangaByTitle(title) {
    try {
        // Создаем базовые параметры
        const params = new URLSearchParams({
            title: title,
            limit: '20'
        });
        
        // Добавляем рейтинги контента по отдельности
        ['safe', 'suggestive', 'erotica', 'pornographic'].forEach(rating => {
            params.append('contentRating[]', rating);
        });
        
        // Добавляем включения по отдельности
        ['author', 'artist'].forEach(include => {
            params.append('includes[]', include);
        });

        const response = await fetch(`${MANGADEX_API_BASE}/manga?${params}`);
        const data = await response.json();

        if (!data.data?.length) {
            return null;
        }

        // Улучшенный поиск лучшего совпадения
        const bestMatch = data.data.find(manga => {
            const titles = manga.attributes.title;
            const altTitles = manga.attributes.altTitles || [];
            
            // Проверяем основные и альтернативные названия
            const allTitles = [
                titles.en,
                titles["ja-ro"],
                titles.ja,
                ...altTitles.map(t => Object.values(t)[0])
            ].filter(Boolean).map(t => t.toLowerCase());

            // Ищем точное совпадение
            return allTitles.some(t => t === title.toLowerCase());
        }) || data.data[0];

        return bestMatch;
    } catch (error) {
        console.error('Error finding manga on MangaDex:', error);
        return null;
    }
}

async function fetchChapterPage(mangaId, offset, limit) {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        'order[volume]': 'asc',
        'order[chapter]': 'asc',
    });

    // Добавляем все допустимые языки
    ['en', 'ru', 'ja', 'zh'].forEach(lang => params.append('translatedLanguage[]', lang));

    // Добавляем все типы контента
    ['safe', 'suggestive', 'erotica', 'pornographic'].forEach(rating => 
        params.append('contentRating[]', rating)
    );

    const response = await fetch(`${MANGADEX_API_BASE}/manga/${mangaId}/feed?${params}`);
    return response.json();
}

export async function getMangaChapters(mangaId) {
    try {
        const limit = 500;
        let offset = 0;
        let allChapters = [];

        while (true) {
            const data = await fetchChapterPage(mangaId, offset, limit);
            if (!data.data?.length) break;

            // Только главы с реальными страницами
            const validChapters = data.data.filter(ch => ch.attributes.pages > 0);
            allChapters.push(...validChapters);

            if (data.data.length < limit) break;
            offset += limit;
        }

        // Сортируем по номеру главы
        return allChapters.sort((a, b) => {
            const chA = parseFloat(a.attributes.chapter) || 0;
            const chB = parseFloat(b.attributes.chapter) || 0;
            return chA - chB;
        });
    } catch (error) {
        console.error('Error getting manga chapters:', error);
        return [];
    }
}

export async function getChapterPages(chapterId) {
    try {
        const response = await fetch(`${MANGADEX_API_BASE}/at-home/server/${chapterId}`);
        const data = await response.json();
        return data.chapter?.data?.map(page => `${data.baseUrl}/data/${data.chapter.hash}/${page}`) || [];
    } catch (error) {
        console.error('Error getting chapter pages:', error);
        return [];
    }
}
