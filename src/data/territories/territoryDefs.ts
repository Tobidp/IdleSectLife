// Regions where the sect and its rivals push for influence. Each def carries a textual
// flavor + a monthly yield the controlling side receives. The runtime in
// domain/territories/territories.ts ticks influence and pays out yields once per month.

import type { ResourceType } from "../../domain/resources/resourceTypes";

export type TerritoryId = "plum_valley" | "cold_ridge" | "lower_markets";

export interface TerritoryDef {
  id: TerritoryId;
  name: string;
  description: string;
  /** Resource the controlling side gains each month. */
  yield: Partial<Record<ResourceType, number>>;
  /** Bonus fame for the controlling side. */
  fameYield: number;
  /** Starting player + rival influence on a fresh run. */
  initialPlayerInfluence: number;
  initialRivalInfluence: number;
}

export const TERRITORIES: Record<TerritoryId, TerritoryDef> = {
  plum_valley: {
    id: "plum_valley",
    name: "Plum Valley",
    description:
      "Fertile lowlands. The villages here feed the region — and provide the bulk of new disciple candidates.",
    yield: { food: 25, wood: 15 },
    fameYield: 2,
    initialPlayerInfluence: 30,
    initialRivalInfluence: 25,
  },
  cold_ridge: {
    id: "cold_ridge",
    name: "Cold Ridge",
    description:
      "High passes that hide relics, herbs, and the bones of forgotten cultivators. Dangerous, rich.",
    yield: { herb: 12, ore: 8 },
    fameYield: 1,
    initialPlayerInfluence: 15,
    initialRivalInfluence: 30,
  },
  lower_markets: {
    id: "lower_markets",
    name: "Lower Markets",
    description:
      "Where the trade roads converge. Whoever the merchants pay tribute to pockets the difference.",
    yield: { gold: 30 },
    fameYield: 1,
    initialPlayerInfluence: 20,
    initialRivalInfluence: 40,
  },
};

export const ALL_TERRITORY_IDS: TerritoryId[] = Object.keys(TERRITORIES) as TerritoryId[];
