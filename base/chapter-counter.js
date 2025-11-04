import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function countChapterPages(mangaId, chapterNum) {
    const chapterPath = path.join(__dirname, '..', 'images', mangaId, chapterNum);
    
    if (!fs.existsSync(chapterPath)) {
        console.log(`Chapter path does not exist: ${chapterPath}`);
        return 0;
    }

    try {
        const files = fs.readdirSync(chapterPath);
        // Count only jpg files, not their webp duplicates
        const jpgCount = files.filter(file => 
            file.toLowerCase().endsWith('.jpg') || 
            file.toLowerCase().endsWith('.jpeg')
        ).length;
        
        console.log(`Found ${jpgCount} jpg files in chapter ${chapterNum} of manga ${mangaId}`);
        return jpgCount;
    } catch (error) {
        console.error(`Error counting pages in ${chapterPath}:`, error);
        return 0;
    }
}

export function getAllChapters(mangaId) {
    const mangaPath = path.join(__dirname, '..', 'images', mangaId);
    
    if (!fs.existsSync(mangaPath)) {
        console.log(`Manga path does not exist: ${mangaPath}`);
        return [];
    }

    try {
        const chapterDirs = fs.readdirSync(mangaPath)
            .filter(dir => fs.statSync(path.join(mangaPath, dir)).isDirectory())
            .sort((a, b) => parseInt(a) - parseInt(b));

        const chapters = chapterDirs.map(dir => {
            const chapterPath = path.join(mangaPath, dir);
            const files = fs.readdirSync(chapterPath);
            
            // Get only jpg files for both count and pages array
            const jpgFiles = files.filter(file => 
                file.toLowerCase().endsWith('.jpg') || 
                file.toLowerCase().endsWith('.jpeg')
            );

            return {
                num: dir,
                number: parseInt(dir),
                title: `Chapter ${dir}`,
                pageCount: jpgFiles.length,
                date: fs.statSync(chapterPath).mtime,
                pages: jpgFiles.map(file => ({
                    filename: file,
                    path: `/images/${mangaId}/${dir}/${file}`
                }))
            };
        });

        return chapters;
    } catch (error) {
        console.error(`Error getting chapters for manga ${mangaId}:`, error);
        return [];
    }
}