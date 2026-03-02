# Dynasty Idle — Project Context

## Project overview
A browser-based idle/incremental RPG with a Chinese cultivation (xianxia) theme. Players enter zones, fight monsters automatically, gain XP/levels, collect loot, and enhance equipment. Built to run locally or on a server — a link is shareable so friends can play together (separate player IDs per browser).

## Stack
- **Frontend:** React 18 + Vite 5, plain CSS (no Tailwind/CSS-in-JS)
- **Backend:** Node.js + Express, better-sqlite3 (SQLite), uuid
- **Auth:** JWT (30-day expiry) + bcryptjs
- **No TypeScript** — everything is plain JS/JSX
- **No test framework** yet

## Running locally
```bash
# Server (port 3001) — always start this first
cd server && node index.js

# Client dev server (port 5173)
cd client && npm run dev

# Build client for production (server serves dist/)
cd client && npm run build
```
Server serves `client/dist` as static files, so after `npm run build` everything runs on `http://localhost:3001`.

After any server-side change: restart server.
After any client-side change: `npm run build` then restart server.

## Repo
GitHub: https://github.com/Styls-dot/dynastyidle (branch: main)

## Project structure
```
dynasty-game/
├── client/
│   ├── src/
│   │   ├── App.jsx              # Root component, all state, combat loop
│   │   ├── api.js               # All fetch calls to server
│   │   ├── index.css            # All styles (single file, no modules)
│   │   └── components/
│   │       ├── CombatDisplay.jsx   # Player vs enemies visual (fixed 160px height)
│   │       ├── MonsterArt.jsx      # All monster SVGs + MONSTER_SVG map
│   │       ├── MonsterRoster.jsx   # Monster selection list in zone detail
│   │       ├── ZoneDetail.jsx      # Centre panel: zone info + combat + skills
│   │       ├── ZoneList.jsx        # Left panel: zone list
│   │       ├── ZoneActivity.jsx    # Right panel: combat log
│   │       ├── PlayerBar.jsx       # Top XP/level/HP/mana bar
│   │       ├── InventoryPanel.jsx  # Bag overlay + equip/salvage/enhance/auto-enhance
│   │       ├── ShopPanel.jsx       # Buy HP/mana potions
│   │       └── CharacterView.jsx   # Character stats page
│   └── dist/                    # Built output (served by Express)
└── server/
    ├── index.js                 # Express app entry point
    ├── db.js                    # SQLite setup, schema, migrations, seed data + maxHp/maxMana funcs
    ├── routes/
    │   ├── auth.js              # Register, login, offline progress calc
    │   ├── zones.js             # Combat logic (most complex route)
    │   ├── player.js            # Player stats, spirit shards, auto-salvage
    │   ├── inventory.js         # Equip, salvage, enhance
    │   ├── skills.js            # Learn, toggle, update skill rules
    │   └── shop.js              # Buy potions
    ├── services/
    │   └── skillEvaluator.js    # Evaluates + fires skills each combat tick
    └── data/
        ├── monsters.js          # Monster definitions per zone (60 total, 5 per zone)
        ├── skills.js            # Skill definitions (id, name, description, type, costs, etc.)
        ├── loot.js              # Loot tables + rollLoot()
        └── enemies.js           # (legacy, may be unused)
```

## Architecture — important patterns

### Player identity
- Users register/login with username+password → JWT token stored in localStorage
- Token decoded server-side via `middleware/auth.js` → sets `req.playerId`
- Sent as `Authorization: Bearer <token>` header on every request

### Combat loop (client)
- `setInterval` every `TICK_MS = 2500ms` in App.jsx
- Calls `POST /api/zones/:id/combat-tick` with `{ monsterId }`
- `monsterId = null` means "Hunt All" mode
- Response updates: player HP/mana/XP/level, enemies array, loot, kill stats, skills fired

### Combat state (server)
- In-memory `playerCombat` Map in `routes/zones.js` — keyed by playerId
- State: `{ zoneId, targetKey, queue: [{...monster, currentHp}], queueIdx }`
- `makeEnemyQueue(zoneId, monsterId)`: specific monster → single target loop; null → 1 guaranteed + 50% chain (Hunt All)
- Player attacks only the frontmost enemy (`queue[queueIdx]`)
- ALL enemies in queue deal damage every tick simultaneously
- `playerCombat.delete(playerId)` on zone entry (resets combat)
- All dead enemies processed each tick: `killedNow = allCurrent.filter(e => e.currentHp <= 0)`

### HP & Mana scaling
```js
maxHp(level)   = 100 + (level - 1) * 20   // exported from db.js
maxMana(level) = 100 + (level - 1) * 10   // exported from db.js
```
- Equipment armor adds `hpBonus = (s.hp || 0) + plusLevel * 10` to maxHp
- `maxHp` and `maxMana` sent in EVERY combat tick response
- App.jsx stores them in player state; components use `player.maxHp ?? formula`
- One-time DB migration (`hp_version` column) converted old % HP to absolute values

### Combat tick response
```js
{
  enemies: [{ id, name, hp, maxHp, level, atk, def, active }],
  killThisTick, killedEnemyName, xpGained,
  playerLevel, playerXp, xpToNextLevel, leveledUp,
  hp, mana, maxHp, maxMana, damagePct,
  skillsFired: [{ skillId, name, icon, targetsHit, hpRestore? }],
  skillCooldowns: { [skillId]: remainingMs },
  totalKillsInZone, bonusPercent, killsToNextBonus,
  lootDrop, autoSalvaged, spiritShards, goldGained,
  hpPotionUsed, manaPotionUsed
}
```

### Skills system
4 skills defined in `server/data/skills.js`:
- `tempest-slash`: AOE all enemies, `max(1, round(ATK - DEF×0.3))` each, 20 mana, 10s CD
- `iron-body`: Heal `healAmount` HP, 15 mana, 12s CD ⚠️ BUG (see below)
- `soul-sever`: Single target `max(1, round(ATK×2.5 - DEF×0.3))`, 25 mana, 6s CD
- `five-element-palm`: AOE-pierce (ignores DEF), `max(1, round(ATK))` each, 35 mana, 18s CD

Skill descriptions use `[bracket]` syntax for variable values, rendered jade-green via `renderDesc()` in ZoneDetail.jsx.

Per-player skill rules (minTargets, hpBelow%, hpAbove%) stored in `player_skills.rules`.
Cooldowns in `playerSkillCooldown` Map (in-memory, keyed `playerId:skillId`).
⚙ gear button in ZoneDetail always visible; expands to show description + conditions (conditions only when active).

### ⚠️ KNOWN BUG — Iron Body heal
Iron Body reduces player HP to 100 instead of healing.
- Suspect: `Math.min(100, finalHp + healFired.hpRestore)` running somewhere despite fix
- File on disk at zones.js line ~240 looks correct: `Math.min(maxHpVal, ...)`
- Additionally: flat 20 HP heal doesn't scale — should be % of maxHp (e.g. 20%)
- **Fix needed:** verify server is running correct code; change healAmount to % of maxHp

### CombatDisplay layout
- Fixed `grid-template-rows: 160px` — NEVER changes height, prevents layout jumping
- Enemy art uses `flex: 1; min-height: 0` — fills available space vertically
- SVGs scale via `max-height: 100%; max-width: 100%; width: auto; height: auto`
- Count-based CSS classes `cc-eg-1` through `cc-eg-6` on the enemy group

## CSS conventions
- Single file: `client/src/index.css`
- CSS variables on `:root`: `--jade`, `--gold`, `--accent`, `--panel`, `--border-soft`, `--text`, `--text-muted`, `--text-dim`, `--mana`
- Font: 'Cinzel' (serif, from Google Fonts) for all game text
- Dark theme throughout
- BEM-ish naming: component prefix (e.g. `cc-` for combat, `mr-` for monster roster, `pb-` for player bar, `inv-` for inventory)
- Skill cooldown visual: `.skill-row` uses CSS gradient with `--cd-pct` + `--cd-fill` custom properties

## Game systems implemented
- **12 zones** (level 1–100), seeded in DB on first run
- **5 monsters per zone** (60 total) — Bamboo Thicket has SVG art, rest do not
- **Equipment:** weapon (atk), armor (def+hp), accessory (xpBonus) — 3 slots
- **Enhancement:** spirit shards, cost `10 + plus²×3`, success `max(1, round(100×0.82^plus))`, fail resets to +0
- **Auto-enhance:** client-side loop with target plus-level, 950ms/attempt, stops when target reached or shards depleted
- **PLUS_BONUS per level:** ATK+3, DEF+2, HP+10, XP%+1
- **Auto-salvage:** set rarities to auto-convert to spirit shards on drop
- **Potions:** HP/mana potions, auto-use below threshold%, restore 30% of max
- **Kill milestones:** every 1000 kills in a zone = +1% drop bonus
- **Recovery:** on death, 15s recovery period before combat resumes
- **Offline progress:** calculated on login, capped at 24h
- **Skills:** 4 skills implemented, per-skill conditions, visual cooldown bars

## Key numbers
```js
TICK_MS        = 2500   // combat tick interval
RECOVERY_MS    = 15000  // death recovery time
ACTIVE_WINDOW  = 120000 // 2min window for "active players" count
INVENTORY_CAP  = 50     // max bag slots
MAX_LOG        = 40     // combat log entries kept
MANA_REGEN     = 5      // mana restored per combat tick

// Player attack: 2 + level*3 + atkBonus
// Damage to enemy: max(1, round(playerAtk - enemy.def * 0.3))
// Damage from enemies: sum(enemy.atk * 0.4 * (1 - defReduction)) per tick
// DefReduction: min(0.75, defBonus * 0.02)
// Regen per tick: clamp(0.3 .. maxHpVal*0.04, (playerLevel - enemyLevel + 3) * 0.6)
// XP gained: round(enemy.xp * (1 + atkBonus/100 + xpBonusPct/100))
// XP to next level: level * 50
// maxHp(level) = 100 + (level-1) * 20
// maxMana(level) = 100 + (level-1) * 10
```

## Planned / not yet built
- Monster art for zones 2–12
- Multiplayer events / world bosses
- Crafting system
- Gathering system
- Skill leveling system (descriptions already forward-compatible with [bracket] syntax)
