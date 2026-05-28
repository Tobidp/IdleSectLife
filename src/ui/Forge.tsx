// Forge modal: discovered blueprints (craft) + crafted-item inventory (equip on a disciple).
// Triggered from a footer button; mirrors the Alchemy modal pattern.

import { useState } from "react";
import { useActions, useGameState } from "./engineContext";
import { BLUEPRINTS, BLUEPRINT_BY_ID } from "../data/blueprints";
import {
  EQUIPMENT_SLOT_ICON,
  EQUIPMENT_SLOT_LABEL,
  ITEM_TIER_CLASS,
  ITEM_TIER_LABEL,
  type EquippedItem,
} from "../data/equipment";
import { canCraftBlueprint } from "../domain/equipment/forge";
import { forgeLevel } from "../domain/buildings/buildings";
import { formatCost } from "./components/format";
import {
  ATTRIBUTES,
  ATTRIBUTE_LABEL,
  type Attribute,
} from "../domain/sect/sectTypes";
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

function BlueprintRow({ blueprintId }: { blueprintId: string }): JSX.Element | null {
  const state = useGameState();
  const actions = useActions();
  if (!state) return null;
  const bp = BLUEPRINT_BY_ID[blueprintId];
  if (!bp) return null;
  const level = forgeLevel(state);
  const built = level >= 1;
  const gated = level < bp.minForgeLevel;
  const canCraft = canCraftBlueprint(state, blueprintId);
  const reason = !built
    ? "Build the Forge first"
    : gated
      ? `Requires Forge Lv ${bp.minForgeLevel}`
      : !canCraft
        ? "Not enough resources"
        : "";
  return (
    <div className="recipe-card">
      <div className="recipe-head">
        <span className="recipe-name">
          {EQUIPMENT_SLOT_ICON[bp.slot]} {bp.name}
        </span>
        <span className="recipe-owned muted">{EQUIPMENT_SLOT_LABEL[bp.slot]}</span>
      </div>
      <div className="recipe-desc muted">{formatXpBonuses(scaleByCommon(bp.baseAttrXpBonus))}</div>
      <div className="recipe-foot">
        <span className="recipe-cost">{formatCost(bp.craftCost)}</span>
        <button
          disabled={!built || gated || !canCraft}
          title={reason || "Roll a random-tier item from this recipe"}
          onClick={() => actions.craftBlueprint(blueprintId)}
        >
          Craft
        </button>
      </div>
    </div>
  );
}

/** Show the base (common-tier) bonus per attribute as a hint of what this blueprint yields. */
function scaleByCommon(base: Partial<Record<Attribute, number>>): EquippedItem["xpBonuses"] {
  return base;
}

function InventoryRow({
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
  return (
    <div className="inv-row">
      <span className="inv-icon">{EQUIPMENT_SLOT_ICON[bp.slot]}</span>
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
    </div>
  );
}

export function Forge(): JSX.Element | null {
  const state = useGameState();
  const [open, setOpen] = useState(false);
  if (!state) return null;

  const level = forgeLevel(state);
  const built = level >= 1;
  const ownedBlueprints = BLUEPRINTS.filter((b) => state.blueprints.includes(b.id));

  return (
    <>
      <button className="forge-btn" title="Forge" onClick={() => setOpen(true)}>
        ⚒️ Forge
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Forge {built ? `· Lv ${level}` : ""}</div>
            <p className="modal-text muted">
              {built
                ? "Craft equipment from your discovered blueprints. Items roll a random quality tier; better tiers grant larger XP bonuses."
                : "Build the Forge from the Buildings panel to start crafting equipment."}
            </p>

            <div className="forge-section">
              <div className="forge-section-title">
                Blueprints ({ownedBlueprints.length})
              </div>
              {ownedBlueprints.length === 0 ? (
                <p className="muted">No blueprints discovered yet. Trials may reveal new ones.</p>
              ) : (
                <div className="recipe-list">
                  {ownedBlueprints.map((b) => (
                    <BlueprintRow key={b.id} blueprintId={b.id} />
                  ))}
                </div>
              )}
            </div>

            <div className="forge-section">
              <div className="forge-section-title">
                Inventory ({state.itemInventory.length})
              </div>
              {state.itemInventory.length === 0 ? (
                <p className="muted">No items waiting to be equipped.</p>
              ) : (
                <div className="inv-list">
                  {state.itemInventory.map((item, idx) => (
                    <InventoryRow
                      key={idx}
                      item={item}
                      index={idx}
                      disciples={state.disciples}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
