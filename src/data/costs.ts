// Building/sect costs, capacities and maintenance. Costs grow exponentially with level.

import type { ResourceType } from "../domain/resources/resourceTypes";

export type Cost = Partial<Record<ResourceType, number>>;

/** Exponential growth: upgradeCost = base * COST_MULTIPLIER^(currentLevel). */
export const COST_MULTIPLIER = 1.5;

// Quarters & Sect base costs are +300% (x4) vs. the original tuning to slow progression.
// Warehouse is intentionally left cheap: you must upgrade it to unlock the storage space
// needed to stockpile the (now larger) materials for the other upgrades.
export const QUARTERS = {
  baseCost: { wood: 120, stone: 80 } as Cost,
  baseCapacity: 5,
  capacityPerLevel: 2, // lvl 1 = 5, lvl 2 = 7, ...
  maintenancePerLevel: { wood: 2 } as Cost, // consumed per month, scaled by level
};

export const WAREHOUSE = {
  baseCost: { stone: 30, wood: 20 } as Cost, // unchanged on purpose (see note above)
  baseCapacity: 200,
  // Capacity grows EXPONENTIALLY at this multiplier per level — comfortably outpaces the
  // 1.5x cost multiplier so the next upgrade always fits inside the current cap. Old saves
  // get more storage at level >= 3; very-low levels lose a sliver (Lv 2: 320 vs old 350).
  capacityMultPerLevel: 1.6,
  maintenancePerLevel: { stone: 2 } as Cost,
};

export const SECT = {
  baseCost: { stone: 400, wood: 400, gold: 200 } as Cost,
  maintenancePerLevel: { gold: 5 } as Cost, // the monthly "wages" paid in gold
};

// Optional building: once built (level >= 1) it enables auto-selling surplus resources for
// gold. Materials-only cost so it can be bootstrapped before you have much gold. No upkeep —
// it's the gold faucet. Higher levels fetch better auto-sell prices.
export const MERCHANT = {
  baseCost: { wood: 150, stone: 150 } as Cost,
  maintenancePerLevel: {} as Cost,
};

// Optional building: each level adds passive HP regen per day to every disciple.
export const INFIRMARY = {
  baseCost: { wood: 80, stone: 80 } as Cost,
  maintenancePerLevel: {} as Cost,
};

// Optional building: each level adds a flat XP bonus (capped). Stacks with mentors.
// Hard-capped at the level where the base XP bonus hits TRAINING_HALL_XP_CAP — further
// upgrades wouldn't add base effect (worker capacity is already at the cap level too).
export const TRAINING_HALL = {
  baseCost: { wood: 100, stone: 100, gold: 20 } as Cost,
  maintenancePerLevel: { gold: 1 } as Cost,
  maxLevel: 5,
};

// Optional building: passively grows herbs per day (a new resource that feeds alchemy later).
export const HERB_GARDEN = {
  baseCost: { wood: 120, stone: 60 } as Cost,
  maintenancePerLevel: {} as Cost,
};

// Optional building: required to craft pills. Higher levels will unlock stronger recipes.
export const ALCHEMY_LAB = {
  baseCost: { wood: 140, stone: 140, gold: 25 } as Cost,
  maintenancePerLevel: { gold: 1 } as Cost,
};

// Optional building: forges equipment from blueprints. Higher levels gate stronger blueprints
// and raise the chance of better quality tiers on each craft.
export const FORGE = {
  baseCost: { wood: 200, stone: 200, gold: 30 } as Cost,
  maintenancePerLevel: { gold: 1 } as Cost,
};

/** Scale a base cost by the exponential multiplier for the given current level. */
export function scaledCost(base: Cost, level: number): Cost {
  const factor = Math.pow(COST_MULTIPLIER, level);
  const out: Cost = {};
  for (const key of Object.keys(base) as ResourceType[]) {
    out[key] = Math.ceil((base[key] ?? 0) * factor);
  }
  return out;
}
