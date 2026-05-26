// Daily happiness dynamics.

import {
  HAPPINESS_TARGET_MATCH,
  HAPPINESS_TARGET_MISMATCH,
  HAPPINESS_DRIFT,
  HAPPINESS_SHORTAGE_PENALTY,
} from "../../data/balance";
import type { Disciple } from "./disciple";
import type { SectType } from "../sect/sectTypes";

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/** Move a disciple's happiness for the day. Food shortage overrides the drift. */
export function updateHappiness(d: Disciple, playerSect: SectType, foodShortage: boolean): void {
  if (foodShortage) {
    d.happiness = clamp(d.happiness - HAPPINESS_SHORTAGE_PENALTY);
    return;
  }
  const matches = d.preferredSect === playerSect;
  const target = matches ? HAPPINESS_TARGET_MATCH : HAPPINESS_TARGET_MISMATCH;
  const diff = target - d.happiness;
  if (Math.abs(diff) <= HAPPINESS_DRIFT) {
    d.happiness = target;
  } else {
    d.happiness += Math.sign(diff) * HAPPINESS_DRIFT;
  }
  d.happiness = clamp(d.happiness);
}
