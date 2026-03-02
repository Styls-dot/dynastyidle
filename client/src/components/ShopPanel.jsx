import React, { useState } from 'react';
import { api } from '../api';

const RARITY_COLOR = { common:'#7A6E62', rare:'#2F6B5F', epic:'#6B3A8A', legendary:'#C6A85C', mythic:'#B33A3A' };
const SELL_PRICES  = { common: 5, rare: 15, epic: 50, legendary: 150, mythic: 500 };
const HP_POTION_COST   = 50;
const MANA_POTION_COST = 40;

export default function ShopPanel({
  gold, setGold,
  hpPotionCount,   setHpPotionCount,
  manaPotionCount, setManaPotionCount,
  inventory, onSellItem,
}) {
  const [busy, setBusy] = useState(false);
  const [msg,  setMsg]  = useState(null);
  const [hpQty,   setHpQty]   = useState(1);
  const [manaQty, setManaQty] = useState(1);

  function flash(text, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 2500);
  }

  async function handleBuy(type, qty) {
    setBusy(true);
    try {
      const res = await api.buyPotion(type, qty);
      setGold(res.gold);
      setHpPotionCount(res.hpPotionCount);
      setManaPotionCount(res.manaPotionCount);
      flash(`Bought ${res.bought} ${type === 'hp' ? 'HP' : 'Mana'} potion${res.bought !== 1 ? 's' : ''}`);
    } catch (e) {
      flash(e.message || 'Purchase failed', false);
    } finally { setBusy(false); }
  }

  async function handleSell(item) {
    setBusy(true);
    try {
      const res = await api.sellItem(item.id);
      setGold(res.gold);
      await onSellItem();
      flash(`Sold ${item.name} for ${res.soldFor}⬡`);
    } catch (e) {
      flash(e.message || 'Sale failed', false);
    } finally { setBusy(false); }
  }

  const bagItems = inventory.filter(i => !i.equippedSlot);

  return (
    <div className="shop-layout">
      <div className="shop-panel">

        {/* Header */}
        <div className="shop-header">
          <span className="shop-title">Market</span>
          <span className="shop-gold">⬡ {gold.toLocaleString()} gold</span>
        </div>

        {msg && (
          <div className={`shop-toast${msg.ok ? '' : ' shop-toast-err'}`}>{msg.text}</div>
        )}

        {/* Potions */}
        <div className="shop-section-label">Potions</div>
        <div className="shop-potion-grid">

          <div className="shop-potion-card">
            <div className="shop-potion-name">🍶 HP Potion</div>
            <div className="shop-potion-desc">Restores 50 HP instantly when consumed</div>
            <div className="shop-potion-stock">{hpPotionCount} in bag</div>
            <div className="shop-potion-actions">
              <input type="number" min="1" className="shop-qty-input" value={hpQty} onChange={e => setHpQty(Math.max(1, +e.target.value))} />
              <button className="shop-buy-btn" disabled={busy || gold < HP_POTION_COST * hpQty}
                onClick={() => handleBuy('hp', hpQty)}>Buy — {HP_POTION_COST * hpQty}⬡</button>
            </div>
          </div>

          <div className="shop-potion-card">
            <div className="shop-potion-name">💧 Mana Potion</div>
            <div className="shop-potion-desc">Restores 50 mana instantly when consumed</div>
            <div className="shop-potion-stock">{manaPotionCount} in bag</div>
            <div className="shop-potion-actions">
              <input type="number" min="1" className="shop-qty-input" value={manaQty} onChange={e => setManaQty(Math.max(1, +e.target.value))} />
              <button className="shop-buy-btn" disabled={busy || gold < MANA_POTION_COST * manaQty}
                onClick={() => handleBuy('mana', manaQty)}>Buy — {MANA_POTION_COST * manaQty}⬡</button>
            </div>
          </div>

        </div>

        {/* Sell items */}
        <div className="shop-section-label" style={{ marginTop: 24 }}>
          Sell Items — {bagItems.length} item{bagItems.length !== 1 ? 's' : ''} in bag
        </div>
        {bagItems.length === 0 ? (
          <div className="shop-sell-empty">No items in bag to sell.</div>
        ) : (
          <div className="shop-sell-list">
            {bagItems.map(item => {
              const col   = RARITY_COLOR[item.rarity] || RARITY_COLOR.common;
              const price = SELL_PRICES[item.rarity] ?? 5;
              return (
                <div key={item.id} className="shop-sell-row">
                  <span className="shop-sell-rarity" style={{ color: col }}>{item.rarity.toUpperCase()}</span>
                  <span className="shop-sell-name">{item.name}</span>
                  <span className="shop-sell-type">{item.type}</span>
                  <button className="shop-sell-btn" disabled={busy} onClick={() => handleSell(item)}>
                    {price}⬡
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
