import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class QueueManager {
    constructor(maxWorkers = os.cpus().length) {
        this.queue = [];
        this.activeWorkers = 0;
        this.maxWorkers = maxWorkers;
        this.workers = new Map();
    }

    async addTask(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                task,
                resolve,
                reject
            });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.queue.length === 0 || this.activeWorkers >= this.maxWorkers) {
            return;
        }

        const { task, resolve, reject } = this.queue.shift();
        this.activeWorkers++;

        try {
            const worker = new Worker(path.join(__dirname, 'image-processor.js'), {
                workerData: task
            });

            this.workers.set(worker.threadId, worker);

            worker.on('message', (result) => {
                resolve(result);
                this.cleanupWorker(worker);
            });

            worker.on('error', (error) => {
                reject(error);
                this.cleanupWorker(worker);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
                this.cleanupWorker(worker);
            });
        } catch (error) {
            this.activeWorkers--;
            reject(error);
            this.processQueue();
        }
    }

    cleanupWorker(worker) {
        this.workers.delete(worker.threadId);
        this.activeWorkers--;
        this.processQueue();
    }

    async shutdown() {
        for (const worker of this.workers.values()) {
            worker.terminate();
        }
        this.workers.clear();
        this.queue = [];
        this.activeWorkers = 0;
    }
}

export default QueueManager;