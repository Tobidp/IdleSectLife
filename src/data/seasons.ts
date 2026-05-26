// Seasons and their light collection modifiers.

import type { CollectableResource } from "../domain/resources/resourceTypes";

export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASONS: readonly Season[] = ["spring", "summer", "autumn", "winter"];

export const SEASON_LABEL: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

export const SEASON_ICON: Record<Season, string> = {
  spring: "🌱",
  summer: "☀️",
  autumn: "🍂",
  winter: "❄️",
};

/** month (1..12) -> season; 3 months each. */
export function seasonForMonth(month: number): Season {
  const idx = Math.floor(((month - 1) % 12) / 3); // 0..3
  return SEASONS[idx];
}

/** Per-season collection multipliers (default 1.0 when unspecified). */
export const SEASON_COLLECT_MULTIPLIER: Record<
  Season,
  Partial<Record<CollectableResource, number>>
> = {
  spring: { wood: 1.1, food: 1.1 },
  summer: { food: 1.2 },
  autumn: { stone: 1.1 },
  winter: { food: 0.8 },
};

export function seasonMultiplier(season: Season, resource: CollectableResource): number {
  return SEASON_COLLECT_MULTIPLIER[season][resource] ?? 1;
}

/** Short human-readable note about a season's notable modifiers, for the UI. */
export const SEASON_NOTE: Record<Season, string> = {
  spring: "Wood & Food +10%",
  summer: "Food +20%",
  autumn: "Stone +10%",
  winter: "Food −20%",
};
