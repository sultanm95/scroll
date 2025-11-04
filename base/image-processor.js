import { parentPort, workerData } from 'worker_threads';
import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';

async function processImage(task) {
    const { sourcePath, outputPath, operation, options } = task;

    try {
        let image = sharp(sourcePath);

        switch (operation) {
            case 'thumbnail':
                image = image
                    .resize(options.width, options.height, {
                        fit: 'contain',
                        background: { r: 255, g: 255, b: 255, alpha: 1 }
                    })
                    .webp({ quality: options.quality || 80 });
                break;

            case 'optimize':
                image = image
                    .webp({ quality: options.quality || 85 })
                    .withMetadata();
                break;

            case 'convert':
                image = image
                    .webp({ quality: options.quality || 90 })
                    .withMetadata();
                break;

            default:
                throw new Error(`Unknown operation: ${operation}`);
        }

        // Ensure output directory exists
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await image.toFile(outputPath);

        return {
            success: true,
            outputPath,
            operation
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            operation
        };
    }
}

if (parentPort) {
    processImage(workerData)
        .then(result => parentPort.postMessage(result))
        .catch(error => parentPort.postMessage({ 
            success: false, 
            error: error.message 
        }));
}