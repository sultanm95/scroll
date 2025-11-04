const NodeCache = require('node-cache');

class CacheManager {
    constructor(ttlSeconds = 300) { // Default 5 minutes
        this.cache = new NodeCache({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2,
            useClones: false
        });
    }

    get(key) {
        const value = this.cache.get(key);
        if (value) {
            console.log(`Cache hit for key: ${key}`);
            return value;
        }
        console.log(`Cache miss for key: ${key}`);
        return null;
    }

    set(key, value) {
        console.log(`Setting cache for key: ${key}`);
        return this.cache.set(key, value);
    }

    delete(key) {
        console.log(`Deleting cache for key: ${key}`);
        return this.cache.del(key);
    }

    flush() {
        console.log('Flushing entire cache');
        return this.cache.flushAll();
    }

    // Helper method to generate cache keys
    static generateKey(prefix, params) {
        const sortedParams = Object.entries(params)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
        return `${prefix}:${sortedParams}`;
    }
}

module.exports = new CacheManager();