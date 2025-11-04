import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { imageCache } from './cache-manager.js';
import sharp from 'sharp';
import QueueManager from './queue-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ImageManager {
    constructor() {
        this.imageBasePath = path.join(__dirname, '..', 'images');
        this.thumbsPath = path.join(__dirname, '..', 'thumbnails');
        this.queueManager = new QueueManager();
        
        // Create thumbnails directory if it doesn't exist
        if (!fs.existsSync(this.thumbsPath)) {
            fs.mkdirSync(this.thumbsPath, { recursive: true });
        }
    }

    /**
     * Получает путь к изображению
     * @param {string} mangaName - Название манги
     * @param {string} chapter - Номер главы
     * @param {string} page - Имя файла страницы
     * @returns {string} Путь к изображению
     */
    getImagePath(mangaName, chapter, page) {
        return path.join(this.imageBasePath, mangaName, chapter, page);
    }

    /**
     * Создает миниатюру изображения
     * @param {string} imagePath - Путь к оригинальному изображению
     * @param {number} width - Ширина миниатюры
     * @param {number} height - Высота миниатюры
     * @returns {Promise<string>} Путь к миниатюре
     */
    async createThumbnail(imagePath, width = 200, height = 300) {
        const thumbDir = path.join(
            this.thumbsPath,
            path.relative(this.imageBasePath, path.dirname(imagePath))
        );
        
        if (!fs.existsSync(thumbDir)) {
            fs.mkdirSync(thumbDir, { recursive: true });
        }

        const filename = path.basename(imagePath);
        const thumbPath = path.join(thumbDir, `thumb_${filename}`);

        // Проверяем существование и актуальность миниатюры
        if (fs.existsSync(thumbPath)) {
            const origStats = fs.statSync(imagePath);
            const thumbStats = fs.statSync(thumbPath);
            
            if (thumbStats.mtime >= origStats.mtime) {
                return thumbPath;
            }
        }

        // Queue thumbnail creation
        const result = await this.queueManager.addTask({
            sourcePath: imagePath,
            outputPath: thumbPath,
            operation: 'thumbnail',
            options: { width, height }
        });

        if (!result.success) {
            throw new Error(`Failed to create thumbnail: ${result.error}`);
        }

        return thumbPath;
    }

    /**
     * Оптимизирует изображение
     * @param {string} imagePath - Путь к изображению
     * @returns {Promise<void>}
     */
    async optimizeImage(imagePath) {
        const tempPath = imagePath + '.temp';

        try {
            const result = await this.queueManager.addTask({
                sourcePath: imagePath,
                outputPath: tempPath,
                operation: 'optimize',
                options: {}
            });

            if (result.success) {
                fs.renameSync(tempPath, imagePath);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error(`Error optimizing image ${imagePath}:`, error);
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }
    }

    /**
     * Получает информацию об изображении
     * @param {string} imagePath - Путь к изображению
     * @returns {Promise<Object>} Информация об изображении
     */
    async getImageInfo(imagePath) {
        const cacheKey = `imageInfo:${imagePath}`;
        const cached = imageCache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        const metadata = await sharp(imagePath).metadata();
        const stats = fs.statSync(imagePath);
        
        const info = {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: stats.size,
            mtime: stats.mtime
        };

        imageCache.set(cacheKey, info);
        return info;
    }

    /**
     * Проверяет и исправляет нумерацию страниц в главе
     * @param {string} mangaName - Название манги
     * @param {string} chapter - Номер главы
     * @returns {Promise<boolean>} Результат проверки и исправления
     */
    async validateAndFixPages(mangaName, chapter) {
        const chapterPath = path.join(this.imageBasePath, mangaName, chapter);
        
        if (!fs.existsSync(chapterPath)) {
            return false;
        }

        const files = fs.readdirSync(chapterPath)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
            })
            .sort((a, b) => {
                const aNum = parseInt(path.basename(a, path.extname(a)));
                const bNum = parseInt(path.basename(b, path.extname(b)));
                return aNum - bNum;
            });

        if (files.length === 0) {
            return false;
        }

        let needsFix = false;
        for (let i = 0; i < files.length; i++) {
            const expectedNum = (i + 1).toString().padStart(3, '0');
            const file = files[i];
            const ext = path.extname(file);
            const expectedName = `${expectedNum}${ext}`;

            if (file !== expectedName) {
                const oldPath = path.join(chapterPath, file);
                const newPath = path.join(chapterPath, expectedName);
                fs.renameSync(oldPath, newPath);
                needsFix = true;
            }
        }

        return true;
    }

    /**
     * Converts image to WebP format
     * @param {string} imagePath - Path to image
     * @returns {Promise<string>} Path to converted image
     */
    async convertToWebP(imagePath) {
        const webpPath = imagePath.replace(/\.[^.]+$/, '.webp');
        
        try {
            const result = await this.queueManager.addTask({
                sourcePath: imagePath,
                outputPath: webpPath,
                operation: 'convert',
                options: {}
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            return webpPath;
        } catch (error) {
            console.error(`Error converting image to WebP ${imagePath}:`, error);
            throw error;
        }
    }

    /**
     * Shuts down the queue manager
     */
    async shutdown() {
        await this.queueManager.shutdown();
    }
}

export const imageManager = new ImageManager();