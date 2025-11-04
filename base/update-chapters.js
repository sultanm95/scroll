import { chapterManager } from './manga-chapters.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updateAllMangaChapters() {
    try {
        // Читаем список манг
        const mangasPath = path.join(__dirname, 'mangas.json');
        const mangas = JSON.parse(fs.readFileSync(mangasPath, 'utf-8'));

        // Для каждой манги обновляем главы
        for (const manga of mangas) {
            console.log(`Updating chapters for ${manga.title}...`);
            try {
                // Принудительное обновление, игнорируя кэш
                await chapterManager.updateChapters(manga.title, true);
                console.log(`✓ Successfully updated chapters for ${manga.title}`);
            } catch (error) {
                console.error(`× Error updating chapters for ${manga.title}:`, error.message);
            }
        }

        console.log('\nUpdate completed!');

    } catch (error) {
        console.error('Error updating manga chapters:', error);
    }
}

// Запускаем обновление
updateAllMangaChapters();