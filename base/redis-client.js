import { createClient } from '@node-redis/client';
import logger from './logger.js';

const redis = createClient({
    url: 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            const delay = Math.min(retries * 50, 2000);
            return delay;
        }
    }
});

redis.on('error', (err) => {
    logger.error('Redis error:', err);
});

redis.on('connect', () => {
    logger.info('Connected to Redis');
});

// Connect to Redis
await redis.connect();

export default redis;