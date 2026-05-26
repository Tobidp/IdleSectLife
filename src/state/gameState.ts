// Central game state: the single serializable object that is saved/loaded.

import { initialTime, type TimeState } from "../core/time/timeEngine";
import type { Rng } from "../core/rng/rng";
import type { SectType } from "../domain/sect/sectTypes";
import type { ResourceType } from "../domain/resources/resourceTypes";
import { createDisciple, type Disciple } from "../domain/disciples/disciple";
import { STARTING_RESOURCES, STARTING_DISCIPLES } from "../data/baseStats";
import type { LogEntry } from "./log";
import { createInitialNarrativeState, type NarrativeState } from "./narrative";

export const SAVE_VERSION = 4;

export type Speed = 1 | 2 | 4;

export interface BuildingState {
  level: number;
}

export interface BuildingsState {
  quarters: BuildingState;
  warehouse: BuildingState;
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
  log: LogEntry[];
  nextId: number;
  settings: Settings;
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
    },
    fame: 0,
    log: [],
    nextId: 1,
    settings: { speed: 1, paused: false },
    narrative: createInitialNarrativeState(),
  };

  for (let i = 0; i < STARTING_DISCIPLES; i++) {
    state.disciples.push(createDisciple(state.nextId++, sect, sect, rng));
  }
  state.rngSeed = rng.state;
  return state;
}
