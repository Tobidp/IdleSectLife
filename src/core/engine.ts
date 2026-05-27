// Game engine: owns the store, RNG, loop and persistence, and exposes the game-mutating
// actions plus an external-store API (subscribe/getState/getVersion) for React. It does NOT
// render and holds no view state — transient UI state lives in React.

import { Store } from "../state/store";
import { Rng, randomSeed } from "./rng/rng";
import { GameLoop } from "./loop/gameLoop";
import { createNewGame, type GameState, type Speed } from "../state/gameState";
import { saveGame, loadGame, clearSave } from "./save/saveManager";
import type { SectType } from "../domain/sect/sectTypes";
import { upgradePavilion, type PavilionKey } from "../domain/buildings/buildings";
import { upgradeSect } from "../domain/sect/sect";
import { addResource } from "../domain/resources/resources";
import { sellResource, buyResource } from "../domain/market/market";
import { acceptApplicant, denyApplicant } from "../domain/disciples/recruitment";
import type { ResourceType } from "../domain/resources/resourceTypes";
import type { Activity } from "../domain/disciples/disciple";
import { acceptQuest, completeQuest, getQuestById } from "../domain/quests/quest";
import { updateNPCRelationship } from "../domain/npcs/relationships";
import { getInvestigationById } from "../domain/investigations/investigation";
import { validateInvestigation } from "../domain/investigations/validator";
import { formatDateShort } from "./time/timeEngine";
import { pushLog } from "../state/log";
import type { QuestId, NPCId, InvestigationId } from "../domain/narrative/types";

/** A daily slot index, or "all" to apply to the whole day. */
export type SlotTarget = 0 | 1 | 2 | "all";

const AUTOSAVE_THROTTLE_MS = 1500;

export class GameEngine {
  private readonly store = new Store(null);
  private rng = new Rng(randomSeed());
  private loop: GameLoop | null = null;
  private lastSave = 0;

  // External-store API for React.useSyncExternalStore (stable identities — Store uses arrows).
  readonly subscribe = this.store.subscribe;
  readonly getState = this.store.getState;
  readonly getVersion = this.store.getVersion;

  /** Resume a save if one exists, otherwise stay on the sect-selection screen. */
  boot(): void {
    const saved = loadGame();
    if (saved) this.resume(saved);
    else this.store.setState(null);
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

  // --- Lifecycle ---

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

  // --- Time ---

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

  // --- Buildings & economy ---

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

  /** Set the auto-sell percentage (0–100) for a resource (needs the Merchant Pavilion). */
  setAutoSell(resource: ResourceType, percent: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    this.store.update((s) => {
      s.autoSell[resource] = clamped;
    });
    this.saveNow();
  }

  // --- Disciples ---

  setDiscipleAction(discipleId: number, slot: number, activity: Activity): void {
    this.store.update((s) => {
      const d = s.disciples.find((x) => x.id === discipleId);
      if (d && slot >= 0 && slot < 3) d.actions[slot] = activity;
    });
    this.saveNow();
  }

  /** Bulk: apply an activity to the given disciples at a slot (or all 3 slots). */
  setActionsForDisciples(ids: number[], slot: SlotTarget, activity: Activity): void {
    const set = new Set(ids);
    this.store.update((s) => {
      for (const d of s.disciples) {
        if (!set.has(d.id)) continue;
        if (slot === "all") d.actions = [activity, activity, activity];
        else d.actions[slot] = activity;
      }
    });
    this.saveNow();
  }

  /** Preset: set every disciple's whole day to one activity. */
  setAllActions(activity: Activity): void {
    this.store.update((s) => {
      for (const d of s.disciples) d.actions = [activity, activity, activity];
    });
    this.saveNow();
  }

  acceptApplicant(id: number): void {
    this.store.update((s) => {
      acceptApplicant(s, id);
    });
    this.saveNow();
  }

  denyApplicant(id: number): void {
    this.store.update((s) => {
      denyApplicant(s, id);
    });
    this.saveNow();
  }

  // --- Narrative ---

  acceptQuest(questId: QuestId): void {
    this.store.update((s) => {
      if (acceptQuest(s.narrative, questId, s)) {
        const quest = getQuestById(questId);
        if (quest) pushLog(s, `Quest accepted: ${quest.title}`, "info");
      }
    });
    this.saveNow();
  }

  completeQuest(questId: QuestId): void {
    this.store.update((s) => {
      const quest = getQuestById(questId);
      if (completeQuest(s.narrative, questId, s) && quest) {
        pushLog(s, `Quest complete: ${quest.title}`, "good");
      }
    });
    this.saveNow();
  }

  applyDialogueChoice(npcId: NPCId, relationshipDelta: number, setsFlag?: string): void {
    this.store.update((s) => {
      if (relationshipDelta) {
        updateNPCRelationship(s.narrative, npcId, relationshipDelta, formatDateShort(s.time));
      }
      if (setsFlag) s.narrative.flags[setsFlag] = true;
    });
    this.saveNow();
  }

  dismissEncounter(npcId: NPCId): void {
    this.store.update((s) => {
      s.narrative.pendingEncounters = s.narrative.pendingEncounters.filter(
        (p) => p.npcId !== npcId,
      );
    });
    this.saveNow();
  }

  submitInvestigation(invId: InvestigationId, accusation: string): void {
    this.store.update((s) => {
      const inv = getInvestigationById(invId);
      if (!inv || s.narrative.completedInvestigations.includes(invId)) return;
      const provided = inv.requiredClues.filter((c) => s.narrative.discoveredClues.includes(c));
      const result = validateInvestigation(invId, accusation, provided, s);
      s.narrative.completedInvestigations.push(invId);
      s.narrative.investigationResults[invId] = {
        outcome: result.outcome,
        message: result.message,
        accusation,
        resolvedOn: formatDateShort(s.time),
      };
      pushLog(
        s,
        `Investigation resolved: ${inv.title} (${result.outcome})`,
        result.success ? "good" : "info",
      );
    });
    this.saveNow();
  }
}

/** The action surface React components call (everything but the store plumbing). */
export type GameActions = Omit<GameEngine, "subscribe" | "getState" | "getVersion" | "boot">;
