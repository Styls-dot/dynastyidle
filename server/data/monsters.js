// Detailed monster rosters per zone.
// SVG artwork is only implemented for bamboo-thicket for now.
module.exports = {

  // ── Bamboo Thicket  Lv 1–10 ──────────────────────────────────────────────
  'bamboo-thicket': [
    {
      id: 'bamboo-sprite',
      name: 'Bamboo Sprite',
      level: 1, hp: 18, atk: 2, def: 0, xp: 6,
      description: 'A tiny qi-fed wisp drifting between stalks. Harmless alone, annoying in swarms.',
    },
    {
      id: 'forest-imp',
      name: 'Forest Imp',
      level: 3, hp: 30, atk: 5, def: 1, xp: 11,
      description: 'Mischievous and quick. Steals Qi from cultivators caught mid-meditation.',
    },
    {
      id: 'pale-fox-spirit',
      name: 'Pale Fox Spirit',
      level: 5, hp: 44, atk: 8, def: 2, xp: 17,
      description: 'A cunning spirit that mimics voices to lure cultivators off the path.',
    },
    {
      id: 'hollow-reed-demon',
      name: 'Hollow Reed Demon',
      level: 8, hp: 60, atk: 11, def: 4, xp: 24,
      description: 'Hollow bamboo fused with malice. Its shriek scatters Qi from the meridians.',
    },
    {
      id: 'green-mist-specter',
      name: 'Green Mist Specter',
      level: 10, hp: 80, atk: 14, def: 6, xp: 34,
      description: 'Ancient apex predator of the thicket. Feeds on the life force of the lost.',
    },
  ],

  // ── Jade River Delta  Lv 11–20 ──────────────────────────────────────────
  'jade-river-delta': [
    {
      id: 'river-serpent',
      name: 'River Serpent',
      level: 11, hp: 96, atk: 16, def: 5, xp: 37,
      description: 'A scaled predator coiled beneath the jade-green shallows. Strikes without warning.',
    },
    {
      id: 'jade-carp-demon',
      name: 'Jade Carp Demon',
      level: 13, hp: 114, atk: 19, def: 7, xp: 43,
      description: 'A carp that cultivated for too long in corrupted waters. Its scales deflect weak Qi.',
    },
    {
      id: 'water-phantom',
      name: 'Water Phantom',
      level: 15, hp: 132, atk: 22, def: 8, xp: 49,
      description: 'A spirit that drowned centuries ago and forgot it was mortal. Cold to the touch.',
    },
    {
      id: 'drowned-sentry',
      name: 'Drowned Sentry',
      level: 17, hp: 148, atk: 25, def: 10, xp: 55,
      description: 'A soldier who sank into the delta still clutching his post. Refuses to stand down.',
    },
    {
      id: 'lotus-shade',
      name: 'Lotus Shade',
      level: 20, hp: 172, atk: 29, def: 12, xp: 64,
      description: 'Born from a lotus that absorbed too much death. Its bloom poisons the Qi of those near it.',
    },
  ],

  // ── Crimson Petal Grove  Lv 21–30 ───────────────────────────────────────
  'crimson-petal-grove': [
    {
      id: 'fox-demon',
      name: 'Fox Demon',
      level: 21, hp: 178, atk: 30, def: 13, xp: 66,
      description: 'A nine-tailed fox stripped of most its tails by a passing immortal. Still dangerous.',
    },
    {
      id: 'petal-wraith',
      name: 'Petal Wraith',
      level: 23, hp: 196, atk: 34, def: 14, xp: 72,
      description: 'A spirit bound to the grove\'s blossoms. Scatters razor-edged petals when cornered.',
    },
    {
      id: 'bloom-specter',
      name: 'Bloom Specter',
      level: 25, hp: 212, atk: 37, def: 15, xp: 79,
      description: 'Invisible until it blooms — then the entire Qi field warps around it.',
    },
    {
      id: 'thorn-dancer',
      name: 'Thorn Dancer',
      level: 27, hp: 228, atk: 40, def: 16, xp: 85,
      description: 'Moves like a dancer. Every step leaves thorns in the spiritual plane.',
    },
    {
      id: 'crimson-sprite',
      name: 'Crimson Sprite',
      level: 30, hp: 252, atk: 44, def: 18, xp: 94,
      description: 'The grove\'s guardian. Ancient, territorial, and fueled by centuries of fallen blood.',
    },
  ],

  // ── Iron Gate Pass  Lv 31–42 ────────────────────────────────────────────
  'iron-gate-pass': [
    {
      id: 'rogue-soldier',
      name: 'Rogue Soldier',
      level: 31, hp: 260, atk: 45, def: 19, xp: 97,
      description: 'A deserter from a dynasty that no longer exists. Still follows orders burned into his soul.',
    },
    {
      id: 'fallen-knight',
      name: 'Fallen Knight',
      level: 34, hp: 284, atk: 49, def: 21, xp: 106,
      description: 'Once the gate\'s finest defender. Now its most relentless threat. His armor has fused to his bones.',
    },
    {
      id: 'gate-specter',
      name: 'Gate Specter',
      level: 37, hp: 308, atk: 53, def: 22, xp: 115,
      description: 'The pass itself seems to breathe this creature into existence. It guards a door that no longer stands.',
    },
    {
      id: 'bone-sentinel',
      name: 'Bone Sentinel',
      level: 39, hp: 324, atk: 56, def: 24, xp: 121,
      description: 'An assembly of soldier bones that coalesced into a single will. Impossible to negotiate with.',
    },
    {
      id: 'iron-shade',
      name: 'Iron Shade',
      level: 42, hp: 348, atk: 61, def: 25, xp: 130,
      description: 'The shadow of an iron golem used to seal the pass in the old war. The golem is gone; its shadow is not.',
    },
  ],

  // ── Ascending Mist Temple  Lv 43–54 ─────────────────────────────────────
  'ascending-mist-temple': [
    {
      id: 'corrupted-monk',
      name: 'Corrupted Monk',
      level: 43, hp: 356, atk: 62, def: 26, xp: 133,
      description: 'A monk who sought enlightenment and found something else entirely. His sutras now cause harm.',
    },
    {
      id: 'temple-shade',
      name: 'Temple Shade',
      level: 46, hp: 380, atk: 66, def: 28, xp: 142,
      description: 'The shade cast by the temple in the morning light. Animated by ten thousand years of prayer gone sour.',
    },
    {
      id: 'sutra-wraith',
      name: 'Sutra Wraith',
      level: 49, hp: 404, atk: 70, def: 30, xp: 151,
      description: 'A scroll of sacred text possessed by a drifting hunger. Speaks only in corrupted verse.',
    },
    {
      id: 'mist-abbot',
      name: 'Mist Abbot',
      level: 52, hp: 428, atk: 74, def: 31, xp: 160,
      description: 'The temple\'s last abbot, absorbed into the mist that swallowed the upper halls.',
    },
    {
      id: 'fallen-disciple',
      name: 'Fallen Disciple',
      level: 54, hp: 444, atk: 77, def: 33, xp: 166,
      description: 'A prodigy cultivator who ascended too fast and shattered his own meridians. Now held together by spite.',
    },
  ],

  // ── Sunken Lotus Marshes  Lv 55–64 ──────────────────────────────────────
  'sunken-lotus-marshes': [
    {
      id: 'drowned-spirit',
      name: 'Drowned Spirit',
      level: 55, hp: 452, atk: 79, def: 33, xp: 169,
      description: 'A spirit that never surfaced after the great flood. The water is part of it now.',
    },
    {
      id: 'marsh-demon',
      name: 'Marsh Demon',
      level: 57, hp: 468, atk: 82, def: 34, xp: 175,
      description: 'Bloated with centuries of stagnant Qi. Every wound it takes releases a toxic cloud.',
    },
    {
      id: 'rotting-soldier',
      name: 'Rotting Soldier',
      level: 59, hp: 484, atk: 85, def: 36, xp: 181,
      description: 'One of thousands buried when the river city sank. Preserved by black water and black intent.',
    },
    {
      id: 'black-lotus-shade',
      name: 'Black Lotus Shade',
      level: 62, hp: 508, atk: 88, def: 37, xp: 190,
      description: 'A lotus grown over the mass grave at the marsh\'s heart. Its roots reach every corpse beneath.',
    },
    {
      id: 'sunken-guardian',
      name: 'Sunken Guardian',
      level: 64, hp: 524, atk: 92, def: 38, xp: 196,
      description: 'Built to protect the river city\'s vaults. Still at its post, now leagues underwater.',
    },
  ],

  // ── Shattered Sky Ridge  Lv 65–74 ───────────────────────────────────────
  'shattered-sky-ridge': [
    {
      id: 'storm-elemental',
      name: 'Storm Elemental',
      level: 65, hp: 532, atk: 93, def: 39, xp: 199,
      description: 'Born from a lightning strike that hit the same peak for a thousand years. Pure electrical intent.',
    },
    {
      id: 'lightning-wraith',
      name: 'Lightning Wraith',
      level: 67, hp: 548, atk: 96, def: 40, xp: 205,
      description: 'Moves faster than the eye. By the time you see it, the strike has already landed.',
    },
    {
      id: 'glass-roc',
      name: 'Glass Roc',
      level: 69, hp: 564, atk: 99, def: 41, xp: 211,
      description: 'A great roc whose feathers fused to glass after nesting on the lightning-struck peaks for generations.',
    },
    {
      id: 'thunder-shade',
      name: 'Thunder Shade',
      level: 71, hp: 580, atk: 102, def: 43, xp: 217,
      description: 'The shadow left behind after a thunderclap. Detached from its sound, it wanders with fury.',
    },
    {
      id: 'sky-demon',
      name: 'Sky Demon',
      level: 74, hp: 604, atk: 106, def: 44, xp: 226,
      description: 'An ancient demon that fell from a higher realm and embedded itself in the ridge. Still falling, in its mind.',
    },
  ],

  // ── Desert of Forgotten Kings  Lv 75–84 ─────────────────────────────────
  'desert-of-forgotten-kings': [
    {
      id: 'terracotta-warrior',
      name: 'Terracotta Warrior',
      level: 75, hp: 612, atk: 107, def: 45, xp: 229,
      description: 'Fired in kilns fed by immortality elixirs. Obeys a dynasty that has been dust for a thousand years.',
    },
    {
      id: 'sand-wraith',
      name: 'Sand Wraith',
      level: 77, hp: 628, atk: 110, def: 46, xp: 235,
      description: 'The last breath of a king who suffocated under his own tomb. Now it fills the lungs of trespassers.',
    },
    {
      id: 'tomb-guardian',
      name: 'Tomb Guardian',
      level: 79, hp: 644, atk: 113, def: 47, xp: 241,
      description: 'A construct built from the bones of royal servants buried alive. Loyal in death as in life.',
    },
    {
      id: 'desert-specter',
      name: 'Desert Specter',
      level: 81, hp: 660, atk: 116, def: 49, xp: 247,
      description: 'Drifts between the dunes like a heat mirage. Cultivators who follow it are never found.',
    },
    {
      id: 'dune-revenant',
      name: 'Dune Revenant',
      level: 84, hp: 684, atk: 119, def: 50, xp: 256,
      description: 'A king who refused to let death interrupt his reign. Has been ruling the sand for three centuries.',
    },
  ],

  // ── Sea of Swaying Bamboo  Lv 85–91 ─────────────────────────────────────
  'sea-of-swaying-bamboo': [
    {
      id: 'ancient-grove-spirit',
      name: 'Ancient Grove Spirit',
      level: 85, hp: 692, atk: 121, def: 51, xp: 259,
      description: 'The spiritual residue of a bamboo forest so old it predates the current age of the world.',
    },
    {
      id: 'qi-leech',
      name: 'Qi Leech',
      level: 87, hp: 708, atk: 124, def: 52, xp: 265,
      description: 'Bloated on the dense Qi of the ancient sea. Contact drains cultivation directly from the meridians.',
    },
    {
      id: 'bamboo-colossus',
      name: 'Bamboo Colossus',
      level: 89, hp: 724, atk: 127, def: 53, xp: 271,
      description: 'A colossal being assembled from bamboo stalks animated over millennia. Each stalk is a separate grievance.',
    },
    {
      id: 'verdant-specter',
      name: 'Verdant Specter',
      level: 90, hp: 732, atk: 128, def: 54, xp: 274,
      description: 'A spirit so saturated with plant-Qi that it can no longer be told apart from the forest itself.',
    },
    {
      id: 'forest-ancient',
      name: 'Forest Ancient',
      level: 91, hp: 740, atk: 129, def: 55, xp: 277,
      description: 'The oldest living thing in the bamboo sea. It has watched empires rise and fall without blinking.',
    },
  ],

  // ── Frost Peak Hermitage  Lv 92–95 ──────────────────────────────────────
  'frost-peak-hermitage': [
    {
      id: 'frost-giant',
      name: 'Frost Giant',
      level: 92, hp: 748, atk: 131, def: 55, xp: 280,
      description: 'A giant that has sat on the peak so long its thoughts have frozen solid.',
    },
    {
      id: 'ice-phoenix-spawn',
      name: 'Ice Phoenix Spawn',
      level: 93, hp: 756, atk: 132, def: 56, xp: 283,
      description: 'Hatched from an egg the immortal hermit left behind. Its rebirth cycle traps the cold it dies in.',
    },
    {
      id: 'frozen-hermit',
      name: 'Frozen Hermit',
      level: 93, hp: 756, atk: 133, def: 56, xp: 283,
      description: 'A cultivator who came to this hermitage to meditate and simply never stopped. Ice has made him permanent.',
    },
    {
      id: 'glacial-wraith',
      name: 'Glacial Wraith',
      level: 94, hp: 764, atk: 134, def: 56, xp: 286,
      description: 'The cold given form and intention. It seeks out warmth for the sole purpose of extinguishing it.',
    },
    {
      id: 'peak-specter',
      name: 'Peak Specter',
      level: 95, hp: 772, atk: 135, def: 57, xp: 289,
      description: 'The ghost of every cultivator who perished one step from the summit, fused into a single regret.',
    },
  ],

  // ── Celestial Dragon Spire  Lv 96–98 ────────────────────────────────────
  'celestial-dragon-spire': [
    {
      id: 'dragon-shade',
      name: 'Dragon Shade',
      level: 96, hp: 780, atk: 137, def: 58, xp: 292,
      description: 'The shadow cast by the bound celestial dragon. Attacks independently whenever the dragon stirs.',
    },
    {
      id: 'celestial-sentinel',
      name: 'Celestial Sentinel',
      level: 96, hp: 780, atk: 137, def: 58, xp: 292,
      description: 'Placed here by a heavenly court that has since forgotten about it. Still follows its original mandate.',
    },
    {
      id: 'spire-warden',
      name: 'Spire Warden',
      level: 97, hp: 788, atk: 138, def: 58, xp: 295,
      description: 'A warden fused to the spire itself. The tower\'s cracks are its veins; the wind is its breath.',
    },
    {
      id: 'heavenly-demon',
      name: 'Heavenly Demon',
      level: 98, hp: 796, atk: 139, def: 59, xp: 298,
      description: 'A demon that infiltrated the celestial court and was cast down here when discovered. Still enraged.',
    },
    {
      id: 'draconic-wraith',
      name: 'Draconic Wraith',
      level: 98, hp: 796, atk: 140, def: 59, xp: 298,
      description: 'A fragment of the bound dragon\'s own spirit, broken off during its imprisonment. Feral with pain.',
    },
  ],

  // ── Palace of the Jade Emperor  Lv 99–100 ───────────────────────────────
  'palace-of-jade-emperor': [
    {
      id: 'imperial-shade',
      name: 'Imperial Shade',
      level: 99, hp: 804, atk: 141, def: 59, xp: 301,
      description: 'The accumulated shadow of ten thousand years of imperial decree, given hunger and form.',
    },
    {
      id: 'divine-sentinel',
      name: 'Divine Sentinel',
      level: 99, hp: 804, atk: 142, def: 60, xp: 301,
      description: 'Stationed at the threshold between mortal and divine. Has turned away everyone who ever approached.',
    },
    {
      id: 'jade-guardian',
      name: 'Jade Guardian',
      level: 100, hp: 812, atk: 143, def: 60, xp: 304,
      description: 'Carved from a single piece of celestial jade. The Emperor\'s first and most loyal creation.',
    },
    {
      id: 'heavens-warden',
      name: "Heaven's Warden",
      level: 100, hp: 812, atk: 143, def: 60, xp: 304,
      description: 'Neither alive nor dead. Exists solely to ensure no mortal passes through the palace gate unchanged.',
    },
    {
      id: 'immortal-specter',
      name: 'Immortal Specter',
      level: 100, hp: 812, atk: 144, def: 60, xp: 304,
      description: 'The ghost of a cultivator who achieved immortality — then chose to remain here as a final test for others.',
    },
  ],

};
