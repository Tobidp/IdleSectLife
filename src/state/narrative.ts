// The narrative slice of the saved game. Holds only serializable progress (ids, flags,
// scores) — never functions. All content/conditions are resolved against the databases
// in src/data/narrative via the domain/* systems.

import type { NPCId, ClueId, QuestId, InvestigationId } from "../domain/narrative/types";

/** Single story arc for now; the field exists so multiple arcs can be added later. */
export type StoryArc = "arc1";
export type StoryPhase = "foundation" | "consolidation" | "recognition";

/** Per-NPC relationship + meeting record. */
export interface NPCEncounter {
  npcId: NPCId;
  /** Numeric score; mapped to a RelationshipLevel by domain/npcs/relationships. */
  relationship: number;
  timesMet: number;
  /** Short date string of the first meeting. */
  metOn: string;
}

/** An NPC waiting in the inbox for the player to open (non-blocking). */
export interface PendingEncounter {
  npcId: NPCId;
  /** Dialogue node id to open the conversation on. */
  nodeId: string;
  seenOn: string;
}

/** A resolved investigation's recorded outcome, kept so the journal can show it. */
export interface InvestigationResult {
  outcome: "success" | "partial" | "failure";
  message: string;
  accusation: string;
  resolvedOn: string;
}

export interface NarrativeState {
  currentArc: StoryArc;
  currentPhase: StoryPhase;

  discoveredClues: ClueId[];
  completedInvestigations: InvestigationId[];
  investigationResults: Record<InvestigationId, InvestigationResult>;
  npcEncounters: Record<NPCId, NPCEncounter>;

  /** Generic story flags, e.g. "met_chen" or "traitor_revealed". */
  flags: Record<string, boolean>;

  activeQuests: QuestId[];
  completedQuests: QuestId[];

  /** NPC encounters surfaced but not yet opened by the player. */
  pendingEncounters: PendingEncounter[];
}

export function createInitialNarrativeState(): NarrativeState {
  return {
    currentArc: "arc1",
    currentPhase: "foundation",
    discoveredClues: [],
    completedInvestigations: [],
    investigationResults: {},
    npcEncounters: {},
    flags: {},
    activeQuests: [],
    completedQuests: [],
    pendingEncounters: [],
  };
}
