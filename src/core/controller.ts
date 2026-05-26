// Game controller: owns the store, RNG, loop and persistence, and implements the UI's action surface.

import { Store } from "../state/store";
import { Rng, randomSeed } from "./rng/rng";
import { GameLoop } from "./loop/gameLoop";
import { createNewGame, type GameState, type Speed } from "../state/gameState";
import { saveGame, loadGame, clearSave } from "./save/saveManager";
import type { GameActions } from "../ui/gameActions";
import { renderGame } from "../ui/render";
import { renderNewGameScreen } from "../ui/newGameScreen";
import type { SectType } from "../domain/sect/sectTypes";
import { upgradePavilion, type PavilionKey } from "../domain/buildings/buildings";
import { upgradeSect } from "../domain/sect/sect";
import { addResource } from "../domain/resources/resources";
import { sellResource, buyResource } from "../domain/market/market";
import type { ResourceType } from "../domain/resources/resourceTypes";
import type { Activity } from "../domain/disciples/disciple";

const AUTOSAVE_THROTTLE_MS = 1500;

export class GameController implements GameActions {
  private readonly store = new Store(null);
  private rng = new Rng(randomSeed());
  private loop: GameLoop | null = null;
  private lastSave = 0;

  constructor(private readonly root: HTMLElement) {
    this.store.subscribe(() => this.render());
  }

  /** Resume a save if one exists, otherwise show sect selection. */
  boot(): void {
    const saved = loadGame();
    if (saved) this.resume(saved);
    else this.store.setState(null);
  }

  private render(): void {
    const state = this.store.getState();
    if (!state) renderNewGameScreen(this.root, this);
    else renderGame(this.root, state, this);
  }

  private startLoop(): void {
    this.loop?.stop();
    this.loop = new GameLoop(this.store, this.rng, () => this.autosave());
    this.loop.start();
  }

  private resume(state: GameState): void {
    this.rng = new Rng(state.rngSeed);
    this.store.setState(state);
    this.startLoop();
  }

  private autosave(): void {
    const now = Date.now();
    if (now - this.lastSave < AUTOSAVE_THROTTLE_MS) return;
    this.saveNow();
  }

  private saveNow(): void {
    const state = this.store.getState();
    if (!state) return;
    state.rngSeed = this.rng.state;
    saveGame(state);
    this.lastSave = Date.now();
  }

  // --- GameActions ---

  newGame(sect: SectType): void {
    this.rng = new Rng(randomSeed());
    const state = createNewGame(sect, this.rng);
    this.store.setState(state);
    this.startLoop();
    this.saveNow();
  }

  hardReset(): void {
    if (!window.confirm("Delete your sect and start over?")) return;
    this.loop?.stop();
    this.loop = null;
    clearSave();
    this.store.setState(null);
  }

  setSpeed(speed: Speed): void {
    this.store.update((s) => {
      s.settings.speed = speed;
      s.settings.paused = false;
    });
    this.saveNow();
  }

  togglePause(): void {
    this.store.update((s) => {
      s.settings.paused = !s.settings.paused;
    });
    this.saveNow();
  }

  upgradePavilion(key: PavilionKey): void {
    this.store.update((s) => {
      upgradePavilion(s, key);
    });
    this.saveNow();
  }

  upgradeSect(): void {
    this.store.update((s) => {
      upgradeSect(s);
    });
    this.saveNow();
  }

  setDiscipleAction(discipleId: number, slot: number, activity: Activity): void {
    this.store.update((s) => {
      const d = s.disciples.find((x) => x.id === discipleId);
      if (d && slot >= 0 && slot < 3) d.actions[slot] = activity;
    });
    this.saveNow();
  }

  manualCollect(resource: ResourceType): void {
    this.store.update((s) => {
      addResource(s, resource, 1);
    });
  }

  sell(resource: ResourceType, qty: number): void {
    this.store.update((s) => {
      sellResource(s, resource, qty);
    });
    this.saveNow();
  }

  buy(resource: ResourceType, qty: number): void {
    this.store.update((s) => {
      buyResource(s, resource, qty);
    });
    this.saveNow();
  }
}
