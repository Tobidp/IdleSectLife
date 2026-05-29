// Game engine: owns the store, RNG, loop and persistence, and exposes the game-mutating
// actions plus an external-store API (subscribe/getState/getVersion) for React. It does NOT
// render and holds no view state — transient UI state lives in React.

import { Store } from "../state/store";
import { Rng, randomSeed } from "./rng/rng";
import { GameLoop, DAY_DURATION_MS } from "./loop/gameLoop";
import { advanceDay } from "../domain/simulation/advanceDay";
import { createNewGame, type GameState, type Speed } from "../state/gameState";
import { saveGame, loadGame, clearSave, encodeSave, decodeSave } from "./save/saveManager";
import type { HiddenBehavior } from "../ui/prefsContext";
import { craftPill, usePill } from "../domain/alchemy/alchemy";
import type { PillId } from "../data/pills";
import { craftBlueprint } from "../domain/equipment/forge";
import {
  equipFromInventory,
  unequipItem,
  sellItem,
  sellAllByTier,
  setAutoSellTier,
} from "../domain/equipment/equip";
import type { EquipmentSlot, ItemTier } from "../data/equipment";
import type { SectType } from "../domain/sect/sectTypes";
import { upgradePavilion, type PavilionKey } from "../domain/buildings/buildings";
import { checkUnlocks } from "../domain/progression/unlocks";
import { resolvePersonalEvent } from "../domain/disciples/personalEvents";
import { startMission, recallMission } from "../domain/missions/missions";
import type { MissionDefId } from "../data/missions/missionDefs";
import { resolveChainChoice } from "../domain/events/eventChains";
import type { ChainId } from "../data/events/chainDefs";
import { pickDoctrine } from "../domain/doctrines/effects";
import type { DoctrineId } from "../data/doctrines/doctrineDefs";
import { learnTechnique } from "../domain/disciples/techniques";
import type { TechniqueId } from "../data/techniques/techniqueDefs";
import { investInTerritory } from "../domain/territories/territories";
import type { TerritoryId } from "../data/territories/territoryDefs";
import { enterTournament, withdrawTournamentEntry } from "../domain/tournaments/tournaments";
import { upgradeSect } from "../domain/sect/sect";
import { addResource } from "../domain/resources/resources";
import { sellResource, buyResource } from "../domain/market/market";
import { acceptApplicant, denyApplicant, expelDisciple } from "../domain/disciples/recruitment";
import type { ResourceType } from "../domain/resources/resourceTypes";
import type { Activity } from "../domain/disciples/disciple";
import { acceptQuest, completeQuest, getQuestById } from "../domain/quests/quest";
import { updateNPCRelationship } from "../domain/npcs/relationships";
import { getInvestigationById } from "../domain/investigations/investigation";
import { validateInvestigation } from "../domain/investigations/validator";
import { formatDateShort } from "./time/timeEngine";
import { pushLog } from "../state/log";
import { simulateOffline, type OfflineSummary } from "../domain/simulation/offline";
import type { QuestId, NPCId, InvestigationId } from "../domain/narrative/types";

/** A daily slot index, or "all" to apply to the whole day. */
export type SlotTarget = 0 | 1 | 2 | "all";

const AUTOSAVE_THROTTLE_MS = 1500;

export class GameEngine {
  private readonly store = new Store(null);
  private rng = new Rng(randomSeed());
  private loop: GameLoop | null = null;
  private lastSave = 0;
  private offlineSummary: OfflineSummary | null = null;
  private hiddenBehavior: HiddenBehavior = "normal";
  private hiddenAt: number | null = null;
  private visibilityListenerAttached = false;

  // External-store API for React.useSyncExternalStore (stable identities — Store uses arrows).
  readonly subscribe = this.store.subscribe;
  readonly getState = this.store.getState;
  readonly getVersion = this.store.getVersion;

  /** Resume a save if one exists (accruing offline progress), otherwise show sect selection. */
  boot(): void {
    this.attachVisibilityListener();
    const saved = loadGame();
    if (!saved) {
      this.store.setState(null);
      return;
    }
    this.rng = new Rng(saved.rngSeed);
    this.offlineSummary = simulateOffline(saved, this.rng);
    saved.rngSeed = this.rng.state;
    this.store.setState(saved);
    this.startLoop();
    this.saveNow();
  }

  /** Current "tab hidden" behavior, applied on the visibilitychange catch-up. */
  setHiddenBehavior(b: HiddenBehavior): void {
    this.hiddenBehavior = b;
  }

  private attachVisibilityListener(): void {
    if (this.visibilityListenerAttached || typeof document === "undefined") return;
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.visibilityListenerAttached = true;
  }

  private onVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      this.hiddenAt = performance.now();
    } else if (this.hiddenAt !== null) {
      const elapsed = performance.now() - this.hiddenAt;
      this.hiddenAt = null;
      this.applyHiddenCatchup(elapsed);
    }
  };

  /**
   * On return from a hidden tab, simulate the missed wall-clock time according to the
   * player's hiddenBehavior preference. "pause" skips, "half" applies at 0.5×, "normal"
   * applies the full elapsed. Bounded by OFFLINE_MAX_DAYS via the simulation cap.
   */
  private applyHiddenCatchup(elapsedMs: number): void {
    if (this.hiddenBehavior === "pause") return;
    if (elapsedMs <= 1000) return;
    const state = this.store.getState();
    if (!state || state.settings.paused) return;
    const rate = this.hiddenBehavior === "half" ? 0.5 : 1;
    const perDay = DAY_DURATION_MS / state.settings.speed;
    const days = Math.floor((elapsedMs * rate) / perDay);
    if (days <= 0) return;
    this.store.update((s) => {
      for (let i = 0; i < days; i++) advanceDay(s, this.rng);
      s.rngSeed = this.rng.state;
    });
    this.saveNow();
  }

  /** The "welcome back" summary from offline progress on this boot, if any. */
  getOfflineSummary(): OfflineSummary | null {
    return this.offlineSummary;
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

  /**
   * Wipe the current save and return to sect selection. Caller is responsible for
   * gating this behind explicit user confirmation — UI now uses a typed "ABANDON"
   * confirmation in Settings, so we don't double-prompt here.
   */
  hardReset(): void {
    this.loop?.stop();
    this.loop = null;
    clearSave();
    this.store.setState(null);
  }

  /** Export the current game as a portable base64 code, or null if no game is active. */
  exportSave(): string | null {
    const state = this.store.getState();
    if (!state) return null;
    state.rngSeed = this.rng.state; // capture the live RNG position before encoding
    return encodeSave(state);
  }

  /** Replace the current game with a decoded save code. Returns false if the code is invalid. */
  importSave(code: string): boolean {
    const state = decodeSave(code);
    if (!state) return false;
    this.resume(state);
    this.saveNow();
    return true;
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
      // Building a Merchant / Forge / Alchemy Lab unfolds its corresponding panel/tab
      // immediately instead of waiting for the next daily tick.
      checkUnlocks(s);
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

  /** Craft a pill from its recipe (needs the Alchemy Lab + the resources). */
  craftPill(pillId: PillId): void {
    this.store.update((s) => {
      craftPill(s, pillId, this.rng);
    });
    this.saveNow();
  }

  /** Consume one pill on the chosen disciple, applying its effect. */
  usePill(pillId: PillId, discipleId: number): void {
    this.store.update((s) => {
      usePill(s, pillId, discipleId);
    });
    this.saveNow();
  }

  // --- Forge / equipment ---

  /** Craft an item from a discovered blueprint. Tier is rolled by RNG. */
  craftBlueprint(blueprintId: string): void {
    this.store.update((s) => {
      craftBlueprint(s, blueprintId, this.rng);
    });
    this.saveNow();
  }

  /** Equip the inventory item at `index` onto a disciple's slot (swaps any existing item). */
  equipFromInventory(inventoryIndex: number, discipleId: number, slot: EquipmentSlot): void {
    this.store.update((s) => {
      equipFromInventory(s, inventoryIndex, discipleId, slot);
    });
    this.saveNow();
  }

  /** Move the disciple's current item in `slot` back to the shared inventory. */
  unequipItem(discipleId: number, slot: EquipmentSlot): void {
    this.store.update((s) => {
      unequipItem(s, discipleId, slot);
    });
    this.saveNow();
  }

  /** Sell an inventory item for gold (price scales with quality tier). */
  sellItem(inventoryIndex: number): void {
    this.store.update((s) => {
      sellItem(s, inventoryIndex);
    });
    this.saveNow();
  }

  /** Sell every inventory item of a given tier in one go. */
  sellAllByTier(tier: ItemTier): void {
    this.store.update((s) => {
      sellAllByTier(s, tier);
    });
    this.saveNow();
  }

  /** Toggle auto-sell for a tier; enabling sweeps current matching inventory. */
  setAutoSellTier(tier: ItemTier, enabled: boolean): void {
    this.store.update((s) => {
      setAutoSellTier(s, tier, enabled);
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

  /** Permanently remove a disciple from the sect (bonded survivors mourn). */
  expelDisciple(id: number): void {
    this.store.update((s) => {
      expelDisciple(s, id);
    });
    this.saveNow();
  }

  /** Resolve the queued personal event for `discipleId` by applying the chosen branch. */
  resolvePersonalEvent(discipleId: number, choiceId: string): void {
    this.store.update((s) => {
      resolvePersonalEvent(s, discipleId, choiceId, this.rng);
    });
    this.saveNow();
  }

  // --- Missions ---

  /** Dispatch a mission with the chosen roster. No-op if anything fails to validate. */
  startMission(defId: MissionDefId, discipleIds: number[]): boolean {
    let ok = false;
    this.store.update((s) => {
      ok = startMission(s, defId, discipleIds);
    });
    this.saveNow();
    return ok;
  }

  /** Recall an active mission early — roster comes home, mission goes back on the board. */
  recallMission(defId: MissionDefId): void {
    this.store.update((s) => {
      recallMission(s, defId);
    });
    this.saveNow();
  }

  /** Apply a chosen branch on the named event chain — transitions stage or ends. */
  resolveChainChoice(chainId: ChainId, choiceId: string): void {
    this.store.update((s) => {
      resolveChainChoice(s, chainId, choiceId, this.rng);
    });
    this.saveNow();
  }

  /** Enter a disciple into the active tournament's roster. */
  enterTournament(discipleId: number): boolean {
    let ok = false;
    this.store.update((s) => {
      ok = enterTournament(s, discipleId);
    });
    if (ok) this.saveNow();
    return ok;
  }

  /** Withdraw a previously-entered disciple from the active tournament. */
  withdrawTournamentEntry(discipleId: number): boolean {
    let ok = false;
    this.store.update((s) => {
      ok = withdrawTournamentEntry(s, discipleId);
    });
    if (ok) this.saveNow();
    return ok;
  }

  /** Invest gold to push player influence in a region. */
  investInTerritory(territoryId: TerritoryId): boolean {
    let ok = false;
    this.store.update((s) => {
      ok = investInTerritory(s, territoryId);
    });
    if (ok) this.saveNow();
    return ok;
  }

  /** Teach a technique to a disciple. No-op if validation fails (conflict, requirement). */
  learnTechnique(discipleId: number, techId: TechniqueId): boolean {
    let ok = false;
    this.store.update((s) => {
      ok = learnTechnique(s, discipleId, techId);
    });
    if (ok) this.saveNow();
    return ok;
  }

  /** Commit the sect to a doctrine for the rest of the run — irreversible. */
  pickDoctrine(id: DoctrineId): boolean {
    let ok = false;
    this.store.update((s) => {
      ok = pickDoctrine(s, id);
      if (ok) {
        pushLog(s, `The sect commits to the ${id.charAt(0).toUpperCase() + id.slice(1)} doctrine.`, "good");
      }
    });
    this.saveNow();
    return ok;
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
