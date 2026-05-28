// Jobs: a "Work · X" daily-slot activity assigns the disciple to a building. Each filled job
// slot counts as one worker for that building that tick. Capacity is the building's level;
// over-assignments are sorted by the relevant attribute and the lower-tier slots are dropped.

import type { GameState } from "../../state/gameState";
import type { Disciple } from "../disciples/disciple";
import type { Attribute } from "../sect/sectTypes";
import { effectiveLevel } from "../disciples/attributes";
import { jobBuildingOf } from "../disciples/actions";

/** Subset of pavilions that accept workers (anything with a productive effect). */
export type JobBuilding =
  | "forge"
  | "herbGarden"
  | "alchemyLab"
  | "trainingHall"
  | "infirmary"
  | "merchant";

/** Each job is gated by a "relevant" attribute — the worker's level there scales the bonus. */
export const JOB_ATTRIBUTE: Record<JobBuilding, Attribute> = {
  forge: "strength",
  herbGarden: "vitality",
  alchemyLab: "vitality",
  trainingHall: "strength",
  infirmary: "vitality",
  merchant: "dexterity",
};

export const JOB_TITLE: Record<JobBuilding, string> = {
  forge: "Smith",
  herbGarden: "Gardener",
  alchemyLab: "Apothecary",
  trainingHall: "Instructor",
  infirmary: "Healer",
  merchant: "Trader",
};

export interface WorkerContribution {
  discipleId: number;
  attrLevel: number;
}

/** True if `b` is a building that accepts workers. */
function isJobBuilding(b: string): b is JobBuilding {
  return b in JOB_ATTRIBUTE;
}

/**
 * All active workers for `building`, sorted by their relevant-attribute level desc and capped
 * at the building's level (over-assigned slots are dropped). Returns [] if the building isn't
 * built or has no assigned slots.
 */
export function getActiveWorkers(state: GameState, building: JobBuilding): WorkerContribution[] {
  const cap = state.buildings[building].level;
  if (cap === 0) return [];
  const attr = JOB_ATTRIBUTE[building];

  const all: WorkerContribution[] = [];
  for (const d of state.disciples) {
    if (d.status !== "active") continue;
    let slotCount = 0;
    for (const action of d.actions) {
      const target = jobBuildingOf(action);
      if (target === building) slotCount += 1;
    }
    if (slotCount === 0) continue;
    const lvl = effectiveLevel(d.attributes[attr]);
    for (let i = 0; i < slotCount; i++) {
      all.push({ discipleId: d.id, attrLevel: lvl });
    }
  }

  return all.sort((a, b) => b.attrLevel - a.attrLevel).slice(0, cap);
}

/** Sum of `attrLevel` across active workers (already capped at building.level). */
export function sumWorkerLevels(state: GameState, building: JobBuilding): number {
  return getActiveWorkers(state, building).reduce((s, w) => s + w.attrLevel, 0);
}

/** How many job slots are currently assigned to `building` (uncapped — for UI display). */
export function assignedSlotCount(state: GameState, building: JobBuilding): number {
  let count = 0;
  for (const d of state.disciples) {
    if (d.status !== "active") continue;
    for (const action of d.actions) {
      if (jobBuildingOf(action) === building) count += 1;
    }
  }
  return count;
}

/** Disciple objects (deduplicated) currently working in `building`. For UI tooltips. */
export function workerDisciples(state: GameState, building: JobBuilding): Disciple[] {
  const ids = new Set(getActiveWorkers(state, building).map((w) => w.discipleId));
  return state.disciples.filter((d) => ids.has(d.id));
}

// re-export so callers can use a single import
export { isJobBuilding };
