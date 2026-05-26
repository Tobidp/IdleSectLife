// Validates an accusation against an investigation: do the supplied clues + the named
// suspect add up to the truth? Pure function — the caller persists the result.

import type { GameState } from "../../state/gameState";
import type { ClueId, InvestigationId } from "../narrative/types";
import { getInvestigationById } from "./investigation";

export interface InvestigationResult {
  success: boolean;
  outcome: "success" | "partial" | "failure";
  message: string;
}

/**
 * Outcome rules:
 * - failure: the dossier is missing one or more required clues.
 * - partial: all clues present, but the wrong suspect is accused.
 * - success: all clues present and the correct suspect is accused.
 */
export function validateInvestigation(
  invId: InvestigationId,
  accusation: string,
  providedClues: ClueId[],
  _game: GameState,
): InvestigationResult {
  const inv = getInvestigationById(invId);
  if (!inv) {
    return { success: false, outcome: "failure", message: "Unknown investigation." };
  }

  const provided = new Set(providedClues);
  const hasAllClues = inv.requiredClues.every((c) => provided.has(c));

  if (!hasAllClues) {
    return { success: false, outcome: "failure", message: inv.outcomes.failure };
  }
  if (accusation === inv.correctAccusation) {
    return { success: true, outcome: "success", message: inv.outcomes.success };
  }
  return { success: false, outcome: "partial", message: inv.outcomes.partial };
}
