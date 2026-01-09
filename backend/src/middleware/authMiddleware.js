const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_123';

module.exports = function authMiddleware(req, res, next) {
    // 1. Get Token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

    if (!token) {
        return res.status(401).json({ error: 'Access Denied: No Token Provided' });
    }

    try {
        // 2. Verify Token
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // { id, username, role, tenant_id }
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid Token' });
    }
};
