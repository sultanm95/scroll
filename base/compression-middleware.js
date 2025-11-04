import compression from 'compression';

// Configure compression middleware with optimized settings
const compressionMiddleware = compression({
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses bigger than 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        
        // Compress all responses by default
        return compression.filter(req, res);
    }
});

export default compressionMiddleware;