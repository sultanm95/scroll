import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { dataCache } from './cache-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CollectionsManager {
    constructor() {
        this.collectionsFile = path.join(__dirname, 'users.json');
    }

    async getCollections(userId) {
        try {
            const users = JSON.parse(fs.readFileSync(this.collectionsFile, 'utf-8'));
            const user = users.find(u => u.id === userId);
            return user ? user.collections || [] : [];
        } catch (error) {
            console.error('Error getting collections:', error);
            return [];
        }
    }

    async addToCollection(userId, collectionName, mangaId) {
        try {
            const users = JSON.parse(fs.readFileSync(this.collectionsFile, 'utf-8'));
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }

            if (!users[userIndex].collections) {
                users[userIndex].collections = {};
            }

            if (!users[userIndex].collections[collectionName]) {
                users[userIndex].collections[collectionName] = [];
            }

            if (!users[userIndex].collections[collectionName].includes(mangaId)) {
                users[userIndex].collections[collectionName].push(mangaId);
                fs.writeFileSync(this.collectionsFile, JSON.stringify(users, null, 2));
            }

            return true;
        } catch (error) {
            console.error('Error adding to collection:', error);
            return false;
        }
    }

    async removeFromCollection(userId, collectionName, mangaId) {
        try {
            const users = JSON.parse(fs.readFileSync(this.collectionsFile, 'utf-8'));
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex === -1 || 
                !users[userIndex].collections || 
                !users[userIndex].collections[collectionName]) {
                return false;
            }

            const collection = users[userIndex].collections[collectionName];
            const index = collection.indexOf(mangaId);
            
            if (index !== -1) {
                collection.splice(index, 1);
                fs.writeFileSync(this.collectionsFile, JSON.stringify(users, null, 2));
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error removing from collection:', error);
            return false;
        }
    }

    async createCollection(userId, collectionName) {
        try {
            const users = JSON.parse(fs.readFileSync(this.collectionsFile, 'utf-8'));
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }

            if (!users[userIndex].collections) {
                users[userIndex].collections = {};
            }

            if (!users[userIndex].collections[collectionName]) {
                users[userIndex].collections[collectionName] = [];
                fs.writeFileSync(this.collectionsFile, JSON.stringify(users, null, 2));
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error creating collection:', error);
            return false;
        }
    }

    async deleteCollection(userId, collectionName) {
        try {
            const users = JSON.parse(fs.readFileSync(this.collectionsFile, 'utf-8'));
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex === -1 || 
                !users[userIndex].collections || 
                !users[userIndex].collections[collectionName]) {
                return false;
            }

            delete users[userIndex].collections[collectionName];
            fs.writeFileSync(this.collectionsFile, JSON.stringify(users, null, 2));
            return true;
        } catch (error) {
            console.error('Error deleting collection:', error);
            return false;
        }
    }
}

export const collectionsManager = new CollectionsManager();