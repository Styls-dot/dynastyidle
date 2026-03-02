import React from 'react';

export default function PlayerBar({ player, zoneName, recovering, recoverySecsLeft }) {
  if (!player) return <div className="player-bar" />;

  const { level, xp, xpToNextLevel, hp, mana } = player;
  const mxHp    = player.maxHp  ?? (100 + (level - 1) * 20);
  const mxMana  = player.maxMana ?? (100 + (level - 1) * 10);
  const xpPct   = Math.min(100, Math.round((xp / xpToNextLevel) * 100));
  const hpPct   = Math.max(0, Math.min(100, (hp / mxHp) * 100));
  const manaPct = Math.max(0, Math.min(100, (mana / mxMana) * 100));
  const hpColor = hpPct > 50 ? 'var(--jade)' : hpPct > 20 ? 'var(--gold)' : 'var(--accent)';

  return (
    <div className="player-bar">
      <span className="pb-level">LV {level}</span>

      {/* XP bar */}
      <div className="pb-bar-group">
        <span className="pb-bar-label">XP</span>
        <div className="pb-track">
          <div className="pb-fill" style={{ width: `${xpPct}%`, background: 'var(--jade)' }} />
        </div>
        <span className="pb-bar-text">{xp.toLocaleString()} / {xpToNextLevel.toLocaleString()}</span>
      </div>

      {/* HP + Mana stacked */}
      <div className="pb-vitals">
        <div className="pb-bar-group">
          <span className="pb-bar-label">HP</span>
          {recovering ? (
            <span className="pb-recovering">RECOVERING  {recoverySecsLeft}s</span>
          ) : (
            <>
              <div className="pb-track">
                <div className="pb-fill" style={{ width: `${hpPct}%`, background: hpColor }} />
              </div>
              <span className="pb-bar-text" style={{ color: hpColor }}>{Math.round(hp)} / {mxHp}</span>
            </>
          )}
        </div>
        <div className="pb-bar-group">
          <span className="pb-bar-label">MP</span>
          <div className="pb-track">
            <div className="pb-fill" style={{ width: `${manaPct}%`, background: 'var(--mana)' }} />
          </div>
          <span className="pb-bar-text" style={{ color: 'var(--mana)' }}>{Math.round(mana)} / {mxMana}</span>
        </div>
      </div>

      {zoneName && <span className="pb-zone">{zoneName}</span>}
    </div>
  );
}
