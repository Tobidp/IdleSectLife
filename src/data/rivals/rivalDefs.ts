// Rival sect definitions. Each rival has an archetype that drives its monthly action
// (challenge a duel, hoard relics, recruit a talent, etc.) and a base influence growth
// rate. The runtime (domain/rivals/rivals.ts) ticks state alongside the player's sect.

export type RivalArchetypeId = "military" | "merchant" | "spiritual" | "shadow" | "diplomatic";

export type RivalId =
  | "crimson_spear"
  | "black_crane"
  | "still_lotus"
  | "iron_compass";

export interface RivalDef {
  id: RivalId;
  name: string;
  leader: string;
  archetype: RivalArchetypeId;
  description: string;
  /** Influence growth per day (small — months matter, not days). */
  influencePerDay: number;
  /** Starting influence on a fresh run. */
  initialInfluence: number;
}

export const RIVALS: Record<RivalId, RivalDef> = {
  crimson_spear: {
    id: "crimson_spear",
    name: "Crimson Spear Sect",
    leader: "Han Yiqing",
    archetype: "military",
    description: "Forge-hardened cultivators who settle disputes with steel and dare anyone to refuse a duel.",
    influencePerDay: 0.18,
    initialInfluence: 22,
  },
  black_crane: {
    id: "black_crane",
    name: "Black Crane Pavilion",
    leader: "Mei Zhaolan",
    archetype: "shadow",
    description: "Rumour, poison and quiet contracts. They prefer the seams between things.",
    influencePerDay: 0.14,
    initialInfluence: 18,
  },
  still_lotus: {
    id: "still_lotus",
    name: "Still Lotus Monastery",
    leader: "Brother Wuxiang",
    archetype: "spiritual",
    description: "Slow, deep cultivators. They speak rarely, but their breakthroughs ripple across the region.",
    influencePerDay: 0.12,
    initialInfluence: 14,
  },
  iron_compass: {
    id: "iron_compass",
    name: "Iron Compass Guild",
    leader: "Lao Hai",
    archetype: "merchant",
    description: "Less sect, more trade house. Wherever the gold flows, the Compass charts a route.",
    influencePerDay: 0.20,
    initialInfluence: 26,
  },
};

export const ALL_RIVAL_IDS: RivalId[] = Object.keys(RIVALS) as RivalId[];

export const RIVAL_ARCHETYPE_LABEL: Record<RivalArchetypeId, string> = {
  military: "Militarist",
  merchant: "Mercantile",
  spiritual: "Spiritual",
  shadow: "Shadow",
  diplomatic: "Diplomatic",
};
