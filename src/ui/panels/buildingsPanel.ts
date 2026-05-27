// Pavilions & sect upgrades: level, effect, next cost and upgrade button.

import { el, panel } from "../components/el";
import { fmt, fmt1, formatCost } from "../components/format";
import type { Cost } from "../../data/costs";
import type { GameState } from "../../state/gameState";
import type { GameActions } from "../gameActions";
import { canAfford, warehouseCap } from "../../domain/resources/resources";
import {
  PAVILION_LABEL,
  pavilionUpgradeCost,
  quartersCapacity,
  disciplesCapacity,
  type PavilionKey,
} from "../../domain/buildings/buildings";
import { sectUpgradeCost } from "../../domain/sect/sect";
import { FAME_BURST_PER_SECT_LEVEL, FAME_PER_SECT_LEVEL_PER_MONTH } from "../../data/balance";

function buildingRow(
  state: GameState,
  name: string,
  level: number,
  effect: string,
  cost: Cost,
  onUpgrade: () => void,
): HTMLElement {
  const affordable = canAfford(state, cost);
  return el("div", { class: "building-row" }, [
    el("div", { class: "building-info" }, [
      el("div", { class: "building-name", text: `${name} · Lv ${level}` }),
      el("div", { class: "building-effect muted", text: effect }),
    ]),
    el("div", { class: "building-upgrade" }, [
      el("div", { class: "building-cost", text: formatCost(cost) }),
      el("button", {
        text: "Upgrade",
        disabled: !affordable,
        title: affordable ? "" : "Not enough resources",
        onClick: onUpgrade,
      }),
    ]),
  ]);
}

function pavilionRow(state: GameState, actions: GameActions, key: PavilionKey): HTMLElement {
  const level = state.buildings[key].level;
  const cost = pavilionUpgradeCost(key, level);
  const effect =
    key === "quarters"
      ? `Houses ${disciplesCapacity(state)} disciples → ${quartersCapacity(level + 1)} next`
      : `Stores ${fmt(warehouseCap(level))} per resource → ${fmt(warehouseCap(level + 1))} next`;
  return buildingRow(state, PAVILION_LABEL[key], level, effect, cost, () =>
    actions.upgradePavilion(key),
  );
}

export function buildingsPanel(state: GameState, actions: GameActions): HTMLElement {
  const sectLevel = state.sect.level;
  const sectRow = buildingRow(
    state,
    "Sect",
    sectLevel,
    `+${fmt(FAME_BURST_PER_SECT_LEVEL)} fame on upgrade · +${fmt1(FAME_PER_SECT_LEVEL_PER_MONTH)} fame/month per level`,
    sectUpgradeCost(sectLevel),
    () => actions.upgradeSect(),
  );

  return panel(
    "Buildings",
    [pavilionRow(state, actions, "quarters"), pavilionRow(state, actions, "warehouse"), sectRow],
    "buildings",
  );
}
