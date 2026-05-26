// Top summary: sect identity/level, fame, calendar, season, population.

import { el, panel } from "../components/el";
import { fmt, fmt1 } from "../components/format";
import type { GameState } from "../../state/gameState";
import { SECT_ICON, SECT_LABEL } from "../../domain/sect/sectTypes";
import { currentSeason, formatDate } from "../../core/time/timeEngine";
import { SEASON_ICON, SEASON_LABEL, SEASON_NOTE } from "../../data/seasons";
import { disciplesCapacity } from "../../domain/buildings/buildings";
import { passiveFamePerDay, recruitChance } from "../../domain/fame/fame";

function stat(label: string, value: string, title = ""): HTMLElement {
  return el("div", { class: "stat", title }, [
    el("span", { class: "stat-label", text: label }),
    el("span", { class: "stat-value", text: value }),
  ]);
}

export function sectOverviewPanel(state: GameState): HTMLElement {
  const season = currentSeason(state.time);
  const cap = disciplesCapacity(state);
  const active = state.disciples.filter((d) => d.status === "active").length;

  const header = el("div", { class: "sect-header" }, [
    el("span", { class: "sect-icon", text: SECT_ICON[state.sect.type] }),
    el("div", {}, [
      el("div", { class: "sect-name", text: `${SECT_LABEL[state.sect.type]} · Lv ${state.sect.level}` }),
      el("div", { class: "sect-date", text: formatDate(state.time) }),
    ]),
  ]);

  const grid = el("div", { class: "stat-grid" }, [
    stat("Fame", fmt(state.fame), "Drives recruitment and prestige"),
    stat("Fame / day", `+${fmt1(passiveFamePerDay(state))}`, "Sect level + happy disciples"),
    stat("Season", `${SEASON_ICON[season]} ${SEASON_LABEL[season]}`, SEASON_NOTE[season]),
    stat("Disciples", `${state.disciples.length} / ${cap}`, `${active} active`),
    stat("Recruit chance", `${Math.round(recruitChance(state.fame) * 100)}% / day`),
  ]);

  return panel("Sect Overview", [header, grid], "sect-overview");
}
