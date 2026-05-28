// Pavilions (Quarters, Warehouse): capacities and upgrades.

import {
  QUARTERS,
  WAREHOUSE,
  MERCHANT,
  INFIRMARY,
  TRAINING_HALL,
  HERB_GARDEN,
  ALCHEMY_LAB,
  FORGE,
  scaledCost,
  type Cost,
} from "../../data/costs";
import {
  FAME_BURST_PER_PAVILION_LEVEL,
  MERCHANT_SELL_BONUS_PER_LEVEL,
  INFIRMARY_HEAL_PER_LEVEL,
  TRAINING_HALL_XP_PER_LEVEL,
  TRAINING_HALL_XP_CAP,
  HERB_PER_LEVEL_PER_DAY,
} from "../../data/balance";
import { spend } from "../resources/resources";
import { pushLog } from "../../state/log";
import type { GameState } from "../../state/gameState";

export type PavilionKey =
  | "quarters"
  | "warehouse"
  | "merchant"
  | "infirmary"
  | "trainingHall"
  | "herbGarden"
  | "alchemyLab"
  | "forge";

export const PAVILION_LABEL: Record<PavilionKey, string> = {
  quarters: "Quarters",
  warehouse: "Warehouse",
  merchant: "Merchant Pavilion",
  infirmary: "Infirmary",
  trainingHall: "Training Hall",
  herbGarden: "Spirit Herb Garden",
  alchemyLab: "Alchemy Lab",
  forge: "Forge",
};

const PAVILION_BASE_COST: Record<PavilionKey, Cost> = {
  quarters: QUARTERS.baseCost,
  warehouse: WAREHOUSE.baseCost,
  merchant: MERCHANT.baseCost,
  infirmary: INFIRMARY.baseCost,
  trainingHall: TRAINING_HALL.baseCost,
  herbGarden: HERB_GARDEN.baseCost,
  alchemyLab: ALCHEMY_LAB.baseCost,
  forge: FORGE.baseCost,
};

/** Auto-selling is unlocked once the Merchant Pavilion exists. */
export function merchantBuilt(state: GameState): boolean {
  return state.buildings.merchant.level >= 1;
}

/** Auto-sell price multiplier from the merchant's level (level 1 = ×1). */
export function merchantSellMultiplier(level: number): number {
  return 1 + Math.max(0, level - 1) * MERCHANT_SELL_BONUS_PER_LEVEL;
}

/** Extra HP regenerated per day from the infirmary. */
export function infirmaryHealBonus(state: GameState): number {
  return state.buildings.infirmary.level * INFIRMARY_HEAL_PER_LEVEL;
}

/** Fractional XP boost from the training hall (capped). */
export function trainingHallXpBonus(state: GameState): number {
  return Math.min(
    TRAINING_HALL_XP_CAP,
    state.buildings.trainingHall.level * TRAINING_HALL_XP_PER_LEVEL,
  );
}

/** Herbs grown per day by the spirit herb garden. */
export function herbProductionPerDay(state: GameState): number {
  return state.buildings.herbGarden.level * HERB_PER_LEVEL_PER_DAY;
}

/** Crafting pills requires the Alchemy Lab. */
export function alchemyLabLevel(state: GameState): number {
  return state.buildings.alchemyLab.level;
}
export function alchemyBuilt(state: GameState): boolean {
  return alchemyLabLevel(state) >= 1;
}

/** Crafting equipment requires the Forge. */
export function forgeLevel(state: GameState): number {
  return state.buildings.forge.level;
}
export function forgeBuilt(state: GameState): boolean {
  return forgeLevel(state) >= 1;
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
