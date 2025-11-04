import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { dataCache } from './cache-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ChapterManager {
    constructor() {
        this.chaptersFile = path.join(__dirname, 'manga-chapters.json');
        this.imageBasePath = path.join(__dirname, '..', 'images');
        this.chapterCache = new Map();
    }

    /**
     * Получает структуру глав манги
     * @param {string} mangaName - Название манги
     * @returns {Object} Структура глав
     */
    async getChapterStructure(mangaName) {
        const cacheKey = `chapters:${mangaName}`;
        
        // Проверяем кэш
        const cached = this.chapterCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 минут
            return cached.data;
        }

        try {
            // Сначала проверяем в manga-chapters.json
            const chaptersDb = JSON.parse(fs.readFileSync(this.chaptersFile, 'utf-8'));
            if (chaptersDb.chapters[mangaName]) {
                this.chapterCache.set(cacheKey, {
                    data: chaptersDb.chapters[mangaName],
                    timestamp: Date.now()
                });
                return chaptersDb.chapters[mangaName];
            }

            // Если нет в базе, сканируем директорию
            const structure = await this.scanChapters(mangaName);
            
            // Сохраняем в базу
            chaptersDb.chapters[mangaName] = structure;
            fs.writeFileSync(this.chaptersFile, JSON.stringify(chaptersDb, null, 2));
            
            // Сохраняем в кэш
            this.chapterCache.set(cacheKey, {
                data: structure,
                timestamp: Date.now()
            });

            return structure;
        } catch (error) {
            console.error(`Error getting chapter structure for ${mangaName}:`, error);
            throw error;
        }
    }

    /**
     * Сканирует главы манги
     * @param {string} mangaName - Название манги
     * @returns {Object} Структура глав
     */
    async scanChapters(mangaName) {
        const mangaPath = path.join(this.imageBasePath, mangaName);
        
        if (!fs.existsSync(mangaPath)) {
            throw new Error(`Manga directory ${mangaName} not found`);
        }

        const chapters = fs.readdirSync(mangaPath)
            .filter(file => fs.statSync(path.join(mangaPath, file)).isDirectory())
            .sort((a, b) => parseInt(a) - parseInt(b));

        const chapterData = {};
        const scanPromises = chapters.map(async chapter => {
            const chapterPath = path.join(mangaPath, chapter);
            const chapterStats = fs.statSync(chapterPath);
            
            // Проверяем был ли каталог изменен
            const cacheKey = `chapter:${mangaName}:${chapter}`;
            const cached = this.chapterCache.get(cacheKey);
            
            if (cached && cached.mtime === chapterStats.mtime.toISOString()) {
                chapterData[chapter] = cached.data;
                return;
            }

            const pages = fs.readdirSync(chapterPath)
                .filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
                })
                .sort((a, b) => {
                    const aNum = parseInt(path.basename(a, path.extname(a)));
                    const bNum = parseInt(path.basename(b, path.extname(b)));
                    return aNum - bNum;
                });

            const data = {
                number: parseInt(chapter),
                pageCount: pages.length,
                pages: pages.map(page => ({
                    filename: page,
                    path: `/images/${mangaName}/${chapter}/${page}`
                })),
                mtime: chapterStats.mtime.toISOString()
            };

            chapterData[chapter] = data;
            this.chapterCache.set(cacheKey, {
                data,
                mtime: chapterStats.mtime.toISOString()
            });
        });

        await Promise.all(scanPromises);
        return chapterData;
    }

    /**
     * Получает информацию о конкретной главе
     * @param {string} mangaName - Название манги
     * @param {string} chapterNum - Номер главы
     * @returns {Object} Информация о главе
     */
    async getChapter(mangaName, chapterNum) {
        const structure = await this.getChapterStructure(mangaName);
        return structure[chapterNum];
    }

    /**
     * Проверяет структуру главы
     * @param {string} mangaName - Название манги
     * @param {string} chapterNum - Номер главы
     * @returns {boolean} Валидность структуры
     */
    validateChapter(mangaName, chapterNum) {
        const chapterPath = path.join(this.imageBasePath, mangaName, chapterNum);
        
        if (!fs.existsSync(chapterPath)) {
            return false;
        }

        const files = fs.readdirSync(chapterPath)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
            });

        if (files.length === 0) {
            return false;
        }

        // Проверяем нумерацию файлов
        const numbers = files
            .map(file => parseInt(path.basename(file, path.extname(file))))
            .sort((a, b) => a - b);

        for (let i = 0; i < numbers.length; i++) {
            if (numbers[i] !== i + 1) {
                return false;
            }
        }

        return true;
    }

    /**
     * Обновляет информацию о главах в базе данных
     * @param {string} mangaName - Название манги
     * @returns {Object} Обновленная информация о манге
     */
    async updateChapters(mangaName) {
        const structure = await this.scanChapters(mangaName);
        const chaptersDb = JSON.parse(fs.readFileSync(this.chaptersFile, 'utf-8'));
        
        chaptersDb.chapters[mangaName] = structure;
        fs.writeFileSync(this.chaptersFile, JSON.stringify(chaptersDb, null, 2));

        // Обновляем информацию в основной базе манги
        const mangasFile = path.join(__dirname, 'mangas.json');
        const mangas = JSON.parse(fs.readFileSync(mangasFile, 'utf-8'));
        const manga = mangas.find(m => 
            m.title.toLowerCase() === mangaName.toLowerCase() ||
            (m.alternativeTitles && Object.values(m.alternativeTitles)
                .some(title => title.toLowerCase() === mangaName.toLowerCase()))
        );

        if (manga) {
            manga.chapterCount = Object.keys(structure).length;
            manga.lastUpdate = new Date().toISOString();
            fs.writeFileSync(mangasFile, JSON.stringify(mangas, null, 2));
        }

        return {
            name: mangaName,
            chapterCount: Object.keys(structure).length,
            chapters: structure
        };
    }

    /**
     * Очищает кэш глав
     * @param {string} [mangaName] - Название манги (если не указано, очищает весь кэш)
     */
    clearCache(mangaName) {
        if (mangaName) {
            // Очищаем кэш только для указанной манги
            for (const [key] of this.chapterCache) {
                if (key.startsWith(`chapters:${mangaName}`) || key.startsWith(`chapter:${mangaName}`)) {
                    this.chapterCache.delete(key);
                }
            }
        } else {
            // Очищаем весь кэш
            this.chapterCache.clear();
        }
    }
}

export const chapterManager = new ChapterManager();