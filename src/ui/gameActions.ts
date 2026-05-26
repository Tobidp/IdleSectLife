// The command surface the UI calls. Implemented by the GameController.

import type { Speed } from "../state/gameState";
import type { SectType } from "../domain/sect/sectTypes";
import type { PavilionKey } from "../domain/buildings/buildings";
import type { ResourceType } from "../domain/resources/resourceTypes";
import type { Activity } from "../domain/disciples/disciple";
import type { Tab, DiscipleSort } from "./viewState";

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
  setDiscipleSort(sort: DiscipleSort): void;
  toggleDiscipleSelected(id: number): void;
  toggleDiscipleExpanded(id: number): void;
  /** Select the first `fraction` (0..1) of disciples in the current display order; 0 clears. */
  selectDisciplePortion(fraction: number): void;

  // Disciples — bulk
  setBulkActivity(activity: Activity): void;
  applyActionToSelected(slot: SlotTarget, activity: Activity): void;
  applyPresetToAll(activity: Activity): void;
}
