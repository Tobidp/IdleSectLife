// NPC relationship tracking: a numeric score per NPC, plus a mapping to friendly labels.

import type { NarrativeState } from "../../state/narrative";
import type { NPCId, RelationshipLevel } from "../narrative/types";

/** Score thresholds (inclusive lower bound), highest first. */
const RELATIONSHIP_THRESHOLDS: { min: number; level: RelationshipLevel }[] = [
  { min: 50, level: "trusted" },
  { min: 15, level: "friendly" },
  { min: -14, level: "neutral" },
  { min: -49, level: "wary" },
  { min: -Infinity, level: "hostile" },
];

export const RELATIONSHIP_LABEL: Record<RelationshipLevel, string> = {
  trusted: "Trusted",
  friendly: "Friendly",
  neutral: "Neutral",
  wary: "Wary",
  hostile: "Hostile",
};

export function relationshipLevel(score: number): RelationshipLevel {
  for (const t of RELATIONSHIP_THRESHOLDS) if (score >= t.min) return t.level;
  return "neutral";
}

export function getNPCRelationship(state: NarrativeState, npcId: NPCId): number {
  return state.npcEncounters[npcId]?.relationship ?? 0;
}

/** Record (or count) a meeting with an NPC, creating the encounter entry if new. */
export function recordEncounter(state: NarrativeState, npcId: NPCId, date: string): void {
  const enc = state.npcEncounters[npcId];
  if (enc) {
    enc.timesMet += 1;
  } else {
    state.npcEncounters[npcId] = { npcId, relationship: 0, timesMet: 1, metOn: date };
  }
}

/** Shift an NPC's relationship score, creating the entry if this is the first interaction. */
export function updateNPCRelationship(
  state: NarrativeState,
  npcId: NPCId,
  delta: number,
  date: string,
): void {
  const enc = state.npcEncounters[npcId];
  if (enc) {
    enc.relationship += delta;
  } else {
    state.npcEncounters[npcId] = { npcId, relationship: delta, timesMet: 0, metOn: date };
  }
}
