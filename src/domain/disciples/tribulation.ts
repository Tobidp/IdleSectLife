// The rank-up "trial": when a disciple's attribute is at 10★ with full XP, an automatic
// tribulation roll decides whether they ascend or suffer a setback. Severity scales with the
// rank they're entering (light → medium → heavy); vitality mitigates the failure chance.

import type { Rng } from "../../core/rng/rng";
import type { AttrProgress } from "./attributes";
import { xpForNextStar } from "./attributes";
import { STARS_PER_RANK } from "../../data/progression";
import {
  TRIBULATION_BASE_FAIL,
  TRIBULATION_MIN_FAIL,
  TRIBULATION_VIT_FACTOR,
  TRIBULATION_HP_FRACTION,
  TRIBULATION_XP_ROLLBACK,
  TRIBULATION_SETBACK_CHANCE,
} from "../../data/balance";

export type TribulationTier = 0 | 1 | 2;
export const TRIBULATION_TIER_LABEL: Record<TribulationTier, string> = {
  0: "minor",
  1: "major",
  2: "severe",
};

/** Severity tier of the trial to enter `targetRank`. */
export function tribulationTier(targetRank: number): TribulationTier {
  if (targetRank <= 2) return 0;
  if (targetRank <= 5) return 1;
  return 2;
}

export interface BreakthroughResult {
  /** False when called on an attribute that's not actually at 10★ + full XP. */
  attempted: boolean;
  success: boolean;
  tier: TribulationTier;
  /** Rank reached on success. */
  newRank?: number;
  /** Fraction of maxHp to subtract on failure (the call site applies it). */
  hpDamageFraction?: number;
  /** Stars lost on a failed setback: 0 = none, 1 = a star, STARS_PER_RANK = a full rank. */
  starsLost?: number;
}

/**
 * Perform the tribulation roll. On success, mutates the attribute to the new rank.
 *
 * `failChanceMultiplier` lets callers fold in temporary buffs (e.g. Tribulation Aid pill
 * = 0.5 halves the chance). Applied AFTER the vitality reduction; still clamped by
 * `TRIBULATION_MIN_FAIL` so a roll is never guaranteed.
 */
export function attemptBreakthrough(
  attr: AttrProgress,
  vitalityLevel: number,
  rng: Rng,
  failChanceMultiplier = 1,
): BreakthroughResult {
  const ready = attr.star === STARS_PER_RANK && attr.xp >= xpForNextStar(attr);
  if (!ready) return { attempted: false, success: false, tier: 0 };

  const targetRank = attr.rank + 1;
  const tier = tribulationTier(targetRank);
  const baseFail = TRIBULATION_BASE_FAIL[tier] - vitalityLevel * TRIBULATION_VIT_FACTOR;
  const failChance = Math.max(TRIBULATION_MIN_FAIL, baseFail * failChanceMultiplier);

  if (!rng.chance(failChance)) {
    attr.rank = targetRank;
    attr.star = 1;
    attr.xp = 0;
    return { attempted: true, success: true, tier, newRank: targetRank };
  }

  // Failure: roll back some XP, then chance for a setback (a star, or a full rank on tier 2).
  attr.xp = Math.max(0, Math.floor(attr.xp * (1 - TRIBULATION_XP_ROLLBACK[tier])));

  let starsLost = 0;
  if (rng.chance(TRIBULATION_SETBACK_CHANCE[tier])) {
    if (tier === 2 && attr.rank > 0) {
      attr.rank -= 1;
      attr.star = STARS_PER_RANK;
      attr.xp = 0;
      starsLost = STARS_PER_RANK;
    } else if (attr.star > 1) {
      attr.star -= 1;
      attr.xp = 0;
      starsLost = 1;
    }
  }
  return {
    attempted: true,
    success: false,
    tier,
    hpDamageFraction: TRIBULATION_HP_FRACTION[tier],
    starsLost,
  };
}
