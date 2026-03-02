const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const requireAuth    = require('./middleware/auth');
const authRouter     = require('./routes/auth');
const zonesRouter    = require('./routes/zones');
const playerRouter   = require('./routes/player');
const inventoryRouter = require('./routes/inventory');
const skillsRouter   = require('./routes/skills');
const shopRouter     = require('./routes/shop');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDb();

// Public routes (no auth)
app.use('/api/auth', authRouter);

// Protected routes — requireAuth sets req.playerId / req.userId / req.username
app.use('/api', requireAuth);
app.use('/api/zones',     zonesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/skills',    skillsRouter);
app.use('/api/shop',      shopRouter);
app.use('/api',           playerRouter);

// Serve built React app
const DIST = path.join(__dirname, '../client/dist');
app.use(express.static(DIST, { etag: false, maxAge: '1y', immutable: true }));
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));
