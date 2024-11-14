// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).json({ error: 'Token is required for authentication' });
    }

    // Check for Bearer format
    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
        console.error("Invalid token format. Expected Bearer format.");
        return res.status(403).json({ error: 'Invalid token format' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;
