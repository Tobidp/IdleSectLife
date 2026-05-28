// Alchemy pill definitions: recipes (resources consumed) and metadata. Effects live in the
// domain layer (src/domain/alchemy) so this file stays pure data.

import type { Cost } from "./costs";

export type PillId = "healing";

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
];

export const PILL_BY_ID: Record<PillId, PillDef> = Object.fromEntries(
  PILLS.map((p) => [p.id, p]),
) as Record<PillId, PillDef>;
