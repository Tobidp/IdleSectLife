// One simulated day. Mutates state in place. This is the heart of the game loop.

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import { advanceOneDay, currentSeason } from "../../core/time/timeEngine";
import { collectYield, foodNeed, addResource, clampAllResources } from "../resources/resources";
import { collectResourceOf } from "../disciples/actions";
import { trainOnce, happinessGainMultiplier } from "../disciples/training";
import { talentXpMult } from "../../data/talent";
import { traitXpMult } from "../../data/traits";
import { pathXpMultFor, maybeAssignPath, PATH_LABEL } from "../disciples/paths";
import { mentorBoost } from "../disciples/mentors";
import { naturalDeathChance, ageInYears } from "../disciples/aging";
import { rollMonthlyBond, mournLost } from "../disciples/bonds";
import { infirmaryHealBonus, trainingHallXpBonus, herbProductionPerDay } from "../buildings/buildings";
import { equipmentXpMult } from "../equipment/bonuses";
import { maybeDropBlueprint } from "../equipment/drop";
import { updateHappiness } from "../disciples/happiness";
import { rollMonthlyApplicant } from "../disciples/recruitment";
import { maxHp, type Disciple } from "../disciples/disciple";
import { addXp, effectiveLevel } from "../disciples/attributes";
import { attemptBreakthrough, TRIBULATION_TIER_LABEL } from "../disciples/tribulation";
import { sectAttribute } from "../sect/sect";
import { monthlyFameGain } from "../fame/fame";
import { applyMonthlyMaintenance } from "../buildings/maintenance";
import { applyAutoSell } from "../market/autoSell";
import { progressNarrative } from "./storyEvents";
import { achievementMultipliers, checkAchievements } from "../achievements/achievements";
import { STORY_ENABLED } from "../../config/featureFlags";
import { PASSIVE_GOLD_PER_MONTH, TRIBULATION_AID_FAIL_MULT } from "../../data/balance";
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
  const bonus = achievementMultipliers(state);
  const mentor = 1 + mentorBoost(state);
  const training = 1 + trainingHallXpBonus(state);
  const infirmaryBonus = infirmaryHealBonus(state);

  // 1. Resolve each active disciple's 3 daily actions.
  for (const d of state.disciples) {
    if (d.status !== "active") continue;
    const mult =
      happinessGainMultiplier(d.happiness) *
      talentXpMult(d.talent) *
      traitXpMult(d.trait) *
      mentor *
      training;
    for (const action of d.actions) {
      const resource = collectResourceOf(action);
      if (resource) {
        const strLevel = effectiveLevel(d.attributes.strength);
        addResource(
          state,
          resource,
          collectYield(resource, strLevel, seasonMultiplier(season, resource)) * bonus.collect,
        );
        if (addXp(d.attributes.strength, COLLECT_XP * mult * pathXpMultFor(d.path, "strength") * equipmentXpMult(d, "strength")).readyToBreakthrough) {
          const failMult = d.tribulationBuff ? TRIBULATION_AID_FAIL_MULT : 1;
          const tr = attemptBreakthrough(
            d.attributes.strength,
            effectiveLevel(d.attributes.vitality),
            rng,
            failMult,
          );
          if (tr.attempted && d.tribulationBuff) {
            d.tribulationBuff = false;
            pushLog(state, `${d.name}'s Tribulation Aid steadies the trial.`, "info");
          }
          if (tr.attempted) {
            if (tr.success) {
              pushLog(
                state,
                `${d.name} ascends to ${rankName(d.attributes.strength.rank)} in ${ATTRIBUTE_LABEL.strength}!`,
                "good",
              );
              const newPath = maybeAssignPath(d);
              if (newPath) {
                pushLog(state, `${d.name} embraces the ${PATH_LABEL[newPath]} path.`, "good");
              }
              maybeDropBlueprint(state, rng, d.name);
            } else {
              if (tr.hpDamageFraction) {
                d.hp -= Math.round(maxHp(d) * tr.hpDamageFraction);
                if (d.hp <= 0) {
                  d.hp = 0;
                  d.status = "down";
                }
              }
              pushLog(
                state,
                `${d.name}'s ${TRIBULATION_TIER_LABEL[tr.tier]} tribulation in ${ATTRIBUTE_LABEL.strength} failed.`,
                "bad",
              );
            }
            if (d.hp <= 0) break;
          }
        }
      } else if (action === "train") {
        const result = trainOnce(d, sectAttr, rng, mentor * training);
        if (result.tribulationAidConsumed) {
          pushLog(state, `${d.name}'s Tribulation Aid steadies the trial.`, "info");
        }
        for (const ev of result.breakthroughs) {
          if (ev.result.success) {
            pushLog(
              state,
              `${d.name} ascends to ${rankName(d.attributes[ev.attr].rank)} in ${ATTRIBUTE_LABEL[ev.attr]}!`,
              "good",
            );
            const newPath = maybeAssignPath(d);
            if (newPath) {
              pushLog(state, `${d.name} embraces the ${PATH_LABEL[newPath]} path.`, "good");
            }
            maybeDropBlueprint(state, rng, d.name);
          } else {
            pushLog(
              state,
              `${d.name}'s ${TRIBULATION_TIER_LABEL[ev.result.tier]} tribulation in ${ATTRIBUTE_LABEL[ev.attr]} failed.`,
              "bad",
            );
          }
        }
        if (result.injured && d.hp <= 0) {
          pushLog(state, `${d.name} was injured in training and is recovering.`, "bad");
          break;
        }
        if (d.hp <= 0) break; // tribulation knockdown
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
    const heal =
      HEAL_BASE + effectiveLevel(d.attributes.vitality) * HEAL_LEVEL_FACTOR + infirmaryBonus;
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
    mournLost(state, dead, (s, l) => `${s.name} mourns the loss of ${l.name}.`);
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
    mournLost(state, leaving, (s, l) => `${s.name} grieves over ${l.name}'s departure.`);
  }

  // 5b. Aging tick: everyone ages one day; beyond their lifespan, natural death may take them.
  const aged: Disciple[] = [];
  for (const d of state.disciples) {
    d.age += 1;
    const chance = naturalDeathChance(d);
    if (chance > 0 && rng.chance(chance)) aged.push(d);
  }
  if (aged.length > 0) {
    const agedIds = new Set(aged.map((d) => d.id));
    state.disciples = state.disciples.filter((d) => !agedIds.has(d.id));
    for (const d of aged) {
      pushLog(state, `${d.name} passed peacefully at age ${ageInYears(d)}.`, "info");
    }
    mournLost(state, aged, (s, l) => `${s.name} mourns ${l.name}'s passing.`);
  }

  // 6. Advance calendar; monthly fame + gold + upkeep + recruitment roll + season notices.
  const result = advanceOneDay(state.time);
  if (result.monthChanged) {
    state.fame += monthlyFameGain(state);
    state.resources.gold += PASSIVE_GOLD_PER_MONTH;
    applyMonthlyMaintenance(state);
    rollMonthlyApplicant(state, rng);
    rollMonthlyBond(state, rng);
  }
  if (result.seasonChanged) {
    pushLog(state, `The season turns to ${SEASON_LABEL[currentSeason(state.time)]}.`, "info");
  }

  // 7. Narrative progression: discover clues, queue NPC encounters.
  // Gated while the Story feature is unreleased so no placeholder text reaches the log.
  if (STORY_ENABLED) progressNarrative(state);

  // 7b. Herb garden grows herbs passively (before clamp so it caps cleanly).
  const herbs = herbProductionPerDay(state);
  if (herbs > 0) addResource(state, "herb", herbs);

  // 8. Keep stores within warehouse caps.
  clampAllResources(state);

  // 9. Merchant auto-sells the configured share of any store that is now full.
  applyAutoSell(state);

  // 10. Achievements: check after everything else so today's events count.
  for (const a of checkAchievements(state)) {
    pushLog(state, `Achievement unlocked: ${a.name}!`, "good");
  }
}
