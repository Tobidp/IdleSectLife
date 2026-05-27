// localStorage persistence. The whole GameState is serialized as JSON.

import { SAVE_VERSION, type GameState } from "../../state/gameState";
import { createInitialNarrativeState } from "../../state/narrative";

const SAVE_KEY = "idle-sect-life:save:v1";

/** Backfill fields added after v3 onto a save (idempotent). */
function backfill(save: GameState): void {
  if (!save.narrative) save.narrative = createInitialNarrativeState();
  if (!save.buildings.merchant) save.buildings.merchant = { level: 0 };
  if (!save.autoSell) save.autoSell = {};
  if (typeof save.goldArrears !== "number") save.goldArrears = 0;
}

/**
 * Forward-migrate an older save in place so a version bump doesn't wipe progress.
 * Returns null only when the save is too old (or newer) to safely upgrade.
 */
function migrate(save: GameState): GameState | null {
  // v3 added the narrative slice; v5 added merchant/autoSell/goldArrears. The deltas are all
  // additive, so any save from v3 onward can be brought up to date by backfilling.
  if (save.version >= 3 && save.version <= SAVE_VERSION) {
    backfill(save);
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
