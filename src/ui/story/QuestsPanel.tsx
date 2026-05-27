// Story tab — Quests panel. Active quests (with a Complete button once the objective is met),
// quests available to accept, and a roll-up of completed ones.

import type { ReactNode } from "react";
import { Panel } from "../components/Panel";
import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
import { availableQuests, activeQuests, completedQuests } from "../../domain/quests/missions";
import { canCompleteQuest, type Quest } from "../../domain/quests/quest";
import type { QuestReward } from "../../data/narrative/quests";
import { RESOURCE_LABEL, type ResourceType } from "../../domain/resources/resourceTypes";
import type { QuestStatus } from "../../domain/narrative/types";

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

function QuestCard({
  quest,
  status,
  children,
}: {
  quest: Quest;
  status: QuestStatus;
  children?: ReactNode;
}): JSX.Element {
  return (
    <div className={`quest-card quest-${status}`}>
      <div className="quest-title">{quest.title}</div>
      <div className="quest-desc muted">{quest.description}</div>
      <div className="quest-reward">Reward: {rewardText(quest.reward)}</div>
      {children}
    </div>
  );
}

export function QuestsPanel({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const active = activeQuests(state);
  const available = availableQuests(state);
  const completed = completedQuests(state);
  const empty = active.length === 0 && available.length === 0 && completed.length === 0;

  return (
    <Panel title="Quests" className="quests-panel">
      {empty && <p className="muted">No quests yet. Build your sect to attract them.</p>}

      {active.map((quest) => {
        const ready = canCompleteQuest(quest.id, state);
        return (
          <QuestCard key={quest.id} quest={quest} status="active">
            <button
              className="quest-action complete-quest"
              disabled={!ready}
              title={ready ? "Turn in this quest" : "Objective not met yet"}
              onClick={() => actions.completeQuest(quest.id)}
            >
              {ready ? "Complete" : "In progress"}
            </button>
          </QuestCard>
        );
      })}

      {available.map((quest) => (
        <QuestCard key={quest.id} quest={quest} status="available">
          <button className="quest-action accept-quest" onClick={() => actions.acceptQuest(quest.id)}>
            Accept
          </button>
        </QuestCard>
      ))}

      {completed.length > 0 && (
        <>
          <div className="quest-section muted">Completed ({completed.length})</div>
          {completed.map((quest) => (
            <QuestCard key={quest.id} quest={quest} status="completed" />
          ))}
        </>
      )}
    </Panel>
  );
}
