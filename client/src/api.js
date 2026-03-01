export function getToken()    { return localStorage.getItem('authToken'); }
export function setToken(t)   { localStorage.setItem('authToken', t); }
export function clearToken()  { localStorage.removeItem('authToken'); }
export function isLoggedIn()  { return !!getToken(); }

async function call(method, path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  // Auth
  register: (username, email, password) => call('POST', '/auth/register', { username, email, password }),
  login:    (login, password)           => call('POST', '/auth/login',    { login, password }),
  me:       ()                          => call('GET',  '/auth/me'),

  // Player
  getPlayer:    ()              => call('GET',    '/player'),

  // Zones
  getZones:        ()                  => call('GET',  '/zones'),
  getZone:         (id)               => call('GET',  `/zones/${id}`),
  getZoneMonsters: (id)               => call('GET',  `/zones/${id}/monsters`),
  selectZone:      (id)               => call('POST', `/zones/${id}/select`),
  combatTick:      (id, monsterId)    => call('POST', `/zones/${id}/combat-tick`, { ...(monsterId ? { monsterId } : {}) }),
  heartbeat:    (zoneId)        => call('POST',   '/heartbeat',               { zoneId }),
  addKills:     (zoneId, amt)   => call('POST',   `/debug/zones/${zoneId}/add-kills`, { amount: amt }),

  // Skills
  getSkills:        ()                => call('GET',   '/skills'),
  toggleSkill:      (skillId)         => call('POST',  '/skills/toggle', { skillId }),
  updateSkillRules: (skillId, rules)  => call('PATCH', `/skills/${skillId}/rules`, { rules }),

  // Shop
  getShopInfo:        ()                     => call('GET',   '/shop/info'),
  buyPotion:          (type, qty)            => call('POST',  '/shop/buy', { type, qty }),
  sellItem:           (itemId)               => call('POST',  '/shop/sell', { itemId }),
  setPotionSettings:  (settings)             => call('PATCH', '/shop/potion-settings', settings),

  // Inventory
  getInventory:    ()              => call('GET',    '/inventory'),
  equipItem:       (itemId, slot)  => call('POST',   `/inventory/${itemId}/equip`, { slot }),
  discardItem:     (itemId)        => call('DELETE', `/inventory/${itemId}`),
  salvageItem:     (itemId)        => call('POST',   `/inventory/${itemId}/salvage`),
  bulkSalvage:     (rarities)      => call('POST',   '/inventory/bulk-salvage', { rarities }),
  enhanceItem:     (itemId)        => call('POST',   `/inventory/${itemId}/enhance`),
  updateSettings:  (settings)      => call('PATCH',  '/inventory/settings', settings),
};
