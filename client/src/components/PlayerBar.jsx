import React from 'react';

export default function PlayerBar({ player, zoneName, recovering, recoverySecsLeft }) {
  if (!player) return <div className="player-bar" />;

  const { level, xp, xpToNextLevel, hp } = player;
  const xpPct = Math.min(100, Math.round((xp / xpToNextLevel) * 100));
  const hpPct = Math.max(0, Math.min(100, Math.round(hp ?? 100)));
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

      {/* HP bar */}
      <div className="pb-bar-group">
        <span className="pb-bar-label">HP</span>
        {recovering ? (
          <span className="pb-recovering">RECOVERING  {recoverySecsLeft}s</span>
        ) : (
          <>
            <div className="pb-track">
              <div className="pb-fill" style={{ width: `${hpPct}%`, background: hpColor }} />
            </div>
            <span className="pb-bar-text" style={{ color: hpColor }}>{hpPct}%</span>
          </>
        )}
      </div>

      {zoneName && <span className="pb-zone">{zoneName}</span>}
    </div>
  );
}
