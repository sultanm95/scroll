// Simple static server for your frontend (ESM)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 5500;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '..')));

app.listen(PORT, () => {
  console.log(`Frontend running at http://localhost:${PORT}`);
});
