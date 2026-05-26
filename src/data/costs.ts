// Building/sect costs, capacities and maintenance. Costs grow exponentially with level.

import type { ResourceType } from "../domain/resources/resourceTypes";

export type Cost = Partial<Record<ResourceType, number>>;

/** Exponential growth: upgradeCost = base * COST_MULTIPLIER^(currentLevel). */
export const COST_MULTIPLIER = 1.5;

export const QUARTERS = {
  baseCost: { wood: 30, stone: 20 } as Cost,
  baseCapacity: 5,
  capacityPerLevel: 2, // lvl 1 = 5, lvl 2 = 7, ...
  maintenancePerLevel: { wood: 2 } as Cost, // consumed per month, scaled by level
};

export const WAREHOUSE = {
  baseCost: { stone: 30, wood: 20 } as Cost,
  baseCapacity: 200,
  capacityPerLevel: 150, // lvl 1 = 200, lvl 2 = 350, ...
  maintenancePerLevel: { stone: 2 } as Cost,
};

export const SECT = {
  baseCost: { stone: 100, wood: 100, gold: 50 } as Cost,
  famePerLevelPerDay: 2, // passive fame/day granted per sect level
  maintenancePerLevel: { gold: 5 } as Cost,
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
