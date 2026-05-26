// Investigation content database (PLACEHOLDER). The player accuses a suspect using the clues
// they've gathered; the validator compares the accusation + supplied clues against these
// definitions to produce an outcome.

import type { ClueId, NPCId } from "../../domain/narrative/types";

export interface InvestigationData {
  title: string;
  description: string;
  /** All of these must be in the dossier for a conclusive result. */
  requiredClues: ClueId[];
  /** Who the player may accuse. Ids without an NPC entry render as a plain label. */
  suspects: NPCId[];
  /** The accusation that yields "success". Use "unknown" for an unnamed culprit. */
  correctAccusation: string;
  outcomes: {
    success: string;
    partial: string;
    failure: string;
  };
}

export const INVESTIGATION_DATABASE: Record<string, InvestigationData> = {
  was_i_guilty: {
    title: "[PLACEHOLDER] Was I Really Guilty?",
    description: "[PLACEHOLDER] Piece together what happened the night you were exiled.",
    requiredClues: ["expulsion_letter", "witness_account"],
    suspects: ["mestre_chen", "unknown_rival"],
    correctAccusation: "unknown_rival",
    outcomes: {
      success: "[PLACEHOLDER] The picture is clear at last — you were framed by a rival.",
      partial: "[PLACEHOLDER] You have the evidence, yet you accuse the wrong person.",
      failure: "[PLACEHOLDER] The evidence is too thin; nothing can be proven yet.",
    },
  },
};
