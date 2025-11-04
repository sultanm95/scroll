import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { dirname } from 'path';
import jwt from 'jsonwebtoken';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import local modules
import { verifyToken } from './middleware/auth.js';
import { searchManga, reindexMangas } from './search-manager.js';
import { chapterManager } from './manga-chapters.js';
import { imageManager } from './image-manager.js';
import { scanMangaChapters } from './manga-scanner.js';
import logger from './utils/logger.js';

// Setup ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseDir = __dirname;

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable
const mangasFile = path.join(baseDir, 'mangas.json');
const usersFile = path.join(baseDir, 'users.json');

// Helper functions
function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
const uploadsDir = path.join(baseDir, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const prefix = file.fieldname === 'background' ? 'bg' : 'avatar';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = function(req, file, cb) {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  const mimetype = file.mimetype.toLowerCase();
  if (!mimetype.match(/^image\/(jpeg|png|gif)$/)) {
    return cb(new Error('Invalid file type'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for all files
  }
});

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Origin', 'Accept', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Content-Length'],
  credentials: true
}));

// Enable CORS for image requests
const corsForImages = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
};

app.use('/uploads', corsForImages);
app.use('/base/uploads', corsForImages);
app.use('/images', corsForImages);

// Set cache control headers for images
app.use('/images', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// We use the verifyToken middleware imported from './middleware/auth.js'



// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(baseDir, 'uploads')));
app.use('/base/uploads', express.static(path.join(baseDir, 'uploads')));
// Serve manga images from the images directory (one level up from base)
app.use('/images', express.static(path.join(baseDir, '..', 'images')));
// Serve thumbnail images
app.use('/thumbnails', express.static(path.join(baseDir, '..', 'thumbnails')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }
  if (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
  next();
});

// Get user's manga lists and favorites
app.get('/api/users/:userId/library', verifyToken, (req, res) => {
  const { userId } = req.params;
  const users = readJSON(usersFile);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Initialize library if it doesn't exist
  if (!user.library) {
    user.library = {
      favorites: [],
      reading: [],
      completed: [],
      planToRead: [],
      dropped: []
    };
  }

  res.json(user.library);
});

// Add/remove manga from user's list
app.post('/api/users/:userId/list', verifyToken, (req, res) => {
  const { userId } = req.params;
  const { mangaId, status, manga } = req.body;
  
  if (!mangaId || !status || !manga) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const users = readJSON(usersFile);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Initialize library structure if it doesn't exist
  if (!user.library) {
    user.library = {
      favorites: [],
      reading: [],
      completed: [],
      planToRead: [],
      dropped: []
    };
  }

  // Remove manga from all lists first
  ['reading', 'completed', 'planToRead', 'dropped'].forEach(listType => {
    user.library[listType] = user.library[listType].filter(m => m.id !== mangaId);
  });

  // Add manga to the specified list
  manga.addedDate = new Date().toISOString();
  manga.status = status;
  user.library[status].push(manga);

  writeJSON(usersFile, users);
  res.json({ added: true, status });
});

// Add/remove manga from favorites
app.post('/api/users/:userId/favorites', verifyToken, (req, res) => {
  const { userId } = req.params;
  const { mangaId, manga } = req.body;
  
  if (!mangaId || !manga) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const users = readJSON(usersFile);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Initialize library structure if it doesn't exist
  if (!user.library) {
    user.library = {
      favorites: [],
      reading: [],
      completed: [],
      planToRead: [],
      dropped: []
    };
  }

  const isFavorite = user.library.favorites.some(m => m.id === mangaId);
  
  if (isFavorite) {
    // Remove from favorites
    user.library.favorites = user.library.favorites.filter(m => m.id !== mangaId);
  } else {
    // Add to favorites
    manga.addedDate = new Date().toISOString();
    user.library.favorites.push(manga);
  }

  writeJSON(usersFile, users);
  res.json({ isFavorite: !isFavorite });
});

// Remove manga from user's list
app.delete('/api/users/:userId/list/:mangaId', verifyToken, (req, res) => {
  const { userId, mangaId } = req.params;
  const users = readJSON(usersFile);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.library) {
    user.library = {
      favorites: [],
      reading: [],
      completed: [],
      planToRead: [],
      dropped: []
    };
  }

  // Remove from all list sections
  ['reading', 'completed', 'planToRead', 'dropped'].forEach(listType => {
    user.library[listType] = user.library[listType].filter(m => m.id !== mangaId);
  });

  writeJSON(usersFile, users);
  res.json({ success: true, message: 'Removed from list' });
});


// Upload custom avatar
app.post('/api/user/avatar/upload', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const username = req.body.username;
    if (!username) {
      // Clean up uploaded file if username is missing
      await fs.promises.unlink(req.file.path);
      return res.status(400).json({ error: 'Missing username' });
    }

    const users = readJSON(usersFile);
    const user = users.find(u => u.username === username);
    if (!user) {
      // Clean up uploaded file if user not found
      await fs.promises.unlink(req.file.path);
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old avatar file if it exists and is in uploads directory
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const oldAvatarPath = path.join(baseDir, user.avatar);
      try {
        await fs.promises.unlink(oldAvatarPath);
      } catch (err) {
        console.error('Error deleting old avatar:', err);
        // Continue even if old file deletion fails
      }
    }

    // Update user's avatar path
    user.avatar = `/uploads/${req.file.filename}`;
    writeJSON(usersFile, users);

    res.json({
      success: true,
      avatar: `http://localhost:${PORT}${user.avatar}`
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (err) {
        console.error('Error cleaning up file:', err);
      }
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Update user avatar (profile page) - for preset avatars
app.post('/api/user/avatar', (req, res) => {
  const { username, avatar } = req.body;
  if (!username || !avatar) return res.status(400).json({ error: 'Missing username or avatar' });
  const users = readJSON(usersFile);
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // If user had a custom avatar, delete it
  if (user.avatar && user.avatar.startsWith('/uploads/')) {
    const oldAvatarPath = path.join(baseDir, user.avatar);
    if (fs.existsSync(oldAvatarPath)) {
      fs.unlinkSync(oldAvatarPath);
    }
  }

  user.avatar = avatar;
  writeJSON(usersFile, users);
  res.json({ success: true });
});

// Upload custom background
app.post('/api/user/background/upload', upload.single('background'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const username = req.body.username;
    if (!username) {
      // Clean up uploaded file if username is missing
      await fs.promises.unlink(req.file.path);
      return res.status(400).json({ error: 'Missing username' });
    }

    const users = readJSON(usersFile);
    const user = users.find(u => u.username === username);
    if (!user) {
      // Clean up uploaded file if user not found
      await fs.promises.unlink(req.file.path);
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old background file if it exists and is in uploads directory
    if (user.background && user.background.startsWith('/uploads/')) {
      const oldBackgroundPath = path.join(baseDir, user.background);
      try {
        await fs.promises.unlink(oldBackgroundPath);
      } catch (err) {
        console.error('Error deleting old background:', err);
        // Continue even if old file deletion fails
      }
    }

    // Update user's background path
    user.background = `/uploads/${req.file.filename}`;
    writeJSON(usersFile, users);

    res.json({
      success: true,
      background: `http://localhost:${PORT}${user.background}`
    });
  } catch (error) {
    console.error('Background upload error:', error);
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (err) {
        console.error('Error cleaning up file:', err);
      }
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Update user background (for preset backgrounds)
app.post('/api/user/background', (req, res) => {
  const { username, background } = req.body;
  if (!username || !background) return res.status(400).json({ error: 'Missing username or background' });
  const users = readJSON(usersFile);
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // If user had a custom background, delete it
  if (user.background && user.background.startsWith('/uploads/')) {
    const oldBackgroundPath = path.join(baseDir, user.background);
    if (fs.existsSync(oldBackgroundPath)) {
      fs.unlinkSync(oldBackgroundPath);
    }
  }

  user.background = background;
  writeJSON(usersFile, users);
  res.json({ success: true });
});

// Manga endpoints
app.get('/api/mangas', (req, res) => {
  const mangas = readJSON(mangasFile);
  res.json(mangas);
});

// Get manga status for user
app.get('/api/manga/:id/status', verifyToken, (req, res) => {
  const { id } = req.params;
  const users = readJSON(usersFile);
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isFavorite = user.library?.favorites?.some(m => m.id === id) || false;
  let status = null;

  ['reading', 'completed', 'planToRead', 'dropped'].forEach(listType => {
    if (user.library?.[listType]?.some(m => m.id === id)) {
      status = listType;
    }
  });

  res.json({ isFavorite, status });
});

// Toggle favorite status
app.post('/api/manga/:id/favorite', verifyToken, async (req, res) => {
  const { id } = req.params;
  const users = readJSON(usersFile);
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Initialize library if it doesn't exist
  if (!user.library) {
    user.library = {
      favorites: [],
      reading: [],
      completed: [],
      planToRead: [],
      dropped: []
    };
  }

  // Get manga details
  const mangas = readJSON(mangasFile);
  const manga = mangas.find(m => m.id === id);
  if (!manga) {
    return res.status(404).json({ error: 'Manga not found' });
  }

  const isFavorite = user.library.favorites.some(m => m.id === id);
  
  if (isFavorite) {
    user.library.favorites = user.library.favorites.filter(m => m.id !== id);
  } else {
    const mangaData = {
      id: manga.id,
      title: manga.title,
      cover: manga.cover,
      author: manga.author,
      addedDate: new Date().toISOString()
    };
    user.library.favorites.push(mangaData);
  }

  writeJSON(usersFile, users);
  res.json({ isFavorite: !isFavorite });
});

// Update manga status
app.post('/api/manga/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const users = readJSON(usersFile);
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Initialize library if it doesn't exist
  if (!user.library) {
    user.library = {
      favorites: [],
      reading: [],
      completed: [],
      planToRead: [],
      dropped: []
    };
  }

  // Get manga details
  const mangas = readJSON(mangasFile);
  const manga = mangas.find(m => m.id === id);
  if (!manga) {
    return res.status(404).json({ error: 'Manga not found' });
  }

  // Remove from all lists first
  ['reading', 'completed', 'planToRead', 'dropped'].forEach(listType => {
    user.library[listType] = user.library[listType].filter(m => m.id !== id);
  });

  // Add to new status list if status is provided
  if (status) {
    const mangaData = {
      id: manga.id,
      title: manga.title,
      cover: manga.cover,
      author: manga.author,
      addedDate: new Date().toISOString(),
      status: status
    };
    user.library[status].push(mangaData);
  }

  writeJSON(usersFile, users);
  res.json({ status });
});

// Get individual manga by ID
app.get('/api/manga/:id', async (req, res) => {
  const mangas = readJSON(mangasFile);
  const manga = mangas.find(m => m.id === req.params.id);
  if (!manga) {
    return res.status(404).json({ error: 'Manga not found' });
  }
  
  try {
    // Get chapters from filesystem
    const chaptersPath = path.join(__dirname, 'manga-chapters.json');
    if (fs.existsSync(chaptersPath)) {
      const chaptersDb = JSON.parse(fs.readFileSync(chaptersPath, 'utf-8'));
      if (chaptersDb.chapters && chaptersDb.chapters[manga.id]) {
        manga.chapters = chaptersDb.chapters[manga.id];
      }
    }
    
    // If no cached chapters found, scan the filesystem
    if (!manga.chapters) {
      const structure = await scanMangaChapters(manga.id.toString());
      manga.chapters = structure.chapters;
      manga.chapterCount = structure.chapterCount;
    }
    
    res.json(manga);
  } catch (error) {
    console.error('Error getting manga chapters:', error);
    res.status(500).json({
      error: 'Failed to get manga chapters',
      details: error.message
    });
  }
});

// Update manga endpoint
app.put('/api/manga/:id', (req, res) => {
  const mangas = readJSON(mangasFile);
  const manga = mangas.find(m => m.id === req.params.id);
  if (!manga) {
    return res.status(404).json({ error: 'Manga not found' });
  }
  
  const updates = req.body;
  // Prevent changing the ID
  delete updates.id;
  
  // Update manga properties
  Object.assign(manga, updates);
  
  // Save changes
  writeJSON(mangasFile, mangas);
  res.json(manga);
});

// These imports are already at the top of the file

// Get individual chapter by manga ID and chapter number
app.get('/api/manga/:id/chapter/:chapterNum', async (req, res) => {
  const { id, chapterNum } = req.params;
  
  try {
    // Check if manga exists
    const mangas = readJSON(mangasFile);
    const manga = mangas.find(m => m.id === id);
    if (!manga) {
      return res.status(404).json({ error: 'Manga not found' });
    }
    
    // Get chapters from filesystem
    const chaptersPath = path.join(__dirname, 'manga-chapters.json');
    let chapters = null;
    
    if (fs.existsSync(chaptersPath)) {
      const chaptersDb = JSON.parse(fs.readFileSync(chaptersPath, 'utf-8'));
      if (chaptersDb.chapters && chaptersDb.chapters[id] && chaptersDb.chapters[id][chapterNum]) {
        chapters = chaptersDb.chapters[id][chapterNum];
      }
    }
    
    // If no cached chapter found, scan the filesystem
    if (!chapters) {
      const structure = await scanMangaChapters(id.toString());
      if (structure.chapters && structure.chapters[chapterNum]) {
        chapters = structure.chapters[chapterNum];
      } else {
        return res.status(404).json({ error: 'Chapter not found' });
      }
    }
    
    // Add manga info to response
    const response = {
      manga: {
        id: manga.id,
        title: manga.title
      },
      chapter: chapters
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error getting chapter:', error);
    res.status(500).json({
      error: 'Failed to get chapter',
      details: error.message
    });
  }
});

// Enhanced search endpoint: /api/search?q=term&type=title|author|genre
app.get('/api/search', (req, res) => {
  const q = req.query.q || '';
  const type = (req.query.type || 'title').toLowerCase();
  const mangas = readJSON(mangasFile);
  
  const results = searchManga(q, type, mangas);
  res.json(results);
});

app.post('/api/mangas', (req, res) => {
  const mangas = readJSON(mangasFile);
  const manga = req.body;
  manga.id = Date.now().toString();
  mangas.push(manga);
  writeJSON(mangasFile, mangas);
  res.status(201).json(manga);
});

app.delete('/api/mangas/:id', (req, res) => {
  let mangas = readJSON(mangasFile);
  mangas = mangas.filter(m => m.id !== req.params.id);
  writeJSON(mangasFile, mangas);
  res.json({ success: true });
});

// User endpoints
app.post('/api/register', (req, res) => {
  const users = readJSON(usersFile);
  const { username, email, password, avatar } = req.body;
  // Username validation
  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Логин должен быть не короче 3 символов' });
  }
  // Password validation
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Пароль должен быть не короче 8 символов' });
  }
  // Email validation (basic regex)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Некорректный email адрес' });
  }
  if (users.find(u => u.username === username || u.email === email)) {
    return res.status(409).json({ error: 'User already exists' });
  }
  
  // Create new user with default fields
  const user = { 
    id: Date.now().toString(), 
    username, 
    email, 
    password, 
    avatar,
    background: 'images/onepiece/693/01.jpg', // Default background
    library: {
      favorites: [],
      reading: [],
      completed: [],
      planToRead: [],
      dropped: []
    },
    avatarFrame: '' // Empty by default, user can choose later
  };

  users.push(user);
  writeJSON(usersFile, users);
  res.status(201).json({ 
    id: user.id, 
    username, 
    email, 
    avatar,
    background: user.background,
    library: user.library,
    avatarFrame: user.avatarFrame
  });
});

// JWT is already imported at the top of the file

app.post('/api/login', (req, res) => {
  const users = readJSON(usersFile);
  const { username, password } = req.body;
  const user = users.find(u => (u.username === username || u.email === username) && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  // Initialize or migrate legacy fields to new structure
  if (!user.library) {
    user.library = {
      favorites: user.favorites || [],
      reading: user.mangaList?.reading || [],
      completed: user.mangaList?.completed || [],
      planToRead: user.mangaList?.planToRead || [],
      dropped: user.mangaList?.dropped || []
    };
    // Clean up old fields
    delete user.mangaList;
    delete user.favorites;
  }

  // Ensure all library sections exist
  const sections = ['favorites', 'reading', 'completed', 'planToRead', 'dropped'];
  sections.forEach(section => {
    if (!user.library[section]) {
      user.library[section] = [];
    }
  });

  // Initialize background if not exists
  if (!user.background) {
    user.background = 'images/onepiece/693/01.jpg';
  }

  // Initialize avatarFrame if not exists
  if (!user.avatarFrame) {
    user.avatarFrame = '';
  }

  // Prepare avatar URL
  let avatarUrl = user.avatar;
  if (avatarUrl && avatarUrl.startsWith('/uploads/')) {
    avatarUrl = `/uploads/${path.basename(avatarUrl)}`; // Clean the path
  }
  
  // Save updates to user data
  writeJSON(usersFile, users);
  
  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, username: user.username, isAdmin: user.isAdmin || false },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ 
    id: user.id, 
    username: user.username, 
    email: user.email, 
    avatar: avatarUrl,
    isAdmin: user.isAdmin || false,
    background: user.background,
    library: user.library,
    avatarFrame: user.avatarFrame,
    token: token  // Add token to response
  });
});

// Get user info by username (no password required, for profile page)
app.post('/api/user/info', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Missing username' });
  const users = readJSON(usersFile);
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Handle avatar URL
  let avatarUrl = user.avatar;
  if (avatarUrl && (avatarUrl.startsWith('/uploads/') || avatarUrl.startsWith('/base/uploads/'))) {
    avatarUrl = `http://localhost:${PORT}${avatarUrl}`;
  } else if (avatarUrl && avatarUrl.includes('dicebear')) {
    const match = avatarUrl.match(/seed=(\d+)/);
    if (match) {
      avatarUrl = `https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${match[1]}`;
    }
  }

  // Handle background URL
  let backgroundUrl = user.background;
  if (backgroundUrl && backgroundUrl.startsWith('/uploads/')) {
    backgroundUrl = `http://localhost:${PORT}${backgroundUrl}`;
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: avatarUrl,
    avatarFrame: user.avatarFrame || '',
    background: backgroundUrl || 'images/onepiece/693/01.jpg'
  });
});

// Update user profile info (username, email, password)
app.post('/api/user/update', (req, res) => {
  const { username, newUsername, newEmail, newPassword, currentPassword, background } = req.body;
  if (!username) return res.status(400).json({ error: 'Missing username' });

  const users = readJSON(usersFile);
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Only check password if updating sensitive info
  if (newUsername || newEmail || newPassword) {
    if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
    if (user.password !== currentPassword) return res.status(401).json({ error: 'Текущий пароль неверный' });
  }

  // Prevent duplicate username/email if changing
  if (newUsername && users.some(u => u.username === newUsername && u !== user)) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  if (newEmail && users.some(u => u.email === newEmail && u !== user)) {
    return res.status(409).json({ error: 'Email already taken' });
  }
  
  // Update user fields
  if (newUsername) user.username = newUsername;
  if (newEmail) user.email = newEmail;
  if (newPassword) user.password = newPassword;
  if (background) user.background = background;

  // Initialize missing fields if they don't exist
  if (!user.mangaList) user.mangaList = [];
  if (!user.background) user.background = 'images/onepiece/693/01.jpg';
  
  writeJSON(usersFile, users);
  res.json({ success: true });
});

// scanMangaChapters is already imported at the top of the file

// Endpoint to get manga structure
app.get('/api/manga/:mangaName/structure', async (req, res) => {
    try {
        const chaptersPath = path.join(__dirname, 'manga-chapters.json');
        let mangaName = req.params.mangaName;
        
        // Check if we have cached data
        if (fs.existsSync(chaptersPath)) {
            const chaptersDb = JSON.parse(fs.readFileSync(chaptersPath, 'utf-8'));
            
            // If using manga name and not ID, we need to map it
            if (isNaN(mangaName)) {
                // Use 1 since that's our static ID for the manga
                mangaName = '1';
            }
            
            if (chaptersDb.chapters && chaptersDb.chapters[mangaName]) {
                return res.json({
                    name: mangaName,
                    chapterCount: Object.keys(chaptersDb.chapters[mangaName]).length,
                    chapters: chaptersDb.chapters[mangaName]
                });
            }
        }
        
        // If no cached data, scan the directory
        const structure = await scanMangaChapters(mangaName);
        res.json(structure);
    } catch (error) {
        console.error('Error getting manga structure:', error);
        res.status(500).json({
            error: 'Failed to get manga structure',
            details: error.message
        });
    }
});

// New endpoint to get chapter info with thumbnails
app.get('/api/manga/:mangaName/chapter/:chapterNum', async (req, res) => {
    const { mangaName, chapterNum } = req.params;
    
    try {
        const chapter = await chapterManager.getChapter(mangaName, chapterNum);
        if (!chapter) {
            return res.status(404).json({ error: 'Chapter not found' });
        }

        // Создаем миниатюры для каждой страницы
        const pagesWithThumbs = await Promise.all(
            chapter.pages.map(async page => {
                const imagePath = imageManager.getImagePath(mangaName, chapterNum, page.filename);
                const thumbPath = await imageManager.createThumbnail(imagePath);
                const imageInfo = await imageManager.getImageInfo(imagePath);
                
                return {
                    ...page,
                    thumbnail: `/thumbnails/${path.relative(imageManager.thumbsPath, thumbPath)}`,
                    width: imageInfo.width,
                    height: imageInfo.height
                };
            })
        );

        res.json({
            ...chapter,
            pages: pagesWithThumbs
        });
    } catch (error) {
        console.error('Error getting chapter info:', error);
        res.status(500).json({
            error: 'Failed to get chapter info',
            details: error.message
        });
    }
});

// Endpoint to optimize chapter images
app.post('/api/manga/:mangaName/chapter/:chapterNum/optimize', async (req, res) => {
    const { mangaName, chapterNum } = req.params;
    
    try {
        const chapter = await chapterManager.getChapter(mangaName, chapterNum);
        if (!chapter) {
            return res.status(404).json({ error: 'Chapter not found' });
        }

        // Оптимизируем каждое изображение
        await Promise.all(
            chapter.pages.map(async page => {
                const imagePath = imageManager.getImagePath(mangaName, chapterNum, page.filename);
                await imageManager.optimizeImage(imagePath);
            })
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error optimizing chapter images:', error);
        res.status(500).json({
            error: 'Failed to optimize images',
            details: error.message
        });
    }
});

// Bulk optimize manga images
app.post('/api/manga/:mangaName/optimize', async (req, res) => {
    const { mangaName } = req.params;
    const { chapters } = req.body;
    
    try {
        const optimizationTasks = [];
        
        if (chapters && Array.isArray(chapters)) {
            // Optimize specific chapters
            for (const chapterNum of chapters) {
                const chapter = await chapterManager.getChapter(mangaName, chapterNum);
                if (chapter) {
                    for (const page of chapter.pages) {
                        const imagePath = imageManager.getImagePath(mangaName, chapterNum, page.filename);
                        optimizationTasks.push(imageManager.optimizeImage(imagePath));
                    }
                }
            }
        } else {
            // Optimize all chapters
            const structure = await chapterManager.getChapterStructure(mangaName);
            for (const chapterNum of Object.keys(structure)) {
                const chapter = await chapterManager.getChapter(mangaName, chapterNum);
                if (chapter) {
                    for (const page of chapter.pages) {
                        const imagePath = imageManager.getImagePath(mangaName, chapterNum, page.filename);
                        optimizationTasks.push(imageManager.optimizeImage(imagePath));
                    }
                }
            }
        }

        await Promise.all(optimizationTasks);
        res.json({ success: true, message: 'Optimization complete' });
    } catch (error) {
        console.error('Error optimizing manga:', error);
        res.status(500).json({
            error: 'Failed to optimize manga',
            details: error.message
        });
    }
});

// Convert manga images to WebP
app.post('/api/manga/:mangaName/convert-webp', async (req, res) => {
    const { mangaName } = req.params;
    const { chapters } = req.body;
    
    try {
        const conversionTasks = [];
        
        if (chapters && Array.isArray(chapters)) {
            // Convert specific chapters
            for (const chapterNum of chapters) {
                const chapter = await chapterManager.getChapter(mangaName, chapterNum);
                if (chapter) {
                    for (const page of chapter.pages) {
                        const imagePath = imageManager.getImagePath(mangaName, chapterNum, page.filename);
                        if (path.extname(imagePath).match(/\.(jpe?g|png)$/i)) {
                            conversionTasks.push(imageManager.convertToWebP(imagePath));
                        }
                    }
                }
            }
        } else {
            // Convert all chapters
            const structure = await chapterManager.getChapterStructure(mangaName);
            for (const chapterNum of Object.keys(structure)) {
                const chapter = await chapterManager.getChapter(mangaName, chapterNum);
                if (chapter) {
                    for (const page of chapter.pages) {
                        const imagePath = imageManager.getImagePath(mangaName, chapterNum, page.filename);
                        if (path.extname(imagePath).match(/\.(jpe?g|png)$/i)) {
                            conversionTasks.push(imageManager.convertToWebP(imagePath));
                        }
                    }
                }
            }
        }

        await Promise.all(conversionTasks);
        res.json({ success: true, message: 'WebP conversion complete' });
    } catch (error) {
        console.error('Error converting to WebP:', error);
        res.status(500).json({
            error: 'Failed to convert to WebP',
            details: error.message
        });
    }
});



// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Optionally notify admin/logging service
  process.exit(1);
});

// Get available avatar frames
app.get('/api/avatar-frames', (req, res) => {
    try {
        const framesPath = path.join(baseDir, '..', 'images', 'ramki');
        const frames = fs.readdirSync(framesPath)
            .filter(file => file.endsWith('.png'))
            .map(file => ({
                name: path.basename(file, '.png'),
                path: `/images/ramki/${file}`
            }));
        res.json(frames);
    } catch (error) {
        console.error('Error loading frames:', error);
        res.status(500).json({ error: 'Failed to load frames' });
    }
});

// Update user avatar frame
app.post('/api/user/avatar-frame', (req, res) => {
    const { username, frame } = req.body;
    if (!username) return res.status(400).json({ error: 'Missing username' });
    
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.avatarFrame = frame;
    writeJSON(usersFile, users);
    res.json({ success: true });
});

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// --- Optional AI proxy endpoint (requires OPENAI_API_KEY) ---
// Usage: POST /api/ai/generate { prompt: '...' }
app.post('/api/ai/generate', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(501).json({ error: 'OPENAI_API_KEY not set on server' });
  try {
    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model: 'gpt-5-mini', input: prompt })
    });
    const data = await resp.json();
    // Return the raw response for flexibility; client can parse as needed
    res.json(data);
  } catch (err) {
    console.error('AI proxy error:', err);
    res.status(500).json({ error: err.message || 'AI request failed' });
  }
});
