const express = require('express');
const router = express.Router();
const cache = require('../utils/cache');
const fetch = require('../utils/fetch');
const logger = require('../utils/logger');

const ANILIST_API_URL = 'https://graphql.anilist.co';

// Helper function to filter NSFW content
function filterNSFWContent(data, allowNSFW = false) {
    if (!data || !data.media) return data;

    if (Array.isArray(data.media)) {
        data.media = data.media.filter(item => allowNSFW || !item.isAdult);
    } else if (data.media.isAdult && !allowNSFW) {
        return null;
    }

    return data;
}

// Get popular manga
router.get('/popular', async (req, res) => {
    try {
        const allowNSFW = req.query.nsfw === 'true';
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 20;

        const cacheKey = cache.generateKey('popular', { page, perPage, nsfw: allowNSFW });
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            return res.json(cachedData);
        }

        const query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                        perPage
                    }
                    media(type: MANGA, sort: POPULARITY_DESC) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        description
                        averageScore
                        popularity
                        isAdult
                        status
                        startDate {
                            year
                            month
                            day
                        }
                    }
                }
            }
        `;

        const response = await fetch.graphqlRequest(ANILIST_API_URL, query, {
            page,
            perPage
        });

        const filteredData = filterNSFWContent(response.data.Page, allowNSFW);
        cache.set(cacheKey, filteredData);
        
        res.json(filteredData);
    } catch (error) {
        logger.error('Error fetching popular manga:', error);
        res.status(500).json({ error: 'Failed to fetch popular manga' });
    }
});

// Search manga
router.get('/search', async (req, res) => {
    try {
        const { query: searchQuery, page = 1, perPage = 20 } = req.query;
        const allowNSFW = req.query.nsfw === 'true';

        if (!searchQuery) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const cacheKey = cache.generateKey('search', { 
            query: searchQuery, 
            page, 
            perPage, 
            nsfw: allowNSFW 
        });
        
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        const query = `
            query ($search: String, $page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                        perPage
                    }
                    media(type: MANGA, search: $search) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        description
                        averageScore
                        popularity
                        isAdult
                        status
                        startDate {
                            year
                            month
                            day
                        }
                    }
                }
            }
        `;

        const response = await fetch.graphqlRequest(ANILIST_API_URL, query, {
            search: searchQuery,
            page: parseInt(page),
            perPage: parseInt(perPage)
        });

        const filteredData = filterNSFWContent(response.data.Page, allowNSFW);
        cache.set(cacheKey, filteredData);

        res.json(filteredData);
    } catch (error) {
        logger.error('Error searching manga:', error);
        res.status(500).json({ error: 'Failed to search manga' });
    }
});

// Get manga details
router.get('/manga/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const allowNSFW = req.query.nsfw === 'true';

        const cacheKey = cache.generateKey('manga', { id, nsfw: allowNSFW });
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            return res.json(cachedData);
        }

        const query = `
            query ($id: Int) {
                Media(id: $id, type: MANGA) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    coverImage {
                        large
                        medium
                    }
                    bannerImage
                    description
                    averageScore
                    popularity
                    isAdult
                    status
                    startDate {
                        year
                        month
                        day
                    }
                    genres
                    tags {
                        id
                        name
                        description
                        category
                    }
                    chapters
                    volumes
                    synonyms
                    staff {
                        edges {
                            role
                            node {
                                id
                                name {
                                    full
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await fetch.graphqlRequest(ANILIST_API_URL, query, {
            id: parseInt(id)
        });

        const filteredData = filterNSFWContent(response.data, allowNSFW);
        
        if (!filteredData) {
            return res.status(403).json({ error: 'NSFW content is filtered' });
        }

        cache.set(cacheKey, filteredData);
        res.json(filteredData);
    } catch (error) {
        logger.error(`Error fetching manga details for ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to fetch manga details' });
    }
});

module.exports = router;