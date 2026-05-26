// Story tab — Quests panel. Shows active quests (with a Complete button once the objective
// is met), quests available to accept, and a roll-up of completed ones.

import { el, panel } from "../components/el";
import type { GameState } from "../../state/gameState";
import type { GameActions } from "../gameActions";
import type { QuestStatus } from "../../domain/narrative/types";
import { availableQuests, activeQuests, completedQuests } from "../../domain/quests/missions";
import { canCompleteQuest, type Quest } from "../../domain/quests/quest";
import type { QuestReward } from "../../data/narrative/quests";
import { RESOURCE_LABEL, type ResourceType } from "../../domain/resources/resourceTypes";

function rewardText(reward: QuestReward): string {
  const parts: string[] = [];
  if (reward.fame) parts.push(`+${reward.fame} Fame`);
  if (reward.resources) {
    for (const [res, qty] of Object.entries(reward.resources)) {
      if (qty) parts.push(`+${qty} ${RESOURCE_LABEL[res as ResourceType]}`);
    }
  }
  return parts.join(" · ");
}

function questCard(quest: Quest, status: QuestStatus, footer: HTMLElement | null): HTMLElement {
  const card = el("div", { class: `quest-card quest-${status}` }, [
    el("div", { class: "quest-title", text: quest.title }),
    el("div", { class: "quest-desc muted", text: quest.description }),
    el("div", { class: "quest-reward", text: `Reward: ${rewardText(quest.reward)}` }),
  ]);
  if (footer) card.append(footer);
  return card;
}

export function questsPanel(state: GameState, actions: GameActions): HTMLElement {
  const active = activeQuests(state);
  const available = availableQuests(state);
  const completed = completedQuests(state);
  const body: HTMLElement[] = [];

  if (active.length === 0 && available.length === 0 && completed.length === 0) {
    body.push(el("p", { class: "muted", text: "No quests yet. Build your sect to attract them." }));
  }

  for (const quest of active) {
    const ready = canCompleteQuest(quest.id, state);
    const footer = el("button", {
      class: "quest-action complete-quest",
      text: ready ? "Complete" : "In progress",
      disabled: !ready,
      title: ready ? "Turn in this quest" : "Objective not met yet",
      onClick: () => actions.completeQuest(quest.id),
    });
    body.push(questCard(quest, "active", footer));
  }

  for (const quest of available) {
    const footer = el("button", {
      class: "quest-action accept-quest",
      text: "Accept",
      onClick: () => actions.acceptQuest(quest.id),
    });
    body.push(questCard(quest, "available", footer));
  }

  if (completed.length > 0) {
    body.push(el("div", { class: "quest-section muted", text: `Completed (${completed.length})` }));
    for (const quest of completed) body.push(questCard(quest, "completed", null));
  }

  return panel("Quests", body, "quests-panel");
}
