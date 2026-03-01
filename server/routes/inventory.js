const express = require('express');
const { getDb, SHARD_VALUES, getEnhanceCost, getEnhanceChance } = require('../db');

const router = express.Router();

function parseItems(rows) {
  return rows.map(r => ({ ...r, stats: JSON.parse(r.stats) }));
}

// GET /api/inventory
router.get('/', (req, res) => {
  const db = getDb();
  const playerId = req.headers['x-player-id'];
  if (!playerId) return res.status(400).json({ error: 'x-player-id required' });
  const items = db.prepare('SELECT * FROM player_inventory WHERE playerId=? ORDER BY obtainedAt DESC').all(playerId);
  res.json(parseItems(items));
});

// POST /api/inventory/bulk-salvage  — must be defined before /:itemId routes
router.post('/bulk-salvage', (req, res) => {
  const db = getDb();
  const playerId = req.headers['x-player-id'];
  if (!playerId) return res.status(400).json({ error: 'x-player-id required' });
  const { rarities } = req.body;
  if (!Array.isArray(rarities) || rarities.length === 0)
    return res.status(400).json({ error: 'rarities required' });

  const ph    = rarities.map(() => '?').join(',');
  const items = db.prepare(`SELECT id,rarity FROM player_inventory WHERE playerId=? AND equippedSlot IS NULL AND rarity IN (${ph})`).all(playerId, ...rarities);
  if (items.length === 0) {
    const p = db.prepare('SELECT spirit_shards FROM player WHERE id=?').get(playerId);
    return res.json({ salvaged: 0, gained: 0, spiritShards: p?.spirit_shards ?? 0 });
  }

  const gained = items.reduce((s, i) => s + (SHARD_VALUES[i.rarity] || 1), 0);
  const idPh   = items.map(() => '?').join(',');
  db.prepare(`DELETE FROM player_inventory WHERE id IN (${idPh})`).run(...items.map(i => i.id));
  db.prepare('UPDATE player SET spirit_shards = spirit_shards + ? WHERE id = ?').run(gained, playerId);
  const { spirit_shards } = db.prepare('SELECT spirit_shards FROM player WHERE id=?').get(playerId);
  res.json({ salvaged: items.length, gained, spiritShards: spirit_shards });
});

// PATCH /api/inventory/settings  — auto-salvage rarities preference
router.patch('/settings', (req, res) => {
  const db = getDb();
  const playerId = req.headers['x-player-id'];
  if (!playerId) return res.status(400).json({ error: 'x-player-id required' });
  const { autoSalvageRarities } = req.body;
  if (!Array.isArray(autoSalvageRarities))
    return res.status(400).json({ error: 'autoSalvageRarities must be array' });
  db.prepare('UPDATE player SET auto_salvage_rarities = ? WHERE id = ?')
    .run(JSON.stringify(autoSalvageRarities), playerId);
  res.json({ autoSalvageRarities });
});

// POST /api/inventory/:itemId/equip  body: { slot }
router.post('/:itemId/equip', (req, res) => {
  const db = getDb();
  const playerId = req.headers['x-player-id'];
  const { itemId } = req.params;
  const { slot } = req.body;
  const item = db.prepare('SELECT * FROM player_inventory WHERE id=? AND playerId=?').get(itemId, playerId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (slot) {
    db.prepare('UPDATE player_inventory SET equippedSlot=NULL WHERE playerId=? AND equippedSlot=?').run(playerId, slot);
    db.prepare('UPDATE player_inventory SET equippedSlot=? WHERE id=?').run(slot, itemId);
  } else {
    db.prepare('UPDATE player_inventory SET equippedSlot=NULL WHERE id=?').run(itemId);
  }
  res.json({ ok: true });
});

// POST /api/inventory/:itemId/salvage
router.post('/:itemId/salvage', (req, res) => {
  const db = getDb();
  const playerId = req.headers['x-player-id'];
  const { itemId } = req.params;
  if (!playerId) return res.status(400).json({ error: 'x-player-id required' });
  const item = db.prepare('SELECT * FROM player_inventory WHERE id=? AND playerId=?').get(itemId, playerId);
  if (!item)            return res.status(404).json({ error: 'Item not found' });
  if (item.equippedSlot) return res.status(400).json({ error: 'Cannot salvage equipped item' });
  const gained = SHARD_VALUES[item.rarity] || 1;
  db.prepare('DELETE FROM player_inventory WHERE id=?').run(itemId);
  db.prepare('UPDATE player SET spirit_shards = spirit_shards + ? WHERE id = ?').run(gained, playerId);
  const { spirit_shards } = db.prepare('SELECT spirit_shards FROM player WHERE id=?').get(playerId);
  res.json({ gained, spiritShards: spirit_shards });
});

// POST /api/inventory/:itemId/enhance
router.post('/:itemId/enhance', (req, res) => {
  const db = getDb();
  const playerId = req.headers['x-player-id'];
  const { itemId } = req.params;
  if (!playerId) return res.status(400).json({ error: 'x-player-id required' });
  const item = db.prepare('SELECT * FROM player_inventory WHERE id=? AND playerId=?').get(itemId, playerId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const currentPlus = item.plus_level || 0;
  const cost   = getEnhanceCost(currentPlus);
  const chance = getEnhanceChance(currentPlus);
  const p = db.prepare('SELECT spirit_shards FROM player WHERE id=?').get(playerId);
  if ((p?.spirit_shards ?? 0) < cost)
    return res.status(400).json({ error: 'Insufficient spirit shards', need: cost, have: p?.spirit_shards ?? 0 });
  const success = Math.random() * 100 < chance;
  const newPlus = success ? currentPlus + 1 : 0;   // fail always resets to +0
  db.prepare('UPDATE player_inventory SET plus_level=? WHERE id=?').run(newPlus, itemId);
  db.prepare('UPDATE player SET spirit_shards = spirit_shards - ? WHERE id = ?').run(cost, playerId);
  const { spirit_shards } = db.prepare('SELECT spirit_shards FROM player WHERE id=?').get(playerId);
  res.json({ success, newPlusLevel: newPlus, cost, chance, spiritShards: spirit_shards });
});

// DELETE /api/inventory/:itemId
router.delete('/:itemId', (req, res) => {
  const db = getDb();
  const playerId = req.headers['x-player-id'];
  db.prepare('DELETE FROM player_inventory WHERE id=? AND playerId=?').run(req.params.itemId, playerId);
  res.json({ ok: true });
});

module.exports = router;
