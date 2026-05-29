// Regional factions — clans / guilds tied to a specific territory. The player's
// relation with each faction (-100..100) modifies the territory's monthly yield when
// the sect controls it (positive relation = bonus, negative = penalty).
//
// Engine action `currySectFavor(factionId)` raises relation at the cost of resources.

import type { TerritoryId } from "../territories/territoryDefs";
import type { ResourceType } from "../../domain/resources/resourceTypes";

export type FactionId = "plum_valley_farmers" | "cold_ridge_hermits" | "lower_markets_cartel";

export interface FactionDef {
  id: FactionId;
  name: string;
  leader: string;
  description: string;
  /** The region this faction operates in — yields tie back to this. */
  territoryId: TerritoryId;
  /** Cost to curry favor once (small relation bump). */
  favorCost: Partial<Record<ResourceType, number>>;
}

export const FACTIONS: Record<FactionId, FactionDef> = {
  plum_valley_farmers: {
    id: "plum_valley_farmers",
    name: "Plum Valley Farmers' Guild",
    leader: "Elder Bao",
    description: "The villages that feed the region. Slow to anger, slower to forgive.",
    territoryId: "plum_valley",
    favorCost: { food: 12, gold: 6 },
  },
  cold_ridge_hermits: {
    id: "cold_ridge_hermits",
    name: "Cold Ridge Hermits",
    leader: "Bone-Sleeve Yan",
    description: "Solitary cultivators who keep the high passes. Tribute is herbs, not coin.",
    territoryId: "cold_ridge",
    favorCost: { herb: 8, gold: 4 },
  },
  lower_markets_cartel: {
    id: "lower_markets_cartel",
    name: "Lower Markets Merchants' Cartel",
    leader: "Headman Liu",
    description: "Coin opens every door here. Trade favors, settle debts, and the markets remember.",
    territoryId: "lower_markets",
    favorCost: { gold: 18 },
  },
};

export const ALL_FACTION_IDS: FactionId[] = Object.keys(FACTIONS) as FactionId[];

/** Relation bump from a single curryFavor call. */
export const FAVOR_RELATION_BUMP = 8;
