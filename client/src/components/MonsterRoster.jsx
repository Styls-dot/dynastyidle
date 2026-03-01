import React from 'react';

// ── SVG Monster Illustrations ─────────────────────────────────────────────────

function BambooSpriteSvg() {
  return (
    <svg viewBox="0 0 50 58" width="54" height="62" style={{ overflow: 'visible' }}>
      {/* Leaf wings */}
      <ellipse cx="11" cy="29" rx="9" ry="4" fill="#4A9A60" opacity="0.8"
               transform="rotate(-30 11 29)" />
      <ellipse cx="39" cy="29" rx="9" ry="4" fill="#4A9A60" opacity="0.8"
               transform="rotate(30 39 29)" />
      {/* Outer glow */}
      <circle cx="25" cy="29" r="16" fill="#3DAA8A" opacity="0.12" />
      {/* Body orb */}
      <circle cx="25" cy="29" r="13" fill="#3DAA8A" />
      <circle cx="25" cy="29" r="9"  fill="#5DCFAA" opacity="0.5" />
      {/* Eyes */}
      <circle cx="21" cy="27" r="2.8" fill="#0C3028" />
      <circle cx="29" cy="27" r="2.8" fill="#0C3028" />
      <circle cx="22" cy="26" r="1"   fill="white" opacity="0.75" />
      <circle cx="30" cy="26" r="1"   fill="white" opacity="0.75" />
      {/* Happy mouth */}
      <path d="M 22,33 Q 25,36 28,33" stroke="#0C3028" strokeWidth="1.3"
            fill="none" strokeLinecap="round" />
      {/* Wisp tails */}
      <path d="M 19,41 Q 16,50 19,55" stroke="#3DAA8A" strokeWidth="2"
            fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M 25,42 Q 25,51 25,56" stroke="#3DAA8A" strokeWidth="2"
            fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M 31,41 Q 34,50 31,55" stroke="#3DAA8A" strokeWidth="2"
            fill="none" strokeLinecap="round" opacity="0.6" />
      {/* Sparkles */}
      <circle cx="12" cy="18" r="1.5" fill="#5DCFAA" opacity="0.7" />
      <circle cx="38" cy="17" r="1.2" fill="#5DCFAA" opacity="0.5" />
      <circle cx="9"  cy="32" r="1"   fill="#5DCFAA" opacity="0.5" />
    </svg>
  );
}

function ForestImpSvg() {
  return (
    <svg viewBox="0 0 52 64" width="54" height="66" style={{ overflow: 'visible' }}>
      {/* Shadow */}
      <ellipse cx="26" cy="62" rx="11" ry="2.5" fill="rgba(0,0,0,0.18)" />
      {/* Body */}
      <ellipse cx="26" cy="46" rx="10" ry="11" fill="#3A5A28" />
      {/* Arms */}
      <path d="M 17,42 Q 8,38 6,32" stroke="#3A5A28" strokeWidth="4.5"
            strokeLinecap="round" fill="none" />
      <path d="M 6,32 L 4,28 M 6,32 L 3,31 M 6,32 L 5,28"
            stroke="#2A4018" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M 35,42 Q 44,38 46,32" stroke="#3A5A28" strokeWidth="4.5"
            strokeLinecap="round" fill="none" />
      <path d="M 46,32 L 48,28 M 46,32 L 49,31 M 46,32 L 47,28"
            stroke="#2A4018" strokeWidth="1.3" strokeLinecap="round" />
      {/* Legs */}
      <path d="M 21,56 L 19,62" stroke="#3A5A28" strokeWidth="4" strokeLinecap="round" />
      <path d="M 31,56 L 33,62" stroke="#3A5A28" strokeWidth="4" strokeLinecap="round" />
      {/* Tail */}
      <path d="M 36,50 Q 46,47 48,40 Q 50,34 46,32"
            stroke="#2A4018" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Head */}
      <circle cx="26" cy="24" r="13" fill="#4A7030" />
      {/* Pointy ears */}
      <polygon points="14,15 9,5 20,13" fill="#4A7030" />
      <polygon points="38,15 43,5 32,13" fill="#4A7030" />
      <polygon points="14,15 11,8 19,14" fill="#6A3A3A" opacity="0.45" />
      <polygon points="38,15 41,8 33,14" fill="#6A3A3A" opacity="0.45" />
      {/* Yellow eyes */}
      <ellipse cx="21" cy="22" rx="4" ry="5" fill="#FFD860" />
      <ellipse cx="31" cy="22" rx="4" ry="5" fill="#FFD860" />
      <circle cx="21" cy="23" r="2.6" fill="#1A1000" />
      <circle cx="31" cy="23" r="2.6" fill="#1A1000" />
      <circle cx="22" cy="22" r="0.9" fill="white" opacity="0.8" />
      <circle cx="32" cy="22" r="0.9" fill="white" opacity="0.8" />
      {/* Grinning mouth */}
      <path d="M 20,31 Q 26,36 32,31"
            stroke="#1A3010" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="23" cy="32" r="1.1" fill="#C04040" />
      <circle cx="29" cy="32" r="1.1" fill="#C04040" />
    </svg>
  );
}

function PaleFoxSpiritSvg() {
  return (
    <svg viewBox="0 0 58 64" width="58" height="66" style={{ overflow: 'visible' }}>
      {/* Tails (drawn first, behind body) */}
      <path d="M 35,44 Q 50,36 53,22 Q 55,12 49,10"
            stroke="#D8D0B8" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M 35,44 Q 51,44 53,34 Q 55,24 51,18"
            stroke="#C8C0A8" strokeWidth="6.5" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M 35,44 Q 50,50 52,42 Q 54,35 49,31"
            stroke="#D8D0B8" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.5" />
      {/* Tail tips */}
      <ellipse cx="49" cy="10" rx="3.5" ry="2.5" fill="#F0ECD8" opacity="0.8" />
      <ellipse cx="51" cy="18" rx="3"   ry="2"   fill="#F0ECD8" opacity="0.6" />
      {/* Body */}
      <ellipse cx="22" cy="45" rx="13" ry="12" fill="#EDE6C8" />
      <ellipse cx="22" cy="47" rx="7"  ry="8"  fill="#F5F0E0" />
      {/* Head */}
      <ellipse cx="20" cy="24" rx="14" ry="13" fill="#EDE6C8" />
      {/* Ears */}
      <polygon points="10,14  6,3  18,12"  fill="#EDE6C8" />
      <polygon points="10,14  8,6  16,13"  fill="#E8A8A8" opacity="0.7" />
      <polygon points="30,14  34,3  22,12" fill="#EDE6C8" />
      <polygon points="30,14  32,6  24,13" fill="#E8A8A8" opacity="0.7" />
      {/* Purple eyes */}
      <ellipse cx="15" cy="23" rx="4" ry="2.8" fill="#9050D0" />
      <ellipse cx="25" cy="23" rx="4" ry="2.8" fill="#9050D0" />
      <ellipse cx="15" cy="23" rx="2.8" ry="1.8" fill="#6030A0" />
      <ellipse cx="25" cy="23" rx="2.8" ry="1.8" fill="#6030A0" />
      <circle cx="16" cy="22.5" r="1" fill="white" opacity="0.5" />
      <circle cx="26" cy="22.5" r="1" fill="white" opacity="0.5" />
      {/* Snout */}
      <ellipse cx="20" cy="30" rx="5" ry="4" fill="#D8D0B0" />
      <ellipse cx="20" cy="29" rx="2.2" ry="1.5" fill="#C8A0A0" />
      <path d="M 17,32 Q 20,35 23,32" stroke="#B08888" strokeWidth="1.1" fill="none" />
      {/* Spirit wisp */}
      <path d="M 6,20 Q 0,14 2,8" stroke="#C0B0E0" strokeWidth="1.8"
            fill="none" opacity="0.45" strokeLinecap="round" />
      {/* Legs */}
      <path d="M 16,56 L 14,62" stroke="#EDE6C8" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 26,56 L 28,62" stroke="#EDE6C8" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

function HollowReedDemonSvg() {
  return (
    <svg viewBox="0 0 52 68" width="52" height="70" style={{ overflow: 'visible' }}>
      {/* Shadow */}
      <ellipse cx="26" cy="67" rx="11" ry="2.5" fill="rgba(0,0,0,0.2)" />
      {/* Legs */}
      <rect x="18" y="54" width="5" height="13" rx="2.5" fill="#6A7A40" />
      <rect x="29" y="54" width="5" height="13" rx="2.5" fill="#6A7A40" />
      <rect x="17" y="60" width="7" height="2.5" rx="1.2" fill="#4A5A28" />
      <rect x="28" y="60" width="7" height="2.5" rx="1.2" fill="#4A5A28" />
      {/* Lower body */}
      <rect x="14" y="42" width="24" height="14" rx="4" fill="#7A8A50" />
      <rect x="12" y="54" width="28" height="3" rx="1.5" fill="#5A6830" />
      <ellipse cx="26" cy="49" rx="8" ry="6" fill="#1A2808" opacity="0.85" />
      <ellipse cx="26" cy="49" rx="4.5" ry="3.5" fill="#2A5028" opacity="0.5" />
      {/* Upper body */}
      <rect x="15" y="28" width="22" height="16" rx="3.5" fill="#8A9A58" />
      <rect x="12" y="42" width="28" height="3" rx="1.5" fill="#5A6830" />
      <ellipse cx="26" cy="36" rx="7" ry="6" fill="#1A2808" opacity="0.85" />
      <ellipse cx="26" cy="36" rx="4" ry="3.5" fill="#3A7048" opacity="0.5" />
      {/* Arms (reed bundles) */}
      <path d="M 15,35 Q 6,30 4,23" stroke="#6A8040" strokeWidth="4"
            strokeLinecap="round" fill="none" />
      <path d="M 15,38 Q 6,36 3,30" stroke="#5A7030" strokeWidth="2.8"
            strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M 4,23 L 2,19 M 4,23 L 1,23 M 4,23 L 3,19"
            stroke="#3A5020" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M 37,35 Q 46,30 48,23" stroke="#6A8040" strokeWidth="4"
            strokeLinecap="round" fill="none" />
      <path d="M 37,38 Q 46,36 49,30" stroke="#5A7030" strokeWidth="2.8"
            strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M 48,23 L 50,19 M 48,23 L 51,23 M 48,23 L 49,19"
            stroke="#3A5020" strokeWidth="1.3" strokeLinecap="round" />
      {/* Head */}
      <ellipse cx="26" cy="20" rx="13" ry="12" fill="#8A9A58" />
      <rect x="13" y="29" width="26" height="3" rx="1.5" fill="#5A6830" />
      {/* Dark hollow face */}
      <ellipse cx="26" cy="19" rx="9" ry="10" fill="#1A2808" opacity="0.9" />
      {/* Glowing eyes */}
      <circle cx="21" cy="16" r="3" fill="#80C040" opacity="0.9" />
      <circle cx="31" cy="16" r="3" fill="#80C040" opacity="0.9" />
      <circle cx="21" cy="16" r="1.5" fill="#C0FF80" />
      <circle cx="31" cy="16" r="1.5" fill="#C0FF80" />
      {/* Screaming mouth */}
      <ellipse cx="26" cy="24" rx="5" ry="4" fill="#0A1A04" />
      <polygon points="22,21 24,26 26,21" fill="#6A8040" />
      <polygon points="26,21 28,26 30,21" fill="#6A8040" />
      {/* Head spikes */}
      <polygon points="26,9  24,4  28,4"  fill="#6A8040" />
      <polygon points="19,12 16,7 22,9"   fill="#5A7030" />
      <polygon points="33,12 36,7 30,9"   fill="#5A7030" />
    </svg>
  );
}

function GreenMistSpecterSvg() {
  return (
    <svg viewBox="0 0 58 68" width="58" height="70" style={{ overflow: 'visible' }}>
      {/* Far mist tendrils */}
      <path d="M 29,40 Q 8,44 5,57 Q 3,64 11,65"
            stroke="#2A7840" strokeWidth="3" fill="none" opacity="0.38" strokeLinecap="round" />
      <path d="M 29,40 Q 50,44 53,57 Q 55,64 47,65"
            stroke="#2A7840" strokeWidth="3" fill="none" opacity="0.38" strokeLinecap="round" />
      <path d="M 29,44 Q 14,54 12,65"
            stroke="#3A9850" strokeWidth="2" fill="none" opacity="0.28" strokeLinecap="round" />
      <path d="M 29,44 Q 44,54 46,65"
            stroke="#3A9850" strokeWidth="2" fill="none" opacity="0.28" strokeLinecap="round" />
      {/* Cloak body */}
      <path d="M 10,34 Q 7,54 11,66 Q 20,72 29,70 Q 38,72 47,66 Q 51,54 48,34 Q 40,22 29,20 Q 18,22 10,34 Z"
            fill="#1A5830" opacity="0.88" />
      <path d="M 16,37 Q 13,54 17,64 Q 23,70 29,68 Q 35,70 41,64 Q 45,54 42,37 Q 36,28 29,26 Q 22,28 16,37 Z"
            fill="#2A7848" opacity="0.45" />
      {/* Left arm tendril */}
      <path d="M 11,37 Q 2,31 1,23 Q 0,17 5,14"
            stroke="#2A7840" strokeWidth="6.5" fill="none" strokeLinecap="round" opacity="0.82" />
      <path d="M 5,14 L 2,10 M 5,14 L 1,15 M 5,14 L 3,10"
            stroke="#1A5030" strokeWidth="1.5" strokeLinecap="round" />
      {/* Right arm tendril */}
      <path d="M 47,37 Q 56,31 57,23 Q 58,17 53,14"
            stroke="#2A7840" strokeWidth="6.5" fill="none" strokeLinecap="round" opacity="0.82" />
      <path d="M 53,14 L 56,10 M 53,14 L 57,15 M 53,14 L 55,10"
            stroke="#1A5030" strokeWidth="1.5" strokeLinecap="round" />
      {/* Face hollow */}
      <ellipse cx="29" cy="30" rx="11" ry="12" fill="#0A2818" opacity="0.92" />
      {/* Glowing eyes */}
      <ellipse cx="24" cy="27" rx="4"   ry="5"   fill="#40C870" opacity="0.9" />
      <ellipse cx="34" cy="27" rx="4"   ry="5"   fill="#40C870" opacity="0.9" />
      <ellipse cx="24" cy="27" rx="2.5" ry="3.5" fill="#80FF90" />
      <ellipse cx="34" cy="27" rx="2.5" ry="3.5" fill="#80FF90" />
      {/* Slit pupils */}
      <rect x="23.2" y="24.5" width="1.6" height="5" rx="0.8" fill="#0A2818" />
      <rect x="33.2" y="24.5" width="1.6" height="5" rx="0.8" fill="#0A2818" />
      {/* Mouth */}
      <path d="M 22,36 Q 29,39 36,36"
            stroke="#40C870" strokeWidth="1.3" fill="none" opacity="0.7" />
      {/* Crown of mist */}
      <path d="M 21,20 Q 19,12 23,8"  stroke="#2A7840" strokeWidth="3.5"
            fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M 29,19 Q 29,10 29,6"  stroke="#3A9850" strokeWidth="3.5"
            fill="none" opacity="0.6" strokeLinecap="round" />
      <path d="M 37,20 Q 39,12 35,8"  stroke="#2A7840" strokeWidth="3.5"
            fill="none" opacity="0.5" strokeLinecap="round" />
    </svg>
  );
}

function HuntAllSvg() {
  return (
    <svg viewBox="0 0 64 60" width="62" height="58" style={{ overflow: 'visible' }}>
      {/* Bottom-left orb — forest green */}
      <circle cx="16" cy="44" r="13" fill="#3A5A28" />
      <circle cx="16" cy="44" r="8"  fill="#5A8A40" opacity="0.5" />
      <circle cx="12.5" cy="42" r="2.5" fill="#1A1000" />
      <circle cx="19.5" cy="42" r="2.5" fill="#1A1000" />
      <circle cx="13.5" cy="41" r="0.9" fill="white" opacity="0.65" />
      <circle cx="20.5" cy="41" r="0.9" fill="white" opacity="0.65" />
      {/* Bottom-right orb — crimson */}
      <circle cx="48" cy="44" r="13" fill="#7A2828" />
      <circle cx="48" cy="44" r="8"  fill="#B04040" opacity="0.5" />
      <circle cx="44.5" cy="42" r="2.5" fill="#1A1000" />
      <circle cx="51.5" cy="42" r="2.5" fill="#1A1000" />
      <circle cx="45.5" cy="41" r="0.9" fill="white" opacity="0.65" />
      <circle cx="52.5" cy="41" r="0.9" fill="white" opacity="0.65" />
      {/* Top orb — jade (front/largest) */}
      <circle cx="32" cy="20" r="15" fill="#2F6B5F" />
      <circle cx="32" cy="20" r="10" fill="#4A9A8A" opacity="0.5" />
      <circle cx="28" cy="18" r="3"   fill="#1A1000" />
      <circle cx="36" cy="18" r="3"   fill="#1A1000" />
      <circle cx="29" cy="17" r="1.1" fill="white" opacity="0.65" />
      <circle cx="37" cy="17" r="1.1" fill="white" opacity="0.65" />
      <path d="M 27,25 Q 32,30 37,25" stroke="#1A3028" strokeWidth="1.6"
            fill="none" strokeLinecap="round" />
      {/* Gold "?" badge — signals random encounter */}
      <circle cx="55" cy="9" r="8" fill="#C6A85C" />
      <circle cx="55" cy="9" r="6" fill="#DFB96A" />
      <text x="55" y="13" textAnchor="middle" fontSize="10" fontFamily="Cinzel, serif"
            fontWeight="700" fill="#2A1A06">?</text>
    </svg>
  );
}

// ── Map monster id → SVG component ───────────────────────────────────────────

const MONSTER_SVG = {
  'bamboo-sprite':      <BambooSpriteSvg />,
  'forest-imp':         <ForestImpSvg />,
  'pale-fox-spirit':    <PaleFoxSpiritSvg />,
  'hollow-reed-demon':  <HollowReedDemonSvg />,
  'green-mist-specter': <GreenMistSpecterSvg />,
};

// ── Roster component ──────────────────────────────────────────────────────────

export default function MonsterRoster({ monsters, selectedMonsterId, onSelectMonster, isActiveZone, onEnterZone }) {
  if (!monsters || monsters.length === 0) return null;

  return (
    <div className="monster-roster">
      <div className="section-label" style={{ marginBottom: 10 }}>Inhabitants</div>

      {/* Hunt All card */}
      <div className={`monster-card hunt-all-card${isActiveZone && !selectedMonsterId ? ' selected' : ''}`}>
        <div className="monster-art">
          <HuntAllSvg />
        </div>
        <div className="monster-info">
          <div className="monster-header">
            <span className="monster-name">Hunt All</span>
          </div>
          <div className="monster-desc">
            Always fights at least 1 enemy. 50% chance for each additional mob.
            More enemies means more XP — but also more damage taken.
          </div>
          <button
            className={`btn-hunt${isActiveZone && !selectedMonsterId ? ' active' : ''}`}
            onClick={() => isActiveZone ? onSelectMonster(null) : onEnterZone(null)}
          >
            {isActiveZone && !selectedMonsterId ? '✓ Active' : isActiveZone ? 'Select' : 'Hunt All'}
          </button>
        </div>
      </div>

      {/* Monster cards */}
      <div className="monster-list">
        {monsters.map(m => {
          const isSelected = isActiveZone && m.id === selectedMonsterId;
          const art = MONSTER_SVG[m.id] ?? null;
          return (
            <div key={m.id} className={`monster-card${isSelected ? ' selected' : ''}`}>
              {art && <div className="monster-art">{art}</div>}
              <div className="monster-info">
                <div className="monster-header">
                  <span className="monster-name">{m.name}</span>
                  <span className="monster-level">Lv {m.level}</span>
                </div>
                <div className="monster-desc">{m.description}</div>
                <div className="monster-stats">
                  <span title="Attack">ATK {m.atk}</span>
                  <span title="Defense">DEF {m.def}</span>
                  <span title="Hit Points">HP {m.hp}</span>
                  <span className="monster-xp" title="Experience reward">⬥ {m.xp} XP</span>
                </div>
                <button
                  className={`btn-hunt${isSelected ? ' active' : ''}`}
                  onClick={() => isActiveZone ? onSelectMonster(isSelected ? null : m.id) : onEnterZone(m.id)}
                >
                  {isSelected ? '✓ Hunting' : 'Hunt'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
