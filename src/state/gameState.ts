// Central game state: the single serializable object that is saved/loaded.

import { initialTime, type TimeState } from "../core/time/timeEngine";
import type { Rng } from "../core/rng/rng";
import type { SectType } from "../domain/sect/sectTypes";
import type { ResourceType } from "../domain/resources/resourceTypes";
import { createDisciple, type Disciple } from "../domain/disciples/disciple";
import { STARTING_RESOURCES, STARTING_DISCIPLES } from "../data/baseStats";
import type { LogEntry } from "./log";
import { createInitialNarrativeState, type NarrativeState } from "./narrative";
import type { PillId } from "../data/pills";
import type { EquippedItem, ItemTier } from "../data/equipment";
import { STARTING_BLUEPRINTS } from "../data/blueprints";
import { checkUnlocks, type UnlockId } from "../domain/progression/unlocks";
import { createInitialClocks, type WorldClock } from "../domain/world/clocks";
import type { PendingPersonalEvent } from "../domain/disciples/personalEvents";
import { createInitialMissionOffers, type ActiveMission } from "../domain/missions/missions";
import type { MissionDefId } from "../data/missions/missionDefs";
import type { ActiveChain } from "../domain/events/eventChains";
import type { ChainId } from "../data/events/chainDefs";

export const SAVE_VERSION = 23;

export type Speed = 1 | 2 | 4;

export interface BuildingState {
  level: number;
}

export interface BuildingsState {
  quarters: BuildingState;
  warehouse: BuildingState;
  /** Optional. level 0 = not built; level >= 1 enables auto-selling surplus. */
  merchant: BuildingState;
  /** Optional. Each level adds passive HP regen per day to every disciple. */
  infirmary: BuildingState;
  /** Optional. Each level adds a flat XP bonus (capped). */
  trainingHall: BuildingState;
  /** Optional. Each level passively grows herbs per day. */
  herbGarden: BuildingState;
  /** Optional. Required to craft pills; higher levels will unlock stronger recipes. */
  alchemyLab: BuildingState;
  /** Optional. Required to craft equipment from discovered blueprints. */
  forge: BuildingState;
}

export interface SectState {
  type: SectType;
  level: number;
}

export interface Settings {
  speed: Speed;
  paused: boolean;
}

export interface GameState {
  version: number;
  time: TimeState;
  rngSeed: number;
  sect: SectState;
  resources: Record<ResourceType, number>;
  disciples: Disciple[];
  /** Applicants awaiting Accept/Deny. Their attributes stay hidden until accepted. */
  applicants: Disciple[];
  buildings: BuildingsState;
  fame: number;
  /** Auto-sell percentage (0–100) per resource; applied when the resource hits its cap (needs the Merchant Pavilion). */
  autoSell: Partial<Record<ResourceType, number>>;
  /** Crafted pill inventory: id -> count. */
  pills: Partial<Record<PillId, number>>;
  /** Blueprint ids the player has discovered (unlocks them in the Forge). */
  blueprints: string[];
  /** Crafted items waiting to be equipped onto a disciple. */
  itemInventory: EquippedItem[];
  /** Tiers the player chose to auto-sell — newly crafted items of these tiers are sold on the
   *  spot, and enabling a tier sweeps any matching items already in the inventory. */
  autoSellItems: Partial<Record<ItemTier, boolean>>;
  /** Consecutive months the gold upkeep ("wages") went unpaid. */
  goldArrears: number;
  log: LogEntry[];
  nextId: number;
  settings: Settings;
  /** Epoch ms of the last save — used to accrue offline progress on return. */
  lastPlayed: number;
  /** Ids of unlocked achievements (drives permanent collect/fame multipliers). */
  achievements: string[];
  /** Ids of UI surfaces (tabs / panels) the player has revealed through play. Sticky. */
  unlocked: UnlockId[];
  /** External pressures that advance daily and fire consequences when they fill up. */
  worldClocks: WorldClock[];
  /** Personal events surfaced for specific disciples, awaiting the player's choice. */
  pendingPersonalEvents: PendingPersonalEvent[];
  /** Mission ids currently available to start (the offer board). */
  missionOffers: MissionDefId[];
  /** Missions currently in progress; disciples assigned have status="on_mission". */
  activeMissions: ActiveMission[];
  /** Event chains currently in progress — each parked at a stage waiting for a choice. */
  activeEventChains: ActiveChain[];
  /** Chain ids the player has already played through — fired-once. */
  completedEventChains: ChainId[];
  /** Story progress: quests, clues, NPC relationships, flags. */
  narrative: NarrativeState;
}

/** Build a fresh game for the chosen sect. Uses `rng` to name the starting disciples. */
export function createNewGame(sect: SectType, rng: Rng): GameState {
  const state: GameState = {
    version: SAVE_VERSION,
    time: initialTime(),
    rngSeed: rng.state,
    sect: { type: sect, level: 1 },
    resources: { ...STARTING_RESOURCES },
    disciples: [],
    applicants: [],
    buildings: {
      quarters: { level: 1 },
      warehouse: { level: 1 },
      merchant: { level: 0 },
      infirmary: { level: 0 },
      trainingHall: { level: 0 },
      herbGarden: { level: 0 },
      alchemyLab: { level: 0 },
      forge: { level: 0 },
    },
    fame: 0,
    autoSell: {},
    pills: {},
    blueprints: [...STARTING_BLUEPRINTS],
    itemInventory: [],
    autoSellItems: {},
    goldArrears: 0,
    log: [],
    nextId: 1,
    settings: { speed: 1, paused: false },
    lastPlayed: Date.now(),
    achievements: [],
    unlocked: [],
    worldClocks: createInitialClocks(),
    pendingPersonalEvents: [],
    missionOffers: createInitialMissionOffers(),
    activeMissions: [],
    activeEventChains: [],
    completedEventChains: [],
    narrative: createInitialNarrativeState(),
  };

  for (let i = 0; i < STARTING_DISCIPLES; i++) {
    state.disciples.push(createDisciple(state.nextId++, sect, sect, rng));
  }
  state.rngSeed = rng.state;
  // Seed unlocks silently so the first log line the player sees isn't a wall of
  // "Unlocked: ..." lines — the surfaces just appear in the UI on their own.
  checkUnlocks(state, { silent: true });
  return state;
}
