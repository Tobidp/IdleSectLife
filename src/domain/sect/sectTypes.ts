// Sect identities and the attribute each one specializes in.

export type SectType = "sword" | "spear" | "bow" | "fist";
export type Attribute = "health" | "strength" | "dexterity" | "vitality";

export const SECT_TYPES: readonly SectType[] = ["sword", "spear", "bow", "fist"];
export const ATTRIBUTES: readonly Attribute[] = ["health", "strength", "dexterity", "vitality"];

/** Each sect trains one core attribute harder (the "+3 sect" training bonus targets this). */
export const SECT_ATTRIBUTE: Record<SectType, Attribute> = {
  sword: "strength",
  spear: "health",
  bow: "dexterity",
  fist: "vitality",
};

export const SECT_LABEL: Record<SectType, string> = {
  sword: "Sword Sect",
  spear: "Spear Sect",
  bow: "Bow Sect",
  fist: "Fist Sect",
};

export const SECT_DESCRIPTION: Record<SectType, string> = {
  sword: "Raises Strength — direct attack power and resource yield.",
  spear: "Raises Health — defense, reach and survivability.",
  bow: "Raises Dexterity — accuracy, evasion and lower injury risk.",
  fist: "Raises Vitality — endurance, faster healing and recovery.",
};

export const SECT_ICON: Record<SectType, string> = {
  sword: "🗡️",
  spear: "🔱",
  bow: "🏹",
  fist: "👊",
};

export const ATTRIBUTE_LABEL: Record<Attribute, string> = {
  health: "Health",
  strength: "Strength",
  dexterity: "Dexterity",
  vitality: "Vitality",
};
