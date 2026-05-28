// Daily happiness dynamics.

import {
  HAPPINESS_TARGET_MATCH,
  HAPPINESS_TARGET_MISMATCH,
  HAPPINESS_DRIFT,
  HAPPINESS_SHORTAGE_PENALTY,
  BOND_HAPPINESS_PER_BOND,
  BOND_HAPPINESS_TARGET_CAP,
} from "../../data/balance";
import type { Disciple } from "./disciple";
import type { SectType } from "../sect/sectTypes";

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/** Move a disciple's happiness for the day. Food shortage overrides the drift. Bonds raise
 * the happiness target by a small amount per bond (capped). */
export function updateHappiness(d: Disciple, playerSect: SectType, foodShortage: boolean): void {
  if (foodShortage) {
    d.happiness = clamp(d.happiness - HAPPINESS_SHORTAGE_PENALTY);
    return;
  }
  const matches = d.preferredSect === playerSect;
  const baseTarget = matches ? HAPPINESS_TARGET_MATCH : HAPPINESS_TARGET_MISMATCH;
  const bondBoost = Math.min(BOND_HAPPINESS_TARGET_CAP, d.bonds.length * BOND_HAPPINESS_PER_BOND);
  const target = Math.min(100, baseTarget + bondBoost);
  const diff = target - d.happiness;
  if (Math.abs(diff) <= HAPPINESS_DRIFT) {
    d.happiness = target;
  } else {
    d.happiness += Math.sign(diff) * HAPPINESS_DRIFT;
  }
  d.happiness = clamp(d.happiness);
}
