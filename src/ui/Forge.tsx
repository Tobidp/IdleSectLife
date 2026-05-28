// Forge panel: craft equipment from discovered blueprints. Lives inside the Craft tab.
// The crafted-item inventory now lives in the Bag panel (also Craft tab).

import { Panel } from "./components/Panel";
import { useActions, useGameState } from "./engineContext";
import { BLUEPRINTS, BLUEPRINT_BY_ID } from "../data/blueprints";
import { EQUIPMENT_SLOT_LABEL, type EquippedItem } from "../data/equipment";
import { canCraftBlueprint } from "../domain/equipment/forge";
import { forgeLevel } from "../domain/buildings/buildings";
import { formatCost } from "./components/format";
import { ATTRIBUTES, ATTRIBUTE_LABEL } from "../domain/sect/sectTypes";

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
        <span className="recipe-name">{bp.name}</span>
        <span className="recipe-owned muted">{EQUIPMENT_SLOT_LABEL[bp.slot]}</span>
      </div>
      <div className="recipe-desc muted">{formatXpBonuses(bp.baseAttrXpBonus as EquippedItem["xpBonuses"])}</div>
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

export function ForgePanel(): JSX.Element | null {
  const state = useGameState();
  if (!state) return null;

  const level = forgeLevel(state);
  const built = level >= 1;
  const ownedBlueprints = BLUEPRINTS.filter((b) => state.blueprints.includes(b.id));

  return (
    <Panel title={`Forge${built ? ` · Lv ${level}` : ""}`} className="craft-forge">
      <p className="muted">
        {built
          ? "Craft equipment from your discovered blueprints. Items roll a random quality tier; finished items go into your Bag."
          : "Build the Forge from the Buildings panel to start crafting equipment."}
      </p>

      <div className="forge-section">
        <div className="forge-section-title">Blueprints ({ownedBlueprints.length})</div>
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
    </Panel>
  );
}
