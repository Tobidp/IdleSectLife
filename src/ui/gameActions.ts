// The command surface the UI calls. Implemented by the GameController.

import type { Speed } from "../state/gameState";
import type { SectType } from "../domain/sect/sectTypes";
import type { PavilionKey } from "../domain/buildings/buildings";
import type { ResourceType } from "../domain/resources/resourceTypes";
import type { Activity } from "../domain/disciples/disciple";
import type { Tab, DiscipleSort } from "./viewState";
import type { QuestId, NPCId, InvestigationId } from "../domain/narrative/types";

/** A daily slot index, or "all" to apply to the whole day. */
export type SlotTarget = 0 | 1 | 2 | "all";

export interface GameActions {
  // Game lifecycle
  newGame(sect: SectType): void;
  hardReset(): void;

  // Time
  setSpeed(speed: Speed): void;
  togglePause(): void;

  // Buildings & economy
  upgradePavilion(key: PavilionKey): void;
  upgradeSect(): void;
  manualCollect(resource: ResourceType): void;
  sell(resource: ResourceType, qty: number): void;
  buy(resource: ResourceType, qty: number): void;

  // Disciples — individual
  setDiscipleAction(discipleId: number, slot: number, activity: Activity): void;

  // Applicants (pending approval)
  acceptApplicant(id: number): void;
  denyApplicant(id: number): void;

  // View / navigation
  setTab(tab: Tab): void;
  /** Restore the default draggable-window arrangement on the Sect tab. */
  resetWindowLayout(): void;
  setDiscipleSort(sort: DiscipleSort): void;
  toggleDiscipleSelected(id: number): void;
  toggleDiscipleExpanded(id: number): void;
  /** Select the first `fraction` (0..1) of disciples in the current display order; 0 clears. */
  selectDisciplePortion(fraction: number): void;

  // Disciples — bulk
  setBulkActivity(activity: Activity): void;
  applyActionToSelected(slot: SlotTarget, activity: Activity): void;
  applyPresetToAll(activity: Activity): void;

  // Narrative — quests
  acceptQuest(questId: QuestId): void;
  completeQuest(questId: QuestId): void;

  // Narrative — NPC encounters / dialogue
  /** Persist a dialogue choice's effects (relationship shift + optional flag). */
  applyDialogueChoice(npcId: NPCId, relationshipDelta: number, setsFlag?: string): void;
  /** Remove a pending encounter from the inbox (the conversation ended). */
  dismissEncounter(npcId: NPCId): void;

  // Narrative — investigations
  /** Open (or, with null, close) an investigation's accusation picker. View-only. */
  openInvestigation(invId: InvestigationId | null): void;
  /** Resolve an investigation by accusing a suspect with the gathered clues. */
  submitInvestigation(invId: InvestigationId, accusation: string): void;
}
