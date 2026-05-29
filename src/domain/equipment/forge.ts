// Forging: turn a blueprint + materials into an EquippedItem at a randomly-rolled tier.
// The crafted item lands in the player's itemInventory; equipping happens separately.

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import type { Attribute } from "../sect/sectTypes";
import { spend } from "../resources/resources";
import { forgeLevel } from "../buildings/buildings";
import { sumWorkerLevels } from "../buildings/jobs";
import { BLUEPRINT_BY_ID } from "../../data/blueprints";
import {
  ITEM_TIER_LABEL,
  ITEM_TIER_SELL_PRICE,
  ITEM_TIER_XP_MULT,
  type EquippedItem,
  type ItemTier,
} from "../../data/equipment";
import { ITEM_TIER_WEIGHTS, FORGE_TIER_SHIFT_PER_LEVEL } from "../../data/balance";
import { pushLog } from "../../state/log";

/** Player has the blueprint, the forge level, and the resources to craft it. */
export function canCraftBlueprint(state: GameState, blueprintId: string): boolean {
  const bp = BLUEPRINT_BY_ID[blueprintId];
  if (!bp) return false;
  if (!state.blueprints.includes(blueprintId)) return false;
  if (forgeLevel(state) < bp.minForgeLevel) return false;
  for (const k of Object.keys(bp.craftCost) as Array<keyof typeof bp.craftCost>) {
    if ((state.resources[k] ?? 0) < (bp.craftCost[k] ?? 0)) return false;
  }
  return true;
}

/** Consume the recipe, roll a tier, push the new item into the inventory. */
export function craftBlueprint(state: GameState, blueprintId: string, rng: Rng): EquippedItem | null {
  if (!canCraftBlueprint(state, blueprintId)) return null;
  const bp = BLUEPRINT_BY_ID[blueprintId];
  if (!spend(state, bp.craftCost)) return null;

  const tier = rollItemTier(rng, state);
  const mult = ITEM_TIER_XP_MULT[tier];
  const xpBonuses: Partial<Record<Attribute, number>> = {};
  for (const k of Object.keys(bp.baseAttrXpBonus) as Attribute[]) {
    const v = bp.baseAttrXpBonus[k];
    if (typeof v === "number") xpBonuses[k] = v * mult;
  }
  const item: EquippedItem = { blueprintId, tier, xpBonuses };
  if (state.autoSellItems[tier]) {
    // Player set this tier to auto-sell — credit gold immediately and skip the inventory.
    const price = ITEM_TIER_SELL_PRICE[tier];
    state.resources.gold += price;
    pushLog(
      state,
      `Forged a ${ITEM_TIER_LABEL[tier]} ${bp.name} — auto-sold for ${price} gold.`,
      "good",
    );
  } else {
    state.itemInventory.push(item);
    pushLog(state, `Forged a ${ITEM_TIER_LABEL[tier]} ${bp.name}.`, "good");
  }
  return item;
}

/** Weighted random pick from the base tier weights, shifted up by Smith workers. */
function rollItemTier(rng: Rng, state: GameState): ItemTier {
  const weights = adjustedTierWeights(state);
  const tiers = Object.keys(weights) as ItemTier[];
  const total = tiers.reduce((s, t) => s + weights[t], 0);
  let pick = rng.next() * total;
  for (const t of tiers) {
    pick -= weights[t];
    if (pick <= 0) return t;
  }
  return "common";
}

/**
 * Tier weights with the Smith worker boost folded in. Each smith-strength-level shifts
 * FORGE_TIER_SHIFT_PER_LEVEL points away from "common" and splits 60/40 into uncommon/rare.
 * Epic and legendary weights are untouched in v1 to keep top tiers genuinely rare.
 */
export function adjustedTierWeights(state: GameState): Record<ItemTier, number> {
  const shift = sumWorkerLevels(state, "forge") * FORGE_TIER_SHIFT_PER_LEVEL;
  return {
    common: Math.max(0, ITEM_TIER_WEIGHTS.common - shift),
    uncommon: ITEM_TIER_WEIGHTS.uncommon + shift * 0.6,
    rare: ITEM_TIER_WEIGHTS.rare + shift * 0.4,
    epic: ITEM_TIER_WEIGHTS.epic,
    legendary: ITEM_TIER_WEIGHTS.legendary,
  };
}

/** Convert the current tier weights into 0..1 probabilities so UI can show "rare: 12%".
 *  Returns ordered entries (common → legendary) for stable rendering. */
export function tierProbabilities(state: GameState): { tier: ItemTier; chance: number }[] {
  const weights = adjustedTierWeights(state);
  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  const order: ItemTier[] = ["common", "uncommon", "rare", "epic", "legendary"];
  return order.map((tier) => ({ tier, chance: total > 0 ? weights[tier] / total : 0 }));
}
