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

/** Hard upgrade caps. Buildings absent from this map have no max level. */
const PAVILION_MAX_LEVEL: Partial<Record<PavilionKey, number>> = {
  trainingHall: TRAINING_HALL.maxLevel,
};
import {
  FAME_BURST_PER_PAVILION_LEVEL,
  MERCHANT_SELL_BONUS_PER_LEVEL,
  INFIRMARY_HEAL_PER_LEVEL,
  TRAINING_HALL_XP_PER_LEVEL,
  TRAINING_HALL_XP_CAP,
  HERB_PER_LEVEL_PER_DAY,
  HERB_PER_WORKER_LEVEL,
  INFIRMARY_HEAL_PER_WORKER_LEVEL,
  TRAINING_HALL_XP_PER_WORKER_LEVEL,
  MERCHANT_SELL_PER_WORKER_LEVEL,
} from "../../data/balance";
import { spend } from "../resources/resources";
import { pushLog } from "../../state/log";
import type { GameState } from "../../state/gameState";
import { sumWorkerLevels } from "./jobs";

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

/** Auto-sell price multiplier from the merchant's *base* level (UI per-level preview). */
export function merchantSellMultiplier(level: number): number {
  return 1 + Math.max(0, level - 1) * MERCHANT_SELL_BONUS_PER_LEVEL;
}

/** Full auto-sell multiplier including any Trader workers' Dexterity contribution. */
export function merchantSellMultiplierFor(state: GameState): number {
  return (
    merchantSellMultiplier(state.buildings.merchant.level) +
    sumWorkerLevels(state, "merchant") * MERCHANT_SELL_PER_WORKER_LEVEL
  );
}

/** Extra HP regenerated per day from the infirmary (base + Healer workers' Vitality). */
export function infirmaryHealBonus(state: GameState): number {
  return (
    state.buildings.infirmary.level * INFIRMARY_HEAL_PER_LEVEL +
    sumWorkerLevels(state, "infirmary") * INFIRMARY_HEAL_PER_WORKER_LEVEL
  );
}

/** Fractional XP boost from the training hall: capped per-level base + uncapped worker addition. */
export function trainingHallXpBonus(state: GameState): number {
  const base = Math.min(
    TRAINING_HALL_XP_CAP,
    state.buildings.trainingHall.level * TRAINING_HALL_XP_PER_LEVEL,
  );
  const worker = sumWorkerLevels(state, "trainingHall") * TRAINING_HALL_XP_PER_WORKER_LEVEL;
  return base + worker;
}

/** Herbs grown per day: passive level production + Gardener workers' Vitality. */
export function herbProductionPerDay(state: GameState): number {
  return (
    state.buildings.herbGarden.level * HERB_PER_LEVEL_PER_DAY +
    sumWorkerLevels(state, "herbGarden") * HERB_PER_WORKER_LEVEL
  );
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

/** Hard max level for `key`, or null if there's no cap. */
export function pavilionMaxLevel(key: PavilionKey): number | null {
  return PAVILION_MAX_LEVEL[key] ?? null;
}

/** True once the pavilion has hit its hard cap (only meaningful for capped pavilions). */
export function pavilionMaxed(state: GameState, key: PavilionKey): boolean {
  const max = pavilionMaxLevel(key);
  return max !== null && state.buildings[key].level >= max;
}

export function upgradePavilion(state: GameState, key: PavilionKey): boolean {
  if (pavilionMaxed(state, key)) return false;
  const level = state.buildings[key].level;
  const cost = pavilionUpgradeCost(key, level);
  if (!spend(state, cost)) return false;
  state.buildings[key].level += 1;
  state.fame += FAME_BURST_PER_PAVILION_LEVEL;
  pushLog(state, `${PAVILION_LABEL[key]} upgraded to level ${state.buildings[key].level}.`, "good");
  return true;
}
