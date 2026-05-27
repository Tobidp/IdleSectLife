// Persisted positions for the draggable Sect-dashboard windows. This is the source of
// truth for where each window sits and is re-applied on every render (the UI is rebuilt
// each tick, so positions can't live in the DOM alone). Stored in its own localStorage key
// — separate from the game save — so it never touches save versioning.

export type WindowId = "overview" | "resources" | "buildings" | "market" | "log";

export const WINDOW_IDS: WindowId[] = ["overview", "resources", "buildings", "market", "log"];

/** Windows share a fixed width so edges line up cleanly when snapped. */
export const WINDOW_WIDTH = 320;

export interface WindowPos {
  x: number;
  y: number;
}

const STORAGE_KEY = "idle-sect-life:windows:v1";

// Default two-column arrangement mirroring the original static dashboard layout.
const DEFAULT_LAYOUT: Record<WindowId, WindowPos> = {
  overview: { x: 0, y: 0 },
  resources: { x: 0, y: 168 },
  buildings: { x: 0, y: 360 },
  market: { x: 0, y: 560 },
  log: { x: 340, y: 0 },
};

let layout: Record<WindowId, WindowPos> = structuredClone(DEFAULT_LAYOUT);

export function loadWindowLayout(): void {
  layout = structuredClone(DEFAULT_LAYOUT);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<Record<WindowId, WindowPos>>;
    for (const id of WINDOW_IDS) {
      const p = saved[id];
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) layout[id] = { x: p.x, y: p.y };
    }
  } catch (err) {
    console.warn("IdleSectLife: failed to load window layout", err);
  }
}

export function getWindowPos(id: WindowId): WindowPos {
  return layout[id] ?? { x: 0, y: 0 };
}

export function setWindowPos(id: WindowId, pos: WindowPos): void {
  layout[id] = pos;
}

export function saveWindowLayout(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch (err) {
    console.warn("IdleSectLife: failed to save window layout", err);
  }
}

export function resetWindowLayout(): void {
  layout = structuredClone(DEFAULT_LAYOUT);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
