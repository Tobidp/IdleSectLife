// Cross-run legacy storage. Lives outside the per-run save (its own localStorage key)
// so abandon/start-over doesn't wipe prestige history. Holds:
//   - active: the legacy currently being applied to whatever run is in progress
//   - history: every legacy the player has earned across all runs (for E4 record)

import type { LegacyId } from "../../data/legacies/legacyDefs";

const STORAGE_KEY = "idle-sect-life:legacies:v1";

export interface LegacyStorage {
  active: LegacyId | null;
  history: LegacyId[];
}

export function loadLegacyStorage(): LegacyStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { active: null, history: [] };
    const parsed = JSON.parse(raw) as Partial<LegacyStorage>;
    return {
      active: parsed.active ?? null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return { active: null, history: [] };
  }
}

export function saveLegacyStorage(s: LegacyStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** Set the active legacy (used during the next-game startup) AND append to history. */
export function recordLegacy(legacyId: LegacyId): void {
  const s = loadLegacyStorage();
  s.active = legacyId;
  s.history.push(legacyId);
  saveLegacyStorage(s);
}

/** Read just the active legacy that should apply to a new game's startup. */
export function getActiveLegacy(): LegacyId | null {
  return loadLegacyStorage().active;
}

/** Clear the active flag after applying to a new game (legacy is one-shot per run). */
export function clearActiveLegacy(): void {
  const s = loadLegacyStorage();
  s.active = null;
  saveLegacyStorage(s);
}
