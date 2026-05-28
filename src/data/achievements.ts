// Achievement definitions: each condition is checked once per day; on first match the player
// "unlocks" it and gains its permanent bonus. Bonuses stay scoped to two clean multipliers
// (collection and fame) so wiring is contained and easy to balance.

import type { GameState } from "../state/gameState";

export interface AchievementBonus {
  /** Fractional bonus added to the collection multiplier (e.g. 0.05 = +5%). */
  collect?: number;
  /** Fractional bonus added to the fame multiplier (e.g. 0.10 = +10%). */
  fame?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: (game: GameState) => boolean;
  bonus: AchievementBonus;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "growing_sect",
    name: "Growing Sect",
    description: "Reach 5 disciples in your sect.",
    condition: (g) => g.disciples.length >= 5,
    bonus: { collect: 0.05 },
  },
  {
    id: "renowned",
    name: "Renowned",
    description: "Accumulate 100 fame.",
    condition: (g) => g.fame >= 100,
    bonus: { fame: 0.1 },
  },
  {
    id: "rising_sect",
    name: "Rising Sect",
    description: "Upgrade your sect to level 3.",
    condition: (g) => g.sect.level >= 3,
    bonus: { fame: 0.05 },
  },
  {
    id: "foundation_reached",
    name: "Foundation Reached",
    description: "Have a disciple ascend to the Foundation realm (rank 3).",
    condition: (g) => g.disciples.some((d) => Object.values(d.attributes).some((a) => a.rank >= 3)),
    bonus: { collect: 0.05 },
  },
  {
    id: "coffers",
    name: "Full Coffers",
    description: "Hold 500 gold at once.",
    condition: (g) => g.resources.gold >= 500,
    bonus: { collect: 0.05 },
  },
  {
    id: "two_years",
    name: "Enduring Sect",
    description: "Survive two full years in the sect.",
    condition: (g) => g.time.year >= 3,
    bonus: { fame: 0.1 },
  },
  {
    id: "trader",
    name: "Trader",
    description: "Build the Merchant Pavilion.",
    condition: (g) => g.buildings.merchant.level >= 1,
    bonus: { collect: 0.05 },
  },
];
