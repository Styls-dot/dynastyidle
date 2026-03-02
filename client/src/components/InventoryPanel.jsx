import React, { useState, useRef } from 'react';
import { api } from '../api';

const RARITY_COLOR = {
  common:    '#7A6E62',
  rare:      '#2F6B5F',
  epic:      '#6B3A8A',
  legendary: '#C6A85C',
  mythic:    '#B33A3A',
};

const SHARD_VALUES = { common: 1, rare: 4, epic: 12, legendary: 30, mythic: 100 };
const RARITIES     = ['common', 'rare', 'epic', 'legendary', 'mythic'];
const SLOT_FOR_TYPE = { weapon: 'weapon', armor: 'armor', accessory: 'accessory' };

// Mirror server formulas
function getEnhanceCost(plus)   { return 10 + plus * plus * 3; }
function getEnhanceChance(plus) { return Math.max(1, Math.round(100 * Math.pow(0.82, plus))); }

// Plus bonuses per level (same as server)
const PLUS_BONUS = { atk: 3, def: 2, hp: 10, xpBonus: 1 };

function statLine(stats, plusLevel = 0) {
  return Object.entries(stats).map(([k, v]) => {
    const bonus = plusLevel > 0 ? (PLUS_BONUS[k] || 0) * plusLevel : 0;
    const total = v + bonus;
    const label = k === 'xpBonus' ? 'XP' : k.toUpperCase();
    const suffix = k === 'xpBonus' ? '%' : '';
    return `${label} +${total}${suffix}`;
  }).join('  ·  ');
}

// ── Slot machine number display ───────────────────────────────────────────────

function SlotMachine({ targetPlus }) {
  const [n, setN] = useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setN(v => (v + 1) % 30), 55);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="enh-slot-wrap">
      <div className="enh-slot-num">+{n}</div>
      <div className="enh-slot-label">ENHANCING</div>
    </div>
  );
}

// ── Auto-enhance controls ─────────────────────────────────────────────────────

function AutoEnhanceRow({ itemId, plus, spiritShards, autoState, onAutoTargetChange, onAutoStart, onAutoStop }) {
  const { running, progress, target } = autoState;
  const tgt = target ?? plus + 5;
  const cost = getEnhanceCost(plus);

  if (running) {
    return (
      <div className="auto-enh-row">
        <span className="auto-enh-running">Auto +{progress} → +{target}</span>
        <button className="btn-item btn-auto-stop" onClick={() => onAutoStop(itemId)}>Stop</button>
      </div>
    );
  }

  return (
    <div className="auto-enh-row">
      <span className="auto-enh-label">Auto →</span>
      <input
        type="number" min={plus + 1} max={99}
        className="auto-enh-input"
        value={tgt}
        onChange={e => onAutoTargetChange(itemId, Math.max(plus + 1, +e.target.value))}
      />
      <button
        className="btn-item btn-auto-enh"
        disabled={spiritShards < cost}
        onClick={() => onAutoStart(itemId, tgt)}
      >Start</button>
    </div>
  );
}

// ── Equipment slot (top section) ─────────────────────────────────────────────

function EquipSlot({ label, item, onUnequip, onEnhance, enhanceState, spiritShards, autoState, onAutoTargetChange, onAutoStart, onAutoStop }) {
  const col       = item ? (RARITY_COLOR[item.rarity] || RARITY_COLOR.common) : 'var(--border)';
  const plus      = item?.plus_level || 0;
  const cost      = getEnhanceCost(plus);
  const chance    = getEnhanceChance(plus);
  const anim      = item ? (enhanceState[item.id]?.anim ?? null) : null;
  const feedback  = item ? (enhanceState[item.id]?.feedback ?? null) : null;
  const isRolling = anim === 'rolling';
  const itemAutoState = item ? (autoState[item.id] ?? {}) : {};

  return (
    <div className={`equip-slot${anim ? ' enh-' + anim : ''}`} style={{ borderTopColor: col }}>
      <div className="equip-slot-label">{label}</div>
      {item ? (
        <div className="equip-slot-filled">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="equip-item-name" style={{ color: col }}>{item.name}</span>
            {plus > 0 && <span className="item-plus-badge" style={{ color: col }}>+{plus}</span>}
          </div>
          <div className="equip-item-stats">{statLine(item.stats, plus)}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn-item btn-unequip" onClick={() => onUnequip(item.id)}>Unequip</button>
            {isRolling ? (
              <span className="enh-rolling-label">◆ ···</span>
            ) : feedback ? (
              <span className={`enhance-result ${feedback.success ? 'success' : 'fail'}`}>
                {feedback.success ? `✓ +${feedback.newPlus}` : `✗ Reset to +0`}
              </span>
            ) : !itemAutoState.running && (
              <button
                className="btn-item btn-enhance"
                onClick={() => onEnhance(item.id)}
                disabled={spiritShards < cost}
                title={`${chance}% success · fail resets to +0`}
              >
                +{plus + 1} · {cost}◆ · {chance}%
              </button>
            )}
          </div>
          {!isRolling && !feedback && (
            <AutoEnhanceRow
              itemId={item.id} plus={plus} spiritShards={spiritShards}
              autoState={itemAutoState}
              onAutoTargetChange={onAutoTargetChange}
              onAutoStart={onAutoStart}
              onAutoStop={onAutoStop}
            />
          )}
        </div>
      ) : (
        <div className="equip-slot-empty">— empty —</div>
      )}
    </div>
  );
}

// ── Bag item card ─────────────────────────────────────────────────────────────

function ItemCard({ item, onEquip, onDiscard, onSalvage, onEnhance, enhanceState, spiritShards, autoState, onAutoTargetChange, onAutoStart, onAutoStop }) {
  const col      = RARITY_COLOR[item.rarity] || RARITY_COLOR.common;
  const plus     = item.plus_level || 0;
  const cost     = getEnhanceCost(plus);
  const chance   = getEnhanceChance(plus);
  const shardVal = SHARD_VALUES[item.rarity] || 1;
  const state    = enhanceState[item.id] ?? {};
  const { anim, feedback } = state;
  const isRolling = anim === 'rolling';
  const itemAutoState = autoState[item.id] ?? {};

  return (
    <div className={`item-card${anim ? ' enh-' + anim : ''}`} style={{ borderTopColor: col }}>
      <div className="item-card-top">
        <span className="item-card-rarity" style={{ color: col }}>{item.rarity.toUpperCase()}</span>
        {plus > 0 && <span className="item-plus-badge" style={{ color: col }}>+{plus}</span>}
      </div>
      <div className="item-card-name">{item.name}</div>
      <div className="item-card-type">{item.type.toUpperCase()}</div>
      <div className="item-card-stats">{statLine(item.stats, plus)}</div>

      {/* Rolling overlay */}
      {isRolling ? (
        <SlotMachine targetPlus={plus + 1} />
      ) : feedback ? (
        <div className={`enhance-result ${feedback.success ? 'success' : 'fail'}`}>
          {feedback.success
            ? `✓  +${feedback.newPlus}`
            : `✗  FAILED  ·  Reset to +0`}
        </div>
      ) : (
        <>
          {!itemAutoState.running && (
            <>
              <div className="item-card-actions">
                <button className="btn-item btn-equip"  onClick={() => onEquip(item)}>Equip</button>
                <button className="btn-item btn-salvage" onClick={() => onSalvage(item.id)} title={`Salvage for ${shardVal} shards`}>+{shardVal}◆</button>
                <button className="btn-item btn-discard" onClick={() => onDiscard(item.id)} title="Discard">✕</button>
              </div>
              <button
                className="btn-item btn-enhance full-width"
                onClick={() => onEnhance(item.id)}
                disabled={spiritShards < cost}
                title={`${chance}% · fail resets to +0`}
              >
                +{plus}→+{plus + 1} · {cost}◆ · {chance}%
              </button>
            </>
          )}
          <AutoEnhanceRow
            itemId={item.id} plus={plus} spiritShards={spiritShards}
            autoState={itemAutoState}
            onAutoTargetChange={onAutoTargetChange}
            onAutoStart={onAutoStart}
            onAutoStop={onAutoStop}
          />
        </>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function InventoryPanel({
  inventory, onClose, onRefresh,
  spiritShards, setSpiritShards,
  autoSalvageRarities, setAutoSalvageRarities,
}) {
  const [busy,         setBusy]         = useState(false);
  const [enhanceState, setEnhanceState] = useState({});
  // autoState: { [itemId]: { running, progress, target } }
  const [autoState,    setAutoState]    = useState({});
  const autoRef = useRef({});  // { [itemId]: bool } — avoids stale-closure stop issues

  const equipped = {
    weapon:    inventory.find(i => i.equippedSlot === 'weapon')    || null,
    armor:     inventory.find(i => i.equippedSlot === 'armor')     || null,
    accessory: inventory.find(i => i.equippedSlot === 'accessory') || null,
  };
  const bag = inventory.filter(i => !i.equippedSlot);

  // ── helpers ─────────────────────────────────────────────────────────────────

  function setItemAnim(itemId, anim)   { setEnhanceState(p => ({ ...p, [itemId]: { ...p[itemId], anim } })); }
  function setItemFeedback(itemId, fb) { setEnhanceState(p => ({ ...p, [itemId]: { ...p[itemId], feedback: fb } })); }
  function clearItemState(itemId)      { setEnhanceState(p => { const n = { ...p }; delete n[itemId]; return n; }); }

  function setAutoItemState(itemId, patch) {
    setAutoState(p => ({ ...p, [itemId]: { ...(p[itemId] ?? {}), ...patch } }));
  }
  function clearAutoItem(itemId) {
    setAutoState(p => { const n = { ...p }; delete n[itemId]; return n; });
  }

  // ── actions ──────────────────────────────────────────────────────────────────

  async function handleEquip(item) {
    setBusy(true);
    try { await api.equipItem(item.id, SLOT_FOR_TYPE[item.type]); await onRefresh(); }
    finally { setBusy(false); }
  }

  async function handleUnequip(itemId) {
    setBusy(true);
    try { await api.equipItem(itemId, null); await onRefresh(); }
    finally { setBusy(false); }
  }

  async function handleDiscard(itemId) {
    setBusy(true);
    try { await api.discardItem(itemId); await onRefresh(); }
    finally { setBusy(false); }
  }

  async function handleSalvage(itemId) {
    setBusy(true);
    try {
      const res = await api.salvageItem(itemId);
      setSpiritShards(res.spiritShards);
      await onRefresh();
    } finally { setBusy(false); }
  }

  async function handleBulkSalvage() {
    if (autoSalvageRarities.length === 0) return;
    setBusy(true);
    try {
      const res = await api.bulkSalvage(autoSalvageRarities);
      setSpiritShards(res.spiritShards);
      await onRefresh();
    } finally { setBusy(false); }
  }

  async function handleEnhance(itemId) {
    setBusy(true);
    setItemAnim(itemId, 'rolling');
    try {
      const [res] = await Promise.all([
        api.enhanceItem(itemId),
        new Promise(r => setTimeout(r, 950)),
      ]);
      setSpiritShards(res.spiritShards);
      setItemAnim(itemId, res.success ? 'success' : 'fail');
      setItemFeedback(itemId, { success: res.success, newPlus: res.newPlusLevel });
      await onRefresh();
      setTimeout(() => clearItemState(itemId), 2500);
    } catch (e) {
      console.error(e);
      clearItemState(itemId);
    } finally { setBusy(false); }
  }

  // ── auto-enhance ─────────────────────────────────────────────────────────────

  function handleAutoTargetChange(itemId, value) {
    setAutoItemState(itemId, { target: value });
  }

  async function handleAutoStart(itemId, targetPlus) {
    const item = [...Object.values(equipped).filter(Boolean), ...bag].find(i => i.id === itemId);
    if (!item) return;

    autoRef.current[itemId] = true;
    let curPlus   = item.plus_level || 0;
    let curShards = spiritShards;

    setAutoItemState(itemId, { running: true, progress: curPlus, target: targetPlus });

    while (autoRef.current[itemId] && curPlus < targetPlus) {
      const cost = getEnhanceCost(curPlus);
      if (curShards < cost) break;

      try {
        const res = await api.enhanceItem(itemId);
        curShards = res.spiritShards;
        setSpiritShards(res.spiritShards);
        curPlus = res.success ? res.newPlusLevel : 0;
        setAutoItemState(itemId, { progress: curPlus });
      } catch {
        break;
      }

      // Brief pause so UI stays responsive
      await new Promise(r => setTimeout(r, 200));
    }

    autoRef.current[itemId] = false;
    clearAutoItem(itemId);
    await onRefresh();
  }

  function handleAutoStop(itemId) {
    autoRef.current[itemId] = false;
  }

  async function toggleAutoSalvage(rarity) {
    const next = autoSalvageRarities.includes(rarity)
      ? autoSalvageRarities.filter(r => r !== rarity)
      : [...autoSalvageRarities, rarity];
    setAutoSalvageRarities(next);
    try { await api.updateSettings({ autoSalvageRarities: next }); }
    catch (e) { console.error(e); setAutoSalvageRarities(autoSalvageRarities); }
  }

  const bulkCount = bag.filter(i => autoSalvageRarities.includes(i.rarity)).length;

  return (
    <div className="inv-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="inv-panel">

        {/* Header */}
        <div className="inv-header">
          <span className="inv-title">Inventory</span>
          <span className="inv-shards">◆ {spiritShards.toLocaleString()} spirit shards</span>
          <span className="inv-count">{inventory.length} / 50</span>
          <button className="inv-close-btn" onClick={onClose}>Close</button>
        </div>

        {/* Auto-salvage settings */}
        <div className="inv-autosalvage-bar">
          <span className="inv-autosalvage-label">Auto-salvage on drop:</span>
          {RARITIES.map(r => (
            <button
              key={r}
              className={`rarity-toggle${autoSalvageRarities.includes(r) ? ' active' : ''}`}
              style={autoSalvageRarities.includes(r) ? { borderColor: RARITY_COLOR[r], color: RARITY_COLOR[r] } : {}}
              onClick={() => toggleAutoSalvage(r)}
            >
              {r.toUpperCase()}
            </button>
          ))}
          {bulkCount > 0 && (
            <button className="btn-item btn-salvage inv-bulk-btn" onClick={handleBulkSalvage} disabled={busy}>
              Salvage {bulkCount} now
            </button>
          )}
        </div>

        <div className="inv-body">
          {/* Equipment */}
          <div className="inv-section-label">Equipped</div>
          <div className="equip-slots">
            {(['weapon', 'armor', 'accessory']).map(slot => (
              <EquipSlot
                key={slot}
                label={slot.charAt(0).toUpperCase() + slot.slice(1)}
                item={equipped[slot]}
                onUnequip={handleUnequip}
                onEnhance={handleEnhance}
                enhanceState={enhanceState}
                spiritShards={spiritShards}
                autoState={autoState}
                onAutoTargetChange={handleAutoTargetChange}
                onAutoStart={handleAutoStart}
                onAutoStop={handleAutoStop}
              />
            ))}
          </div>

          {/* Bag */}
          <div className="inv-section-label" style={{ marginTop: 22 }}>
            Bag — {bag.length} item{bag.length !== 1 ? 's' : ''}
          </div>
          {bag.length === 0 ? (
            <div className="inv-bag-empty">No items in bag.</div>
          ) : (
            <div className="inv-grid">
              {bag.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEquip={handleEquip}
                  onDiscard={handleDiscard}
                  onSalvage={handleSalvage}
                  onEnhance={handleEnhance}
                  enhanceState={enhanceState}
                  spiritShards={spiritShards}
                  autoState={autoState}
                  onAutoTargetChange={handleAutoTargetChange}
                  onAutoStart={handleAutoStart}
                  onAutoStop={handleAutoStop}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
