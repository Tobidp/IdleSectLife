// Equipment blueprints (catalog). The set is intentionally small in v1 — the system is in
// place so we can pile more in later. Drops in B5d pull from this catalog at random; the
// player starts with `STARTING_BLUEPRINTS` so the Forge isn't empty on day one.

import type { Cost } from "./costs";
import type { Blueprint } from "./equipment";

export const BLUEPRINTS: readonly Blueprint[] = [
  {
    id: "initiate_robe",
    name: "Initiate's Robe",
    slot: "body",
    baseAttrXpBonus: { health: 0.05 },
    craftCost: { ore: 20, wood: 20 } as Cost,
    minForgeLevel: 1,
  },
  {
    id: "iron_sword",
    name: "Iron Sword",
    slot: "weapon",
    baseAttrXpBonus: { strength: 0.08 },
    craftCost: { ore: 40, wood: 10 } as Cost,
    minForgeLevel: 1,
  },
  {
    id: "cloth_cap",
    name: "Cloth Cap",
    slot: "head",
    baseAttrXpBonus: { vitality: 0.04 },
    craftCost: { ore: 10, wood: 10 } as Cost,
    minForgeLevel: 1,
  },
  {
    id: "padded_gloves",
    name: "Padded Gloves",
    slot: "gloves",
    baseAttrXpBonus: { dexterity: 0.06 },
    craftCost: { ore: 15, wood: 10 } as Cost,
    minForgeLevel: 1,
  },
  {
    id: "travel_pants",
    name: "Travel Pants",
    slot: "pants",
    baseAttrXpBonus: { vitality: 0.05 },
    craftCost: { ore: 20, wood: 15 } as Cost,
    minForgeLevel: 1,
  },
  {
    id: "worn_boots",
    name: "Worn Boots",
    slot: "feet",
    baseAttrXpBonus: { dexterity: 0.05 },
    craftCost: { ore: 15, wood: 15 } as Cost,
    minForgeLevel: 1,
  },
];

export const BLUEPRINT_BY_ID: Record<string, Blueprint> = Object.fromEntries(
  BLUEPRINTS.map((b) => [b.id, b]),
);

/** Blueprints the player owns from day one so the Forge UI isn't empty before any drops. */
export const STARTING_BLUEPRINTS: readonly string[] = ["initiate_robe"];
