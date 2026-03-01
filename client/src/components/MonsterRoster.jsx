import React from 'react';
import { MONSTER_SVG, HuntAllSvg } from './MonsterArt';

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
