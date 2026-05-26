// localStorage persistence. The whole GameState is serialized as JSON.

import { SAVE_VERSION, type GameState } from "../../state/gameState";
import { createInitialNarrativeState } from "../../state/narrative";

const SAVE_KEY = "idle-sect-life:save:v1";

/**
 * Forward-migrate an older save in place so a version bump doesn't wipe progress.
 * Returns null only when the save is too old (or newer) to safely upgrade.
 */
function migrate(save: GameState): GameState | null {
  if (save.version === SAVE_VERSION) {
    // Defensive backfill in case a current-version save predates a sub-field.
    if (!save.narrative) save.narrative = createInitialNarrativeState();
    return save;
  }
  // v3 → v4: the narrative slice was added; everything else is unchanged.
  if (save.version === 3) {
    save.narrative = createInitialNarrativeState();
    save.version = SAVE_VERSION;
    return save;
  }
  return null; // older/unknown shape — start fresh rather than risk corruption
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("IdleSectLife: failed to save game", err);
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    return migrate(parsed);
  } catch (err) {
    console.warn("IdleSectLife: failed to load save", err);
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.warn("IdleSectLife: failed to clear save", err);
  }
}

export function hasSave(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}
