import React from 'react';
import { MONSTER_SVG } from './MonsterArt';

// ── Player SVG ────────────────────────────────────────────────────────────────

function CultivatorSvg() {
  return (
    <svg viewBox="0 0 56 78" width="56" height="78" style={{ overflow: 'visible' }}>
      <circle cx="28" cy="46" r="23" fill="#3DAA8A" opacity="0.07" />
      <ellipse cx="28" cy="7" rx="4.5" ry="7" fill="#1A4035" />
      <circle cx="28" cy="2" r="3.5" fill="#C6A85C" />
      <circle cx="28" cy="18" r="11" fill="#2F6B5F" />
      <ellipse cx="24.5" cy="18" rx="2.2" ry="2" fill="#0C2820" />
      <ellipse cx="31.5" cy="18" rx="2.2" ry="2" fill="#0C2820" />
      <circle cx="25" cy="17.2" r="0.8" fill="white" opacity="0.5" />
      <circle cx="32" cy="17.2" r="0.8" fill="white" opacity="0.5" />
      <path d="M 25,23 Q 28,25 31,23" stroke="#0C2820" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M 13,31 Q 10,53 10,72 L 46,72 Q 46,53 43,31 Q 36,26 28,26 Q 20,26 13,31 Z" fill="#2F6B5F" />
      <path d="M 24,31 L 27,70 L 29,70 L 32,31 Q 30,28 28,28 Q 26,28 24,31 Z" fill="#1A4035" opacity="0.55" />
      <rect x="11" y="47" width="34" height="5" rx="2.5" fill="#C6A85C" opacity="0.9" />
      <path d="M 13,34 Q 3,28 1,20" stroke="#2F6B5F" strokeWidth="7.5" strokeLinecap="round" fill="none" />
      <path d="M 43,34 Q 53,28 55,20" stroke="#2F6B5F" strokeWidth="7.5" strokeLinecap="round" fill="none" />
      <circle cx="1"  cy="18" r="5" fill="#3A7060" />
      <circle cx="55" cy="18" r="5" fill="#3A7060" />
      <circle cx="-3" cy="13" r="1.5" fill="#5DCFAA" opacity="0.7" />
      <circle cx="-2" cy="8"  r="1"   fill="#5DCFAA" opacity="0.5" />
      <circle cx="59" cy="13" r="1.5" fill="#5DCFAA" opacity="0.7" />
      <circle cx="58" cy="8"  r="1"   fill="#5DCFAA" opacity="0.5" />
    </svg>
  );
}

// ── Enemy card (scales by count) ──────────────────────────────────────────────

function EnemyCard({ enemy, killKey, lastKillXp, countClass }) {
  const hpPct    = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
  const art      = MONSTER_SVG[enemy.id] ?? null;
  const showKill = enemy.active && killKey > 0;

  return (
    <div className={`cc-enemy-card ${enemy.active ? 'cc-ec-active' : 'cc-ec-waiting'}`}>
      <div className="cc-name cc-enemy-name">{enemy.name}</div>
      <div className="cc-lv">Lv {enemy.level}</div>

      <div className="cc-e-art">
        {art}
        {showKill && (
          <span key={killKey + 'xp'} className="cc-float cc-xp">
            +{lastKillXp} XP
          </span>
        )}
      </div>

      <div className="cc-bars">
        <div className="cc-bar-row">
          <span className="cc-bar-label">HP</span>
          <span className="cc-bar-val cc-bar-val-enemy">
            {Math.max(0, enemy.hp)}/{enemy.maxHp}
          </span>
        </div>
        <div className="cc-bar-track">
          <div className="cc-bar-fill cc-hp-enemy" style={{ width: `${hpPct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── CombatDisplay ─────────────────────────────────────────────────────────────

export default function CombatDisplay({ player, enemies, lastKill, lastHit, recovering, recoverySecs }) {
  const hp      = player?.hp ?? 100;
  const lvl     = player?.level ?? 1;
  const count   = enemies?.length ?? 0;

  const hitKey  = lastHit?.ts ?? 0;
  const tookDmg = hitKey > 0 && (lastHit?.damagePct ?? 0) > 0;

  const killKey     = lastKill?.ts ?? 0;
  const lastKillXp  = lastKill?.xpGained ?? 0;

  // css class drives all sizing — clamp at 6 for styles, but render all
  const clampedCount = Math.min(count, 6);
  const countClass   = `cc-eg-${clampedCount}`;

  return (
    <div className="combat-display">

      {/* ── Player card ── */}
      <div className="cc-card">
        <div className="cc-name">Cultivator</div>
        <div className="cc-lv">Lv {lvl}</div>
        <div className="cc-art">
          <CultivatorSvg />
          {tookDmg && (
            <span key={hitKey + 'pd'} className="cc-float cc-dmg">
              -{Math.round(lastHit.damagePct * 10) / 10}
            </span>
          )}
        </div>
        <div className="cc-bars">
          <div className="cc-bar-row">
            <span className="cc-bar-label">HP</span>
            <span className="cc-bar-val">{Math.round(hp)} / 100</span>
          </div>
          <div className="cc-bar-track">
            <div className="cc-bar-fill cc-hp-player" style={{ width: `${Math.max(0, hp)}%` }} />
          </div>
        </div>
      </div>

      {/* ── Centre ── */}
      <div className="cc-vs">
        {recovering ? (
          <>
            <div className="cc-rec-label">REC</div>
            <div className="cc-rec-secs">{recoverySecs}s</div>
          </>
        ) : (
          <span className="cc-vs-text">VS</span>
        )}
      </div>

      {/* ── Enemy group ── */}
      <div className={`cc-enemy-group ${countClass}`}>
        {(enemies ?? []).map((e, i) => (
          <EnemyCard
            key={e.id + i}
            enemy={e}
            killKey={killKey}
            lastKillXp={lastKillXp}
            countClass={countClass}
          />
        ))}
      </div>

    </div>
  );
}
