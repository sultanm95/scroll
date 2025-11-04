const fetch = require('node-fetch');
const logger = require('./logger');

class FetchManager {
    constructor() {
        this.retryCount = 3;
        this.retryDelay = 1000;
    }

    async fetchWithRetry(url, options = {}, currentTry = 1) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${error}`);
            }

            return await response.json();
        } catch (error) {
            if (currentTry < this.retryCount) {
                logger.warn(`Retry attempt ${currentTry} for URL: ${url}`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.fetchWithRetry(url, options, currentTry + 1);
            }
            
            logger.error(`Failed after ${this.retryCount} attempts for URL: ${url}`, error);
            throw error;
        }
    }

    async graphqlRequest(url, query, variables = {}) {
        return this.fetchWithRetry(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables
            })
        });
    }
}

module.exports = new FetchManager();