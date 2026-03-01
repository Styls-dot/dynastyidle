import React, { useState } from 'react';
import MonsterRoster from './MonsterRoster';
import CombatDisplay from './CombatDisplay';

function RuleStepper({ label, value, min, max, onChange }) {
  return (
    <div className="skill-rule-row">
      <span className="skill-rule-label">{label}</span>
      <div className="skill-rule-stepper">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
        <span className="skill-rule-val">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
      </div>
    </div>
  );
}

export default function ZoneDetail({ zone, player, monsters, selectedMonsterId, onSelectMonster, onEnterZone, isActiveZone, onStatsUpdate, fighting, lastKill, lastHit, enemies, recovering, recoverySecs, learnedSkills = [], activeSkillIds = [], onToggleSkill, onUpdateSkillRules }) {
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

        {/* Skills */}
        <div className="section-label">Skills</div>
        {learnedSkills.length === 0 ? (
          <div className="skill-empty">No skills learned yet — spells drop from monsters.</div>
        ) : (
          <div className="skill-list">
            {learnedSkills.map(skill => {
              const isActive   = activeSkillIds.includes(skill.id);
              const rules      = skill.rules || {};
              const isExpanded = expandedSkillId === skill.id;

              // Compact condition summary shown when skill is active but panel is collapsed
              const minT  = rules.minTargets ?? 1;
              const hpB   = rules.hpBelow   ?? null;
              const hpA   = rules.hpAbove   ?? null;
              const parts = [`≥${minT} enem${minT === 1 ? 'y' : 'ies'}`];
              if (hpB != null && hpB < 100) parts.push(`HP <${hpB}%`);
              if (hpA != null && hpA > 1)   parts.push(`HP ≥${hpA}%`);
              const condSummary = parts.join('  ·  ');

              return (
                <div key={skill.id} className={`skill-card${isActive ? ' skill-card-active' : ''}`}>
                  <div className="skill-card-top">
                    <div className="skill-card-icon">{skill.icon}</div>
                    <div className="skill-card-body">
                      <div className="skill-card-name">{skill.name}</div>
                      <div className="skill-card-desc">{skill.description}</div>
                      <div className="skill-card-meta">Cooldown: {skill.cooldownMs / 1000}s</div>
                    </div>
                    <button
                      className={`skill-toggle-btn${isActive ? ' active' : ''}`}
                      onClick={() => {
                        if (isActive) setExpandedSkillId(null);
                        onToggleSkill(skill.id);
                      }}
                    >
                      {isActive ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {isActive && (
                    <div className="skill-conditions">
                      <div className="skill-conditions-bar">
                        <span className="skill-cond-summary">{condSummary}</span>
                        <button
                          className={`skill-cond-toggle${isExpanded ? ' open' : ''}`}
                          onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
                        >
                          ⚙ Conditions
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="skill-rules">
                          <RuleStepper
                            label="Min. enemies alive"
                            value={rules.minTargets ?? 1}
                            min={1}
                            max={6}
                            onChange={v => onUpdateSkillRules(skill.id, { ...rules, minTargets: v })}
                          />
                          <RuleStepper
                            label="Your HP below %"
                            value={rules.hpBelow ?? 100}
                            min={1}
                            max={100}
                            onChange={v => onUpdateSkillRules(skill.id, { ...rules, hpBelow: v })}
                          />
                          <RuleStepper
                            label="Your HP above %"
                            value={rules.hpAbove ?? 1}
                            min={1}
                            max={100}
                            onChange={v => onUpdateSkillRules(skill.id, { ...rules, hpAbove: v })}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
