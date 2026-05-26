// Clue content database (PLACEHOLDER). Each clue has a discovery condition evaluated each
// day by storyEvents; once true the clue is added to the player's dossier.

import type { GameState } from "../../state/gameState";

export type ClueCategory = "past" | "sect" | "rival" | "world";

export const CLUE_CATEGORY_LABEL: Record<ClueCategory, string> = {
  past: "[PLACEHOLDER] Your Past",
  sect: "[PLACEHOLDER] The Sect",
  rival: "[PLACEHOLDER] Rivals",
  world: "[PLACEHOLDER] The World",
};

export interface ClueData {
  title: string;
  description: string;
  category: ClueCategory;
  /** Returns true the day this clue becomes discoverable. */
  discoveryCondition: (game: GameState) => boolean;
}

export const CLUE_DATABASE: Record<string, ClueData> = {
  expulsion_letter: {
    title: "[PLACEHOLDER] The Expulsion Letter",
    description: "[PLACEHOLDER] A torn letter suggesting your exile was arranged, not earned.",
    category: "past",
    discoveryCondition: (game) => game.sect.level >= 2,
  },
  witness_account: {
    title: "[PLACEHOLDER] A Witness's Account",
    description: "[PLACEHOLDER] Someone who was there that night is finally willing to talk.",
    category: "past",
    discoveryCondition: (game) => game.narrative.flags.met_chen === true,
  },
};
