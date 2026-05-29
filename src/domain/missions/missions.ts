// Mission runtime: a small store of currently-offered missions, a list of active
// (in-progress) missions, and the per-day tick that advances them and fires their
// resolve handlers when the duration elapses.
//
// All offers are visible at once; offers never expire (kept simple — the doc's "missions
// can rotate" idea lives in C-series). A mission moves from offered -> active when the
// player picks disciples and confirms; active -> resolved (removed) when its remaining
// days hit 0.

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import {
  ALL_MISSIONS,
  getMissionDef,
  type MissionDefId,
} from "../../data/missions/missionDefs";
import { pushLog } from "../../state/log";
import { maxHp } from "../disciples/disciple";

export interface ActiveMission {
  defId: MissionDefId;
  discipleIds: number[];
  startedOn: number;
  endsOn: number;
}

/** Generate the initial offer pool for a new game — every mission is on the board. */
export function createInitialMissionOffers(): MissionDefId[] {
  return ALL_MISSIONS.map((m) => m.id);
}

/** True if this disciple is currently away on a mission. */
export function isOnMission(state: GameState, discipleId: number): boolean {
  return state.activeMissions.some((m) => m.discipleIds.includes(discipleId));
}

/** Assign roster + send. Returns false (and no-ops) if anything is wrong (unknown def,
 *  too few/many disciples, any disciple is unavailable). */
export function startMission(state: GameState, defId: MissionDefId, discipleIds: number[]): boolean {
  const def = getMissionDef(defId);
  if (!def) return false;
  if (discipleIds.length < def.minDisciples || discipleIds.length > def.maxDisciples) return false;
  if (!state.missionOffers.includes(defId)) return false;
  const disciples = discipleIds
    .map((id) => state.disciples.find((d) => d.id === id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));
  if (disciples.length !== discipleIds.length) return false;
  if (disciples.some((d) => d.status !== "active")) return false;
  if (disciples.some((d) => isOnMission(state, d.id))) return false;
  // Move disciples into the "on_mission" status; the daily action loop skips them.
  for (const d of disciples) d.status = "on_mission";
  state.activeMissions.push({
    defId,
    discipleIds,
    startedOn: state.time.totalDays,
    endsOn: state.time.totalDays + def.durationDays,
  });
  // Remove from the offer board — re-offered after completion.
  state.missionOffers = state.missionOffers.filter((id) => id !== defId);
  pushLog(state, `Sent ${disciples.map((d) => d.name).join(", ")} on: ${def.name}.`, "info");
  return true;
}

/** Cancel an active mission early. Disciples come home immediately at full HP (the
 *  expedition was aborted, not fought through), and the mission becomes available again. */
export function recallMission(state: GameState, defId: MissionDefId): boolean {
  const idx = state.activeMissions.findIndex((m) => m.defId === defId);
  if (idx < 0) return false;
  const mission = state.activeMissions[idx];
  for (const id of mission.discipleIds) {
    const d = state.disciples.find((x) => x.id === id);
    if (d && d.status === "on_mission") d.status = "active";
  }
  state.activeMissions.splice(idx, 1);
  if (!state.missionOffers.includes(defId)) state.missionOffers.push(defId);
  const def = getMissionDef(defId);
  pushLog(state, `Recalled the ${def?.name ?? defId} mission early.`, "info");
  return true;
}

/** Per-day tick: any active mission whose endsOn we've reached resolves now. Disciples
 *  flip back to active (or stay down if HP went to 0 in resolve), and the offer goes
 *  back on the board for the next try. */
export function advanceMissions(state: GameState, rng: Rng): void {
  if (state.activeMissions.length === 0) return;
  const finished = state.activeMissions.filter((m) => state.time.totalDays >= m.endsOn);
  if (finished.length === 0) return;
  for (const mission of finished) {
    const def = getMissionDef(mission.defId);
    if (!def) continue;
    const assigned = mission.discipleIds
      .map((id) => state.disciples.find((d) => d.id === id))
      .filter((d): d is NonNullable<typeof d> => Boolean(d));
    def.resolve(state, assigned, rng);
    // Flip surviving disciples back to active (or down if HP hit 0). Clamp HP to maxHp
    // so a partial-HP returnee can heal normally on subsequent ticks.
    for (const d of assigned) {
      if (d.hp <= 0) {
        d.hp = 0;
        d.status = "down";
      } else {
        d.status = "active";
        d.hp = Math.min(d.hp, maxHp(d));
      }
    }
    if (!state.missionOffers.includes(mission.defId)) {
      state.missionOffers.push(mission.defId);
    }
  }
  state.activeMissions = state.activeMissions.filter((m) => state.time.totalDays < m.endsOn);
}
