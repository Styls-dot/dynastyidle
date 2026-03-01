import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api, getPlayerId } from './api';
import PlayerBar      from './components/PlayerBar';
import ZoneList       from './components/ZoneList';
import ZoneDetail     from './components/ZoneDetail';
import ZoneActivity   from './components/ZoneActivity';
import InventoryPanel from './components/InventoryPanel';
import CharacterView  from './components/CharacterView';

const TICK_MS        = 2500;
const HEARTBEAT_MS   = 30_000;
const POLL_ZONES_MS  = 60_000;
const POLL_ZONE_MS   = 15_000;
const MAX_LOG        = 40;

export default function App() {
  const [player,        setPlayer]        = useState(null);
  const [zones,         setZones]         = useState([]);
  const [viewedId,      setViewedId]      = useState(null);
  const [activeZoneId,  setActiveZoneId]  = useState(null);
  const [zoneDetail,    setZoneDetail]    = useState(null);
  const [combatLog,     setCombatLog]     = useState([]);
  const [lastKill,      setLastKill]      = useState(null);
  const [fighting,      setFighting]      = useState(false);
  const [recovering,    setRecovering]    = useState(false);
  const [recoveryEnd,   setRecoveryEnd]   = useState(null);
  const [recoverySecs,  setRecoverySecs]  = useState(0);
  const [inventory,           setInventory]           = useState([]);
  const [showInventory,       setShowInventory]       = useState(false);
  const [spiritShards,        setSpiritShards]        = useState(0);
  const [autoSalvageRarities, setAutoSalvageRarities] = useState([]);
  const [view,                setView]                = useState('zones');
  const [skillView,           setSkillView]           = useState('combat');
  const [zoneMonsters,        setZoneMonsters]        = useState([]);
  const [selectedMonsterId,   setSelectedMonsterId]   = useState(null);

  const activeZoneIdRef        = useRef(null);
  const viewedIdRef            = useRef(null);
  const selectedMonsterIdRef   = useRef(null);
  activeZoneIdRef.current      = activeZoneId;
  viewedIdRef.current          = viewedId;
  selectedMonsterIdRef.current = selectedMonsterId;

  // ── recovery countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (!recoveryEnd) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((recoveryEnd - Date.now()) / 1000));
      setRecoverySecs(left);
      if (left === 0) { setRecovering(false); setRecoveryEnd(null); }
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [recoveryEnd]);

  // ── load player ───────────────────────────────────────────────────────────
  const loadPlayer = useCallback(async () => {
    try {
      const p = await api.getPlayer();
      setPlayer(p);
      setSpiritShards(p.spiritShards ?? 0);
      setAutoSalvageRarities(p.autoSalvageRarities ?? []);
      if (p.recoveryUntil > Date.now()) {
        setRecovering(true);
        setRecoveryEnd(p.recoveryUntil);
      }
    } catch (e) { console.error(e); }
  }, []);

  // ── load inventory ────────────────────────────────────────────────────────
  const loadInventory = useCallback(async () => {
    try { setInventory(await api.getInventory()); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadPlayer(); loadInventory(); }, [loadPlayer, loadInventory]);

  // ── zone list ─────────────────────────────────────────────────────────────
  const loadZones = useCallback(async () => {
    try { setZones(await api.getZones()); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    loadZones();
    const t = setInterval(loadZones, POLL_ZONES_MS);
    return () => clearInterval(t);
  }, [loadZones]);

  // ── zone detail (follows viewed zone) ────────────────────────────────────
  const loadDetail = useCallback(async (id) => {
    try { setZoneDetail(await api.getZone(id)); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!viewedId) return;
    loadDetail(viewedId);
    const t = setInterval(() => loadDetail(viewedId), POLL_ZONE_MS);
    return () => clearInterval(t);
  }, [viewedId, loadDetail]);

  // ── heartbeat (only for active combat zone) ───────────────────────────────
  useEffect(() => {
    if (!activeZoneId) return;
    const t = setInterval(() => api.heartbeat(activeZoneId).catch(console.error), HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [activeZoneId]);

  // ── combat loop (only for active combat zone) ─────────────────────────────
  useEffect(() => {
    if (!activeZoneId) { setFighting(false); return; }
    setFighting(true);

    const t = setInterval(async () => {
      const zoneId = activeZoneIdRef.current;
      if (!zoneId) return;
      try {
        const tick = await api.combatTick(zoneId, selectedMonsterIdRef.current);

        // HP / recovery state
        setPlayer(prev => prev ? { ...prev, level: tick.playerLevel, xp: tick.playerXp, xpToNextLevel: tick.xpToNextLevel, hp: tick.hp ?? prev.hp } : prev);

        if (tick.recovering) {
          setRecovering(true);
          setRecoveryEnd(tick.recoveryUntil);
          return;
        }
        if (tick.died) {
          setRecovering(true);
          setRecoveryEnd(tick.recoveryUntil);
          setCombatLog(prev => [{
            id: crypto.randomUUID(), ts: Date.now(), type: 'death',
            enemyName: '—', xpGained: 0, leveledUp: false, playerLevel: tick.playerLevel, damagePct: 0,
          }, ...prev].slice(0, MAX_LOG));
          return;
        }

        setRecovering(false);

        // Kill log
        const killEntry = {
          id: crypto.randomUUID(), ts: Date.now(), type: 'kill',
          enemyName: tick.enemyName, enemies: tick.enemies, mobCount: tick.mobCount ?? 1,
          xpGained: tick.xpGained,
          leveledUp: tick.leveledUp, playerLevel: tick.playerLevel,
          damagePct: tick.damagePct,
        };
        setLastKill({ enemyName: tick.enemyName, xpGained: tick.xpGained, leveledUp: tick.leveledUp });

        const newEntries = [killEntry];

        // Loot log + inventory
        if (tick.lootDrop) {
          const { lootDrop: l } = tick;
          newEntries.unshift({
            id: crypto.randomUUID(), ts: Date.now(), type: 'loot',
            itemName: l.name, itemType: l.type, rarity: l.rarity, autoSalvaged: false,
          });
          setInventory(prev => [{ ...l, equippedSlot: null, obtainedAt: Date.now(), plus_level: 0 }, ...prev]);
        }

        // Auto-salvaged loot
        if (tick.autoSalvaged) {
          const s = tick.autoSalvaged;
          setSpiritShards(tick.spiritShards);
          newEntries.unshift({
            id: crypto.randomUUID(), ts: Date.now(), type: 'loot',
            itemName: s.name, itemType: s.type, rarity: s.rarity,
            autoSalvaged: true, shards: s.shards,
          });
        }

        setCombatLog(prev => [...newEntries, ...prev].slice(0, MAX_LOG));

        // Sync zone stats — only update detail panel if viewing the active zone
        const zoneStats = { kills: tick.totalKillsInZone, bonusPercent: tick.bonusPercent, killsToNextBonus: tick.killsToNextBonus };
        if (viewedIdRef.current === zoneId) {
          setZoneDetail(prev => prev ? { ...prev, playerStats: zoneStats } : prev);
        }
        setZones(prev => prev.map(z => z.id === zoneId ? { ...z, playerStats: zoneStats } : z));

      } catch (e) { console.error('combat tick failed', e); }
    }, TICK_MS);

    return () => { clearInterval(t); setFighting(false); };
  }, [activeZoneId]);

  // ── view a zone (browse only, no combat change) ───────────────────────────
  async function handleViewZone(id) {
    if (id === viewedId) return;
    setViewedId(id);
    try {
      const [detail, monsters] = await Promise.all([
        api.getZone(id),
        api.getZoneMonsters(id),
      ]);
      setZoneDetail(detail);
      setZoneMonsters(monsters);
    } catch (e) { console.error(e); }
  }

  // ── enter a zone for combat ───────────────────────────────────────────────
  async function handleEnterZone(id, monsterId = null) {
    setActiveZoneId(id);
    setViewedId(id);
    setSelectedMonsterId(monsterId);
    setCombatLog([]);
    setLastKill(null);
    try {
      const [detail, monsters] = await Promise.all([
        api.selectZone(id),
        api.getZoneMonsters(id),
      ]);
      setZoneDetail(detail);
      setZoneMonsters(monsters);
      setZones(prev => prev.map(z => z.id === id ? { ...z, activeCount: detail.activeCount } : z));
    } catch (e) { console.error(e); }
  }

  function handleStatsUpdate(newStats) {
    setZoneDetail(prev => prev ? { ...prev, playerStats: newStats } : prev);
    setZones(prev => prev.map(z => z.id === viewedId ? { ...z, playerStats: newStats } : z));
  }

  const equippedCount = inventory.filter(i => i.equippedSlot).length;
  const bagCount      = inventory.filter(i => !i.equippedSlot).length;
  const shortId       = getPlayerId().slice(0, 8);
  const lvl           = player?.level ?? 1;

  return (
    <div className="app">
      <div className="topbar">
        <span className="topbar-title">Dynasty Idle</span>
        <span className="topbar-sep">·</span>
        <span className="topbar-id">id: {shortId}</span>
        <span className="topbar-sep">·</span>
        <button className={`nav-tab${view === 'zones'     ? ' active' : ''}`} onClick={() => setView('zones')}>ZONES</button>
        <button className={`nav-tab${view === 'character' ? ' active' : ''}`} onClick={() => setView('character')}>CHARACTER</button>
        <span style={{ flex: 1 }} />
        <span className="topbar-shards">◆ {spiritShards.toLocaleString()}</span>
        <button className="btn-inventory" onClick={() => setShowInventory(true)}>
          BAG ({bagCount})
          {equippedCount > 0 && <span className="equip-badge">{equippedCount} eq</span>}
        </button>
      </div>

      <PlayerBar
        player={player}
        zoneName={zoneDetail?.name ?? null}
        recovering={recovering}
        recoverySecsLeft={recoverySecs}
      />

      <div className="main">
        {view === 'character'
          ? <CharacterView player={player} inventory={inventory} zones={zones} />
          : <div className="skills-layout">
              <nav className="skill-nav">
                <button
                  className={`skill-nav-btn${skillView === 'combat' ? ' active' : ''}`}
                  onClick={() => setSkillView('combat')}
                >
                  <span className="skill-nav-icon">⚔</span>
                  <span className="skill-nav-label">Combat</span>
                </button>
                <button className="skill-nav-btn" disabled title="Coming soon">
                  <span className="skill-nav-icon">◈</span>
                  <span className="skill-nav-label">Gathering</span>
                </button>
                <button className="skill-nav-btn" disabled title="Coming soon">
                  <span className="skill-nav-icon">⚒</span>
                  <span className="skill-nav-label">Crafting</span>
                </button>
              </nav>
              {skillView === 'combat' ? (
                <>
                  <ZoneList
                    zones={zones}
                    viewedId={viewedId}
                    activeZoneId={activeZoneId}
                    onView={handleViewZone}
                    playerLevel={lvl}
                  />
                  <ZoneDetail
                    zone={zoneDetail}
                    monsters={zoneMonsters}
                    selectedMonsterId={selectedMonsterId}
                    onSelectMonster={setSelectedMonsterId}
                    onEnterZone={(monsterId) => handleEnterZone(viewedId, monsterId)}
                    isActiveZone={viewedId !== null && viewedId === activeZoneId}
                    onStatsUpdate={handleStatsUpdate}
                    fighting={fighting && !recovering}
                    lastKill={lastKill}
                    recovering={recovering}
                    recoverySecs={recoverySecs}
                  />
                  <ZoneActivity zone={zoneDetail} combatLog={combatLog} />
                </>
              ) : (
                <div className="skill-placeholder">Coming soon</div>
              )}
            </div>
        }
      </div>

      {showInventory && (
        <InventoryPanel
          inventory={inventory}
          onClose={() => setShowInventory(false)}
          onRefresh={loadInventory}
          spiritShards={spiritShards}
          setSpiritShards={setSpiritShards}
          autoSalvageRarities={autoSalvageRarities}
          setAutoSalvageRarities={setAutoSalvageRarities}
        />
      )}
    </div>
  );
}
