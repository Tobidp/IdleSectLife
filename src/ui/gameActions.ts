// The command surface the UI calls. Implemented by the GameController.

import type { Speed } from "../state/gameState";
import type { SectType } from "../domain/sect/sectTypes";
import type { PavilionKey } from "../domain/buildings/buildings";
import type { ResourceType } from "../domain/resources/resourceTypes";
import type { Activity } from "../domain/disciples/disciple";

export interface GameActions {
  newGame(sect: SectType): void;
  hardReset(): void;
  setSpeed(speed: Speed): void;
  togglePause(): void;
  upgradePavilion(key: PavilionKey): void;
  upgradeSect(): void;
  setDiscipleAction(discipleId: number, slot: number, activity: Activity): void;
  manualCollect(resource: ResourceType): void;
  sell(resource: ResourceType, qty: number): void;
  buy(resource: ResourceType, qty: number): void;
}
