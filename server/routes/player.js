const express = require('express');
const { getDb, xpToNextLevel } = require('../db');

const router = express.Router();

function ensurePlayer(db, playerId) {
  if (!db.prepare('SELECT id FROM player WHERE id=?').get(playerId)) {
    db.prepare('INSERT INTO player (id,level,xp,hp,recoveryUntil,createdAt) VALUES (?,1,0,100,0,?)').run(playerId, Date.now());
  }
}

// GET /api/player
router.get('/player', (req, res) => {
  const db = getDb();
  const playerId = req.playerId;
  if (!playerId) return res.status(400).json({ error: 'Not authenticated' });

  ensurePlayer(db, playerId);
  const p        = db.prepare('SELECT id,level,xp,hp,mana,gold,recoveryUntil,spirit_shards,auto_salvage_rarities,hp_potion_count,mana_potion_count,hp_potion_threshold,mana_potion_threshold FROM player WHERE id=?').get(playerId);
  const presence = db.prepare('SELECT zoneId FROM player_presence WHERE playerId=?').get(playerId);

  res.json({
    id:                  p.id,
    level:               p.level,
    xp:                  p.xp,
    xpToNextLevel:       xpToNextLevel(p.level),
    hp:                  p.hp,
    mana:                p.mana ?? 100,
    gold:                p.gold ?? 0,
    recoveryUntil:       p.recoveryUntil,
    currentZoneId:       presence?.zoneId ?? null,
    spiritShards:        p.spirit_shards ?? 0,
    autoSalvageRarities: JSON.parse(p.auto_salvage_rarities || '[]'),
    hpPotionCount:       p.hp_potion_count ?? 0,
    manaPotionCount:     p.mana_potion_count ?? 0,
    hpPotionThreshold:   p.hp_potion_threshold ?? 30,
    manaPotionThreshold: p.mana_potion_threshold ?? 30,
  });
});

// POST /api/heartbeat
router.post('/heartbeat', (req, res) => {
  const db = getDb();
  const playerId = req.playerId;
  const { zoneId } = req.body;
  if (!playerId || !zoneId) return res.status(400).json({ error: 'zoneId required' });

  ensurePlayer(db, playerId);
  db.prepare(`INSERT INTO player_presence (playerId,zoneId,lastSeen) VALUES (?,?,?) ON CONFLICT(playerId) DO UPDATE SET zoneId=excluded.zoneId,lastSeen=excluded.lastSeen`).run(playerId, zoneId, Date.now());
  res.json({ ok: true });
});

// POST /api/debug/zones/:id/add-kills
router.post('/debug/zones/:id/add-kills', (req, res) => {
  const db = getDb();
  const zoneId = req.params.id;
  const playerId = req.playerId;
  const { amount = 100 } = req.body;
  if (!playerId) return res.status(400).json({ error: 'Not authenticated' });

  ensurePlayer(db, playerId);
  db.prepare(`INSERT INTO player_zone_stats (playerId,zoneId,kills) VALUES (?,?,?) ON CONFLICT(playerId,zoneId) DO UPDATE SET kills=kills+excluded.kills`).run(playerId, zoneId, amount);
  const { kills } = db.prepare('SELECT kills FROM player_zone_stats WHERE playerId=? AND zoneId=?').get(playerId, zoneId);
  res.json({ kills, bonusPercent: Math.floor(kills / 1000), killsToNextBonus: 1000 - (kills % 1000) });
});

module.exports = router;
