// Investigation lookups and availability.

import type { NarrativeState } from "../../state/narrative";
import type { InvestigationId } from "../narrative/types";
import {
  INVESTIGATION_DATABASE,
  type InvestigationData,
} from "../../data/narrative/investigations";

export interface Investigation extends InvestigationData {
  id: InvestigationId;
}

export function getInvestigationById(invId: InvestigationId): Investigation | null {
  const data = INVESTIGATION_DATABASE[invId];
  return data ? { id: invId, ...data } : null;
}

export function isInvestigationResolved(state: NarrativeState, invId: InvestigationId): boolean {
  return state.completedInvestigations.includes(invId);
}

/** Investigations whose every required clue has been discovered and that aren't resolved yet. */
export function readyInvestigations(state: NarrativeState): Investigation[] {
  return (Object.keys(INVESTIGATION_DATABASE) as InvestigationId[])
    .map((id) => getInvestigationById(id))
    .filter((inv): inv is Investigation => inv !== null)
    .filter(
      (inv) =>
        !isInvestigationResolved(state, inv.id) &&
        inv.requiredClues.every((c) => state.discoveredClues.includes(c)),
    );
}
