const API_BASE_URL = 'http://localhost:3001/api/anilist';

export async function fetchPopularManga(page = 1, perPage = 20, showNSFW = false) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/popular?page=${page}&perPage=${perPage}&nsfw=${showNSFW}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch popular manga');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching popular manga:', error);
        throw error;
    }
}

export async function searchManga(query, page = 1, perPage = 20, showNSFW = false) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}&perPage=${perPage}&nsfw=${showNSFW}`
        );

        if (!response.ok) {
            throw new Error('Failed to search manga');
        }

        return await response.json();
    } catch (error) {
        console.error('Error searching manga:', error);
        throw error;
    }
}

export async function getMangaDetails(id, showNSFW = false) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/manga/${id}?nsfw=${showNSFW}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch manga details');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching manga details:', error);
        throw error;
    }
}
