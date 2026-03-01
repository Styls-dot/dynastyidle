import React from 'react';

export default function ZoneList({ zones, viewedId, activeZoneId, onView, playerLevel }) {
  return (
    <div className="left-panel">
      <div className="panel-header">Zones</div>
      <div className="zone-list">
        {zones.map(z => {
          const locked   = playerLevel < z.minLevel;
          const active   = z.id === activeZoneId;
          const viewing  = z.id === viewedId && !active;
          const hasBonus = z.playerStats?.bonusPercent > 0;

          return (
            <div
              key={z.id}
              className={`zone-item${active ? ' active' : viewing ? ' viewing' : ''}${locked ? ' locked' : ''}`}
              onClick={() => onView(z.id)}
            >
              <div className="zone-item-name">
                {locked && <span className="lock-icon">⚔ </span>}
                {z.name}
              </div>
              <div className="zone-item-meta">
                <span className="lvl-badge">Lv {z.minLevel}–{z.maxLevel}</span>
                {z.activeCount > 0 && (
                  <span className="active-pip">{z.activeCount}</span>
                )}
                {hasBonus && (
                  <span className="bonus-pip">+{z.playerStats.bonusPercent}%</span>
                )}
                {locked && (
                  <span className="locked-note">req lv {z.minLevel}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
