const express = require('express');
const { getDb, SELL_PRICES, HP_POTION_COST, MANA_POTION_COST, POTION_RESTORE, POTION_MAX_STACK } = require('../db');

const router = express.Router();

// GET /api/shop/info  →  prices, current stock, potion thresholds
router.get('/info', (req, res) => {
  const db       = getDb();
  const playerId = req.playerId;
  const player   = db.prepare('SELECT gold, hp_potion_count, mana_potion_count, hp_potion_threshold, mana_potion_threshold FROM player WHERE id=?').get(playerId);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  res.json({
    gold:               player.gold ?? 0,
    hpPotionCount:      player.hp_potion_count ?? 0,
    manaPotionCount:    player.mana_potion_count ?? 0,
    hpPotionThreshold:  player.hp_potion_threshold ?? 30,
    manaPotionThreshold:player.mana_potion_threshold ?? 30,
    hpPotionCost:       HP_POTION_COST,
    manaPotionCost:     MANA_POTION_COST,
    potionRestore:      POTION_RESTORE,
    potionMaxStack:     POTION_MAX_STACK,
    sellPrices:         SELL_PRICES,
  });
});

// POST /api/shop/buy  body: { type: 'hp'|'mana', qty: number }
router.post('/buy', (req, res) => {
  const db       = getDb();
  const playerId = req.playerId;
  let { type, qty = 1 } = req.body;
  qty = Math.max(1, Math.min(20, Math.round(qty)));

  if (type !== 'hp' && type !== 'mana') return res.status(400).json({ error: 'type must be hp or mana' });

  const player  = db.prepare('SELECT gold, hp_potion_count, mana_potion_count FROM player WHERE id=?').get(playerId);
  const cost    = (type === 'hp' ? HP_POTION_COST : MANA_POTION_COST) * qty;
  const current = type === 'hp' ? (player.hp_potion_count ?? 0) : (player.mana_potion_count ?? 0);

  if ((player.gold ?? 0) < cost) return res.status(400).json({ error: 'Not enough gold' });
  const canBuy = Math.min(qty, POTION_MAX_STACK - current);
  if (canBuy <= 0) return res.status(400).json({ error: 'Potion stack is full' });

  const actualCost = (type === 'hp' ? HP_POTION_COST : MANA_POTION_COST) * canBuy;
  const col = type === 'hp' ? 'hp_potion_count' : 'mana_potion_count';
  db.prepare(`UPDATE player SET gold = gold - ?, ${col} = ${col} + ? WHERE id=?`).run(actualCost, canBuy, playerId);

  const updated = db.prepare('SELECT gold, hp_potion_count, mana_potion_count FROM player WHERE id=?').get(playerId);
  res.json({
    gold:            updated.gold,
    hpPotionCount:   updated.hp_potion_count,
    manaPotionCount: updated.mana_potion_count,
    bought:          canBuy,
  });
});

// POST /api/shop/sell  body: { itemId }
router.post('/sell', (req, res) => {
  const db       = getDb();
  const playerId = req.playerId;
  const { itemId } = req.body;
  if (!itemId) return res.status(400).json({ error: 'itemId required' });

  const item = db.prepare('SELECT id, rarity, equippedSlot FROM player_inventory WHERE id=? AND playerId=?').get(itemId, playerId);
  if (!item)            return res.status(404).json({ error: 'Item not found' });
  if (item.equippedSlot) return res.status(400).json({ error: 'Unequip the item before selling' });

  const price = SELL_PRICES[item.rarity] ?? 5;
  db.prepare('DELETE FROM player_inventory WHERE id=?').run(itemId);
  db.prepare('UPDATE player SET gold = gold + ? WHERE id=?').run(price, playerId);

  const { gold } = db.prepare('SELECT gold FROM player WHERE id=?').get(playerId);
  res.json({ gold, soldFor: price });
});

// PATCH /api/shop/potion-settings  body: { hpThreshold?, manaThreshold? }
router.patch('/potion-settings', (req, res) => {
  const db       = getDb();
  const playerId = req.playerId;
  const { hpThreshold, manaThreshold } = req.body;

  if (hpThreshold   != null) db.prepare('UPDATE player SET hp_potion_threshold=?   WHERE id=?').run(Math.max(1, Math.min(99, Math.round(hpThreshold))),   playerId);
  if (manaThreshold != null) db.prepare('UPDATE player SET mana_potion_threshold=? WHERE id=?').run(Math.max(1, Math.min(99, Math.round(manaThreshold))), playerId);

  const p = db.prepare('SELECT hp_potion_threshold, mana_potion_threshold FROM player WHERE id=?').get(playerId);
  res.json({ hpThreshold: p.hp_potion_threshold, manaThreshold: p.mana_potion_threshold });
});

module.exports = router;
