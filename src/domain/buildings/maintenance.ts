// Monthly upkeep for pavilions and the sect, scaled by level — including the gold "wages"
// whose non-payment carries real consequences (morale, then structural decay).

import {
  QUARTERS,
  WAREHOUSE,
  MERCHANT,
  INFIRMARY,
  TRAINING_HALL,
  SECT,
  type Cost,
} from "../../data/costs";
import {
  WAGE_ARREARS_HAPPINESS_PENALTY,
  WAGE_ARREARS_GRACE_MONTHS,
} from "../../data/balance";
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
  addScaled(due, MERCHANT.maintenancePerLevel, state.buildings.merchant.level);
  addScaled(due, INFIRMARY.maintenancePerLevel, state.buildings.infirmary.level);
  addScaled(due, TRAINING_HALL.maintenancePerLevel, state.buildings.trainingHall.level);
  addScaled(due, SECT.maintenancePerLevel, state.sect.level);
  return due;
}

/** Drop a level on the highest-level structure (>1), simulating decay. Returns its label. */
function decayOneStructure(state: GameState): string | null {
  const options = [
    { label: "Quarters", level: state.buildings.quarters.level, drop: () => (state.buildings.quarters.level -= 1) },
    { label: "Warehouse", level: state.buildings.warehouse.level, drop: () => (state.buildings.warehouse.level -= 1) },
    { label: "The sect", level: state.sect.level, drop: () => (state.sect.level -= 1) },
  ];
  const eligible = options.filter((o) => o.level > 1).sort((a, b) => b.level - a.level);
  if (eligible.length === 0) return null;
  eligible[0].drop();
  return eligible[0].label;
}

/**
 * Deduct upkeep. Materials (wood/stone) just deplete with a warning. The gold "wages" matter:
 * a month unpaid drops every disciple's morale; once the debt outlasts the grace period,
 * structures start to decay. Paying in full clears the arrears.
 */
export function applyMonthlyMaintenance(state: GameState): void {
  const due = monthlyMaintenance(state);
  const goldDue = due.gold ?? 0;
  const goldPaid = state.resources.gold >= goldDue;

  let materialShort = false;
  for (const k of Object.keys(due) as ResourceType[]) {
    const amount = due[k] ?? 0;
    if (amount <= 0) continue;
    if (state.resources[k] >= amount) {
      state.resources[k] -= amount;
    } else {
      state.resources[k] = 0;
      if (k !== "gold") materialShort = true;
    }
  }
  if (materialShort) pushLog(state, "Ran short on materials for upkeep this month.", "bad");

  if (goldPaid) {
    if (state.goldArrears > 0) {
      state.goldArrears = 0;
      pushLog(state, "Wages paid in full — the sect steadies.", "good");
    }
    return;
  }

  // Unpaid wages: morale drops now, structures decay if the debt persists.
  state.goldArrears += 1;
  for (const d of state.disciples) {
    d.happiness = Math.max(0, d.happiness - WAGE_ARREARS_HAPPINESS_PENALTY);
  }
  pushLog(state, `Couldn't pay wages (needed ${goldDue} gold). Morale falls.`, "bad");

  if (state.goldArrears > WAGE_ARREARS_GRACE_MONTHS) {
    const decayed = decayOneStructure(state);
    if (decayed) {
      pushLog(state, `${decayed} fell into disrepair after ${state.goldArrears} months unpaid.`, "bad");
    }
  }
}
