// Equipment system data: slots, item tiers, and the shapes for blueprints + crafted items.
// Effects (XP multipliers per attribute) are pre-computed at craft time so the simulation
// loop just reads `EquippedItem.xpBonuses` instead of re-deriving from the blueprint each tick.

import type { Cost } from "./costs";
import type { Attribute } from "../domain/sect/sectTypes";

/** Body-coverage slots a disciple can fill. Weapon is separate from armor. */
export type EquipmentSlot = "head" | "body" | "gloves" | "pants" | "feet" | "weapon";

export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = [
  "head",
  "body",
  "gloves",
  "pants",
  "feet",
  "weapon",
];

export const EQUIPMENT_SLOT_LABEL: Record<EquipmentSlot, string> = {
  head: "Head",
  body: "Body",
  gloves: "Gloves",
  pants: "Pants",
  feet: "Feet",
  weapon: "Weapon",
};

export const EQUIPMENT_SLOT_ICON: Record<EquipmentSlot, string> = {
  head: "🪖",
  body: "🥋",
  gloves: "🧤",
  pants: "👖",
  feet: "👢",
  weapon: "⚔️",
};

/** Quality tier rolled at craft time. Higher tiers multiply the blueprint's base bonuses. */
export type ItemTier = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const ITEM_TIERS: readonly ItemTier[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

export const ITEM_TIER_LABEL: Record<ItemTier, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

/** CSS class echoing the rank-tier palette so equipment colour-codes the same way. */
export const ITEM_TIER_CLASS: Record<ItemTier, string> = {
  common: "tier-common",
  uncommon: "tier-uncommon",
  rare: "tier-rare",
  epic: "tier-epic",
  legendary: "tier-legendary",
};

/** Multiplier applied to the blueprint's base XP bonuses when rolling this tier. */
export const ITEM_TIER_XP_MULT: Record<ItemTier, number> = {
  common: 1,
  uncommon: 1.5,
  rare: 2,
  epic: 3,
  legendary: 5,
};

/**
 * A blueprint the player has discovered. Crafting consumes `craftCost`, requires the Forge
 * to be at `minForgeLevel`, and rolls an item with bonuses = baseAttrXpBonus * tier multiplier.
 */
export interface Blueprint {
  id: string;
  name: string;
  slot: EquipmentSlot;
  /** Per-attribute fractional XP bonus at common tier (e.g. 0.1 = +10%). */
  baseAttrXpBonus: Partial<Record<Attribute, number>>;
  craftCost: Cost;
  minForgeLevel: number;
}

/** A crafted item in a disciple's equipment slot. */
export interface EquippedItem {
  blueprintId: string;
  tier: ItemTier;
  /** Pre-computed fractional XP bonuses (baseAttrXpBonus * ITEM_TIER_XP_MULT[tier]). */
  xpBonuses: Partial<Record<Attribute, number>>;
}

/** A fresh, all-empty equipment record for a new disciple. */
export function emptyEquipment(): Record<EquipmentSlot, EquippedItem | null> {
  return {
    head: null,
    body: null,
    gloves: null,
    pants: null,
    feet: null,
    weapon: null,
  };
}
