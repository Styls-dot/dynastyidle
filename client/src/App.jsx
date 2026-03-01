import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api, isLoggedIn, clearToken, setToken } from './api';
import AuthScreen    from './components/AuthScreen';
import PlayerBar      from './components/PlayerBar';
import ZoneList       from './components/ZoneList';
import ZoneDetail     from './components/ZoneDetail';
import ZoneActivity   from './components/ZoneActivity';
import InventoryPanel from './components/InventoryPanel';
import CharacterView  from './components/CharacterView';
import ShopPanel      from './components/ShopPanel';

const TICK_MS        = 2500;
const HEARTBEAT_MS   = 30_000;
const POLL_ZONES_MS  = 60_000;
const POLL_ZONE_MS   = 15_000;
const MAX_LOG        = 40;

export default function App() {
  // ── auth state ────────────────────────────────────────────────────────────
  const [authReady,       setAuthReady]       = useState(false);
  const [loggedIn,        setLoggedIn]        = useState(false);
  const [username,        setUsername]        = useState('');
  const [offlineProgress, setOfflineProgress] = useState(null);

  // ── game state ────────────────────────────────────────────────────────────
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
  const [enemies,             setEnemies]             = useState([]);
  const [lastHit,             setLastHit]             = useState({ ts: 0, damagePct: 0 });
  const [learnedSkills,       setLearnedSkills]       = useState([]);
  const [activeSkillIds,      setActiveSkillIds]      = useState([]);
  const [gold,                setGold]                = useState(0);
  const [hpPotionCount,       setHpPotionCount]       = useState(0);
  const [manaPotionCount,     setManaPotionCount]     = useState(0);
  const [hpPotionThreshold,   setHpPotionThreshold]   = useState(30);
  const [manaPotionThreshold, setManaPotionThreshold] = useState(30);
  const [skillCooldowns,      setSkillCooldowns]      = useState({});

  const activeZoneIdRef        = useRef(null);
  const viewedIdRef            = useRef(null);
  const selectedMonsterIdRef   = useRef(null);
  activeZoneIdRef.current      = activeZoneId;
  viewedIdRef.current          = viewedId;
  selectedMonsterIdRef.current = selectedMonsterId;

  // ── validate token on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn()) { setAuthReady(true); return; }
    api.me()
      .then(data => {
        setUsername(data.username);
        setLoggedIn(true);
        setAuthReady(true);
      })
      .catch(() => {
        clearToken();
        setAuthReady(true);
      });
  }, []);

  // ── handle successful auth (login or register) ────────────────────────────
  function handleAuth(data) {
    setToken(data.token);
    setUsername(data.username);
    if (data.offlineProgress) setOfflineProgress(data.offlineProgress);
    setLoggedIn(true);
  }

  // ── logout ────────────────────────────────────────────────────────────────
  function handleLogout() {
    clearToken();
    setLoggedIn(false);
    setUsername('');
    setPlayer(null);
    setZones([]);
    setActiveZoneId(null);
    setViewedId(null);
    setZoneDetail(null);
    setCombatLog([]);
    setInventory([]);
    setSpiritShards(0);
    setOfflineProgress(null);
    setLearnedSkills([]);
    setActiveSkillIds([]);
    setGold(0);
    setHpPotionCount(0);
    setManaPotionCount(0);
  }

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
      setGold(p.gold ?? 0);
      setHpPotionCount(p.hpPotionCount ?? 0);
      setManaPotionCount(p.manaPotionCount ?? 0);
      setHpPotionThreshold(p.hpPotionThreshold ?? 30);
      setManaPotionThreshold(p.manaPotionThreshold ?? 30);
      if (p.recoveryUntil > Date.now()) {
        setRecovering(true);
        setRecoveryEnd(p.recoveryUntil);
      }
      return p;
    } catch (e) { console.error(e); return null; }
  }, []);

  // ── load inventory ────────────────────────────────────────────────────────
  const loadInventory = useCallback(async () => {
    try { setInventory(await api.getInventory()); } catch (e) { console.error(e); }
  }, []);

  // ── load skills ───────────────────────────────────────────────────────────
  const loadSkills = useCallback(async () => {
    try {
      const { skills, activeSkillIds: aids } = await api.getSkills();
      setLearnedSkills(skills);
      setActiveSkillIds(aids ?? []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    loadPlayer().then(p => {
      if (p?.currentZoneId) handleEnterZone(p.currentZoneId);
    });
    loadInventory();
    loadSkills();
  }, [loggedIn, loadPlayer, loadInventory, loadSkills]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── zone list ─────────────────────────────────────────────────────────────
  const loadZones = useCallback(async () => {
    try { setZones(await api.getZones()); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    loadZones();
    const t = setInterval(loadZones, POLL_ZONES_MS);
    return () => clearInterval(t);
  }, [loggedIn, loadZones]);

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
        setPlayer(prev => prev ? { ...prev, level: tick.playerLevel, xp: tick.playerXp, xpToNextLevel: tick.xpToNextLevel, hp: tick.hp ?? prev.hp, mana: tick.mana ?? prev.mana } : prev);
        if (tick.hpPotionUsed)   setHpPotionCount(p => Math.max(0, p - 1));
        if (tick.manaPotionUsed) setManaPotionCount(p => Math.max(0, p - 1));
        if (tick.skillCooldowns) setSkillCooldowns(tick.skillCooldowns);

        if (tick.recovering) {
          setRecovering(true);
          setRecoveryEnd(tick.recoveryUntil);
          return;
        }
        if (tick.died) {
          setRecovering(true);
          setRecoveryEnd(tick.recoveryUntil);
          setEnemies([]);
          setCombatLog(prev => [{
            id: crypto.randomUUID(), ts: Date.now(), type: 'death',
            enemyName: '—', xpGained: 0, leveledUp: false, playerLevel: tick.playerLevel, damagePct: 0,
          }, ...prev].slice(0, MAX_LOG));
          return;
        }

        setRecovering(false);

        if (tick.enemies) setEnemies(tick.enemies);
        setLastHit({ ts: Date.now(), damagePct: tick.damagePct ?? 0 });

        // Skills fired this tick (multiple possible)
        if (tick.skillsFired?.length) {
          const entries = tick.skillsFired.map(sf => ({
            id: crypto.randomUUID(), ts: Date.now(), type: 'skill-fire',
            skillName: sf.name, targetsHit: sf.targetsHit, hpRestore: sf.hpRestore ?? null,
          }));
          setCombatLog(prev => [...entries, ...prev].slice(0, MAX_LOG));
        }

        // Skill drop this tick
        if (tick.skillDrop) {
          const sd = tick.skillDrop;
          setLearnedSkills(prev => prev.some(s => s.id === sd.skillId) ? prev : [...prev, { ...sd, id: sd.skillId }]);
          setCombatLog(prev => [{
            id: crypto.randomUUID(), ts: Date.now(), type: 'skill-drop',
            skillName: sd.name,
          }, ...prev].slice(0, MAX_LOG));
        }

        if (tick.killThisTick) {
          const killEntry = {
            id: crypto.randomUUID(), ts: Date.now(), type: 'kill',
            enemyName: tick.killedEnemyName, mobCount: 1,
            xpGained: tick.xpGained,
            leveledUp: tick.leveledUp, playerLevel: tick.playerLevel,
            damagePct: tick.damagePct,
          };
          setLastKill({ enemyName: tick.killedEnemyName, xpGained: tick.xpGained, leveledUp: tick.leveledUp, playerLevel: tick.playerLevel, ts: Date.now() });

          const newEntries = [killEntry];

          if (tick.lootDrop) {
            const { lootDrop: l } = tick;
            newEntries.unshift({
              id: crypto.randomUUID(), ts: Date.now(), type: 'loot',
              itemName: l.name, itemType: l.type, rarity: l.rarity, autoSalvaged: false,
            });
            setInventory(prev => [{ ...l, equippedSlot: null, obtainedAt: Date.now(), plus_level: 0 }, ...prev]);
          }

          if (tick.goldGained) setGold(g => g + tick.goldGained);

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

          const zoneStats = { kills: tick.totalKillsInZone, bonusPercent: tick.bonusPercent, killsToNextBonus: tick.killsToNextBonus };
          if (viewedIdRef.current === zoneId) {
            setZoneDetail(prev => prev ? { ...prev, playerStats: zoneStats } : prev);
          }
          setZones(prev => prev.map(z => z.id === zoneId ? { ...z, playerStats: zoneStats } : z));
        }

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
    setEnemies([]);
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

  async function handleToggleSkill(skillId) {
    setActiveSkillIds(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
    try {
      const { activeSkillIds: updated } = await api.toggleSkill(skillId);
      setActiveSkillIds(updated);
    } catch (e) { console.error(e); }
  }

  async function handleUpdateSkillRules(skillId, rules) {
    setLearnedSkills(prev => prev.map(s => s.id === skillId ? { ...s, rules } : s));
    try { await api.updateSkillRules(skillId, rules); } catch (e) { console.error(e); }
  }

  function handleStatsUpdate(newStats) {
    setZoneDetail(prev => prev ? { ...prev, playerStats: newStats } : prev);
    setZones(prev => prev.map(z => z.id === viewedId ? { ...z, playerStats: newStats } : z));
  }

  // ── render ────────────────────────────────────────────────────────────────
  if (!authReady) {
    return <div className="auth-loading">Loading…</div>;
  }

  if (!loggedIn) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  const equippedCount = inventory.filter(i => i.equippedSlot).length;
  const bagCount      = inventory.filter(i => !i.equippedSlot).length;
  const lvl           = player?.level ?? 1;

  return (
    <div className="app">
      {/* ── Offline progress popup ── */}
      {offlineProgress && (
        <div className="offline-overlay">
          <div className="offline-panel">
            <div className="offline-title">Welcome Back</div>
            <div className="offline-body">
              While you were away ({formatDuration(offlineProgress.durationMs)}):
            </div>
            <ul className="offline-list">
              <li>+{offlineProgress.xpGained.toLocaleString()} XP</li>
              <li>{offlineProgress.kills.toLocaleString()} fjender besejret</li>
              {offlineProgress.levelUps > 0 && <li>{offlineProgress.levelUps} level-up{offlineProgress.levelUps > 1 ? 's' : ''}!</li>}
              {offlineProgress.spiritShardsGained > 0 && <li>+{offlineProgress.spiritShardsGained} spirit shards</li>}
              {offlineProgress.lootItems.length > 0 && <li>{offlineProgress.lootItems.length} item{offlineProgress.lootItems.length > 1 ? 's' : ''} found</li>}
            </ul>
            <button className="offline-dismiss" onClick={() => {
              setOfflineProgress(null);
              // Refresh inventory and player after offline loot was applied
              loadInventory();
              loadPlayer();
            }}>Continue</button>
          </div>
        </div>
      )}

      <div className="topbar">
        <span className="topbar-title">Dynasty Idle</span>
        <span className="topbar-sep">·</span>
        <span className="topbar-id">&#128100; {username}</span>
        <span className="topbar-sep">·</span>
        <button className={`nav-tab${view === 'zones'     ? ' active' : ''}`} onClick={() => setView('zones')}>ZONES</button>
        <button className={`nav-tab${view === 'character' ? ' active' : ''}`} onClick={() => setView('character')}>CHARACTER</button>
        <button className={`nav-tab${view === 'shop'      ? ' active' : ''}`} onClick={() => setView('shop')}>SHOP</button>
        <span style={{ flex: 1 }} />
        <span className="topbar-gold">⬡ {gold.toLocaleString()}</span>
        <span className="topbar-shards">◆ {spiritShards.toLocaleString()}</span>
        <button className="btn-inventory" onClick={() => setShowInventory(true)}>
          BAG ({bagCount})
          {equippedCount > 0 && <span className="equip-badge">{equippedCount} eq</span>}
        </button>
        <button className="btn-logout" onClick={handleLogout} title="Log out">Log out</button>
      </div>

      <PlayerBar
        player={player}
        zoneName={zoneDetail?.name ?? null}
        recovering={recovering}
        recoverySecsLeft={recoverySecs}
      />

      <div className="main">
        {view === 'shop'
          ? <ShopPanel
              gold={gold} setGold={setGold}
              hpPotionCount={hpPotionCount}   setHpPotionCount={setHpPotionCount}
              manaPotionCount={manaPotionCount} setManaPotionCount={setManaPotionCount}
              inventory={inventory} onSellItem={loadInventory}
            />
          : view === 'character'
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
                    player={player}
                    monsters={zoneMonsters}
                    selectedMonsterId={selectedMonsterId}
                    onSelectMonster={setSelectedMonsterId}
                    onEnterZone={(monsterId) => handleEnterZone(viewedId, monsterId)}
                    isActiveZone={viewedId !== null && viewedId === activeZoneId}
                    onStatsUpdate={handleStatsUpdate}
                    fighting={fighting && !recovering}
                    lastKill={lastKill}
                    lastHit={lastHit}
                    enemies={enemies}
                    recovering={recovering}
                    recoverySecs={recoverySecs}
                    learnedSkills={learnedSkills}
                    activeSkillIds={activeSkillIds}
                    onToggleSkill={handleToggleSkill}
                    onUpdateSkillRules={handleUpdateSkillRules}
                    skillCooldowns={skillCooldowns}
                    hpPotionCount={hpPotionCount}
                    manaPotionCount={manaPotionCount}
                    hpPotionThreshold={hpPotionThreshold}
                    manaPotionThreshold={manaPotionThreshold}
                    onHpThresholdChange={async (v) => { setHpPotionThreshold(v); try { await api.setPotionSettings({ hpThreshold: v }); } catch(e) { console.error(e); } }}
                    onManaThresholdChange={async (v) => { setManaPotionThreshold(v); try { await api.setPotionSettings({ manaThreshold: v }); } catch(e) { console.error(e); } }}
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

function formatDuration(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins  = Math.floor((totalSecs % 3600) / 60);
  if (hours > 0) return `${hours}t ${mins}m`;
  return `${mins}m`;
}
