const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const zonesRouter     = require('./routes/zones');
const playerRouter    = require('./routes/player');
const inventoryRouter = require('./routes/inventory');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDb();

app.use('/api/zones',     zonesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api',           playerRouter);

// Serve built React app
const DIST = path.join(__dirname, '../client/dist');
app.use(express.static(DIST));
app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));

app.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));
