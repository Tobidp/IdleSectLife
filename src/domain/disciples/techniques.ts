// Technique runtime: lookup helpers that fold every learned technique on a disciple into
// a single value the existing systems can multiply against (XP gain, max HP, breakthrough
// fail). All defaults are 1.0 so disciples with no techniques learned behave exactly
// as before.

import type { Disciple } from "./disciple";
import type { Attribute } from "../sect/sectTypes";
import type { GameState } from "../../state/gameState";
import {
  ALL_TECHNIQUE_IDS,
  TECHNIQUES,
  type TechniqueId,
} from "../../data/techniques/techniqueDefs";

function eachTech<T>(d: Disciple, fn: (def: typeof TECHNIQUES[TechniqueId]) => T | undefined): T[] {
  const list: T[] = [];
  for (const id of d.techniques ?? []) {
    const def = TECHNIQUES[id];
    if (!def) continue;
    const v = fn(def);
    if (v !== undefined) list.push(v);
  }
  return list;
}

export function techniqueXpMult(d: Disciple, attr: Attribute): number {
  return eachTech(d, (def) => def.xpMult?.[attr]).reduce((a, b) => a * b, 1);
}

export function techniqueMaxHpMult(d: Disciple): number {
  return eachTech(d, (def) => def.maxHpMult).reduce((a, b) => a * b, 1);
}

export function techniqueBreakthroughFailMult(d: Disciple): number {
  return eachTech(d, (def) => def.breakthroughFailMult).reduce((a, b) => a * b, 1);
}

/** Why this disciple can't currently learn `techId`, or null if they can. */
export function whyCantLearn(state: GameState, d: Disciple, techId: TechniqueId): string | null {
  const def = TECHNIQUES[techId];
  if (!def) return "Unknown technique.";
  if ((d.techniques ?? []).includes(techId)) return "Already learned.";
  if (def.requiresDoctrine && state.doctrine !== def.requiresDoctrine) {
    return `Requires ${def.requiresDoctrine} doctrine.`;
  }
  if (def.requiresSectLevel && state.sect.level < def.requiresSectLevel) {
    return `Requires sect level ${def.requiresSectLevel}.`;
  }
  for (const conflictId of def.conflicts) {
    if ((d.techniques ?? []).includes(conflictId)) {
      return `Conflicts with ${TECHNIQUES[conflictId]?.name ?? conflictId}.`;
    }
  }
  return null;
}

export function canLearnTechnique(state: GameState, d: Disciple, techId: TechniqueId): boolean {
  return whyCantLearn(state, d, techId) === null;
}

export function learnTechnique(state: GameState, discipleId: number, techId: TechniqueId): boolean {
  const d = state.disciples.find((x) => x.id === discipleId);
  if (!d) return false;
  if (!canLearnTechnique(state, d, techId)) return false;
  if (!d.techniques) d.techniques = [];
  d.techniques.push(techId);
  return true;
}

/** Every defined technique, in a stable order suitable for the picker. */
export function allTechniqueIds(): readonly TechniqueId[] {
  return ALL_TECHNIQUE_IDS;
}
