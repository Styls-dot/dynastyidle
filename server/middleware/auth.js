const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dynasty-dev-secret';

module.exports = function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    const payload = jwt.verify(token, SECRET);
    req.playerId = payload.playerId;
    req.userId   = payload.userId;
    req.username = payload.username;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid session — please log in again' });
  }
};
