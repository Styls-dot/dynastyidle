const LOOT_TABLE = {
  'bamboo-thicket':            { weapon: ['Bamboo Staff','Spirit Needle','Hollow Reed Blade'],         armor: ['Forest Robes','Bark Mantle','Vine Wrapping'],          accessory: ['Spirit Bead','Fox Charm','Bamboo Seal'] },
  'jade-river-delta':          { weapon: ['River Blade','Serpent Fang','Jade Dart'],                   armor: ['River Silk Robe','Scale Mantle','Delta Wrapping'],     accessory: ['Jade Pendant','Water Talisman','Serpent Ring'] },
  'crimson-petal-grove':       { weapon: ['Petal Blade','Fox Claw','Bloom Dagger'],                    armor: ['Crimson Silk Robe','Petal Mantle','Fox Pelt'],          accessory: ['Crimson Bead','Fox Spirit Ring','Bloom Amulet'] },
  'iron-gate-pass':            { weapon: ['Iron Saber','Gate Spear','Fallen Blade'],                   armor: ['Iron Plate','Soldier Mantle','Gate Vambrace'],          accessory: ['Iron Sigil','Warlord Pendant','Bone Talisman'] },
  'ascending-mist-temple':     { weapon: ['Monk Staff','Temple Spear','Sutra Blade'],                  armor: ['Temple Robe','Monk Mantle','Sutra Sash'],               accessory: ['Temple Seal','Monk Bead','Sutra Pendant'] },
  'sunken-lotus-marshes':      { weapon: ['Marsh Blade','Lotus Spear','Drowned Saber'],                armor: ['Lotus Robe','Marsh Mantle','Sodden Wrapping'],          accessory: ['Black Lotus Bead','Marsh Ring','Drowned Talisman'] },
  'shattered-sky-ridge':       { weapon: ['Thunder Blade','Lightning Spear','Sky Saber'],              armor: ['Storm Plate','Sky Mantle','Glass Vambrace'],            accessory: ['Thunder Bead','Storm Ring','Sky Talisman'] },
  'desert-of-forgotten-kings': { weapon: ['Sand Saber','Tomb Spear','Dune Blade'],                    armor: ['Desert Plate','Tomb Mantle','Sand Vambrace'],           accessory: ['Pharaoh Seal','Desert Ring','Tomb Pendant'] },
  'sea-of-swaying-bamboo':     { weapon: ['Ancient Staff','Qi Blade','Verdant Spear'],                 armor: ['Ancient Robe','Grove Mantle','Qi Sash'],                accessory: ['Ancient Seal','Qi Bead','Grove Ring'] },
  'frost-peak-hermitage':      { weapon: ['Frost Blade','Ice Spear','Frozen Saber'],                   armor: ['Frost Plate','Ice Mantle','Frozen Vambrace'],           accessory: ['Frost Bead','Ice Ring','Hermit Seal'] },
  'celestial-dragon-spire':    { weapon: ['Dragon Blade','Celestial Spear','Heavenly Saber'],          armor: ['Dragon Scale Plate','Celestial Mantle','Heaven Sash'],  accessory: ['Dragon Bead','Celestial Ring','Dragon Seal'] },
  'palace-of-jade-emperor':    { weapon: ['Imperial Blade','Jade Spear','Divine Saber'],               armor: ['Imperial Robe','Jade Plate','Divine Mantle'],           accessory: ['Imperial Jade Seal','Jade Emperor Ring','Divine Bead'] },
};

// weight, base stat values per rarity
const RARITIES = [
  { name: 'common',    w: 60, atk: 3,  def: 3,  hp: 5,  xpBonus: 2  },
  { name: 'rare',      w: 25, atk: 8,  def: 8,  hp: 12, xpBonus: 6  },
  { name: 'epic',      w: 10, atk: 18, def: 18, hp: 25, xpBonus: 14 },
  { name: 'legendary', w: 4,  atk: 35, def: 35, hp: 50, xpBonus: 28 },
  { name: 'mythic',    w: 1,  atk: 70, def: 70, hp: 100,xpBonus: 56 },
];

function rollRarity(dropBonusPct = 0) {
  const shift = Math.min(dropBonusPct * 1.5, 36);
  const ws = [
    Math.max(10, 60 - shift),
    25 + shift * 0.45,
    10 + shift * 0.28,
    4  + shift * 0.14,
    1  + shift * 0.05,
  ];
  const total = ws.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < RARITIES.length; i++) {
    r -= ws[i];
    if (r <= 0) return RARITIES[i];
  }
  return RARITIES[0];
}

// Returns null (no drop) or { name, type, rarity, stats }
function rollLoot(zoneId, playerLevel, dropBonusPct = 0) {
  const dropChance = 0.20 + dropBonusPct * 0.01;
  if (Math.random() > dropChance) return null;

  const table = LOOT_TABLE[zoneId];
  if (!table) return null;

  const typeKeys = ['weapon', 'armor', 'accessory'];
  const typeKey  = typeKeys[Math.floor(Math.random() * typeKeys.length)];
  const names    = table[typeKey];
  const name     = names[Math.floor(Math.random() * names.length)];
  const rarity   = rollRarity(dropBonusPct);
  const lvScale  = Math.floor(playerLevel / 10);

  let stats;
  if (typeKey === 'weapon')    stats = { atk: rarity.atk + lvScale };
  else if (typeKey === 'armor') stats = { def: rarity.def + lvScale, hp: Math.floor(rarity.hp / 2) + lvScale };
  else                          stats = { xpBonus: rarity.xpBonus + lvScale };

  return { name, type: typeKey, rarity: rarity.name, stats };
}

module.exports = { rollLoot };
