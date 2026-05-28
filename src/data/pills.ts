// Alchemy pill definitions: recipes (resources consumed) and metadata. Effects live in the
// domain layer (src/domain/alchemy) so this file stays pure data.

import type { Cost } from "./costs";

export type PillId = "healing" | "insight" | "tribulationAid";

export interface PillDef {
  id: PillId;
  name: string;
  description: string;
  recipe: Cost;
  /** Required alchemy lab level to craft. Higher tiers will gate stronger pills later. */
  minLabLevel: number;
}

export const PILLS: readonly PillDef[] = [
  {
    id: "healing",
    name: "Healing Pill",
    description: "Used on a fallen disciple: instantly restores full HP and returns them to duty.",
    recipe: { herb: 3, food: 1 },
    minLabLevel: 1,
  },
  {
    id: "insight",
    name: "Insight Pill",
    description:
      "A flash of clarity — grants a flat chunk of XP to every attribute. Huge early on; fades as cultivation deepens.",
    recipe: { herb: 6, food: 2 },
    minLabLevel: 2,
  },
  {
    id: "tribulationAid",
    name: "Tribulation Aid",
    description:
      "Settles the spirit before a trial — halves the fail chance of the next breakthrough. Consumed on the attempt, win or lose.",
    recipe: { herb: 8, food: 1, gold: 5 },
    minLabLevel: 3,
  },
];

export const PILL_BY_ID: Record<PillId, PillDef> = Object.fromEntries(
  PILLS.map((p) => [p.id, p]),
) as Record<PillId, PillDef>;
