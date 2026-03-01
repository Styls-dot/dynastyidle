const express = require('express');
const { getDb } = require('../db');
const SKILL_DEFS = require('../data/skills');

const router = express.Router();

// GET /api/skills  →  { skills: [...], activeSkillId }
router.get('/', (req, res) => {
  const db       = getDb();
  const playerId = req.playerId;
  const rows     = db.prepare('SELECT skillId, learned_at, rules FROM player_skills WHERE playerId=?').all(playerId);
  const player   = db.prepare('SELECT active_skill_id FROM player WHERE id=?').get(playerId);

  const skills = rows.map(r => ({
    ...SKILL_DEFS[r.skillId],
    learnedAt: r.learned_at,
    rules: JSON.parse(r.rules || '{}'),
  })).filter(s => s.id);

  res.json({ skills, activeSkillId: player?.active_skill_id ?? null });
});

// POST /api/skills/set-active  body: { skillId: string | null }
router.post('/set-active', (req, res) => {
  const db       = getDb();
  const playerId = req.playerId;
  const { skillId } = req.body;

  if (skillId) {
    const has = db.prepare('SELECT 1 FROM player_skills WHERE playerId=? AND skillId=?').get(playerId, skillId);
    if (!has) return res.status(400).json({ error: 'Skill not learned' });
  }

  const newId = skillId || null;
  db.prepare('UPDATE player SET active_skill_id=? WHERE id=?').run(newId, playerId);
  res.json({ activeSkillId: newId });
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

  // Sanitise — only known rule keys accepted
  const clean = {};
  if (typeof rules.minTargets === 'number') clean.minTargets = Math.max(1, Math.min(10, Math.round(rules.minTargets)));
  if (typeof rules.hpBelow    === 'number') clean.hpBelow    = Math.max(1,  Math.min(100, Math.round(rules.hpBelow)));
  if (typeof rules.hpAbove    === 'number') clean.hpAbove    = Math.max(1,  Math.min(100, Math.round(rules.hpAbove)));

  db.prepare('UPDATE player_skills SET rules=? WHERE playerId=? AND skillId=?').run(JSON.stringify(clean), playerId, skillId);
  res.json({ rules: clean });
});

module.exports = router;
