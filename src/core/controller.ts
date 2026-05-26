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
import { createViewState, type Tab, type DiscipleSort } from "../ui/viewState";
import type { SlotTarget } from "../ui/gameActions";
import { orderedDisciples } from "../ui/views/disciplesView";

const AUTOSAVE_THROTTLE_MS = 1500;

export class GameController implements GameActions {
  private readonly store = new Store(null);
  private rng = new Rng(randomSeed());
  private loop: GameLoop | null = null;
  private lastSave = 0;
  private renderPending = false;
  private readonly view = createViewState();

  constructor(private readonly root: HTMLElement) {
    this.store.subscribe(() => this.render());
    // Keep an open <select> from being destroyed by a day-tick re-render:
    // defer redraws while one is focused, then catch up once focus leaves it.
    this.root.addEventListener("focusout", () => {
      setTimeout(() => {
        if (this.renderPending && !this.isEditingSelect()) {
          this.renderPending = false;
          this.render();
        }
      }, 0);
    });
  }

  private isEditingSelect(): boolean {
    return document.activeElement instanceof HTMLSelectElement;
  }

  /** Resume a save if one exists, otherwise show sect selection. */
  boot(): void {
    const saved = loadGame();
    if (saved) this.resume(saved);
    else this.store.setState(null);
  }

  private render(): void {
    const state = this.store.getState();
    if (!state) {
      renderNewGameScreen(this.root, this);
      return;
    }
    // Don't rebuild the DOM while the user is mid-choice in a dropdown —
    // it would close the open <select>. Defer and redraw when focus leaves it.
    if (this.isEditingSelect()) {
      this.renderPending = true;
      return;
    }
    this.renderPending = false;
    this.pruneView(state);
    renderGame(this.root, state, this.view, this);
  }

  /** Drop selection/expansion of disciples that have left or died. */
  private pruneView(state: GameState): void {
    const alive = new Set(state.disciples.map((d) => d.id));
    for (const id of this.view.selectedIds) if (!alive.has(id)) this.view.selectedIds.delete(id);
    for (const id of this.view.expandedIds) if (!alive.has(id)) this.view.expandedIds.delete(id);
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

  // --- View / navigation (UI-only state, no save) ---

  setTab(tab: Tab): void {
    this.view.tab = tab;
    this.render();
  }

  setDiscipleSort(sort: DiscipleSort): void {
    this.view.sort = sort;
    this.render();
  }

  toggleDiscipleSelected(id: number): void {
    if (this.view.selectedIds.has(id)) this.view.selectedIds.delete(id);
    else this.view.selectedIds.add(id);
    this.render();
  }

  toggleDiscipleExpanded(id: number): void {
    if (this.view.expandedIds.has(id)) this.view.expandedIds.delete(id);
    else this.view.expandedIds.add(id);
    this.render();
  }

  selectDisciplePortion(fraction: number): void {
    const state = this.store.getState();
    if (!state) return;
    this.view.selectedIds.clear();
    if (fraction > 0) {
      const ordered = orderedDisciples(state, this.view.sort);
      const count = Math.ceil(fraction * ordered.length);
      for (let i = 0; i < count; i++) this.view.selectedIds.add(ordered[i].id);
    }
    this.render();
  }

  setBulkActivity(activity: Activity): void {
    this.view.bulkActivity = activity;
    this.render();
  }

  // --- Disciples — bulk (mutate game state) ---

  applyActionToSelected(slot: SlotTarget, activity: Activity): void {
    this.store.update((s) => {
      for (const d of s.disciples) {
        if (!this.view.selectedIds.has(d.id)) continue;
        if (slot === "all") d.actions = [activity, activity, activity];
        else d.actions[slot] = activity;
      }
    });
    this.saveNow();
  }

  applyPresetToAll(activity: Activity): void {
    this.store.update((s) => {
      for (const d of s.disciples) d.actions = [activity, activity, activity];
    });
    this.saveNow();
  }
}
