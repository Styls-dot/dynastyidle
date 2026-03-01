'use strict';

/**
 * Evaluates active skills against live combat state and fires any that are ready.
 * Mutates enemy currentHp in-place. Returns { fired, manaSpent }.
 *
 * Multiple skills can fire in the same tick if there is enough mana for each.
 * Skills are processed in order — earlier skills get mana priority.
 */
function evaluateSkills({
  activeSkillIds,
  skillDefs,
  getSkillRow,
  state,
  now,
  playerAtk,
  newHp,
  currentMana,
  cooldownMap,
  playerId,
}) {
  const fired = [];
  let manaLeft = currentMana ?? 100;

  for (const skillId of activeSkillIds) {
    const skillDef = skillDefs[skillId];
    if (!skillDef) continue;

    // ── Cooldown ─────────────────────────────────────────────────────────────
    const cdKey = `${playerId}:${skillId}`;
    const lastFired = cooldownMap.get(cdKey) || 0;
    if (now - lastFired < skillDef.cooldownMs) continue;

    // ── Mana check ───────────────────────────────────────────────────────────
    const manaCost = skillDef.manaCost ?? 0;
    if (manaLeft < manaCost) continue;

    // ── Player-configured rules ──────────────────────────────────────────────
    const skillRow = getSkillRow(skillId);
    if (!skillRow) continue;

    const rules = JSON.parse(skillRow.rules || '{}');

    // ── Alive enemies (excluding AOE victims already at 0 HP) ────────────────
    const aliveEnemies = state.queue.slice(state.queueIdx).filter(e => e.currentHp > 0);
    const aliveCount   = aliveEnemies.length;

    // ── Trigger conditions (HP is stored as 0-100, same scale as thresholds) ─
    const passTargets = aliveCount >= (rules.minTargets ?? 1);
    const passHpBelow = rules.hpBelow == null || newHp < rules.hpBelow;
    const passHpAbove = rules.hpAbove == null || newHp >= rules.hpAbove;

    if (!passTargets || !passHpBelow || !passHpAbove) continue;

    // ── All conditions met — deduct mana, mark cooldown, apply effect ─────────
    manaLeft -= manaCost;
    cooldownMap.set(cdKey, now);

    if (skillDef.type === 'aoe') {
      for (const enemy of aliveEnemies) {
        enemy.currentHp -= Math.max(1, Math.round(playerAtk - enemy.def * 0.3));
      }
      fired.push({ skillId, name: skillDef.name, icon: skillDef.icon, targetsHit: aliveCount });

    } else if (skillDef.type === 'aoe-pierce') {
      for (const enemy of aliveEnemies) {
        enemy.currentHp -= Math.max(1, Math.round(playerAtk));
      }
      fired.push({ skillId, name: skillDef.name, icon: skillDef.icon, targetsHit: aliveCount });

    } else if (skillDef.type === 'single') {
      const target = aliveEnemies[0];
      if (target) {
        const mult = skillDef.dmgMult ?? 2;
        target.currentHp -= Math.max(1, Math.round(playerAtk * mult - target.def * 0.3));
        fired.push({ skillId, name: skillDef.name, icon: skillDef.icon, targetsHit: 1 });
      }

    } else if (skillDef.type === 'heal') {
      const hpRestore = skillDef.healAmount ?? 15;
      fired.push({ skillId, name: skillDef.name, icon: skillDef.icon, targetsHit: 0, hpRestore });
    }
  }

  return { fired, manaSpent: (currentMana ?? 100) - manaLeft };
}

module.exports = { evaluateSkills };
