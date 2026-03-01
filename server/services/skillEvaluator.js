'use strict';

/**
 * Evaluates active skills against live combat state and fires any that are ready.
 * Mutates enemy currentHp in-place (same pattern as normal attack in zones.js).
 * Returns an array of fire-result objects — one per skill that fired this tick.
 *
 * Key invariant: alive count is always computed from state at call time.
 *   Dead enemies (currentHp <= 0) are filtered out before any condition check.
 *   No cached counts, no stale references, no cross-skill state.
 *
 * @param {object}   params
 * @param {string[]} params.activeSkillIds  - skills to evaluate this tick
 * @param {object}   params.skillDefs       - SKILL_DEFS map { [id]: def }
 * @param {Function} params.getSkillRow     - (skillId) => { rules: string } | null
 * @param {object}   params.state           - { queue: [{...monster, currentHp}], queueIdx }
 * @param {number}   params.now             - Date.now() at tick start
 * @param {number}   params.playerAtk       - computed player attack value (2 + level*3 + atkBonus)
 * @param {number}   params.newHp           - player HP after normal damage/regen this tick (0-100)
 * @param {Map}      params.cooldownMap     - Map<'playerId:skillId', lastFiredMs> (mutated in place)
 * @param {string}   params.playerId
 * @returns {{ skillId: string, name: string, targetsHit: number, hpRestore?: number }[]}
 */
function evaluateSkills({
  activeSkillIds,
  skillDefs,
  getSkillRow,
  state,
  now,
  playerAtk,
  newHp,
  cooldownMap,
  playerId,
}) {
  const fired = [];

  for (const skillId of activeSkillIds) {
    const skillDef = skillDefs[skillId];
    if (!skillDef) continue;

    // ── Independent per-skill cooldown ──────────────────────────────────────
    const cdKey = `${playerId}:${skillId}`;
    const lastFired = cooldownMap.get(cdKey) || 0;
    if (now - lastFired < skillDef.cooldownMs) continue;

    // ── Player-configured rules ──────────────────────────────────────────────
    const skillRow = getSkillRow(skillId);
    if (!skillRow) continue;

    const rules = JSON.parse(skillRow.rules || '{}');

    // ── Live alive-count — NEVER use spawn count or cached value ────────────
    // Filter to currentHp > 0 so that enemies already killed by a previous AOE
    // (but not yet advanced past by queueIdx) do NOT inflate the count.
    const aliveEnemies = state.queue.slice(state.queueIdx).filter(e => e.currentHp > 0);
    const aliveCount = aliveEnemies.length;

    // ── Evaluate trigger conditions ──────────────────────────────────────────
    // newHp is stored as 0-100 (a percentage), so hpBelow/hpAbove are comparable directly.
    const passTargets = aliveCount >= (rules.minTargets ?? 1);
    const passHpBelow = rules.hpBelow == null || newHp < rules.hpBelow;
    const passHpAbove = rules.hpAbove == null || newHp >= rules.hpAbove;

    if (!passTargets || !passHpBelow || !passHpAbove) continue;

    // ── All conditions met — mark cooldown and apply effect ─────────────────
    cooldownMap.set(cdKey, now);

    if (skillDef.type === 'aoe') {
      // Hit all alive enemies with normal damage formula
      for (const enemy of aliveEnemies) {
        enemy.currentHp -= Math.max(1, Math.round(playerAtk - enemy.def * 0.3));
      }
      fired.push({ skillId, name: skillDef.name, targetsHit: aliveCount });

    } else if (skillDef.type === 'aoe-pierce') {
      // Hit all alive enemies ignoring their defense
      for (const enemy of aliveEnemies) {
        enemy.currentHp -= Math.max(1, Math.round(playerAtk));
      }
      fired.push({ skillId, name: skillDef.name, targetsHit: aliveCount });

    } else if (skillDef.type === 'single') {
      // Heavy single-target hit on the front alive enemy
      const target = aliveEnemies[0];
      if (target) {
        const mult = skillDef.dmgMult ?? 2;
        target.currentHp -= Math.max(1, Math.round(playerAtk * mult - target.def * 0.3));
        fired.push({ skillId, name: skillDef.name, targetsHit: 1 });
      }

    } else if (skillDef.type === 'heal') {
      // Restore HP to the player (caller applies this to newHp and writes to DB)
      const hpRestore = skillDef.healAmount ?? 15;
      fired.push({ skillId, name: skillDef.name, targetsHit: 0, hpRestore });
    }
  }

  return fired;
}

module.exports = { evaluateSkills };
