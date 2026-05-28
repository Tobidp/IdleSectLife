// Bag panel: a single window holding both pill inventory (alchemy outputs) and equipment
// inventory (forge outputs). Lives in the Craft tab next to the two crafting panels.

import { useState } from "react";
import { Panel } from "./components/Panel";
import { useActions, useGameState } from "./engineContext";
import { PILLS } from "../data/pills";
import { BLUEPRINT_BY_ID } from "../data/blueprints";
import {
  EQUIPMENT_SLOT_LABEL,
  ITEM_TIER_CLASS,
  ITEM_TIER_LABEL,
  ITEM_TIER_SELL_PRICE,
  type EquippedItem,
} from "../data/equipment";
import { ATTRIBUTES, ATTRIBUTE_LABEL } from "../domain/sect/sectTypes";
import type { Disciple } from "../domain/disciples/disciple";

function formatXpBonuses(b: EquippedItem["xpBonuses"]): string {
  const parts: string[] = [];
  for (const k of ATTRIBUTES) {
    const v = b[k];
    if (typeof v === "number" && v > 0) {
      parts.push(`+${Math.round(v * 100)}% ${ATTRIBUTE_LABEL[k]} XP`);
    }
  }
  return parts.length === 0 ? "—" : parts.join(" · ");
}

function EquipmentRow({
  item,
  index,
  disciples,
}: {
  item: EquippedItem;
  index: number;
  disciples: Disciple[];
}): JSX.Element | null {
  const actions = useActions();
  const bp = BLUEPRINT_BY_ID[item.blueprintId];
  const [target, setTarget] = useState<number>(disciples[0]?.id ?? -1);
  if (!bp) return null;
  const sellPrice = ITEM_TIER_SELL_PRICE[item.tier];
  return (
    <div className="inv-row">
      <span className="inv-slot muted">{EQUIPMENT_SLOT_LABEL[bp.slot]}</span>
      <span className={`inv-name ${ITEM_TIER_CLASS[item.tier]}`}>
        {ITEM_TIER_LABEL[item.tier]} {bp.name}
      </span>
      <span className="inv-bonus muted">{formatXpBonuses(item.xpBonuses)}</span>
      <select
        className="inv-target"
        value={target}
        onChange={(e) => setTarget(parseInt(e.target.value, 10))}
        disabled={disciples.length === 0}
        title="Disciple to equip"
      >
        {disciples.length === 0 ? (
          <option value={-1}>No disciples</option>
        ) : (
          disciples.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))
        )}
      </select>
      <button
        disabled={disciples.length === 0 || target < 0}
        title={`Equip into the ${EQUIPMENT_SLOT_LABEL[bp.slot]} slot (swaps with current)`}
        onClick={() => actions.equipFromInventory(index, target, bp.slot)}
      >
        Equip
      </button>
      <button
        className="inv-sell"
        title={`Sell to the merchant for ${sellPrice} gold (cannot be undone)`}
        onClick={() => actions.sellItem(index)}
      >
        Sell · {sellPrice}🪙
      </button>
    </div>
  );
}

export function BagPanel(): JSX.Element | null {
  const state = useGameState();
  if (!state) return null;

  const ownedPills = PILLS.filter((p) => (state.pills[p.id] ?? 0) > 0);

  return (
    <Panel title="Bag" className="craft-bag">
      <div className="forge-section">
        <div className="forge-section-title">
          Pills ({ownedPills.length} kind{ownedPills.length === 1 ? "" : "s"})
        </div>
        {ownedPills.length === 0 ? (
          <p className="muted">No pills brewed yet — craft some at the Alchemy panel.</p>
        ) : (
          <div className="pill-list">
            {ownedPills.map((p) => (
              <div className="pill-row" key={p.id}>
                <span className="pill-name">{p.name}</span>
                <span className="pill-count">×{state.pills[p.id] ?? 0}</span>
                <span className="pill-desc muted">{p.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="forge-section">
        <div className="forge-section-title">
          Equipment ({state.itemInventory.length})
        </div>
        {state.itemInventory.length === 0 ? (
          <p className="muted">No items waiting to be equipped.</p>
        ) : (
          <div className="inv-list">
            {state.itemInventory.map((item, idx) => (
              <EquipmentRow key={idx} item={item} index={idx} disciples={state.disciples} />
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
