// React Grid Layout config for the Craft tab — separate storage from the Sect dashboard so
// the two layouts evolve independently. Three panels: Alchemy (top-left), Forge (top-right),
// Bag (bottom, full-width).

import type { Layout } from "react-grid-layout";

export const CRAFT_GRID_COLS = 12;
export const CRAFT_GRID_ROW_HEIGHT = 30;
export const CRAFT_GRID_MARGIN: [number, number] = [12, 12];

export type CraftPanelId = "alchemy" | "forge" | "bag";
export const CRAFT_PANEL_IDS: CraftPanelId[] = ["alchemy", "forge", "bag"];

const DEFAULT_LAYOUT: Layout[] = [
  { i: "alchemy", x: 0, y: 0, w: 6, h: 9 },
  { i: "forge", x: 6, y: 0, w: 6, h: 9 },
  { i: "bag", x: 0, y: 9, w: 12, h: 9 },
];

const STORAGE_KEY = "idle-sect-life:craft-grid:v1";

export function defaultCraftLayout(): Layout[] {
  return DEFAULT_LAYOUT.map((item) => ({ ...item }));
}

/** Pure: keep only known panels and guarantee every panel has an item (missing -> default). */
export function sanitizeCraftLayout(saved: Layout[]): Layout[] {
  const byId = new Map(
    saved.filter((it) => CRAFT_PANEL_IDS.includes(it.i as CraftPanelId)).map((it) => [it.i, it]),
  );
  return CRAFT_PANEL_IDS.map((id) => {
    const s = byId.get(id);
    if (s && [s.x, s.y, s.w, s.h].every((n) => Number.isFinite(n))) {
      return { i: id, x: s.x, y: s.y, w: s.w, h: s.h };
    }
    return { ...DEFAULT_LAYOUT.find((o) => o.i === id)! };
  });
}

export function loadCraftLayout(): Layout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCraftLayout();
    return sanitizeCraftLayout(JSON.parse(raw) as Layout[]);
  } catch {
    return defaultCraftLayout();
  }
}

export function saveCraftLayout(layout: Layout[]): void {
  try {
    const slim = layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch {
    /* ignore */
  }
}

export function resetCraftLayout(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
