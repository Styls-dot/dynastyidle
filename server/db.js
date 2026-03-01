const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'game.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      username      TEXT NOT NULL UNIQUE,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    INTEGER NOT NULL,
      last_login_at INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS zones (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      minLevel    INTEGER NOT NULL,
      maxLevel    INTEGER NOT NULL,
      description TEXT NOT NULL,
      tags        TEXT NOT NULL,
      sortOrder   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS player (
      id             TEXT PRIMARY KEY,
      level          INTEGER NOT NULL DEFAULT 1,
      xp             INTEGER NOT NULL DEFAULT 0,
      hp             REAL    NOT NULL DEFAULT 100,
      recoveryUntil  INTEGER NOT NULL DEFAULT 0,
      createdAt      INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS player_zone_stats (
      playerId  TEXT NOT NULL,
      zoneId    TEXT NOT NULL,
      kills     INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (playerId, zoneId)
    );

    CREATE TABLE IF NOT EXISTS player_presence (
      playerId  TEXT PRIMARY KEY,
      zoneId    TEXT NOT NULL,
      lastSeen  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS zone_events (
      id        TEXT PRIMARY KEY,
      zoneId    TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      type      TEXT NOT NULL,
      message   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS player_skills (
      playerId   TEXT NOT NULL,
      skillId    TEXT NOT NULL,
      learned_at INTEGER NOT NULL,
      PRIMARY KEY (playerId, skillId)
    );

    CREATE TABLE IF NOT EXISTS player_inventory (
      id           TEXT PRIMARY KEY,
      playerId     TEXT NOT NULL,
      name         TEXT NOT NULL,
      type         TEXT NOT NULL,
      rarity       TEXT NOT NULL,
      stats        TEXT NOT NULL,
      zoneId       TEXT NOT NULL,
      equippedSlot TEXT,
      obtainedAt   INTEGER NOT NULL
    );
  `);

  // Safe migrations for existing DBs
  const safeAlter = (sql) => { try { db.exec(sql); } catch (_) {} };
  safeAlter(`ALTER TABLE player ADD COLUMN level                  INTEGER NOT NULL DEFAULT 1`);
  safeAlter(`ALTER TABLE player ADD COLUMN xp                     INTEGER NOT NULL DEFAULT 0`);
  safeAlter(`ALTER TABLE player ADD COLUMN hp                     REAL    NOT NULL DEFAULT 100`);
  safeAlter(`ALTER TABLE player ADD COLUMN recoveryUntil          INTEGER NOT NULL DEFAULT 0`);
  safeAlter(`ALTER TABLE player ADD COLUMN spirit_shards          INTEGER NOT NULL DEFAULT 0`);
  safeAlter(`ALTER TABLE player ADD COLUMN auto_salvage_rarities  TEXT    NOT NULL DEFAULT '[]'`);
  safeAlter(`ALTER TABLE player_inventory ADD COLUMN plus_level   INTEGER NOT NULL DEFAULT 0`);
  safeAlter(`ALTER TABLE player ADD COLUMN user_id TEXT`);
  safeAlter(`ALTER TABLE player ADD COLUMN last_active_at INTEGER NOT NULL DEFAULT 0`);
  safeAlter(`ALTER TABLE player ADD COLUMN last_monster_id TEXT`);
  safeAlter(`ALTER TABLE player ADD COLUMN active_skill_id TEXT`);
  safeAlter(`ALTER TABLE player_skills ADD COLUMN rules TEXT NOT NULL DEFAULT '{}'`);
  safeAlter(`ALTER TABLE player ADD COLUMN mana                  REAL    NOT NULL DEFAULT 100`);
  safeAlter(`ALTER TABLE player ADD COLUMN gold                  INTEGER NOT NULL DEFAULT 0`);
  safeAlter(`ALTER TABLE player ADD COLUMN hp_potion_count       INTEGER NOT NULL DEFAULT 0`);
  safeAlter(`ALTER TABLE player ADD COLUMN mana_potion_count     INTEGER NOT NULL DEFAULT 0`);
  safeAlter(`ALTER TABLE player ADD COLUMN hp_potion_threshold   INTEGER NOT NULL DEFAULT 30`);
  safeAlter(`ALTER TABLE player ADD COLUMN mana_potion_threshold INTEGER NOT NULL DEFAULT 30`);
  safeAlter(`ALTER TABLE player ADD COLUMN active_skill_ids      TEXT    NOT NULL DEFAULT '[]'`);

  const { c } = db.prepare('SELECT COUNT(*) as c FROM zones').get();
  if (c === 0) seedZones(db);
}

function xpToNextLevel(level) {
  return level * 50;
}

function seedZones(db) {
  const zones = [
    { id:'bamboo-thicket',            name:'Bamboo Thicket',              minLevel:1,  maxLevel:10,  description:'A dense grove of ancient bamboo where wandering spirits drift between the stalks at dusk. Novice cultivators begin their path here, learning to feel the flow of Qi.',                                                                        tags:JSON.stringify(['forest','spirits','beginner']),           sortOrder:1  },
    { id:'jade-river-delta',          name:'Jade River Delta',            minLevel:11, maxLevel:20,  description:'Mist clings low over jade-green waters where river serpents guard shallow shoals. A proving ground for those who have survived their first trials.',                                                                                          tags:JSON.stringify(['river','mist','serpents']),               sortOrder:2  },
    { id:'crimson-petal-grove',       name:'Crimson Petal Grove',         minLevel:21, maxLevel:30,  description:'Blossoms fall year-round from trees that have never seen winter. Hidden fox spirits and flower demons challenge those who linger too long.',                                                                                                   tags:JSON.stringify(['forest','blossoms','demons']),            sortOrder:3  },
    { id:'iron-gate-pass',            name:'Iron Gate Pass',              minLevel:31, maxLevel:42,  description:'A narrow mountain corridor carved by ancient armies. Rogue soldiers of a fallen dynasty still patrol its crumbling battlements.',                                                                                                              tags:JSON.stringify(['mountain','fortress','undead']),          sortOrder:4  },
    { id:'ascending-mist-temple',     name:'Ascending Mist Temple',       minLevel:43, maxLevel:54,  description:'A monastery built into sheer cliffs where monks once cultivated for a thousand years. Their corrupted remnants guard the upper halls.',                                                                                                        tags:JSON.stringify(['mountain','monastery','corrupted']),      sortOrder:5  },
    { id:'sunken-lotus-marshes',      name:'Sunken Lotus Marshes',        minLevel:55, maxLevel:64,  description:'Drowned ruins of a river city, half-submerged in black water. Lotuses bloom above the graves of those who perished in the great flood.',                                                                                                      tags:JSON.stringify(['swamp','ruins','drowned']),               sortOrder:6  },
    { id:'shattered-sky-ridge',       name:'Shattered Sky Ridge',         minLevel:65, maxLevel:74,  description:'Lightning strikes the peaks so frequently the stone has fused to glass. Storm elementals and roc-riders make any crossing treacherous.',                                                                                                       tags:JSON.stringify(['mountain','lightning','elementals']),     sortOrder:7  },
    { id:'desert-of-forgotten-kings', name:'Desert of Forgotten Kings',   minLevel:75, maxLevel:84,  description:'Vast dunes bury the tombs of rulers who sought immortality and found only sand. Terracotta guardians still obey commands from a dynasty long swallowed by time.',                                                                            tags:JSON.stringify(['desert','ruins','undead','golems']),      sortOrder:8  },
    { id:'sea-of-swaying-bamboo',     name:'Sea of Swaying Bamboo',       minLevel:85, maxLevel:91,  description:'An ancient bamboo sea so vast cultivators have been lost in it for decades. The Qi here is dense enough to touch; the creatures that feed on it are immense.',                                                                               tags:JSON.stringify(['ancient','spirits','dense-qi']),          sortOrder:9  },
    { id:'frost-peak-hermitage',      name:'Frost Peak Hermitage',        minLevel:92, maxLevel:95,  description:'The abandoned hermitage of a reclusive immortal, claimed by frost giants and ice phoenixes. The cold here can freeze Qi solid within the meridians.',                                                                                        tags:JSON.stringify(['mountain','ice','phoenix']),              sortOrder:10 },
    { id:'celestial-dragon-spire',    name:'Celestial Dragon Spire',      minLevel:96, maxLevel:98,  description:'A tower that pierces the clouds, built on the back of a bound celestial dragon. Only cultivators nearing the peak of mortality dare ascend its steps.',                                                                                      tags:JSON.stringify(['divine','dragon','celestial']),           sortOrder:11 },
    { id:'palace-of-jade-emperor',    name:'Palace of the Jade Emperor',  minLevel:99, maxLevel:100, description:'The threshold of divinity. Those who reach this place stand on the border between mortal and immortal. Few return unchanged; most do not return at all.',                                                                                    tags:JSON.stringify(['divine','palace','immortal']),            sortOrder:12 },
  ];
  const insert = db.prepare(`INSERT INTO zones (id,name,minLevel,maxLevel,description,tags,sortOrder) VALUES (@id,@name,@minLevel,@maxLevel,@description,@tags,@sortOrder)`);
  db.transaction(rows => rows.forEach(r => insert.run(r)))(zones);
  console.log(`[db] seeded ${zones.length} zones`);
}

const SHARD_VALUES = { common: 1, rare: 4, epic: 12, legendary: 30, mythic: 100 };
const SELL_PRICES  = { common: 5, rare: 15, epic: 50, legendary: 150, mythic: 500 };
const HP_POTION_COST   = 50;   // gold
const MANA_POTION_COST = 40;   // gold
const POTION_RESTORE   = 50;   // HP/mana restored per potion
const POTION_MAX_STACK = 20;

// No cap — cost and chance scale indefinitely
function getEnhanceCost(plus)   { return 10 + plus * plus * 3; }
function getEnhanceChance(plus) { return Math.max(1, Math.round(100 * Math.pow(0.82, plus))); }

module.exports = { getDb, initDb, xpToNextLevel, SHARD_VALUES, SELL_PRICES, HP_POTION_COST, MANA_POTION_COST, POTION_RESTORE, POTION_MAX_STACK, getEnhanceCost, getEnhanceChance };
