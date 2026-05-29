// Legacies: the prestige bonus from one run carries into the next. Each legacy is named
// after a founder archetype, applies a set of starting modifiers to the new game, and
// (loosely) also flavors how that run will play (e.g. Tyrant grants discipline but rivals
// see the sect as a threat).
//
// Legacy state is stored OUTSIDE the per-run save (its own localStorage key) so a hard
// reset doesn't wipe the prestige history.

import type { ResourceType } from "../../domain/resources/resourceTypes";

export type LegacyId =
  | "founder_warrior"
  | "founder_healer"
  | "founder_merchant"
  | "founder_sage"
  | "founder_tyrant";

export interface LegacyDef {
  id: LegacyId;
  label: string;
  description: string;
  /** Plain-English summary of what carries over. */
  bonus: string;
  /** Plain-English flavor cost (mostly atmospheric — no enforced mechanic yet). */
  flavor: string;
  /** Modifiers applied to a brand-new game's starting state. */
  startingResources: Partial<Record<ResourceType, number>>;
  startingFame: number;
  /** Whether the new run begins with extra disciple capacity (warehouse / quarters). */
  bonusQuartersLevel: number;
  bonusWarehouseLevel: number;
}

export const LEGACIES: Record<LegacyId, LegacyDef> = {
  founder_warrior: {
    id: "founder_warrior",
    label: "Founder: the Warrior",
    description: "Your first sect was remembered for its iron discipline and the blade-edge of its disciples.",
    bonus: "+20 fame, +30 ore, +30 stone",
    flavor: "Rivals know the lineage — they will test the next generation harder.",
    startingResources: { stone: 30, ore: 30 },
    startingFame: 20,
    bonusQuartersLevel: 0,
    bonusWarehouseLevel: 0,
  },
  founder_healer: {
    id: "founder_healer",
    label: "Founder: the Healer",
    description: "The first sect saved villages. Its name still summons grateful peasants from across the valley.",
    bonus: "+20 herb, +20 food, +1 Warehouse level",
    flavor: "Rivals see the next generation as too soft to threaten — they'll be the more shocked.",
    startingResources: { herb: 20, food: 20 },
    startingFame: 10,
    bonusQuartersLevel: 0,
    bonusWarehouseLevel: 1,
  },
  founder_merchant: {
    id: "founder_merchant",
    label: "Founder: the Merchant",
    description: "Your first sect built its halls with coin and influence, not steel.",
    bonus: "+80 gold, +20 wood",
    flavor: "Coffers open more doors than blades — but the next generation has less reputation for combat.",
    startingResources: { gold: 80, wood: 20 },
    startingFame: 5,
    bonusQuartersLevel: 0,
    bonusWarehouseLevel: 0,
  },
  founder_sage: {
    id: "founder_sage",
    label: "Founder: the Sage",
    description: "The first sect was an academy first. Manuals piled on shelves; disciples spent their youth reading.",
    bonus: "+15 fame, +1 Quarters level (capacity)",
    flavor: "Recruits drift in expecting knowledge. They take longer to grow into warriors.",
    startingResources: {},
    startingFame: 15,
    bonusQuartersLevel: 1,
    bonusWarehouseLevel: 0,
  },
  founder_tyrant: {
    id: "founder_tyrant",
    label: "Founder: the Tyrant",
    description: "The first sect ruled by fear. Its founder broke rivals who refused to bend.",
    bonus: "+30 fame, +50 gold",
    flavor: "Disciples of the next generation arrive expecting harshness. Happiness baselines run lower.",
    startingResources: { gold: 50 },
    startingFame: 30,
    bonusQuartersLevel: 0,
    bonusWarehouseLevel: 0,
  },
};

export const ALL_LEGACY_IDS: LegacyId[] = Object.keys(LEGACIES) as LegacyId[];
