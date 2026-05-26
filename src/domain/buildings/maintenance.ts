// Monthly upkeep for pavilions and the sect, scaled by level.

import { QUARTERS, WAREHOUSE, SECT, type Cost } from "../../data/costs";
import type { ResourceType } from "../resources/resourceTypes";
import { pushLog } from "../../state/log";
import type { GameState } from "../../state/gameState";

function addScaled(into: Cost, base: Cost, level: number): void {
  for (const k of Object.keys(base) as ResourceType[]) {
    into[k] = (into[k] ?? 0) + (base[k] ?? 0) * level;
  }
}

/** Total upkeep due this month across all buildings. */
export function monthlyMaintenance(state: GameState): Cost {
  const due: Cost = {};
  addScaled(due, QUARTERS.maintenancePerLevel, state.buildings.quarters.level);
  addScaled(due, WAREHOUSE.maintenancePerLevel, state.buildings.warehouse.level);
  addScaled(due, SECT.maintenancePerLevel, state.sect.level);
  return due;
}

/** Deduct upkeep; if a resource runs short, take what's there and warn (no harsh penalty in v1). */
export function applyMonthlyMaintenance(state: GameState): void {
  const due = monthlyMaintenance(state);
  let short = false;
  for (const k of Object.keys(due) as ResourceType[]) {
    const amount = due[k] ?? 0;
    if (state.resources[k] >= amount) {
      state.resources[k] -= amount;
    } else {
      state.resources[k] = 0;
      short = true;
    }
  }
  if (short) {
    pushLog(state, "Could not fully pay monthly maintenance — stores ran dry.", "bad");
  }
}
