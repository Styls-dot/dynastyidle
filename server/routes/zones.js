const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, xpToNextLevel, SHARD_VALUES } = require('../db');
const ENEMIES    = require('../data/enemies');
const MONSTERS   = require('../data/monsters');
const { rollLoot } = require('../data/loot');
const SKILL_DEFS         = require('../data/skills');
const { evaluateSkills } = require('../services/skillEvaluator');

const router = express.Router();
const ACTIVE_WINDOW_MS = 120_000;
const INVENTORY_CAP    = 50;
const RECOVERY_MS      = 15_000;
const MANA_REGEN       = 5;    // mana restored per combat tick

// ── in-memory combat state per player ────────────────────────────────────────
// { playerId: { zoneId, targetKey, queue: [{...monster, currentHp}], queueIdx } }
const playerCombat = new Map();

// ── in-memory skill cooldowns: playerId -> lastSkillFiredAt (ms timestamp) ──
const playerSkillCooldown = new Map();

function makeEnemyQueue(zoneId, monsterId) {
  const pool = MONSTERS[zoneId] || [];
  if (!pool.length) return [];

  if (monsterId) {
    const m = pool.find(m => m.id === monsterId);
    if (!m) return [];
    return [{ ...m, currentHp: m.hp }];
  }

  // Hunt All: 1 guaranteed, then 50% chain — no upper limit
  const pick = () => {
    const m = pool[Math.floor(Math.random() * pool.length)];
    return { ...m, currentHp: m.hp };
  };
  const queue = [pick()];
  while (Math.random() < 0.5) queue.push(pick());
  return queue;
}

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
  const playerId = req.playerId || null;
  res.json(db.prepare('SELECT * FROM zones ORDER BY sortOrder').all().map(z => formatZone(z, db, playerId)));
});

// GET /api/zones/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const zone = db.prepare('SELECT * FROM zones WHERE id=?').get(req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });
  const playerId = req.playerId || null;
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
  const playerId = req.playerId;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });

  const zone = db.prepare('SELECT * FROM zones WHERE id=?').get(req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });

  ensurePlayer(db, playerId);
  playerCombat.delete(playerId); // reset combat state on zone entry
  db.prepare(`INSERT INTO player_presence (playerId,zoneId,lastSeen) VALUES (?,?,?) ON CONFLICT(playerId) DO UPDATE SET zoneId=excluded.zoneId,lastSeen=excluded.lastSeen`).run(playerId, zone.id, Date.now());
  db.prepare(`INSERT INTO zone_events (id,zoneId,createdAt,type,message) VALUES (?,?,?,?,?)`).run(uuidv4(), zone.id, Date.now(), 'enter', `A cultivator has entered ${zone.name}.`);
  const events = db.prepare('SELECT * FROM zone_events WHERE zoneId=? ORDER BY createdAt DESC LIMIT 10').all(zone.id);
  res.json({ ...formatZone(zone, db, playerId), events });
});

// POST /api/zones/:id/combat-tick
router.post('/:id/combat-tick', (req, res) => {
  const db  = getDb();
  const playerId  = req.playerId;
  const { monsterId } = req.body;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });

  const zone = db.prepare('SELECT * FROM zones WHERE id=?').get(req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });

  ensurePlayer(db, playerId);
  const player = db.prepare('SELECT level,xp,hp,mana,gold,recoveryUntil,auto_salvage_rarities,active_skill_ids,hp_potion_count,mana_potion_count,hp_potion_threshold,mana_potion_threshold FROM player WHERE id=?').get(playerId);
  const now = Date.now();

  // ── recovery check ──
  if (player.recoveryUntil > now) {
    return res.json({ recovering: true, recoveryUntil: player.recoveryUntil, hp: 0, mana: player.mana ?? 100, playerLevel: player.level, playerXp: player.xp, xpToNextLevel: xpToNextLevel(player.level) });
  }

  // ── auto-restore after recovery period ──
  let currentHp = player.hp;
  if (currentHp <= 0) {
    currentHp = 100;
    db.prepare('UPDATE player SET hp=100,recoveryUntil=0 WHERE id=?').run(playerId);
  }

  // ── equipment bonuses ──
  const { atkBonus, defBonus, xpBonusPct } = getEquipmentBonuses(db, playerId);

  // ── resolve or initialize combat state ──
  const targetKey = monsterId || 'hunt-all';
  let state = playerCombat.get(playerId);

  if (!state || state.zoneId !== zone.id || state.targetKey !== targetKey || !state.queue.length || state.queueIdx >= state.queue.length) {
    const q = makeEnemyQueue(zone.id, monsterId);
    if (!q.length) {
      return res.json({ hp: currentHp, mana: player.mana ?? 100, playerLevel: player.level, playerXp: player.xp, xpToNextLevel: xpToNextLevel(player.level), leveledUp: false, killThisTick: false, damagePct: 0, currentEnemy: null, queuedEnemies: [] });
    }
    state = { zoneId: zone.id, targetKey, queue: q, queueIdx: 0 };
    playerCombat.set(playerId, state);
  }

  const frontEnemy    = state.queue[state.queueIdx];
  // Only alive enemies deal damage — dead AOE victims must not attack the player
  const activeEnemies = state.queue.slice(state.queueIdx).filter(e => e.currentHp > 0);

  // ── player attacks frontmost enemy ──
  const playerAtk  = 2 + player.level * 3 + atkBonus;
  const dmgToEnemy = Math.max(1, Math.round(playerAtk - frontEnemy.def * 0.3));
  frontEnemy.currentHp -= dmgToEnemy;

  // ── ALL active enemies attack player ──
  const defReduction  = Math.min(0.75, defBonus * 0.02);
  const damagePct     = activeEnemies.reduce((sum, e) => sum + Math.max(0, e.atk * 0.4 * (1 - defReduction)), 0);
  const regenPct      = Math.max(0.3, Math.min(8, (player.level - frontEnemy.level + 3) * 0.6));
  let newHp           = Math.max(0, Math.min(100, currentHp - damagePct + regenPct));

  // ── auto HP potion (fires before death check) ──
  let hpPotionUsed = false;
  if (newHp < (player.hp_potion_threshold ?? 30) && (player.hp_potion_count ?? 0) > 0) {
    newHp = Math.min(100, newHp + 50);
    db.prepare('UPDATE player SET hp_potion_count = hp_potion_count - 1 WHERE id=?').run(playerId);
    hpPotionUsed = true;
  }

  // ── death ──
  if (newHp <= 0) {
    const recoveryUntil = now + RECOVERY_MS;
    db.prepare('UPDATE player SET hp=0,recoveryUntil=? WHERE id=?').run(recoveryUntil, playerId);
    playerCombat.delete(playerId);
    return res.json({ died: true, recoveryUntil, hp: 0, mana: player.mana ?? 100, playerLevel: player.level, playerXp: player.xp, xpToNextLevel: xpToNextLevel(player.level) });
  }

  // ── mana regen + auto mana potion ──
  const currentMana = player.mana ?? 100;
  let newMana = Math.min(100, currentMana + MANA_REGEN);
  let manaPotionUsed = false;
  if (newMana < (player.mana_potion_threshold ?? 30) && (player.mana_potion_count ?? 0) > 0) {
    newMana = Math.min(100, newMana + 50);
    db.prepare('UPDATE player SET mana_potion_count = mana_potion_count - 1 WHERE id=?').run(playerId);
    manaPotionUsed = true;
  }

  // Update last_active_at and last_monster_id on every tick
  db.prepare('UPDATE player SET last_active_at=?,last_monster_id=? WHERE id=?').run(now, monsterId || null, playerId);

  // ── skills: evaluate all active skills with mana check ──────────────────────
  const activeSkillIds = JSON.parse(player.active_skill_ids || '[]');
  const { fired: firedSkills, manaSpent } = evaluateSkills({
    activeSkillIds,
    skillDefs: SKILL_DEFS,
    getSkillRow: (skillId) =>
      db.prepare('SELECT rules FROM player_skills WHERE playerId=? AND skillId=?').get(playerId, skillId),
    state,
    now,
    playerAtk,
    newHp,
    currentMana: newMana,
    cooldownMap: playerSkillCooldown,
    playerId,
  });

  // ── Build skill cooldowns map ──
  const skillCooldowns = {};
  for (const sid of activeSkillIds) {
    const def = SKILL_DEFS[sid];
    if (!def) continue;
    const cdKey = `${playerId}:${sid}`;
    const lastFired = playerSkillCooldown.get(cdKey) || 0;
    skillCooldowns[sid] = Math.max(0, def.cooldownMs - (now - lastFired));
  }

  // ── Final HP/mana after skill effects ──
  let finalHp   = newHp;
  const finalMana = Math.max(0, newMana - manaSpent);
  const healFired = firedSkills.find(s => s.hpRestore);
  if (healFired) finalHp = Math.min(100, finalHp + healFired.hpRestore);

  // Write HP + mana in one statement
  db.prepare('UPDATE player SET hp=?, mana=? WHERE id=?').run(finalHp, finalMana, playerId);

  let killThisTick = false, killedEnemyName = null, xpGained = 0;
  let lootDrop = null, autoSalvaged = null, spiritShards = null;
  let totalKillsInZone, bonusPercent, killsToNextBonus;
  let totalGoldGained = 0;
  let { level, xp } = player, leveledUp = false;

  // Parsed once — used for every kill this tick
  const autoRarities = JSON.parse(player.auto_salvage_rarities || '[]');
  const xpMult       = 1 + (atkBonus / 100) + (xpBonusPct / 100);

  // ── helper: award XP + kill count + loot for one killed enemy ──────────────
  const processKill = (enemy) => {
    const gained = Math.round(enemy.xp * xpMult);
    xpGained += gained;
    xp       += gained;
    while (xp >= xpToNextLevel(level) && level < 100) { xp -= xpToNextLevel(level); level++; leveledUp = true; }

    db.prepare(`INSERT INTO player_zone_stats (playerId,zoneId,kills) VALUES (?,?,1) ON CONFLICT(playerId,zoneId) DO UPDATE SET kills=kills+1`).run(playerId, zone.id);
    const killRow = db.prepare('SELECT kills FROM player_zone_stats WHERE playerId=? AND zoneId=?').get(playerId, zone.id);
    totalKillsInZone = killRow.kills;
    bonusPercent     = Math.floor(totalKillsInZone / 1000);
    killsToNextBonus = 1000 - (totalKillsInZone % 1000);

    const loot = rollLoot(zone.id, level, bonusPercent);
    if (loot) {
      if (autoRarities.includes(loot.rarity)) {
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

    totalGoldGained += Math.max(1, Math.round(enemy.level + Math.random() * enemy.level));
  };

  // ── Process all enemies killed this tick (normal attack + skills) ──────────
  // Enemies die immediately when their HP hits 0, regardless of queue position.
  const allCurrent = state.queue.slice(state.queueIdx);
  const killedNow  = allCurrent.filter(e => e.currentHp <= 0);

  if (killedNow.length > 0) {
    killThisTick    = true;
    killedEnemyName = killedNow[0].name;

    // ── skill drop (3% chance per kill tick) ──
    let skillDrop = null;
    if (Math.random() < 0.03) {
      const learnedRows = db.prepare('SELECT skillId FROM player_skills WHERE playerId=?').all(playerId);
      const learned     = new Set(learnedRows.map(r => r.skillId));
      const available   = Object.keys(SKILL_DEFS).filter(id => !learned.has(id));
      if (available.length > 0) {
        const sid = available[Math.floor(Math.random() * available.length)];
        db.prepare('INSERT OR IGNORE INTO player_skills (playerId,skillId,learned_at) VALUES (?,?,?)').run(playerId, sid, now);
        skillDrop = { skillId: sid, ...SKILL_DEFS[sid] };
      }
    }

    for (const e of killedNow) processKill(e);

    // DB write for level/xp + gold once after all kills
    db.prepare('UPDATE player SET level=?,xp=? WHERE id=?').run(level, xp, playerId);
    if (totalGoldGained > 0) {
      db.prepare('UPDATE player SET gold = gold + ? WHERE id=?').run(totalGoldGained, playerId);
    }

    if (skillDrop) Object.assign(state, { _lastSkillDrop: skillDrop });

    // ── Rebuild queue: survivors stay, or start a new wave ──────────────────
    const aliveNow = allCurrent.filter(e => e.currentHp > 0);
    if (aliveNow.length > 0) {
      state.queue    = aliveNow;
      state.queueIdx = 0;
    } else {
      state.queue    = makeEnemyQueue(zone.id, monsterId);
      state.queueIdx = 0;
    }
  }

  // pull skill drop out of state if set this tick
  const skillDropOut = state._lastSkillDrop ?? null;
  if (skillDropOut) delete state._lastSkillDrop;

  // Build enemies array — only alive enemies (currentHp > 0) are shown
  const enemies = state.queue.slice(state.queueIdx)
    .filter(e => e.currentHp > 0)
    .map((e, i) => ({
      id: e.id, name: e.name,
      hp: e.currentHp, maxHp: e.hp,
      level: e.level, atk: e.atk, def: e.def,
      active: i === 0,
    }));

  res.json({
    killThisTick, killedEnemyName, xpGained,
    enemies,
    playerLevel: level, playerXp: xp, xpToNextLevel: xpToNextLevel(level), leveledUp,
    hp: finalHp, mana: finalMana, damagePct: Math.round(damagePct * 10) / 10,
    skillsFired: firedSkills,
    skillCooldowns,
    hpPotionUsed, manaPotionUsed,
    ...(skillDropOut ? { skillDrop: skillDropOut } : {}),
    ...(killThisTick ? {
      totalKillsInZone, bonusPercent, killsToNextBonus,
      lootDrop, autoSalvaged, goldGained: totalGoldGained,
      ...(spiritShards !== null ? { spiritShards } : {}),
    } : {}),
  });
});

module.exports = router;
