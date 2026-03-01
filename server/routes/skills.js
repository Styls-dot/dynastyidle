const express = require('express');
const { getDb } = require('../db');
const SKILL_DEFS = require('../data/skills');

const router = express.Router();

// GET /api/skills  →  { skills: [...], activeSkillIds }
router.get('/', (req, res) => {
  const db       = getDb();
  const playerId = req.playerId;
  const rows     = db.prepare('SELECT skillId, learned_at, rules FROM player_skills WHERE playerId=?').all(playerId);
  const player   = db.prepare('SELECT active_skill_ids FROM player WHERE id=?').get(playerId);

  const skills = rows.map(r => ({
    ...SKILL_DEFS[r.skillId],
    learnedAt: r.learned_at,
    rules: JSON.parse(r.rules || '{}'),
  })).filter(s => s.id);

  const activeSkillIds = JSON.parse(player?.active_skill_ids || '[]');
  res.json({ skills, activeSkillIds });
});

// POST /api/skills/toggle  body: { skillId }
// Adds to active array if not there, removes if already active.
router.post('/toggle', (req, res) => {
  const db       = getDb();
  const playerId = req.playerId;
  const { skillId } = req.body;

  if (!skillId) return res.status(400).json({ error: 'skillId required' });

  const has = db.prepare('SELECT 1 FROM player_skills WHERE playerId=? AND skillId=?').get(playerId, skillId);
  if (!has) return res.status(400).json({ error: 'Skill not learned' });

  const player  = db.prepare('SELECT active_skill_ids FROM player WHERE id=?').get(playerId);
  const current = JSON.parse(player?.active_skill_ids || '[]');
  const next    = current.includes(skillId)
    ? current.filter(id => id !== skillId)
    : [...current, skillId];

  db.prepare('UPDATE player SET active_skill_ids=? WHERE id=?').run(JSON.stringify(next), playerId);
  res.json({ activeSkillIds: next });
});

// PATCH /api/skills/:skillId/rules  body: { rules: { minTargets?, hpBelow?, hpAbove? } }
router.patch('/:skillId/rules', (req, res) => {
  const db       = getDb();
  const playerId = req.playerId;
  const { skillId } = req.params;
  const { rules }   = req.body;

  if (!rules || typeof rules !== 'object')
    return res.status(400).json({ error: 'rules object required' });

  const has = db.prepare('SELECT 1 FROM player_skills WHERE playerId=? AND skillId=?').get(playerId, skillId);
  if (!has) return res.status(404).json({ error: 'Skill not learned' });

  const clean = {};
  if (typeof rules.minTargets === 'number') clean.minTargets = Math.max(1, Math.min(10, Math.round(rules.minTargets)));
  if (typeof rules.hpBelow    === 'number') clean.hpBelow    = Math.max(1,  Math.min(100, Math.round(rules.hpBelow)));
  if (typeof rules.hpAbove    === 'number') clean.hpAbove    = Math.max(1,  Math.min(100, Math.round(rules.hpAbove)));

  db.prepare('UPDATE player_skills SET rules=? WHERE playerId=? AND skillId=?').run(JSON.stringify(clean), playerId, skillId);
  res.json({ rules: clean });
});

module.exports = router;
