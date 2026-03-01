import React from 'react';

const RARITY_COLOR = {
  common:    '#7A6E62',
  rare:      '#2F6B5F',
  epic:      '#6B3A8A',
  legendary: '#C6A85C',
  mythic:    '#B33A3A',
};

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function ZoneActivity({ zone, combatLog }) {
  const count  = zone?.activeCount ?? 0;
  const events = zone?.events ?? [];

  return (
    <div className="right-panel">
      <div className="panel-header">Zone Activity</div>

      <div className="presence-block">
        <div className={`presence-count${count === 0 ? ' zero' : ''}`}>{count}</div>
        <div className="presence-label">cultivator{count !== 1 ? 's' : ''} present</div>
      </div>

      <div className="panel-header" style={{ borderTop: 'none' }}>Combat Log</div>
      <div className="event-list" style={{ maxHeight: 210, flexShrink: 0 }}>
        {combatLog.length === 0 ? (
          <div className="no-zone-msg">Enter a zone to begin combat.</div>
        ) : (
          combatLog.map(entry => (
            <div key={entry.id} className="event-item">
              <div className="event-time">{relTime(entry.ts)}</div>
              {entry.type === 'skill-drop' ? (
                <div className="event-msg event-skill-drop">
                  ✦ Learned: <strong>{entry.skillName}</strong>
                </div>
              ) : entry.type === 'skill-fire' ? (
                <div className="event-msg event-skill-fire">
                  {entry.hpRestore
                    ? `${entry.skillName} — restored ${entry.hpRestore} HP`
                    : `🌀 ${entry.skillName} — hit ${entry.targetsHit} target${entry.targetsHit !== 1 ? 's' : ''}`
                  }
                </div>
              ) : entry.type === 'loot' ? (
                <div className="event-msg" style={{ color: RARITY_COLOR[entry.rarity] || RARITY_COLOR.common }}>
                  {entry.rarity.toUpperCase()} &mdash; {entry.itemName}
                  {entry.autoSalvaged
                    ? <span className="event-salvaged"> ◆+{entry.shards}</span>
                    : <span className="event-loot-type"> ({entry.itemType})</span>
                  }
                </div>
              ) : (
                <>
                  {entry.leveledUp && <div className="event-levelup">LEVEL UP  →  LV {entry.playerLevel}</div>}
                  <div className="event-msg enter">
                    {entry.mobCount > 1
                      ? <>Slew <span className="event-mob-count">{entry.mobCount}×</span> {entry.enemyName}</>
                      : <>Slew {entry.enemyName}</>
                    }
                    <span className="event-xp"> +{entry.xpGained} xp</span>
                    {entry.damagePct > 0 && <span className="event-dmg"> -{Math.round(entry.damagePct)}% hp</span>}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="panel-header" style={{ borderTop: 'none' }}>Zone Events</div>
      <div className="event-list">
        {!zone ? (
          <div className="no-zone-msg">Select a zone to view events.</div>
        ) : events.length === 0 ? (
          <div className="no-zone-msg">No events yet.</div>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="event-item">
              <div className="event-time">{relTime(ev.createdAt)}</div>
              <div className={`event-msg ${ev.type}`}>{ev.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
