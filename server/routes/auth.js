const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb, xpToNextLevel, SHARD_VALUES } = require('../db');
const MONSTERS  = require('../data/monsters');
const { rollLoot } = require('../data/loot');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'dynasty-dev-secret';
const INVENTORY_CAP = 50;

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

function getEquipmentBonuses(db, playerId) {
  const equipped = db.prepare(
    'SELECT type,stats,equippedSlot,plus_level FROM player_inventory WHERE playerId=? AND equippedSlot IS NOT NULL'
  ).all(playerId);
  let atkBonus = 0, xpBonusPct = 0;
  for (const item of equipped) {
    const s  = JSON.parse(item.stats);
    const pl = item.plus_level || 0;
    if (item.equippedSlot === 'weapon')    atkBonus   += (s.atk     || 0) + pl * 3;
    if (item.equippedSlot === 'accessory') xpBonusPct += (s.xpBonus || 0) + pl * 1;
  }
  return { atkBonus, xpBonusPct };
}

function calcOfflineProgress(db, player) {
  if (!player.last_active_at) return null;

  const presence = db.prepare('SELECT zoneId FROM player_presence WHERE playerId=?').get(player.id);
  if (!presence) return null;

  const zoneId   = presence.zoneId;
  const monsters = MONSTERS[zoneId];
  if (!monsters || !monsters.length) return null;

  const now      = Date.now();
  const idleMs   = Math.min(now - player.last_active_at, 86_400_000);
  if (idleMs < 2500) return null;

  const offlineTicks = Math.floor(idleMs / 2500);

  // Pick target monster
  const monsterId = player.last_monster_id;
  let enemy;
  if (monsterId) {
    enemy = monsters.find(m => m.id === monsterId);
  }
  if (!enemy) enemy = monsters[0];

  const { atkBonus, xpBonusPct } = getEquipmentBonuses(db, player.id);
  const playerAtk   = 2 + player.level * 3 + atkBonus;
  const dmgPerTick  = Math.max(1, Math.round(playerAtk - enemy.def * 0.3));
  const ticksPerKill = Math.ceil(enemy.hp / dmgPerTick);
  const totalKills   = Math.floor(offlineTicks / ticksPerKill);

  if (totalKills === 0) return null;

  // XP
  const xpMult   = 1 + xpBonusPct / 100;
  const xpGained = Math.round(totalKills * enemy.xp * xpMult);

  // Apply XP + level-ups
  let { level, xp } = player;
  xp += xpGained;
  let levelUps = 0;
  while (xp >= xpToNextLevel(level) && level < 100) {
    xp -= xpToNextLevel(level);
    level++;
    levelUps++;
  }

  // Zone kill stats for drop bonus
  const killRow = db.prepare('SELECT kills FROM player_zone_stats WHERE playerId=? AND zoneId=?').get(player.id, zoneId);
  const bonusPct = killRow ? Math.floor(killRow.kills / 1000) : 0;

  // Loot (cap at 150 rolls to avoid inventory spam)
  const lootRolls    = Math.min(totalKills, 150);
  const autoRarities = JSON.parse(player.auto_salvage_rarities || '[]');
  const lootItems    = [];
  let shardsGained   = 0;

  for (let i = 0; i < lootRolls; i++) {
    const loot = rollLoot(zoneId, player.level, bonusPct);
    if (!loot) continue;
    if (autoRarities.includes(loot.rarity)) {
      shardsGained += SHARD_VALUES[loot.rarity] || 1;
    } else {
      lootItems.push(loot);
    }
  }

  // Commit to DB inside a transaction
  db.transaction(() => {
    // XP + level
    db.prepare('UPDATE player SET level=?,xp=? WHERE id=?').run(level, xp, player.id);

    // Kill count
    if (totalKills > 0) {
      db.prepare(`INSERT INTO player_zone_stats (playerId,zoneId,kills) VALUES (?,?,?)
                  ON CONFLICT(playerId,zoneId) DO UPDATE SET kills=kills+excluded.kills`)
        .run(player.id, zoneId, totalKills);
    }

    // Spirit shards from auto-salvage
    if (shardsGained > 0) {
      db.prepare('UPDATE player SET spirit_shards=spirit_shards+? WHERE id=?').run(shardsGained, player.id);
    }

    // Inventory items (up to cap)
    const invCount = db.prepare('SELECT COUNT(*) as c FROM player_inventory WHERE playerId=?').get(player.id).c;
    let slots      = Math.max(0, INVENTORY_CAP - invCount);
    const addedItems = [];
    for (const loot of lootItems) {
      if (slots <= 0) break;
      const itemId = uuidv4();
      db.prepare(`INSERT INTO player_inventory (id,playerId,name,type,rarity,stats,zoneId,equippedSlot,obtainedAt,plus_level)
                  VALUES (?,?,?,?,?,?,?,NULL,?,0)`)
        .run(itemId, player.id, loot.name, loot.type, loot.rarity, JSON.stringify(loot.stats), zoneId, now);
      addedItems.push({ id: itemId, ...loot });
      slots--;
    }

    // Patch lootItems to only what actually landed in inventory
    lootItems.length = 0;
    lootItems.push(...addedItems);
  })();

  return {
    durationMs: idleMs,
    kills: totalKills,
    xpGained,
    levelUps,
    lootItems,
    spiritShardsGained: shardsGained,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || username.length < 3)
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  if (!email || !email.includes('@'))
    return res.status(400).json({ error: 'Invalid email address' });
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const db = getDb();
  if (db.prepare('SELECT id FROM users WHERE username=?').get(username))
    return res.status(409).json({ error: 'Username is already taken' });
  if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
    return res.status(409).json({ error: 'Email is already registered' });

  const hash     = await bcrypt.hash(password, 10);
  const userId   = uuidv4();
  const playerId = uuidv4();
  const now      = Date.now();

  db.transaction(() => {
    db.prepare('INSERT INTO users (id,username,email,password_hash,created_at,last_login_at) VALUES (?,?,?,?,?,?)')
      .run(userId, username, email, hash, now, now);
    db.prepare('INSERT INTO player (id,level,xp,hp,recoveryUntil,createdAt,user_id,last_active_at) VALUES (?,1,0,100,0,?,?,0)')
      .run(playerId, now, userId);
  })();

  const token = signToken({ userId, playerId, username });
  res.json({ token, username, playerId });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password)
    return res.status(400).json({ error: 'Login and password required' });

  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username=? OR email=?').get(login, login);
  if (!user)
    return res.status(401).json({ error: 'Incorrect username/email or password' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok)
    return res.status(401).json({ error: 'Incorrect username/email or password' });

  const player = db.prepare('SELECT * FROM player WHERE user_id=?').get(user.id);
  if (!player)
    return res.status(500).json({ error: 'Player profile not found' });

  // Calculate and apply offline progress before responding
  const offlineProgress = calcOfflineProgress(db, player);

  const now = Date.now();
  db.prepare('UPDATE users  SET last_login_at=?  WHERE id=?').run(now, user.id);
  db.prepare('UPDATE player SET last_active_at=? WHERE id=?').run(now, player.id);

  // Re-fetch player after mutations
  const updatedPlayer = db.prepare(
    'SELECT id,level,xp,hp,recoveryUntil,spirit_shards,auto_salvage_rarities FROM player WHERE id=?'
  ).get(player.id);

  const token = signToken({ userId: user.id, playerId: player.id, username: user.username });
  res.json({
    token,
    username: user.username,
    playerId: player.id,
    player: {
      id:                  updatedPlayer.id,
      level:               updatedPlayer.level,
      xp:                  updatedPlayer.xp,
      xpToNextLevel:       updatedPlayer.level * 50,
      hp:                  updatedPlayer.hp,
      recoveryUntil:       updatedPlayer.recoveryUntil,
      spiritShards:        updatedPlayer.spirit_shards ?? 0,
      autoSalvageRarities: JSON.parse(updatedPlayer.auto_salvage_rarities || '[]'),
    },
    offlineProgress,
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    const SECRET_KEY = process.env.JWT_SECRET || 'dynasty-dev-secret';
    const payload = require('jsonwebtoken').verify(token, SECRET_KEY);
    res.json({ username: payload.username, playerId: payload.playerId });
  } catch {
    res.status(401).json({ error: 'Invalid session' });
  }
});

module.exports = router;
