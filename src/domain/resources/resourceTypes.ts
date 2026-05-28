// Resource identities and helper groupings.

export type ResourceType = "stone" | "wood" | "food" | "gold" | "cloth" | "herb";

/** Resources held in the Warehouse and capped by its level. Gold is uncapped in v1 (Vault is v2). */
export const STORABLE_RESOURCES: readonly ResourceType[] = ["stone", "wood", "food", "cloth", "herb"];

/** Resources a disciple can gather via a "collect" action. */
export const COLLECTABLE_RESOURCES = ["stone", "wood", "food"] as const;
export type CollectableResource = (typeof COLLECTABLE_RESOURCES)[number];

export function isCollectable(r: ResourceType): r is CollectableResource {
  return (COLLECTABLE_RESOURCES as readonly string[]).includes(r);
}

export const RESOURCE_LABEL: Record<ResourceType, string> = {
  stone: "Stone",
  wood: "Wood",
  food: "Food",
  gold: "Gold",
  cloth: "Cloth",
  herb: "Herb",
};

export const RESOURCE_ICON: Record<ResourceType, string> = {
  stone: "🪨",
  wood: "🪵",
  food: "🌾",
  gold: "🪙",
  cloth: "🧵",
  herb: "🌿",
};
