const express = require('express');
const fetch = require('node-fetch');
const logger = require('../utils/logger');

const router = express.Router();

const MANGADEX_API = 'https://api.mangadex.org';

// Error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
        logger.error('MangaDex API error:', err);
        res.status(500).json({
            error: 'Failed to fetch from MangaDex',
            message: err.message
        });
    });
};

// Get manga by ID
router.get('/manga/:id', async (req, res) => {
    try {
        const response = await fetch(`${MANGADEX_API}/manga/${req.params.id}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('MangaDex API error:', error);
        res.status(500).json({ error: 'Failed to fetch manga details' });
    }
});

// Find manga by title (for AniList integration)
router.get('/findByTitle', async (req, res) => {
    const title = req.query.title;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const response = await fetch(`${MANGADEX_API}/manga?title=${encodeURIComponent(title)}&limit=5`);
        const data = await response.json();

        if (data.data?.length > 0) {
            // Find best match by comparing titles
            const bestMatch = data.data.find(m =>
                m.attributes.title.en?.toLowerCase() === title.toLowerCase() ||
                m.attributes.title["ja-ro"]?.toLowerCase() === title.toLowerCase()
            ) || data.data[0];

            res.json(bestMatch);
        } else {
            res.status(404).json({ error: 'No manga found' });
        }
    } catch (error) {
        console.error('MangaDex API error:', error);
        res.status(500).json({ error: 'Failed to fetch from MangaDex' });
    }
});

// Get manga chapters
router.get('/manga/:mangaId/chapters', async (req, res) => {
    try {
        const response = await fetch(
            `${MANGADEX_API}/manga/${req.params.mangaId}/feed?limit=100&translatedLanguage[]=en&order[chapter]=asc`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('MangaDex API error:', error);
        res.status(500).json({ error: 'Failed to fetch chapters' });
    }
});

// Get chapter pages
router.get('/chapter/:chapterId/pages', async (req, res) => {
    try {
        const response = await fetch(`${MANGADEX_API}/at-home/server/${req.params.chapterId}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('MangaDex API error:', error);
        res.status(500).json({ error: 'Failed to fetch chapter pages' });
    }
});

module.exports = router;