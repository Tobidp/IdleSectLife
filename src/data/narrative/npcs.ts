// NPC content database (PLACEHOLDER). Names, dialogue and triggers here are stand-ins to
// exercise the narrative pipeline — real copy is filled in during the writing sprint.

import type { DialogueNode, NPCType } from "../../domain/narrative/types";
import type { GameState } from "../../state/gameState";

/** Condition + bookkeeping that surfaces an NPC encounter once during play. */
export interface NPCEncounterTrigger {
  /** Dialogue node the encounter opens on. */
  nodeId: string;
  /** Narrative flag set when the encounter fires, so it only happens once. */
  onceFlag: string;
  /** When true (and the flag isn't set yet), the encounter is queued. */
  trigger: (game: GameState) => boolean;
}

export interface NPCData {
  name: string;
  type: NPCType;
  blurb: string;
  /** Dialogue nodes keyed by id; "initial" is the conventional entry point. */
  dialogue: Record<string, DialogueNode>;
  encounter?: NPCEncounterTrigger;
}

export const NPC_DATABASE: Record<string, NPCData> = {
  mestre_chen: {
    name: "[PLACEHOLDER] Mestre Chen",
    type: "mentor",
    blurb: "[PLACEHOLDER] An old cultivator who remembers the sect before its fall.",
    dialogue: {
      initial: {
        id: "initial",
        text: "[PLACEHOLDER] So you are the one trying to raise this fallen sect from the ashes...",
        choices: [
          {
            id: "respectful",
            text: "[PLACEHOLDER] I only wish to restore what was lost.",
            relationshipDelta: 5,
            setsFlag: "chen_respected",
            next: "respectful",
          },
          {
            id: "ambitious",
            text: "[PLACEHOLDER] I will surpass everyone who wronged me.",
            relationshipDelta: -3,
            setsFlag: "chen_wary",
            next: "ambitious",
          },
        ],
      },
      respectful: {
        id: "respectful",
        text: "[PLACEHOLDER] Wise. Then perhaps these old eyes can still be of some use to you.",
        choices: [],
      },
      ambitious: {
        id: "ambitious",
        text: "[PLACEHOLDER] Ambition without wisdom is a blade without a hilt. Tread carefully.",
        choices: [],
      },
    },
    encounter: {
      nodeId: "initial",
      onceFlag: "met_chen",
      trigger: (game) => game.sect.level >= 2,
    },
  },
};
