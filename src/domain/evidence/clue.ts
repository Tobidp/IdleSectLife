// Clue lookups + discovery rules. State holds only discovered ids; conditions live in data.

import type { GameState } from "../../state/gameState";
import type { NarrativeState } from "../../state/narrative";
import type { ClueId } from "../narrative/types";
import { CLUE_DATABASE, type ClueData } from "../../data/narrative/clues";

export interface Clue extends ClueData {
  id: ClueId;
}

export function getClueById(clueId: ClueId): Clue | null {
  const data = CLUE_DATABASE[clueId];
  return data ? { id: clueId, ...data } : null;
}

export function hasClue(state: NarrativeState, clueId: ClueId): boolean {
  return state.discoveredClues.includes(clueId);
}

/** True when the clue exists, isn't already found, and its condition is met. */
export function canDiscoverClue(clueId: ClueId, game: GameState): boolean {
  const clue = getClueById(clueId);
  if (!clue) return false;
  if (hasClue(game.narrative, clueId)) return false;
  return clue.discoveryCondition(game);
}

/** Add a clue to the dossier. Returns false if it was already there. */
export function discoverClue(state: NarrativeState, clueId: ClueId): boolean {
  if (state.discoveredClues.includes(clueId)) return false;
  state.discoveredClues.push(clueId);
  return true;
}
