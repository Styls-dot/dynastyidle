# Dynasty Idle — Project Context

## Project overview
A browser-based idle/incremental RPG with a Chinese cultivation (xianxia) theme. Players enter zones, fight monsters automatically, gain XP/levels, collect loot, and enhance equipment. Built to run locally or on a server — a link is shareable so friends can play together (separate player IDs per browser).

## Stack
- **Frontend:** React 18 + Vite 5, plain CSS (no Tailwind/CSS-in-JS)
- **Backend:** Node.js + Express, better-sqlite3 (SQLite), uuid
- **No TypeScript** — everything is plain JS/JSX
- **No test framework** yet

## Running locally
```bash
# Server (port 3001)
cd server && node index.js

# Client dev server (port 5173)
cd client && npm run dev

# Build client for production (server serves dist/)
cd client && npm run build
```
Server serves `client/dist` as static files, so after `npm run build` everything runs on `http://localhost:3001`.

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
│   │       ├── ZoneDetail.jsx      # Centre panel: zone info + combat
│   │       ├── ZoneList.jsx        # Left panel: zone list
│   │       ├── ZoneActivity.jsx    # Right panel: combat log
│   │       ├── PlayerBar.jsx       # Top XP/level/HP bar
│   │       ├── InventoryPanel.jsx  # Bag overlay + equip/salvage/enhance
│   │       └── CharacterView.jsx   # Character stats page
│   └── dist/                    # Built output (served by Express)
└── server/
    ├── index.js                 # Express app entry point
    ├── db.js                    # SQLite setup, schema, migrations, seed data
    ├── routes/
    │   ├── zones.js             # Combat logic (most complex route)
    │   ├── player.js            # Player stats, spirit shards, auto-salvage
    │   └── inventory.js         # Equip, salvage, enhance
    └── data/
        ├── monsters.js          # Monster definitions per zone
        ├── enemies.js           # (legacy, may be unused)
        └── loot.js              # Loot tables + rollLoot()
```

## Architecture — important patterns

### Player identity
- Player ID is a UUID stored in `localStorage` (generated on first visit)
- Sent as `x-player-id` header on every request
- No login/auth — anyone with your ID can play as you

### Combat loop (client)
- `setInterval` every `TICK_MS = 2500ms` in App.jsx
- Calls `POST /api/zones/:id/combat-tick` with `{ playerId, monsterId }`
- `monsterId = null` means "Hunt All" mode
- Response updates: player HP/XP/level, enemies array, loot, kill stats

### Combat state (server)
- In-memory `playerCombat` Map in `routes/zones.js` — keyed by playerId
- State: `{ zoneId, targetKey, queue: [{...monster, currentHp}], queueIdx }`
- `makeEnemyQueue(zoneId, monsterId)`: specific monster → single target loop; null → 1 guaranteed + 50% chain (Hunt All)
- Player attacks only the frontmost enemy (`queue[queueIdx]`)
- ALL enemies in queue deal damage every tick simultaneously
- `playerCombat.delete(playerId)` on zone entry (resets combat)

### Combat tick response
```js
{
  enemies: [{ id, name, hp, maxHp, level, atk, def, active }],
  // active: true = being attacked by player (currently always enemies[0])
  // active is AOE-ready: set multiple to true when AOE skills are added
  killThisTick, killedEnemyName, xpGained,
  playerLevel, playerXp, xpToNextLevel, leveledUp,
  hp, damagePct,
  // on kill:
  totalKillsInZone, bonusPercent, killsToNextBonus,
  lootDrop, autoSalvaged, spiritShards
}
```

### CombatDisplay layout
- Fixed `grid-template-rows: 160px` — NEVER changes height, prevents layout jumping
- Enemy art uses `flex: 1; min-height: 0` — fills available space vertically
- SVGs scale via `max-height: 100%; max-width: 100%; width: auto; height: auto`
- Count-based CSS classes `cc-eg-1` through `cc-eg-6` on the enemy group — only adjust font-size, padding, bar height, and visibility (never art dimensions directly)

## CSS conventions
- Single file: `client/src/index.css`
- CSS variables on `:root`: `--jade`, `--gold`, `--accent`, `--panel`, `--border-soft`, `--text`, `--text-muted`, `--text-dim`
- Font: 'Cinzel' (serif, from Google Fonts) for all game text
- Dark theme throughout
- BEM-ish naming: component prefix (e.g. `cc-` for combat, `mr-` for monster roster)

## Game systems implemented
- **12 zones** (level 1–100), seeded in DB on first run
- **5 monsters** in Bamboo Thicket (zone 1) — other zones have no monsters yet
- **Equipment:** weapon (atk), armor (def), accessory (xpBonus) — 3 slots
- **Enhancement:** +level items with spirit shards, success chance decreases per level
- **Auto-salvage:** set rarities to auto-convert to spirit shards on drop
- **Kill milestones:** every 1000 kills in a zone = +1% drop bonus
- **Recovery:** on death, 15s recovery period before combat resumes

## Planned / not yet built
- Skills (combat AOE, gathering, crafting) — nav tabs exist but disabled
- Monster art for zones 2–12 (Bamboo Thicket has 5 SVGs, rest have none)
- Multiplayer events / world bosses
- Crafting system

## Key numbers
```js
TICK_MS        = 2500   // combat tick interval
RECOVERY_MS    = 15000  // death recovery time
ACTIVE_WINDOW  = 120000 // 2min window for "active players" count
INVENTORY_CAP  = 50     // max bag slots
MAX_LOG        = 40     // combat log entries kept

// Player attack: 2 + level*3 + atkBonus
// Damage to enemy: max(1, round(playerAtk - enemy.def * 0.3))
// Damage from enemies: sum(enemy.atk * 0.4 * (1 - defReduction)) per tick
// DefReduction: min(0.75, defBonus * 0.02)
// Regen per tick: clamp(0.3..8, (playerLevel - enemyLevel + 3) * 0.6)
// XP gained: round(enemy.xp * (1 + atkBonus/100 + xpBonusPct/100))
// XP to next level: level * 50
```
