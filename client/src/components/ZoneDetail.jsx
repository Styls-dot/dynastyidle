import React, { useState } from 'react';
import { api } from '../api';
import MonsterRoster from './MonsterRoster';

export default function ZoneDetail({ zone, monsters, selectedMonsterId, onSelectMonster, onEnterZone, isActiveZone, onStatsUpdate, fighting, lastKill, recovering, recoverySecs }) {
  const [adding, setAdding] = useState(false);

  if (!zone) {
    return (
      <div className="center-panel">
        <div className="empty-state">
          <div className="empty-state-title">No Zone Selected</div>
          Choose a zone from the list to begin.<br />
          Select your target and enter to start combat.
        </div>
      </div>
    );
  }

  const ps       = zone.playerStats;
  const kills    = ps?.kills          ?? 0;
  const bonus    = ps?.bonusPercent   ?? 0;
  const toNext   = ps?.killsToNextBonus ?? 1000;
  const progress = ((kills % 1000) / 1000) * 100;

  async function handleAddKills() {
    setAdding(true);
    try { onStatsUpdate(await api.addKills(zone.id, 100)); }
    catch (e) { console.error(e); }
    finally { setAdding(false); }
  }

  return (
    <div className="center-panel">
      <div className="zone-detail">

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 3 }}>
          <div className="zone-detail-name">{zone.name}</div>
          {isActiveZone && (
            recovering
              ? <span className="recovering-badge">RECOVERING  {recoverySecs}s</span>
              : fighting && <span className="fighting-badge">FIGHTING</span>
          )}
        </div>
        <div className="zone-detail-level">LEVEL RANGE  {zone.minLevel} – {zone.maxLevel}</div>

        {/* Last kill flash — only when actively fighting here */}
        {isActiveZone && !recovering && lastKill && (
          <div className="last-kill-row">
            <span className="last-kill-enemy">{lastKill.enemyName}</span>
            <span className="last-kill-xp">+{lastKill.xpGained} XP</span>
            {lastKill.leveledUp && <span className="levelup-flash">LEVEL UP!</span>}
          </div>
        )}

        {/* Description */}
        <div className="zone-detail-desc">{zone.description}</div>

        {/* Tags */}
        <div className="tags">
          {zone.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>

        {/* Monster roster */}
        <MonsterRoster
          monsters={monsters}
          selectedMonsterId={selectedMonsterId}
          onSelectMonster={onSelectMonster}
          isActiveZone={isActiveZone}
          onEnterZone={onEnterZone}
        />

        {/* Kill stats */}
        <div className="section-label">Zone Kill Progress</div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-label">Total Kills</div>
            <div className="stat-card-value">{kills.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Drop Bonus</div>
            <div className="stat-card-value jade">+{bonus}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">To Next +1%</div>
            <div className="stat-card-value accent">{toNext.toLocaleString()}</div>
          </div>
        </div>

        <div className="kill-bar-wrap">
          <div className="kill-bar-header">
            <span>Kill progress to next bonus tier</span>
            <span>{(kills % 1000).toLocaleString()} / 1,000</span>
          </div>
          <div className="kill-bar-track">
            <div className="kill-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="debug-row">
          <span className="debug-label">DEV</span>
          <button className="btn-debug" onClick={handleAddKills} disabled={adding}>
            {adding ? 'adding…' : '+ 100 kills'}
          </button>
        </div>

      </div>
    </div>
  );
}
