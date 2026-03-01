export function getPlayerId() {
  let id = localStorage.getItem('playerId');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('playerId', id); }
  return id;
}

async function call(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-player-id': getPlayerId() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  getPlayer:    ()              => call('GET',    '/player'),
  getZones:        ()                  => call('GET',  '/zones'),
  getZone:         (id)               => call('GET',  `/zones/${id}`),
  getZoneMonsters: (id)               => call('GET',  `/zones/${id}/monsters`),
  selectZone:      (id)               => call('POST', `/zones/${id}/select`,      { playerId: getPlayerId() }),
  combatTick:      (id, monsterId)    => call('POST', `/zones/${id}/combat-tick`, { playerId: getPlayerId(), ...(monsterId ? { monsterId } : {}) }),
  heartbeat:    (zoneId)        => call('POST',   '/heartbeat',               { playerId: getPlayerId(), zoneId }),
  addKills:     (zoneId, amt)   => call('POST',   `/debug/zones/${zoneId}/add-kills`, { playerId: getPlayerId(), amount: amt }),
  getInventory:    ()              => call('GET',    '/inventory'),
  equipItem:       (itemId, slot)  => call('POST',   `/inventory/${itemId}/equip`, { slot }),
  discardItem:     (itemId)        => call('DELETE', `/inventory/${itemId}`),
  salvageItem:     (itemId)        => call('POST',   `/inventory/${itemId}/salvage`),
  bulkSalvage:     (rarities)      => call('POST',   '/inventory/bulk-salvage', { rarities }),
  enhanceItem:     (itemId)        => call('POST',   `/inventory/${itemId}/enhance`),
  updateSettings:  (settings)      => call('PATCH',  '/inventory/settings', settings),
};
