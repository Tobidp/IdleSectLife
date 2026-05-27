// Pavilions (Quarters, Warehouse): capacities and upgrades.

import { QUARTERS, WAREHOUSE, MERCHANT, scaledCost, type Cost } from "../../data/costs";
import { FAME_BURST_PER_PAVILION_LEVEL, MERCHANT_SELL_BONUS_PER_LEVEL } from "../../data/balance";
import { spend } from "../resources/resources";
import { pushLog } from "../../state/log";
import type { GameState } from "../../state/gameState";

export type PavilionKey = "quarters" | "warehouse" | "merchant";

export const PAVILION_LABEL: Record<PavilionKey, string> = {
  quarters: "Quarters",
  warehouse: "Warehouse",
  merchant: "Merchant Pavilion",
};

const PAVILION_BASE_COST: Record<PavilionKey, Cost> = {
  quarters: QUARTERS.baseCost,
  warehouse: WAREHOUSE.baseCost,
  merchant: MERCHANT.baseCost,
};

/** Auto-selling is unlocked once the Merchant Pavilion exists. */
export function merchantBuilt(state: GameState): boolean {
  return state.buildings.merchant.level >= 1;
}

/** Auto-sell price multiplier from the merchant's level (level 1 = ×1). */
export function merchantSellMultiplier(level: number): number {
  return 1 + Math.max(0, level - 1) * MERCHANT_SELL_BONUS_PER_LEVEL;
}

export function quartersCapacity(level: number): number {
  return QUARTERS.baseCapacity + (level - 1) * QUARTERS.capacityPerLevel;
}

export function disciplesCapacity(state: GameState): number {
  return quartersCapacity(state.buildings.quarters.level);
}

export function pavilionUpgradeCost(key: PavilionKey, level: number): Cost {
  return scaledCost(PAVILION_BASE_COST[key], level);
}

export function upgradePavilion(state: GameState, key: PavilionKey): boolean {
  const level = state.buildings[key].level;
  const cost = pavilionUpgradeCost(key, level);
  if (!spend(state, cost)) return false;
  state.buildings[key].level += 1;
  state.fame += FAME_BURST_PER_PAVILION_LEVEL;
  pushLog(state, `${PAVILION_LABEL[key]} upgraded to level ${state.buildings[key].level}.`, "good");
  return true;
}
