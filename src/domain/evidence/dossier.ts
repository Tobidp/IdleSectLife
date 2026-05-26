// Read-only views over the discovered clues, for the journal UI.

import type { NarrativeState } from "../../state/narrative";
import type { ClueCategory } from "../../data/narrative/clues";
import { getClueById, type Clue } from "./clue";

/** All discovered clues, in discovery order, skipping any unknown ids. */
export function getDossier(state: NarrativeState): Clue[] {
  return state.discoveredClues
    .map((id) => getClueById(id))
    .filter((c): c is Clue => c !== null);
}

/** Discovered clues grouped by category (empty categories omitted). */
export function getDossierByCategory(state: NarrativeState): Map<ClueCategory, Clue[]> {
  const groups = new Map<ClueCategory, Clue[]>();
  for (const clue of getDossier(state)) {
    const list = groups.get(clue.category) ?? [];
    list.push(clue);
    groups.set(clue.category, list);
  }
  return groups;
}
