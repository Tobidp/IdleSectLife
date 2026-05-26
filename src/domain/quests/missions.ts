// Mission selection: derives the quest lists the UI shows from the database + current state.
// (The database in data/narrative/quests.ts is the content; this is the live filtering.)

import type { GameState } from "../../state/gameState";
import type { QuestId } from "../narrative/types";
import { QUEST_DATABASE } from "../../data/narrative/quests";
import { canAcceptQuest, getQuestById, type Quest } from "./quest";

const ALL_QUEST_IDS: QuestId[] = Object.keys(QUEST_DATABASE);

/** Quests the player can accept right now (gate satisfied, not yet accepted/completed). */
export function availableQuests(game: GameState): Quest[] {
  return ALL_QUEST_IDS.filter((id) => canAcceptQuest(id, game))
    .map((id) => getQuestById(id))
    .filter((q): q is Quest => q !== null);
}

export function activeQuests(game: GameState): Quest[] {
  return game.narrative.activeQuests
    .map((id) => getQuestById(id))
    .filter((q): q is Quest => q !== null);
}

export function completedQuests(game: GameState): Quest[] {
  return game.narrative.completedQuests
    .map((id) => getQuestById(id))
    .filter((q): q is Quest => q !== null);
}
