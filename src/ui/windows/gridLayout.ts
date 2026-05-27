// Persistence + defaults for the React Grid Layout used by the Sect dashboard. The layout
// (per-panel x/y/w/h on a 12-column grid) lives in its own localStorage key, separate from
// the game save, so it never affects save versioning.

import type { Layout } from "react-grid-layout";

export const GRID_COLS = 12;
export const GRID_ROW_HEIGHT = 30;
export const GRID_MARGIN: [number, number] = [12, 12];

export type PanelId = "overview" | "resources" | "buildings" | "market" | "log";
export const PANEL_IDS: PanelId[] = ["overview", "resources", "buildings", "market", "log"];

// Default three-column arrangement (w=4 each): left x=0, center x=4, right x=8.
const DEFAULT_LAYOUT: Layout[] = [
  { i: "overview", x: 0, y: 0, w: 4, h: 6 },
  { i: "resources", x: 0, y: 6, w: 4, h: 9 },
  { i: "buildings", x: 4, y: 0, w: 4, h: 7 },
  { i: "market", x: 4, y: 7, w: 4, h: 8 },
  { i: "log", x: 8, y: 0, w: 4, h: 15 },
];

const STORAGE_KEY = "idle-sect-life:grid:v3";

export function defaultLayout(): Layout[] {
  return DEFAULT_LAYOUT.map((item) => ({ ...item }));
}

/** Pure: keep only known panels and guarantee every panel has an item (missing -> default). */
export function sanitizeLayout(saved: Layout[]): Layout[] {
  const byId = new Map(saved.filter((it) => PANEL_IDS.includes(it.i as PanelId)).map((it) => [it.i, it]));
  return PANEL_IDS.map((id) => {
    const s = byId.get(id);
    if (s && [s.x, s.y, s.w, s.h].every((n) => Number.isFinite(n))) {
      return { i: id, x: s.x, y: s.y, w: s.w, h: s.h };
    }
    return { ...DEFAULT_LAYOUT.find((o) => o.i === id)! };
  });
}

export function loadGridLayout(): Layout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLayout();
    return sanitizeLayout(JSON.parse(raw) as Layout[]);
  } catch {
    return defaultLayout();
  }
}

export function saveGridLayout(layout: Layout[]): void {
  try {
    const slim = layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch {
    /* ignore */
  }
}

export function resetGridLayout(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
