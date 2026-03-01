import React from 'react';

// ── Cultivation realms ────────────────────────────────────────────────────────

const REALMS = [
  { name: 'Qi Condensation',           minLevel: 1,   maxLevel: 10,  desc: 'Gathering ambient Qi into the meridians for the first time. Most mortals never take this step.' },
  { name: 'Foundation Building',       minLevel: 11,  maxLevel: 20,  desc: 'Forging a stable Qi foundation within the dantian. The majority of cultivators spend their lives here.' },
  { name: 'Core Formation',            minLevel: 21,  maxLevel: 35,  desc: 'Condensing Qi into a golden core at the body\'s center of power. A rare achievement that separates talent from mediocrity.' },
  { name: 'Nascent Soul',              minLevel: 36,  maxLevel: 50,  desc: 'A soul-seed forms within the golden core, granting true spiritual perception beyond the mortal veil.' },
  { name: 'Soul Transformation',       minLevel: 51,  maxLevel: 65,  desc: 'The nascent soul matures and may briefly leave the body. Heaven\'s will becomes a tangible force.' },
  { name: 'Void Refinement',           minLevel: 66,  maxLevel: 80,  desc: 'Refining the void between heaven and earth. The cultivator approaches unity with the nameless Tao.' },
  { name: 'Body Integration',          minLevel: 81,  maxLevel: 90,  desc: 'Spirit and flesh merge entirely. The physical form becomes an indestructible vessel for divine power.' },
  { name: 'Mahayana',                  minLevel: 91,  maxLevel: 98,  desc: 'Standing at the threshold between mortal and immortal. The heavenly tribulation draws near.' },
  { name: 'Tribulation Transcendence', minLevel: 99,  maxLevel: 100, desc: 'Facing the final tribulation. Those who endure shed the mortal coil entirely. Immortality awaits.' },
];

const STAGES = ['Early', 'Middle', 'Late', 'Peak'];

function getRealmInfo(level) {
  const realm     = REALMS.find(r => level >= r.minLevel && level <= r.maxLevel) || REALMS[REALMS.length - 1];
  const span      = realm.maxLevel - realm.minLevel + 1;
  const pos       = level - realm.minLevel;
  const progress  = span <= 1 ? 1 : pos / (span - 1);          // 0–1 through whole realm
  const stageIdx  = Math.min(3, Math.floor(progress * 4));
  const inStage   = (progress * 4) - stageIdx;                  // 0–1 through current stage
  return { ...realm, realmIdx: REALMS.indexOf(realm), stage: STAGES[stageIdx], stageIdx, inStage, progress };
}

// ── Stats calculation (mirrors server formulas) ───────────────────────────────

function calcStats(player, inventory) {
  if (!player) return { atk: 0, def: 0, maxHp: 100, xpMult: 1.00, dmgRed: 0 };
  const weapon    = inventory.find(i => i.equippedSlot === 'weapon');
  const armor     = inventory.find(i => i.equippedSlot === 'armor');
  const accessory = inventory.find(i => i.equippedSlot === 'accessory');
  const wp = weapon?.plus_level    || 0;
  const ap = armor?.plus_level     || 0;
  const cp = accessory?.plus_level || 0;
  const atk    = weapon    ? (weapon.stats.atk    || 0) + wp * 3 : 0;
  const def    = armor     ? (armor.stats.def     || 0) + ap * 2 : 0;
  const hp     = armor     ? (armor.stats.hp      || 0) + ap * 10 : 0;
  const xpBonus= accessory ? (accessory.stats.xpBonus || 0) + cp * 1 : 0;
  const lvl    = player.level;
  return {
    atk:    lvl * 2 + atk,
    def:    lvl     + def,
    maxHp:  100 + lvl * 20 + hp,
    xpMult: +(1 + atk / 100 + xpBonus / 100).toFixed(2),
    dmgRed: Math.min(75, def * 2),
  };
}

// ── Rarity helpers ────────────────────────────────────────────────────────────

const RARITY_COLOR = { common:'#7A6E62', rare:'#2F6B5F', epic:'#6B3A8A', legendary:'#C6A85C', mythic:'#B33A3A' };

function statLine(stats) {
  return Object.entries(stats)
    .map(([k, v]) => `${k === 'xpBonus' ? 'XP' : k.toUpperCase()} +${v}${k === 'xpBonus' ? '%' : ''}`)
    .join(' · ');
}

// ── Cultivator SVG figure ─────────────────────────────────────────────────────
// viewBox 0 0 280 390
// Key anchor points (in SVG coords):
//   head center:    (140, 52)
//   neck:           (140, 91)
//   right hand:     (268, 196)
//   torso left-edge:(50,  185)
//   torso center:   (140, 190)

function CultivatorFigure() {
  return (
    <svg viewBox="0 0 280 390" fill="none" xmlns="http://www.w3.org/2000/svg"
         style={{ width: '100%', height: '100%', display: 'block' }}>

      {/* Topknot ornament */}
      <line x1="140" y1="29" x2="140" y2="16" stroke="var(--border)" strokeWidth="1.5"/>
      <circle cx="140" cy="12" r="5" stroke="var(--gold)" strokeWidth="1.2" fill="var(--gold-bg)"/>
      <line x1="126" y1="21" x2="154" y2="21" stroke="var(--gold)" strokeWidth="0.8" opacity="0.6"/>

      {/* Head */}
      <circle cx="140" cy="52" r="26" stroke="var(--border)" strokeWidth="1.5" fill="var(--bg)"/>

      {/* Eyes */}
      <line x1="131" y1="49" x2="135" y2="49" stroke="var(--text-dim)" strokeWidth="1.3"/>
      <line x1="145" y1="49" x2="149" y2="49" stroke="var(--text-dim)" strokeWidth="1.3"/>
      {/* Mouth */}
      <path d="M136,61 Q140,64 144,61" stroke="var(--text-dim)" strokeWidth="1" fill="none"/>

      {/* Neck */}
      <path d="M133,77 L133,91 L147,91 L147,77" stroke="var(--border)" strokeWidth="1.2" fill="var(--bg)"/>

      {/* Collar — V opening */}
      <path d="M117,96 Q140,114 163,96" stroke="var(--border)" strokeWidth="1.2" fill="none"/>

      {/* Shoulder span */}
      <path d="M42,103 Q82,92 117,96 L140,99 L163,96 Q198,92 238,103"
            stroke="var(--border)" strokeWidth="1.5" fill="none"/>

      {/* LEFT sleeve (robed, flowing down-left) */}
      <path d="M42,103 L52,118 Q36,145 22,190 L13,194 Q14,184 19,177 Q33,142 50,117 L42,103 Z"
            stroke="var(--border)" strokeWidth="1.5" fill="var(--panel)"/>

      {/* RIGHT sleeve (robed, flowing down-right) */}
      <path d="M238,103 L228,118 Q244,145 258,190 L267,194 Q266,184 261,177 Q247,142 230,117 L238,103 Z"
            stroke="var(--border)" strokeWidth="1.5" fill="var(--panel)"/>

      {/* Left hand */}
      <ellipse cx="11" cy="199" rx="8" ry="10" stroke="var(--border)" strokeWidth="1.2" fill="var(--bg)"/>

      {/* Right hand  ← connector attaches here */}
      <ellipse cx="268" cy="196" rx="8" ry="10" stroke="var(--border)" strokeWidth="1.2" fill="var(--bg)"/>

      {/* ROBE BODY */}
      <path d="M52,118 L228,118 L240,268 Q140,283 40,268 Z"
            stroke="var(--border)" strokeWidth="1.5" fill="var(--panel)"/>

      {/* Chest ornament — small circle with cross */}
      <circle cx="140" cy="155" r="8" stroke="var(--gold)" strokeWidth="1" fill="var(--gold-bg)" opacity="0.7"/>
      <line x1="140" y1="149" x2="140" y2="161" stroke="var(--gold)" strokeWidth="0.8" opacity="0.7"/>
      <line x1="134" y1="155" x2="146" y2="155" stroke="var(--gold)" strokeWidth="0.8" opacity="0.7"/>

      {/* Belt / sash */}
      <path d="M53,198 Q140,212 227,198" stroke="var(--gold)" strokeWidth="2" fill="none"/>
      <circle cx="140" cy="205" r="4.5" stroke="var(--gold)" strokeWidth="1.2" fill="var(--gold-bg)"/>

      {/* Center seam */}
      <line x1="140" y1="118" x2="140" y2="268"
            stroke="var(--border)" strokeWidth="0.8" strokeDasharray="4,6" opacity="0.45"/>

      {/* ROBE HEM FLARE */}
      <path d="M40,268 Q20,338 10,384 Q140,398 270,384 Q260,338 240,268 Z"
            stroke="var(--border)" strokeWidth="1.5" fill="var(--panel)"/>

      {/* Hem trim — gold */}
      <path d="M17,372 Q140,386 263,372" stroke="var(--gold)" strokeWidth="1.2" fill="none"/>

      {/* Left foot */}
      <path d="M94,384 Q87,391 77,395 Q71,398 85,399 Q99,399 104,393"
            stroke="var(--border)" strokeWidth="1.2" fill="var(--bg)"/>

      {/* Right foot */}
      <path d="M186,384 Q193,391 203,395 Q209,398 195,399 Q181,399 176,393"
            stroke="var(--border)" strokeWidth="1.2" fill="var(--bg)"/>
    </svg>
  );
}

// ── Equipment slot box ────────────────────────────────────────────────────────

function SlotBox({ label, item, className }) {
  const col = item ? (RARITY_COLOR[item.rarity] || RARITY_COLOR.common) : 'var(--border)';
  return (
    <div className={`doll-slot ${className}`} style={{ borderTopColor: col }}>
      <div className="doll-slot-label">{label.toUpperCase()}</div>
      {item ? (
        <>
          <div className="doll-slot-name" style={{ color: col }}>{item.name}</div>
          <div className="doll-slot-stats">{statLine(item.stats)}</div>
        </>
      ) : (
        <div className="doll-slot-empty">— empty —</div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CharacterView({ player, inventory, zones }) {
  if (!player) return <div className="char-view" />;

  const equipped   = {
    weapon:    inventory.find(i => i.equippedSlot === 'weapon')    || null,
    armor:     inventory.find(i => i.equippedSlot === 'armor')     || null,
    accessory: inventory.find(i => i.equippedSlot === 'accessory') || null,
  };
  const realm      = getRealmInfo(player.level);
  const stats      = calcStats(player, inventory);
  const totalKills = zones.reduce((s, z) => s + (z.playerStats?.kills || 0), 0);
  const zonesSeen  = zones.filter(z => (z.playerStats?.kills || 0) > 0).length;

  return (
    <div className="char-view">

      {/* ── LEFT: Realm ── */}
      <div className="char-realm-panel">
        <div className="char-panel-label">Cultivation Realm</div>

        <div className="realm-name">{realm.name}</div>
        <div className="realm-stage">{realm.stage} Stage</div>
        <div className="realm-desc">{realm.desc}</div>

        {/* Stage progress bar */}
        <div className="realm-prog-wrap">
          <div className="realm-prog-header">
            <span>{realm.stage} → {realm.stageIdx < 3 ? STAGES[realm.stageIdx + 1] : 'Next Realm'}</span>
            <span>{Math.round(realm.inStage * 100)}%</span>
          </div>
          <div className="realm-prog-track">
            <div className="realm-prog-fill" style={{ width: `${realm.inStage * 100}%` }} />
          </div>
        </div>

        {/* Stage pips */}
        <div className="realm-pips">
          {STAGES.map((s, i) => (
            <div key={s} className={`realm-pip${i < realm.stageIdx ? ' done' : i === realm.stageIdx ? ' active' : ''}`}>
              <div className="realm-pip-dot" />{s}
            </div>
          ))}
        </div>

        <div className="char-divider" />

        {/* All realms list */}
        <div className="realm-list">
          {REALMS.map((r, i) => {
            const state = i < realm.realmIdx ? 'past' : i === realm.realmIdx ? 'current' : 'future';
            return (
              <div key={r.name} className={`realm-row ${state}`}>
                <div className="realm-row-dot" />
                <div className="realm-row-content">
                  <span className="realm-row-name">{r.name}</span>
                  <span className="realm-row-lvl">Lv {r.minLevel}–{r.maxLevel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CENTER: Paper doll ── */}
      <div className="char-doll-col">
        <div className="char-panel-label" style={{ textAlign: 'center' }}>Character</div>

        {/* Paper doll wrapper — 560 × 420, fixed */}
        <div className="paper-doll">

          {/* SVG figure centered in the 560px space (starts at left:140) */}
          <div className="char-figure-wrap">
            <CultivatorFigure />
          </div>

          {/*
              Connector lines overlay (viewBox 560×420, same coordinate space as .paper-doll)
              SVG anchor points in container coords (SVG offset: left=140, top=15, scale=1):
                head:      (280, 67)   ← 140+140, 15+52
                right hand:(408, 211)  ← 140+268, 15+196
                torso left:(192, 200)  ← 140+52,  15+185
              Slot right/left centers:
                accessory: right-center (143, 55)  slot: top:15 left:8 h:80 → y=15+40=55
                armor:     right-center (143, 200) slot: top:160 left:8 h:80 → y=160+40=200
                weapon:    left-center  (417, 200) slot: top:160 right:8=417 h:80 → y=160+40=200
          */}
          <svg className="connector-svg" viewBox="0 0 560 420" preserveAspectRatio="none">
            {/* accessory → head */}
            <line x1="143" y1="55"  x2="274" y2="67"  stroke="var(--border)" strokeWidth="1" strokeDasharray="4,3" opacity="0.7"/>
            {/* armor → torso left */}
            <line x1="143" y1="200" x2="192" y2="200" stroke="var(--border)" strokeWidth="1" strokeDasharray="4,3" opacity="0.7"/>
            {/* weapon → right hand */}
            <line x1="417" y1="200" x2="408" y2="211" stroke="var(--border)" strokeWidth="1" strokeDasharray="4,3" opacity="0.7"/>
          </svg>

          {/* Equipment slot boxes */}
          <SlotBox label="Accessory" item={equipped.accessory} className="doll-slot-accessory" />
          <SlotBox label="Armor"     item={equipped.armor}     className="doll-slot-armor"     />
          <SlotBox label="Weapon"    item={equipped.weapon}    className="doll-slot-weapon"     />
        </div>

        {/* Name plate */}
        <div className="char-nameplate">
          <span className="char-nameplate-lvl">Level {player.level}</span>
          <span className="char-nameplate-realm">{realm.stage} {realm.name}</span>
        </div>
      </div>

      {/* ── RIGHT: Stats ── */}
      <div className="char-stats-panel">
        <div className="char-panel-label">Combat Stats</div>

        {[
          { label: 'Attack',        val: stats.atk,                    cls: '' },
          { label: 'Defense',       val: stats.def,                    cls: '' },
          { label: 'Max HP',        val: stats.maxHp.toLocaleString(), cls: 'jade' },
          { label: 'Dmg Reduction', val: `${stats.dmgRed}%`,           cls: '' },
          { label: 'XP Rate',       val: `${stats.xpMult}×`,          cls: 'gold' },
        ].map(({ label, val, cls }) => (
          <div key={label} className="char-stat-row">
            <span className="char-stat-label">{label}</span>
            <span className={`char-stat-value ${cls}`}>{val}</span>
          </div>
        ))}

        <div className="char-divider" />
        <div className="char-panel-label" style={{ fontSize: 8, marginBottom: 8 }}>Progress</div>

        {[
          { label: 'Total Kills',    val: totalKills.toLocaleString() },
          { label: 'Zones Visited',  val: `${zonesSeen} / ${zones.length}` },
          { label: 'Items Found',    val: inventory.length.toLocaleString() },
        ].map(({ label, val }) => (
          <div key={label} className="char-stat-row">
            <span className="char-stat-label">{label}</span>
            <span className="char-stat-value">{val}</span>
          </div>
        ))}

        {/* Equipment bonus breakdown */}
        {(equipped.weapon || equipped.armor || equipped.accessory) && (<>
          <div className="char-divider" />
          <div className="char-panel-label" style={{ fontSize: 8, marginBottom: 8 }}>Equipped Bonuses</div>
          {equipped.weapon && (
            <div className="char-stat-row small">
              <span className="char-stat-label">{equipped.weapon.name}</span>
              <span className="char-stat-value">ATK +{equipped.weapon.stats.atk || 0}</span>
            </div>
          )}
          {equipped.armor && (<>
            <div className="char-stat-row small">
              <span className="char-stat-label">{equipped.armor.name}</span>
              <span className="char-stat-value">DEF +{equipped.armor.stats.def || 0}</span>
            </div>
          </>)}
          {equipped.accessory && (
            <div className="char-stat-row small">
              <span className="char-stat-label">{equipped.accessory.name}</span>
              <span className="char-stat-value">XP +{equipped.accessory.stats.xpBonus || 0}%</span>
            </div>
          )}
        </>)}
      </div>

    </div>
  );
}
