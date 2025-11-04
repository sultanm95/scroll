import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixChaptersStructure() {
    try {
        // Читаем текущие файлы
        const chaptersPath = path.join(__dirname, 'manga-chapters.json');
        const mangasPath = path.join(__dirname, 'mangas.json');

        const chaptersData = JSON.parse(fs.readFileSync(chaptersPath, 'utf-8'));
        const mangasData = JSON.parse(fs.readFileSync(mangasPath, 'utf-8'));

        // Создаем новую структуру данных
        const newChaptersData = {
            chapters: {}
        };

        // Для каждой манги
        for (const manga of mangasData) {
            // Получаем главы по ID манги
            const mangaChapters = chaptersData.chapters[manga.id];
            
            if (mangaChapters) {
                // Добавляем главы под названием манги
                newChaptersData.chapters[manga.title] = mangaChapters;
            }
        }

        // Создаем backup текущего файла
        fs.copyFileSync(chaptersPath, `${chaptersPath}.bak`);

        // Сохраняем новую структуру
        fs.writeFileSync(chaptersPath, JSON.stringify(newChaptersData, null, 2));

        console.log('Chapter structure has been fixed successfully!');
        console.log('Backup of the original file was created at manga-chapters.json.bak');

    } catch (error) {
        console.error('Error fixing chapter structure:', error);
    }
}

// Запускаем исправление
fixChaptersStructure();