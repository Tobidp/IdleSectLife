// Succession + role promotion. Disciples earn a role (young → master → elder) based on
// age + cultivation level. Roles are passive: elders give the sect monthly fame; losing
// a master or elder costs morale + fame.

import type { Disciple } from "./disciple";
import type { GameState } from "../../state/gameState";
import { effectiveLevel } from "./attributes";
import { ageInYears } from "./aging";
import { pushLog } from "../../state/log";

export type DiscipleRole = "young" | "master" | "elder";

const MASTER_MIN_AVG_LEVEL = 18;
const MASTER_MIN_AGE_YEARS = 30;
const ELDER_MIN_AVG_LEVEL = 32;
const ELDER_MIN_AGE_YEARS = 50;

function avgLevel(d: Disciple): number {
  const total =
    effectiveLevel(d.attributes.strength) +
    effectiveLevel(d.attributes.dexterity) +
    effectiveLevel(d.attributes.vitality) +
    effectiveLevel(d.attributes.health);
  return total / 4;
}

/** Compute the role a disciple should currently hold. Roles only ever promote, they
 *  don't demote — once an elder, always an elder. Caller is expected to check the
 *  current role before applying upgrades. */
export function inferRole(d: Disciple): DiscipleRole {
  const years = ageInYears(d);
  const lvl = avgLevel(d);
  if (lvl >= ELDER_MIN_AVG_LEVEL && years >= ELDER_MIN_AGE_YEARS) return "elder";
  if (lvl >= MASTER_MIN_AVG_LEVEL && years >= MASTER_MIN_AGE_YEARS) return "master";
  return "young";
}

const ORDER: Record<DiscipleRole, number> = { young: 0, master: 1, elder: 2 };

/** Per-day re-check: promote any disciple whose conditions are now met. Demotion is
 *  not possible (an elder's title outlives their cultivation peak). */
export function updateRoles(state: GameState): void {
  for (const d of state.disciples) {
    if (d.status !== "active") continue;
    const cur = (d.role ?? "young") as DiscipleRole;
    const target = inferRole(d);
    if (ORDER[target] > ORDER[cur]) {
      d.role = target;
      pushLog(state, `${d.name} was elevated to ${target} of the sect.`, "good");
    }
  }
}

/** Monthly elder fame bonus — applied alongside the existing monthlyFameGain. */
export function elderFameBonus(state: GameState): number {
  const elders = state.disciples.filter((d) => d.role === "elder" && d.status === "active").length;
  return elders * 3;
}

/** Death / departure of a role-holder hurts more than a young disciple. Caller passes
 *  the list of departed disciples and we compute the morale + fame impact. */
export function applyRoleLossPenalty(state: GameState, departed: Disciple[]): void {
  let elderLost = 0;
  let masterLost = 0;
  for (const d of departed) {
    if (d.role === "elder") elderLost += 1;
    else if (d.role === "master") masterLost += 1;
  }
  if (elderLost === 0 && masterLost === 0) return;
  const fameLoss = elderLost * 8 + masterLost * 3;
  state.fame = Math.max(0, state.fame - fameLoss);
  // Everyone's mood drops a bit at the loss of a senior figure.
  const moraleDrop = elderLost * 8 + masterLost * 4;
  for (const d of state.disciples) {
    if (d.status === "active") {
      d.happiness = Math.max(0, d.happiness - moraleDrop);
    }
  }
  if (elderLost > 0) {
    pushLog(state, `The sect mourns ${elderLost} elder${elderLost > 1 ? "s" : ""} — fame and morale fall.`, "bad");
  } else {
    pushLog(state, `The sect mourns ${masterLost} master${masterLost > 1 ? "s" : ""} — fame and morale fall.`, "bad");
  }
}
