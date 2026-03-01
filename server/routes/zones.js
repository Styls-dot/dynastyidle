const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, xpToNextLevel, SHARD_VALUES } = require('../db');
const ENEMIES   = require('../data/enemies');
const MONSTERS  = require('../data/monsters');
const { rollLoot } = require('../data/loot');

const router = express.Router();
const ACTIVE_WINDOW_MS = 120_000;
const INVENTORY_CAP    = 50;
const RECOVERY_MS      = 15_000;

// ── helpers ──────────────────────────────────────────────────────────────────

function activeCount(db, zoneId) {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  return db.prepare('SELECT COUNT(*) as c FROM player_presence WHERE zoneId=? AND lastSeen>=?').get(zoneId, cutoff).c;
}

function playerZoneStats(db, playerId, zoneId) {
  if (!playerId) return null;
  const row = db.prepare('SELECT kills FROM player_zone_stats WHERE playerId=? AND zoneId=?').get(playerId, zoneId);
  const kills = row ? row.kills : 0;
  return { kills, bonusPercent: Math.floor(kills / 1000), killsToNextBonus: 1000 - (kills % 1000) };
}

function formatZone(zone, db, playerId) {
  return { ...zone, tags: JSON.parse(zone.tags), activeCount: activeCount(db, zone.id), playerStats: playerZoneStats(db, playerId, zone.id) };
}

function ensurePlayer(db, playerId) {
  if (!db.prepare('SELECT id FROM player WHERE id=?').get(playerId)) {
    db.prepare('INSERT INTO player (id,level,xp,hp,recoveryUntil,createdAt) VALUES (?,1,0,100,0,?)').run(playerId, Date.now());
  }
}

function getEquipmentBonuses(db, playerId) {
  const equipped = db.prepare('SELECT type,stats,equippedSlot,plus_level FROM player_inventory WHERE playerId=? AND equippedSlot IS NOT NULL').all(playerId);
  let atkBonus = 0, defBonus = 0, xpBonusPct = 0;
  for (const item of equipped) {
    const s  = JSON.parse(item.stats);
    const pl = item.plus_level || 0;
    if (item.equippedSlot === 'weapon')    atkBonus   += (s.atk     || 0) + pl * 3;
    if (item.equippedSlot === 'armor')     defBonus   += (s.def     || 0) + pl * 2;
    if (item.equippedSlot === 'accessory') xpBonusPct += (s.xpBonus || 0) + pl * 1;
  }
  return { atkBonus, defBonus, xpBonusPct };
}

// ── routes ───────────────────────────────────────────────────────────────────

// GET /api/zones
router.get('/', (req, res) => {
  const db = getDb();
  const playerId = req.headers['x-player-id'] || null;
  res.json(db.prepare('SELECT * FROM zones ORDER BY sortOrder').all().map(z => formatZone(z, db, playerId)));
});

// GET /api/zones/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const zone = db.prepare('SELECT * FROM zones WHERE id=?').get(req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });
  const playerId = req.headers['x-player-id'] || null;
  const events = db.prepare('SELECT * FROM zone_events WHERE zoneId=? ORDER BY createdAt DESC LIMIT 10').all(zone.id);
  res.json({ ...formatZone(zone, db, playerId), events });
});

// GET /api/zones/:id/monsters
router.get('/:id/monsters', (req, res) => {
  res.json(MONSTERS[req.params.id] || []);
});

// POST /api/zones/:id/select
router.post('/:id/select', (req, res) => {
  const db = getDb();
  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });

  const zone = db.prepare('SELECT * FROM zones WHERE id=?').get(req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });

  ensurePlayer(db, playerId);
  db.prepare(`INSERT INTO player_presence (playerId,zoneId,lastSeen) VALUES (?,?,?) ON CONFLICT(playerId) DO UPDATE SET zoneId=excluded.zoneId,lastSeen=excluded.lastSeen`).run(playerId, zone.id, Date.now());
  db.prepare(`INSERT INTO zone_events (id,zoneId,createdAt,type,message) VALUES (?,?,?,?,?)`).run(uuidv4(), zone.id, Date.now(), 'enter', `A cultivator has entered ${zone.name}.`);
  const events = db.prepare('SELECT * FROM zone_events WHERE zoneId=? ORDER BY createdAt DESC LIMIT 10').all(zone.id);
  res.json({ ...formatZone(zone, db, playerId), events });
});

// POST /api/zones/:id/combat-tick
router.post('/:id/combat-tick', (req, res) => {
  const db  = getDb();
  const { playerId, monsterId } = req.body;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });

  const zone = db.prepare('SELECT * FROM zones WHERE id=?').get(req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });

  ensurePlayer(db, playerId);
  const player = db.prepare('SELECT level,xp,hp,recoveryUntil,auto_salvage_rarities FROM player WHERE id=?').get(playerId);
  const now = Date.now();

  // ── recovery check ──
  if (player.recoveryUntil > now) {
    return res.json({ recovering: true, recoveryUntil: player.recoveryUntil, hp: 0, playerLevel: player.level, playerXp: player.xp, xpToNextLevel: xpToNextLevel(player.level) });
  }

  // ── auto-restore after recovery period ──
  let currentHp = player.hp;
  if (currentHp <= 0) {
    currentHp = 100;
    db.prepare('UPDATE player SET hp=100,recoveryUntil=0 WHERE id=?').run(playerId);
  }

  // ── equipment bonuses ──
  const { atkBonus, defBonus, xpBonusPct } = getEquipmentBonuses(db, playerId);

  // ── resolve target monster (specific or random) ──
  const zoneMonsters = MONSTERS[zone.id] || [];
  const monster = monsterId ? (zoneMonsters.find(m => m.id === monsterId) || null) : null;

  // ── roll encounter group ──
  // Targeted: always 1 specific monster.
  // Hunt All: 100% first mob, then 50% chain for each additional mob.
  const pool = ENEMIES[zone.id] || ['Wandering Specter'];
  let enemies;
  if (monster) {
    enemies = [monster.name];
  } else {
    enemies = [pool[Math.floor(Math.random() * pool.length)]];
    while (Math.random() < 0.5) {
      enemies.push(pool[Math.floor(Math.random() * pool.length)]);
    }
  }
  const mobCount = enemies.length;

  // ── HP calculation ──
  const effectiveLevel = monster ? monster.level : zone.minLevel;
  const baseDmgPct   = Math.max(0, effectiveLevel * 0.2 + 2 - player.level * 0.05);
  const defReduction = Math.min(0.75, defBonus * 0.02);
  const perMobDmg    = Math.max(0, baseDmgPct * (1 - defReduction));
  const damagePct    = perMobDmg * mobCount;
  const regenPct     = Math.min(5, Math.max(0.3, (player.level - effectiveLevel) * 0.25 + 0.5));
  const newHp        = Math.max(0, Math.min(100, currentHp - damagePct + regenPct));

  // ── death ──
  if (newHp <= 0) {
    const recoveryUntil = now + RECOVERY_MS;
    db.prepare('UPDATE player SET hp=0,recoveryUntil=? WHERE id=?').run(recoveryUntil, playerId);
    return res.json({ died: true, recoveryUntil, hp: 0, playerLevel: player.level, playerXp: player.xp, xpToNextLevel: xpToNextLevel(player.level) });
  }

  db.prepare('UPDATE player SET hp=? WHERE id=?').run(newHp, playerId);

  // ── XP ──
  const baseXp    = monster ? monster.xp : Math.max(5, zone.minLevel + 5);
  const xpMult    = 1 + (atkBonus / 100) + (xpBonusPct / 100);
  const xpGained  = Math.round(baseXp * mobCount * xpMult);

  // ── display name ──
  const enemyName = mobCount === 1
    ? enemies[0]
    : `${enemies[0]} +${mobCount - 1}`;

  let { level, xp } = player;
  xp += xpGained;
  let leveledUp = false;
  while (xp >= xpToNextLevel(level) && level < 100) { xp -= xpToNextLevel(level); level++; leveledUp = true; }
  db.prepare('UPDATE player SET level=?,xp=? WHERE id=?').run(level, xp, playerId);

  // ── kill count ──
  db.prepare(`INSERT INTO player_zone_stats (playerId,zoneId,kills) VALUES (?,?,?) ON CONFLICT(playerId,zoneId) DO UPDATE SET kills=kills+?`).run(playerId, zone.id, mobCount, mobCount);
  const { kills } = db.prepare('SELECT kills FROM player_zone_stats WHERE playerId=? AND zoneId=?').get(playerId, zone.id);
  const bonusPct  = Math.floor(kills / 1000);

  // ── loot ──
  let lootDrop    = null;
  let autoSalvaged = null;
  let spiritShards = null;
  const loot = rollLoot(zone.id, level, bonusPct);
  if (loot) {
    const autoRarities = JSON.parse(player.auto_salvage_rarities || '[]');
    if (autoRarities.includes(loot.rarity)) {
      // Auto-salvage: add shards, skip inventory
      const shards = SHARD_VALUES[loot.rarity] || 1;
      db.prepare('UPDATE player SET spirit_shards = spirit_shards + ? WHERE id = ?').run(shards, playerId);
      spiritShards = db.prepare('SELECT spirit_shards FROM player WHERE id=?').get(playerId).spirit_shards;
      autoSalvaged = { name: loot.name, rarity: loot.rarity, type: loot.type, shards };
    } else {
      const invCount = db.prepare('SELECT COUNT(*) as c FROM player_inventory WHERE playerId=?').get(playerId).c;
      if (invCount < INVENTORY_CAP) {
        const itemId = uuidv4();
        db.prepare(`INSERT INTO player_inventory (id,playerId,name,type,rarity,stats,zoneId,equippedSlot,obtainedAt,plus_level) VALUES (?,?,?,?,?,?,?,NULL,?,0)`)
          .run(itemId, playerId, loot.name, loot.type, loot.rarity, JSON.stringify(loot.stats), zone.id, now);
        lootDrop = { id: itemId, ...loot };
      }
    }
  }

  res.json({
    enemyName, enemies, mobCount, xpGained,
    playerLevel: level, playerXp: xp, xpToNextLevel: xpToNextLevel(level), leveledUp,
    hp: newHp, damagePct: Math.round(damagePct * 10) / 10, regenPct: Math.round(regenPct * 10) / 10,
    totalKillsInZone: kills, bonusPercent: bonusPct, killsToNextBonus: 1000 - (kills % 1000),
    lootDrop, autoSalvaged,
    ...(spiritShards !== null ? { spiritShards } : {}),
  });
});

module.exports = router;
