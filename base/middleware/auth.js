import jwt from 'jsonwebtoken';

// Secret key for JWT - in production, use environment variable
const JWT_SECRET = 'your-secret-key';

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];  // Get token from Bearer header
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
