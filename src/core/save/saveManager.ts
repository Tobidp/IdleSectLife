// localStorage persistence. The whole GameState is serialized as JSON; imported payloads
// are validated against SaveSchema before any migrate / state-replacement happens so a
// hostile or corrupted blob can't crash the app or smuggle bad data into the simulation.

import { SAVE_VERSION, type GameState } from "../../state/gameState";
import { createInitialNarrativeState } from "../../state/narrative";
import { emptyEquipment } from "../../data/equipment";
import { reconcileWorldClocks } from "../../domain/world/clocks";
import { createInitialMissionOffers } from "../../domain/missions/missions";
import { reconcileRivals } from "../../domain/rivals/rivals";
import { reconcileBehavior } from "../../domain/secrets/secrets";
import { reconcileTerritories } from "../../domain/territories/territories";
import { reconcileFactionRelations } from "../../domain/factions/factions";
import { rollAmbition, rollFear, rollOrigin } from "../../data/disciples/narratives";
import { Rng } from "../rng/rng";
import { validateSave } from "./schema";

const SAVE_KEY = "idle-sect-life:save:v1";

/** Hard cap on the size of an imported base64 save code. ~512KB raw is far more than any
 *  legitimate save needs and keeps a billion-byte paste from blocking the main thread. */
const MAX_IMPORT_BYTES = 512 * 1024;

/** Backfill fields added after v3 onto a save (idempotent). */
function backfill(save: GameState): void {
  if (!save.narrative) save.narrative = createInitialNarrativeState();
  if (!save.buildings.merchant) save.buildings.merchant = { level: 0 };
  if (!save.buildings.infirmary) save.buildings.infirmary = { level: 0 };
  if (!save.buildings.trainingHall) save.buildings.trainingHall = { level: 0 };
  if (!save.buildings.herbGarden) save.buildings.herbGarden = { level: 0 };
  if (!save.buildings.alchemyLab) save.buildings.alchemyLab = { level: 0 };
  if (!save.buildings.forge) save.buildings.forge = { level: 0 };
  // Pre-B3 saves didn't have the herb resource.
  if (typeof save.resources.herb !== "number") save.resources.herb = 0;
  // Pre-B5a saves didn't have the ore resource.
  if (typeof save.resources.ore !== "number") save.resources.ore = 0;
  if (!save.pills) save.pills = {};
  if (!Array.isArray(save.blueprints)) save.blueprints = [];
  if (!Array.isArray(save.itemInventory)) save.itemInventory = [];
  if (!save.autoSellItems) save.autoSellItems = {};
  if (!save.autoSell) save.autoSell = {};
  if (typeof save.goldArrears !== "number") save.goldArrears = 0;
  // Default to "now" so an old save isn't treated as having been away forever.
  if (typeof save.lastPlayed !== "number") save.lastPlayed = Date.now();
  if (!Array.isArray(save.achievements)) save.achievements = [];
  // Pre-progressive-disclosure saves had no `unlocked`. We intentionally backfill EMPTY
  // (not "all unlocked") so existing players also see the unfold; conditions that are
  // already met re-unlock within the next tick, so the "reset moment" is brief.
  if (!Array.isArray(save.unlocked)) save.unlocked = [];
  // Pre-WorldClock saves: seed all known clocks at progress 0. Existing clocks (after a
  // future codebase adds new ones) are kept and the missing ids appended.
  save.worldClocks = reconcileWorldClocks(save.worldClocks);
  // Pre-B3 saves have no pending personal-event queue.
  if (!Array.isArray(save.pendingPersonalEvents)) save.pendingPersonalEvents = [];
  // Pre-B4 saves have no mission state — seed the offer board so existing players see
  // the new system on first load.
  if (!Array.isArray(save.missionOffers)) save.missionOffers = createInitialMissionOffers();
  if (!Array.isArray(save.activeMissions)) save.activeMissions = [];
  // Pre-B5: event chain state defaults to empty (chains will trigger via daily rolls).
  if (!Array.isArray(save.activeEventChains)) save.activeEventChains = [];
  if (!Array.isArray(save.completedEventChains)) save.completedEventChains = [];
  // Pre-C1: no doctrine committed yet.
  if (save.doctrine === undefined) save.doctrine = null;
  // Pre-C3: seed rivals (or reconcile against any new defs the codebase added).
  save.rivals = reconcileRivals(save.rivals);
  // Pre-C5: behavior counters + unlocked secrets default to neutral.
  save.behavior = reconcileBehavior(save.behavior);
  if (!Array.isArray(save.unlockedSecrets)) save.unlockedSecrets = [];
  // Pre-D1: territories seeded from defs (or reconciled against new regions).
  save.territories = reconcileTerritories(save.territories);
  // Pre-D2: no scheduled crises.
  if (!Array.isArray(save.scheduledCrises)) save.scheduledCrises = [];
  // Pre-D3: tournament state defaults.
  if (save.activeTournament === undefined) save.activeTournament = null;
  if (save.lastTournamentDay === undefined) save.lastTournamentDay = null;
  // Pre-D4: faction relations default to 0.
  save.factionRelations = reconcileFactionRelations(save.factionRelations);
  // Pre-A2 disciples + applicants had no talent; default to "common".
  // Pre-Phase-3-closeout disciples lacked trait / path / age.
  // Pre-B2 disciples lacked the narrative layers (origin / ambition / fear / trauma /
  // destiny) — roll them from the save's own rngSeed so the assignment is reproducible
  // for any given save and the backfill itself doesn't drift the live RNG.
  const backfillRng = new Rng(typeof save.rngSeed === "number" ? save.rngSeed : 1);
  for (const list of [save.disciples, save.applicants]) {
    for (const d of list ?? []) {
      if (!d.talent) d.talent = "common";
      if (!d.trait) d.trait = "balanced";
      if (d.path === undefined) d.path = null;
      if (typeof d.age !== "number") d.age = 360 * 18; // assume a generic young adult
      if (!Array.isArray(d.bonds)) d.bonds = [];
      if (typeof d.tribulationBuff !== "boolean") d.tribulationBuff = false;
      if (!d.equipment) d.equipment = emptyEquipment();
      if (!d.origin) d.origin = rollOrigin(backfillRng);
      if (!d.ambition) d.ambition = rollAmbition(backfillRng);
      if (!d.fear) d.fear = rollFear(backfillRng);
      if (d.trauma === undefined) d.trauma = null;
      if (d.destiny === undefined) d.destiny = null;
      // Pre-C2 disciples had no techniques learned.
      if (!Array.isArray(d.techniques)) d.techniques = [];
    }
  }
  // Existing applicants get their timer reset to "just arrived" on load — fair grace for
  // pre-feature saves rather than silently expiring everyone who was waiting at save time.
  for (const a of save.applicants ?? []) {
    if (typeof a.arrivedOnDay !== "number") a.arrivedOnDay = save.time.totalDays;
  }
}

/**
 * Forward-migrate an older save in place so a version bump doesn't wipe progress.
 * Returns null only when the save is too old (or newer) to safely upgrade. Assumes
 * the input has already been schema-validated.
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

/** Parse the raw JSON text in a try/catch and return null on any failure. */
function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Run the full validate -> migrate pipeline. Returns null if anything along the way fails. */
function loadValidated(raw: string, source: "localStorage" | "import"): GameState | null {
  const parsed = safeJsonParse(raw);
  if (parsed === null) {
    if (source === "import") console.warn("Sect: Ascendant: import failed — not valid JSON");
    return null;
  }
  const validated = validateSave(parsed);
  if (!validated.ok) {
    console.warn(`Sect: Ascendant: ${source} rejected by schema (${validated.reason})`);
    return null;
  }
  // SaveSchema is intentionally loose about fields the migrate pass will backfill, so we
  // upcast here — migrate then trusts the shape and only fills holes.
  return migrate(validated.data as unknown as GameState);
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
    return loadValidated(raw, "localStorage");
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
  const trimmed = code.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_IMPORT_BYTES) {
    console.warn("Sect: Ascendant: import rejected (empty or exceeds size cap)");
    return null;
  }
  let json: string;
  try {
    json = fromBase64(trimmed);
  } catch {
    console.warn("Sect: Ascendant: import rejected (not valid base64 / UTF-8)");
    return null;
  }
  return loadValidated(json, "import");
}
