// Quest lookups + lifecycle (available -> active -> completed) and reward payout.

import type { GameState } from "../../state/gameState";
import type { NarrativeState } from "../../state/narrative";
import type { QuestId, QuestStatus } from "../narrative/types";
import { QUEST_DATABASE, type QuestData, type QuestReward } from "../../data/narrative/quests";
import { addResource } from "../resources/resources";
import type { ResourceType } from "../resources/resourceTypes";

export interface Quest extends QuestData {
  id: QuestId;
}

export function getQuestById(questId: QuestId): Quest | null {
  const data = QUEST_DATABASE[questId];
  return data ? { id: questId, ...data } : null;
}

export function questStatus(state: NarrativeState, questId: QuestId): QuestStatus {
  if (state.completedQuests.includes(questId)) return "completed";
  if (state.activeQuests.includes(questId)) return "active";
  return "available";
}

/** True when an as-yet-unaccepted quest's availability gate is satisfied. */
export function canAcceptQuest(questId: QuestId, game: GameState): boolean {
  const quest = getQuestById(questId);
  if (!quest) return false;
  if (questStatus(game.narrative, questId) !== "available") return false;
  return quest.available ? quest.available(game) : true;
}

/** Move an available quest into the active list. Returns false if it wasn't acceptable. */
export function acceptQuest(state: NarrativeState, questId: QuestId, game: GameState): boolean {
  if (!canAcceptQuest(questId, game)) return false;
  state.activeQuests.push(questId);
  return true;
}

/** True when an active quest's objective is met and it can be turned in. */
export function canCompleteQuest(questId: QuestId, game: GameState): boolean {
  const quest = getQuestById(questId);
  if (!quest) return false;
  if (questStatus(game.narrative, questId) !== "active") return false;
  return quest.objectiveMet(game);
}

function applyReward(game: GameState, reward: QuestReward): void {
  if (reward.fame) game.fame += reward.fame;
  if (reward.resources) {
    for (const [res, qty] of Object.entries(reward.resources)) {
      if (qty) addResource(game, res as ResourceType, qty);
    }
  }
}

/** Complete an active quest, pay its reward, and move it to completed. */
export function completeQuest(state: NarrativeState, questId: QuestId, game: GameState): boolean {
  if (!canCompleteQuest(questId, game)) return false;
  state.activeQuests = state.activeQuests.filter((id) => id !== questId);
  state.completedQuests.push(questId);
  const quest = getQuestById(questId);
  if (quest) applyReward(game, quest.reward);
  return true;
}
