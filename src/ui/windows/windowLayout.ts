// Slot-based layout for the Sect-dashboard windows. Each window belongs to a COLUMN
// (0 = left, 1 = center, 2 = right) and has an ORDER within that column. Positions are NOT
// stored as free x/y — the columns are laid out with native CSS flow + gaps, so spacing is
// always consistent and windows can never overlap. Persisted in its own localStorage key,
// separate from the game save.

export type WindowId = "overview" | "resources" | "buildings" | "market" | "log";

export const WINDOW_IDS: WindowId[] = ["overview", "resources", "buildings", "market", "log"];

export const COLUMN_COUNT = 3;

export interface WindowSlot {
  col: number; // 0..COLUMN_COUNT-1
  order: number; // position within the column, ascending
}

export type Layout = Record<WindowId, WindowSlot>;

// Bumped to v2: the shape changed from {x,y} to {col,order}; old data is ignored.
const STORAGE_KEY = "idle-sect-life:windows:v2";

// Default three-column arrangement.
const DEFAULT_LAYOUT: Layout = {
  overview: { col: 0, order: 0 },
  resources: { col: 0, order: 1 },
  buildings: { col: 1, order: 0 },
  market: { col: 1, order: 1 },
  log: { col: 2, order: 0 },
};

let layout: Layout = structuredClone(DEFAULT_LAYOUT);

export function getLayout(): Layout {
  return layout;
}

export function setLayout(next: Layout): void {
  layout = next;
}

/** The window ids in a column, in display order. */
export function orderedColumn(src: Layout, col: number): WindowId[] {
  return WINDOW_IDS.filter((id) => src[id].col === col).sort((a, b) => src[a].order - src[b].order);
}

/**
 * Pure: produce a new layout with `id` moved into `targetCol` at `insertIndex`, with both
 * the target and source columns renumbered to stay contiguous. No window ever shares a slot.
 */
export function computeReorder(
  src: Layout,
  id: WindowId,
  targetCol: number,
  insertIndex: number,
): Layout {
  const next = structuredClone(src);

  const target = WINDOW_IDS.filter((w) => w !== id && next[w].col === targetCol).sort(
    (a, b) => next[a].order - next[b].order,
  );
  const idx = Math.max(0, Math.min(insertIndex, target.length));
  target.splice(idx, 0, id);
  target.forEach((w, i) => {
    next[w] = { col: targetCol, order: i };
  });

  // Renumber the other columns so their orders remain contiguous after the move.
  for (let c = 0; c < COLUMN_COUNT; c++) {
    if (c === targetCol) continue;
    WINDOW_IDS.filter((w) => next[w].col === c)
      .sort((a, b) => next[a].order - next[b].order)
      .forEach((w, i) => {
        next[w] = { col: c, order: i };
      });
  }
  return next;
}

export function loadWindowLayout(): void {
  layout = structuredClone(DEFAULT_LAYOUT);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<Record<WindowId, WindowSlot>>;
    for (const id of WINDOW_IDS) {
      const s = saved[id];
      if (
        s &&
        Number.isInteger(s.col) &&
        s.col >= 0 &&
        s.col < COLUMN_COUNT &&
        Number.isFinite(s.order)
      ) {
        layout[id] = { col: s.col, order: s.order };
      }
    }
    // Normalise orders to contiguous integers per column.
    for (let c = 0; c < COLUMN_COUNT; c++) {
      orderedColumn(layout, c).forEach((id, i) => {
        layout[id] = { col: c, order: i };
      });
    }
  } catch (err) {
    console.warn("IdleSectLife: failed to load window layout", err);
  }
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
