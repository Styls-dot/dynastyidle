// Skill definitions — id is the canonical key
module.exports = {
  'tempest-slash': {
    id:          'tempest-slash',
    name:        'Tempest Slash',
    description: 'Channel qi into a sweeping strike that hits all enemies simultaneously.',
    icon:        '🌀',
    cooldownMs:  10000,   // 10 seconds
    type:        'aoe',   // damages all enemies in the queue
  },
};
