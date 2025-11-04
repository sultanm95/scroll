import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Scans a manga directory and returns its chapter structure
 * @param {string} mangaName - Name of the manga (folder name)
 * @returns {Object} Manga chapter structure
 */
export async function scanMangaChapters(mangaName) {
    try {
        // Construct path to manga directory
        const mangaBasePath = path.join(__dirname, '..', 'images', mangaName);
        
        // Check if manga directory exists
        if (!fs.existsSync(mangaBasePath)) {
            throw new Error(`Manga directory ${mangaName} not found`);
        }

        // Get all chapter directories
        const chapters = fs.readdirSync(mangaBasePath)
            .filter(file => {
                const fullPath = path.join(mangaBasePath, file);
                return fs.statSync(fullPath).isDirectory();
            })
            .sort((a, b) => {
                // Natural number sorting for chapter numbers
                return parseInt(a) - parseInt(b);
            });

        // Read existing manga-chapters.json or create new one
        const chaptersPath = path.join(__dirname, 'manga-chapters.json');
        let chaptersDb = { chapters: {} };
        if (fs.existsSync(chaptersPath)) {
            try {
                chaptersDb = JSON.parse(fs.readFileSync(chaptersPath, 'utf-8'));
            } catch (e) {
                console.error('Error reading manga-chapters.json:', e);
            }
        }

        // Scan each chapter for pages
        const mangaChapters = {};
        for (const chapter of chapters) {
            const chapterPath = path.join(mangaBasePath, chapter);
            const pages = fs.readdirSync(chapterPath)
                .filter(file => {
                    // Filter for image files
                    const ext = path.extname(file).toLowerCase();
                    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
                })
                .sort((a, b) => {
                    // Natural number sorting for page numbers
                    const aNum = parseInt(path.basename(a, path.extname(a)));
                    const bNum = parseInt(path.basename(b, path.extname(b)));
                    return aNum - bNum;
                });

            const jpgPages = pages.filter(page => !page.endsWith('.webp')); // Only include jpg files
            mangaChapters[chapter] = {
                number: parseInt(chapter),
                pageCount: jpgPages.length,
                pages: jpgPages.map(page => ({
                    filename: page,
                    path: `/images/${mangaName}/${chapter}/${page}`
                }))
            };
        }

        // Save chapter data to file
        chaptersDb.chapters[mangaName] = mangaChapters;
        fs.writeFileSync(chaptersPath, JSON.stringify(chaptersDb, null, 2));

        return {
            name: mangaName,
            chapterCount: chapters.length,
            chapters: mangaChapters
        };
    } catch (error) {
        console.error(`Error scanning manga ${mangaName}:`, error);
        throw error;
    }
}

/**
 * Validates a new chapter directory structure
 * @param {string} mangaName - Name of the manga
 * @param {string} chapterDir - Chapter directory name
 * @returns {boolean} Whether the chapter structure is valid
 */
export function validateChapterStructure(mangaName, chapterDir) {
    const chapterPath = path.join(__dirname, '..', 'images', mangaName, chapterDir);
    
    try {
        // Check if directory exists
        if (!fs.existsSync(chapterPath)) {
            return false;
        }

        // Get all files in the chapter directory
        const files = fs.readdirSync(chapterPath)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
            });

        // Check if there are any image files
        if (files.length === 0) {
            return false;
        }

        // Check if files are numbered correctly
        const numbers = files.map(file => 
            parseInt(path.basename(file, path.extname(file)))
        ).sort((a, b) => a - b);

        // Check if numbers are sequential
        for (let i = 0; i < numbers.length; i++) {
            if (numbers[i] !== i + 1) {
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error(`Error validating chapter structure for ${mangaName}/${chapterDir}:`, error);
        return false;
    }
}

/**
 * Updates manga data in the database
 * @param {string} mangaName - Name of the manga
 * @param {Object} chapterData - New chapter data
 * @returns {Object} Updated manga data
 */
export async function updateMangaData(mangaName, chapterData) {
    const mangasPath = path.join(__dirname, 'mangas.json');
    const chaptersPath = path.join(__dirname, 'manga-chapters.json');
    
    try {
        // Read current databases
        const mangas = JSON.parse(fs.readFileSync(mangasPath, 'utf-8'));
        const chaptersDb = JSON.parse(fs.readFileSync(chaptersPath, 'utf-8'));
        
        // Find existing manga or create new entry
        let manga = mangas.find(m => m.title.toLowerCase() === mangaName.toLowerCase());
        
        if (!manga) {
            // Create new manga entry
            manga = {
                id: Date.now().toString(),
                title: mangaName,
                lastUpdate: new Date().toISOString()
            };
            mangas.push(manga);
        }

        // Initialize chapters object for this manga if it doesn't exist
        if (!chaptersDb.chapters[mangaName]) {
            chaptersDb.chapters[mangaName] = {};
        }

        // Update chapter data
        chaptersDb.chapters[mangaName] = chapterData.chapters;
        manga.chapterCount = chapterData.chapterCount;
        manga.lastUpdate = new Date().toISOString();

        // Save updated databases
        fs.writeFileSync(mangasPath, JSON.stringify(mangas, null, 2));
        fs.writeFileSync(chaptersPath, JSON.stringify(chaptersDb, null, 2));
        
        return manga;
    } catch (error) {
        console.error(`Error updating manga data for ${mangaName}:`, error);
        throw error;
    }
}