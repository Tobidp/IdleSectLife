// localStorage persistence. The whole GameState is serialized as JSON.

import { SAVE_VERSION, type GameState } from "../../state/gameState";
import { createInitialNarrativeState } from "../../state/narrative";

const SAVE_KEY = "idle-sect-life:save:v1";

/** Backfill fields added after v3 onto a save (idempotent). */
function backfill(save: GameState): void {
  if (!save.narrative) save.narrative = createInitialNarrativeState();
  if (!save.buildings.merchant) save.buildings.merchant = { level: 0 };
  if (!save.buildings.infirmary) save.buildings.infirmary = { level: 0 };
  if (!save.buildings.trainingHall) save.buildings.trainingHall = { level: 0 };
  if (!save.buildings.herbGarden) save.buildings.herbGarden = { level: 0 };
  if (!save.buildings.alchemyLab) save.buildings.alchemyLab = { level: 0 };
  // Pre-B3 saves didn't have the herb resource.
  if (typeof save.resources.herb !== "number") save.resources.herb = 0;
  // Pre-B5a saves didn't have the ore resource.
  if (typeof save.resources.ore !== "number") save.resources.ore = 0;
  if (!save.pills) save.pills = {};
  if (!save.autoSell) save.autoSell = {};
  if (typeof save.goldArrears !== "number") save.goldArrears = 0;
  // Default to "now" so an old save isn't treated as having been away forever.
  if (typeof save.lastPlayed !== "number") save.lastPlayed = Date.now();
  if (!Array.isArray(save.achievements)) save.achievements = [];
  // Pre-A2 disciples + applicants had no talent; default to "common".
  // Pre-Phase-3-closeout disciples lacked trait / path / age.
  for (const list of [save.disciples, save.applicants]) {
    for (const d of list ?? []) {
      if (!d.talent) d.talent = "common";
      if (!d.trait) d.trait = "balanced";
      if (d.path === undefined) d.path = null;
      if (typeof d.age !== "number") d.age = 360 * 18; // assume a generic young adult
      if (!Array.isArray(d.bonds)) d.bonds = [];
      if (typeof d.tribulationBuff !== "boolean") d.tribulationBuff = false;
    }
  }
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
    state.lastPlayed = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Sect: Ascendant: failed to save game", err);
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    return migrate(parsed);
  } catch (err) {
    console.warn("Sect: Ascendant: failed to load save", err);
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.warn("Sect: Ascendant: failed to clear save", err);
  }
}

export function hasSave(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

// --- Portable export/import: base64-encoded JSON, for moving a save between devices ---

/** btoa over UTF-8 (handles non-ASCII disciple names etc.). */
function toBase64(s: string): string {
  return btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))));
}
function fromBase64(b64: string): string {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(b64), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
}

/** Serialize a save to a portable base64 code. */
export function encodeSave(state: GameState): string {
  return toBase64(JSON.stringify(state));
}

/** Decode + validate a pasted save code; returns the migrated state or null if unusable. */
export function decodeSave(code: string): GameState | null {
  try {
    const parsed = JSON.parse(fromBase64(code.trim())) as GameState;
    return migrate(parsed);
  } catch {
    return null;
  }
}
