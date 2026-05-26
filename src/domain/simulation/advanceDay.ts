// One simulated day. Mutates state in place. This is the heart of the game loop.

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import { advanceOneDay, currentSeason } from "../../core/time/timeEngine";
import { collectYield, foodNeed, addResource, clampAllResources } from "../resources/resources";
import { collectResourceOf } from "../disciples/actions";
import { trainOnce, happinessGainMultiplier } from "../disciples/training";
import { updateHappiness } from "../disciples/happiness";
import { rollMonthlyApplicant } from "../disciples/recruitment";
import { maxHp, type Disciple } from "../disciples/disciple";
import { addXp, effectiveLevel } from "../disciples/attributes";
import { sectAttribute } from "../sect/sect";
import { passiveFamePerDay } from "../fame/fame";
import { applyMonthlyMaintenance } from "../buildings/maintenance";
import { progressNarrative } from "./storyEvents";
import { ATTRIBUTE_LABEL } from "../sect/sectTypes";
import { seasonMultiplier, SEASON_LABEL } from "../../data/seasons";
import { COLLECT_XP, rankName } from "../../data/progression";
import {
  HEAL_BASE,
  HEAL_LEVEL_FACTOR,
  DEATH_BASE_CHANCE,
  DEATH_LEVEL_FACTOR,
  DEATH_MIN_CHANCE,
  ABANDON_THRESHOLD,
  ABANDON_DIVISOR,
} from "../../data/balance";
import { pushLog } from "../../state/log";

export function advanceDay(state: GameState, rng: Rng): void {
  const season = currentSeason(state.time);
  const sectAttr = sectAttribute(state);

  // 1. Resolve each active disciple's 3 daily actions.
  for (const d of state.disciples) {
    if (d.status !== "active") continue;
    const mult = happinessGainMultiplier(d.happiness);
    for (const action of d.actions) {
      const resource = collectResourceOf(action);
      if (resource) {
        const strLevel = effectiveLevel(d.attributes.strength);
        addResource(state, resource, collectYield(resource, strLevel, seasonMultiplier(season, resource)));
        if (addXp(d.attributes.strength, COLLECT_XP * mult).rankedUp) {
          pushLog(state, `${d.name}'s ${ATTRIBUTE_LABEL.strength} reached ${rankName(d.attributes.strength.rank)}!`, "good");
        }
      } else if (action === "train") {
        const result = trainOnce(d, sectAttr, rng);
        for (const attr of result.rankedUp) {
          pushLog(state, `${d.name}'s ${ATTRIBUTE_LABEL[attr]} reached ${rankName(d.attributes[attr].rank)}!`, "good");
        }
        if (result.injured && d.hp <= 0) {
          pushLog(state, `${d.name} was injured in training and is recovering.`, "bad");
          break; // knocked down — no more actions today
        }
      }
    }
  }

  // 2. Food consumption -> shortage flag.
  const need = foodNeed(state);
  let shortage = false;
  if (state.resources.food >= need) {
    state.resources.food -= need;
  } else {
    state.resources.food = 0;
    shortage = need > 0;
    if (shortage) pushLog(state, "Food shortage! Disciples are going hungry.", "bad");
  }

  // 3. Happiness.
  for (const d of state.disciples) {
    updateHappiness(d, state.sect.type, shortage);
  }

  // 4. Healing & death.
  const dead: Disciple[] = [];
  for (const d of state.disciples) {
    const heal = HEAL_BASE + effectiveLevel(d.attributes.vitality) * HEAL_LEVEL_FACTOR;
    if (d.status === "down") {
      const deathChance = Math.max(
        DEATH_MIN_CHANCE,
        DEATH_BASE_CHANCE - effectiveLevel(d.attributes.vitality) * DEATH_LEVEL_FACTOR,
      );
      if (rng.chance(deathChance)) {
        dead.push(d);
        continue;
      }
      d.hp += heal;
      if (d.hp > 0) {
        d.status = "active";
        d.hp = Math.min(d.hp, maxHp(d));
        pushLog(state, `${d.name} has recovered and returns to duty.`, "good");
      }
    } else if (d.hp < maxHp(d)) {
      d.hp = Math.min(maxHp(d), d.hp + heal);
    }
  }
  if (dead.length > 0) {
    const deadIds = new Set(dead.map((d) => d.id));
    state.disciples = state.disciples.filter((d) => !deadIds.has(d.id));
    for (const d of dead) pushLog(state, `${d.name} succumbed to their injuries.`, "bad");
  }

  // 5. Abandonment of unhappy disciples.
  const leaving: Disciple[] = [];
  for (const d of state.disciples) {
    if (d.status === "active" && d.happiness < ABANDON_THRESHOLD) {
      const chance = (ABANDON_THRESHOLD - d.happiness) / ABANDON_DIVISOR;
      if (rng.chance(chance)) leaving.push(d);
    }
  }
  if (leaving.length > 0) {
    const leavingIds = new Set(leaving.map((d) => d.id));
    state.disciples = state.disciples.filter((d) => !leavingIds.has(d.id));
    for (const d of leaving) pushLog(state, `${d.name} grew unhappy and left the sect.`, "bad");
  }

  // 6. Passive fame.
  state.fame += passiveFamePerDay(state);

  // 7. Advance calendar; monthly upkeep + recruitment roll + season notices.
  const result = advanceOneDay(state.time);
  if (result.monthChanged) {
    applyMonthlyMaintenance(state);
    rollMonthlyApplicant(state, rng);
  }
  if (result.seasonChanged) {
    pushLog(state, `The season turns to ${SEASON_LABEL[currentSeason(state.time)]}.`, "info");
  }

  // 8. Narrative progression: discover clues, queue NPC encounters.
  progressNarrative(state);

  // 9. Keep stores within warehouse caps.
  clampAllResources(state);
}
