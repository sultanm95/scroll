import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем конфигурацию кэша
const cacheConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'cache-config.json')));

class Cache {
    constructor() {
        this.cache = new Map();
        this.lastUpdate = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
        
        // Автоматическая очистка устаревших записей каждые 15 минут
        setInterval(() => this.cleanExpired(), 900000);
    }
    
    cleanExpired() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, lastUpdate] of this.lastUpdate) {
            const cached = this.cache.get(key);
            if (cached && now - lastUpdate > cached.ttl) {
                this.cache.delete(key);
                this.lastUpdate.delete(key);
                cleaned++;
                this.stats.evictions++;
            }
        }
        return cleaned;
    }

    get(key) {
        if (!cacheConfig.enabled) return null;
        
        const now = Date.now();
        const cached = this.cache.get(key);
        
        if (!cached) {
            this.stats.misses++;
            return null;
        }

        const lastUpdate = this.lastUpdate.get(key) || 0;
        if (now - lastUpdate > cached.ttl) {
            this.cache.delete(key);
            this.lastUpdate.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return cached.data;
    }

    set(key, data, ttl = cacheConfig.ttl) {
        if (!cacheConfig.enabled) return;

        // Если кэш достиг максимального размера, удаляем самую старую запись
        if (this.cache.size >= cacheConfig.maxSize) {
            const oldestKey = Array.from(this.lastUpdate.entries())
                .sort(([, a], [, b]) => a - b)[0][0];
            this.cache.delete(oldestKey);
            this.lastUpdate.delete(oldestKey);
        }

        this.cache.set(key, { data, ttl });
        this.lastUpdate.set(key, Date.now());
    }

    clear() {
        this.cache.clear();
        this.lastUpdate.clear();
        this.stats.hits = 0;
        this.stats.misses = 0;
    }

    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) 
            : 0;
        
        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            size: this.cache.size,
            maxSize: cacheConfig.maxSize
        };
    }

    invalidatePattern(pattern) {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                this.lastUpdate.delete(key);
            }
        }
    }
}

// Создаем отдельные экземпляры кэша для разных типов данных
export const dataCache = new Cache(); // Для JSON данных
export const imageCache = new Cache(); // Для изображений
export const apiCache = new Cache();   // Для API ответов

// Middleware для кэширования
export function cacheMiddleware(cacheName = 'api', keyGenerator = req => `${req.method}:${req.originalUrl}`) {
    const cache = {
        'api': apiCache,
        'data': dataCache,
        'image': imageCache
    }[cacheName];

    if (!cache) throw new Error(`Unknown cache type: ${cacheName}`);

    return (req, res, next) => {
        if (!cacheConfig.enabled) return next();

        const key = keyGenerator(req);
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            // Добавляем заголовки кэширования
            const headers = cacheConfig.paths[cacheName]?.headers || {};
            Object.entries(headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
            return res.json(cachedResponse);
        }

        // Сохраняем оригинальный метод res.json
        const originalJson = res.json;

        // Переопределяем res.json для сохранения ответа в кэш
        res.json = function(data) {
            cache.set(key, data);
            return originalJson.call(this, data);
        };

        next();
    };
}

// Middleware для кэширования изображений
export function imageCacheMiddleware(req, res, next) {
    if (!cacheConfig.enabled) return next();
    
    // Проверяем заголовок If-None-Match
    const clientEtag = req.headers['if-none-match'];
    const key = req.path;
    const cachedImage = imageCache.get(key);

    if (cachedImage) {
        const etag = require('crypto')
            .createHash('md5')
            .update(cachedImage + cacheConfig.version)
            .digest('hex');
            
        if (clientEtag === etag) {
            return res.status(304).end();
        }

        const headers = cacheConfig.paths.images.headers;
        Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.setHeader('ETag', etag);
        return res.sendFile(cachedImage);
    }

    // Сохраняем оригинальный метод sendFile
    const originalSendFile = res.sendFile;

    // Переопределяем sendFile для сохранения файла в кэш с ограничением размера
    res.sendFile = function(path, options, callback) {
        const stats = require('fs').statSync(path);
        // Кэшируем только файлы размером до 5MB
        if (stats.size <= 5242880) {
            imageCache.set(key, path, cacheConfig.paths.images.ttl);
        }
        return originalSendFile.call(this, path, options, callback);
    };

    next();
}