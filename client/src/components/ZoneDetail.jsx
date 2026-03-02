import React, { useState } from 'react';
import MonsterRoster from './MonsterRoster';
import CombatDisplay from './CombatDisplay';
import { api } from '../api';

function Stepper({ value, min, max, onChange }) {
  return (
    <div className="compact-stepper">
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
      <span>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
    </div>
  );
}

export default function ZoneDetail({ zone, player, monsters, selectedMonsterId, onSelectMonster, onEnterZone, isActiveZone, onStatsUpdate, fighting, lastKill, lastHit, enemies, recovering, recoverySecs, learnedSkills = [], activeSkillIds = [], onToggleSkill, onUpdateSkillRules, skillCooldowns = {}, hpPotionCount = 0, manaPotionCount = 0, hpPotionThreshold = 30, manaPotionThreshold = 30, onHpThresholdChange, onManaThresholdChange }) {
  const [expandedSkillId, setExpandedSkillId] = useState(null);

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

        {/* Combat display */}
        {isActiveZone && (fighting || recovering) && (
          <CombatDisplay
            player={player}
            enemies={enemies}
            lastKill={lastKill}
            lastHit={lastHit}
            fighting={fighting}
            recovering={recovering}
            recoverySecs={recoverySecs}
          />
        )}

        {/* Level-up flash */}
        {isActiveZone && lastKill?.leveledUp && (
          <div className="levelup-banner">LEVEL UP  →  LV {lastKill.playerLevel ?? player?.level}</div>
        )}

        {/* Description */}
        <div className="zone-detail-desc">{zone.description}</div>

        {/* Tags */}
        <div className="tags">
          {zone.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>

        {/* Skills + Potions in a two-column panel */}
        <div className="combat-config">

          {/* Skills column */}
          <div className="combat-config-col">
            <div className="combat-config-label">Skills</div>
            {learnedSkills.length === 0 ? (
              <div className="skill-empty">No skills learned yet.</div>
            ) : (
              <div className="skill-rows">
                {learnedSkills.map(skill => {
                  const isActive   = activeSkillIds.includes(skill.id);
                  const rules      = skill.rules || {};
                  const isExpanded = expandedSkillId === skill.id;

                  const minT  = rules.minTargets ?? 1;
                  const hpB   = rules.hpBelow   ?? null;
                  const hpA   = rules.hpAbove   ?? null;
                  const parts = [`≥${minT}`];
                  if (hpB != null && hpB < 100) parts.push(`HP<${hpB}%`);
                  if (hpA != null && hpA > 1)   parts.push(`HP≥${hpA}%`);
                  const condSummary = parts.join(' · ');

                  const cdMs = skillCooldowns[skill.id] ?? 0;

                  return (
                    <div key={skill.id} className={`skill-row${isActive ? ' skill-row-active' : ''}`}
                      style={isActive && cdMs > 0 ? { '--cd-pct': `${Math.round(cdMs / skill.cooldownMs * 100)}%` } : undefined}>
                      <div className="skill-row-main">
                        <span className="skill-row-icon">{skill.icon}</span>
                        <div className="skill-row-body">
                          <span className="skill-row-name">{skill.name}</span>
                          <span className="skill-row-meta">
                            {skill.cooldownMs / 1000}s
                            {isActive && (
                              cdMs > 0
                                ? <span className="skill-cd-remaining"> · {(cdMs / 1000).toFixed(1)}s</span>
                                : <span className="skill-cd-ready"> · ready</span>
                            )}
                          </span>
                        </div>
                        <div className="skill-row-actions">
                          {isActive && (
                            <button
                              className={`skill-gear-btn${isExpanded ? ' open' : ''}`}
                              title="Conditions"
                              onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
                            >⚙</button>
                          )}
                          <button
                            className={`skill-toggle-btn${isActive ? ' active' : ''}`}
                            onClick={() => {
                              if (isActive) setExpandedSkillId(null);
                              onToggleSkill(skill.id);
                            }}
                          >{isActive ? 'ON' : 'OFF'}</button>
                        </div>
                      </div>

                      {isActive && isExpanded && (
                        <div className="skill-row-expand">
                          {skill.description && (
                            <div className="skill-expand-desc">{skill.description}</div>
                          )}
                          <div className="skill-expand-row">
                            <span className="skill-expand-label">Min. enemies</span>
                            <Stepper value={rules.minTargets ?? 1} min={1} max={6}
                              onChange={v => onUpdateSkillRules(skill.id, { ...rules, minTargets: v })} />
                          </div>
                          <div className="skill-expand-row">
                            <span className="skill-expand-label">HP below %</span>
                            <Stepper value={rules.hpBelow ?? 100} min={1} max={100}
                              onChange={v => onUpdateSkillRules(skill.id, { ...rules, hpBelow: v })} />
                          </div>
                          <div className="skill-expand-row">
                            <span className="skill-expand-label">HP above %</span>
                            <Stepper value={rules.hpAbove ?? 1} min={1} max={100}
                              onChange={v => onUpdateSkillRules(skill.id, { ...rules, hpAbove: v })} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Potions column */}
          <div className="combat-config-col">
            <div className="combat-config-label">Potions</div>
            <div className="potion-rows">
              <div className="potion-row">
                <span className="potion-row-icon">🍶</span>
                <div className="potion-row-body">
                  <span className="potion-row-name">HP Potion</span>
                  <span className="potion-row-count">{hpPotionCount} in bag</span>
                </div>
                <div className="potion-row-right">
                  <span className="potion-row-auto">Auto &lt;</span>
                  <Stepper value={hpPotionThreshold} min={1} max={99} onChange={onHpThresholdChange} />
                  <span className="potion-row-pct">%</span>
                </div>
              </div>
              <div className="potion-row">
                <span className="potion-row-icon">💧</span>
                <div className="potion-row-body">
                  <span className="potion-row-name">Mana Potion</span>
                  <span className="potion-row-count">{manaPotionCount} in bag</span>
                </div>
                <div className="potion-row-right">
                  <span className="potion-row-auto">Auto &lt;</span>
                  <Stepper value={manaPotionThreshold} min={1} max={99} onChange={onManaThresholdChange} />
                  <span className="potion-row-pct">%</span>
                </div>
              </div>
            </div>
          </div>

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

      </div>
    </div>
  );
}
