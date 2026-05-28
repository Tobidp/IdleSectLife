// Spirit-root / talent: a tier rolled when a disciple is created that scales their XP gain.
// Higher tiers are rare — the system rewards patient Accept/Deny review.

import type { Rng } from "../core/rng/rng";

export type TalentTier = "mundane" | "common" | "bright" | "brilliant" | "heavenly";

export interface TalentDef {
  id: TalentTier;
  label: string;
  /** Relative weight in the random roll. */
  weight: number;
  /** Multiplier applied to every XP gain (train and collect). */
  xpMult: number;
}

export const TALENT_TIERS: readonly TalentDef[] = [
  { id: "mundane", label: "Mundane", weight: 50, xpMult: 0.75 },
  { id: "common", label: "Common", weight: 30, xpMult: 1.0 },
  { id: "bright", label: "Bright", weight: 15, xpMult: 1.5 },
  { id: "brilliant", label: "Brilliant", weight: 4, xpMult: 2.5 },
  { id: "heavenly", label: "Heavenly", weight: 1, xpMult: 4.0 },
];

export const TALENT_BY_ID: Record<TalentTier, TalentDef> = Object.fromEntries(
  TALENT_TIERS.map((t) => [t.id, t]),
) as Record<TalentTier, TalentDef>;

/** Reuses the rank tier colours so talent badges echo the rarity palette. */
export const TALENT_TIER_CLASS: Record<TalentTier, string> = {
  mundane: "rank-gray",
  common: "rank-green",
  bright: "rank-blue",
  brilliant: "rank-purple",
  heavenly: "rank-gold",
};

const TALENT_TOTAL_WEIGHT = TALENT_TIERS.reduce((s, t) => s + t.weight, 0);

/** Weighted random talent pick. */
export function rollTalent(rng: Rng): TalentTier {
  let r = rng.next() * TALENT_TOTAL_WEIGHT;
  for (const t of TALENT_TIERS) {
    r -= t.weight;
    if (r <= 0) return t.id;
  }
  return "common";
}

export function talentXpMult(tier: TalentTier): number {
  return TALENT_BY_ID[tier].xpMult;
}
