// Pavilions & sect upgrades: level, effect, next cost and upgrade button.

import { Panel } from "../components/Panel";
import { fmt, fmt1, formatCost } from "../components/format";
import type { Cost } from "../../data/costs";
import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
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

function BuildingRow({
  state,
  name,
  level,
  effect,
  cost,
  onUpgrade,
}: {
  state: GameState;
  name: string;
  level: number;
  effect: string;
  cost: Cost;
  onUpgrade: () => void;
}): JSX.Element {
  const affordable = canAfford(state, cost);
  return (
    <div className="building-row">
      <div className="building-info">
        <div className="building-name">
          {name} · Lv {level}
        </div>
        <div className="building-effect muted">{effect}</div>
      </div>
      <div className="building-upgrade">
        <div className="building-cost">{formatCost(cost)}</div>
        <button disabled={!affordable} title={affordable ? "" : "Not enough resources"} onClick={onUpgrade}>
          Upgrade
        </button>
      </div>
    </div>
  );
}

function PavilionRow({ state, pkey }: { state: GameState; pkey: PavilionKey }): JSX.Element {
  const actions = useActions();
  const level = state.buildings[pkey].level;
  const cost = pavilionUpgradeCost(pkey, level);
  const effect =
    pkey === "quarters"
      ? `Houses ${disciplesCapacity(state)} disciples → ${quartersCapacity(level + 1)} next`
      : `Stores ${fmt(warehouseCap(level))} per resource → ${fmt(warehouseCap(level + 1))} next`;
  return (
    <BuildingRow
      state={state}
      name={PAVILION_LABEL[pkey]}
      level={level}
      effect={effect}
      cost={cost}
      onUpgrade={() => actions.upgradePavilion(pkey)}
    />
  );
}

export function BuildingsPanel({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const sectLevel = state.sect.level;
  return (
    <Panel title="Buildings" className="buildings">
      <PavilionRow state={state} pkey="quarters" />
      <PavilionRow state={state} pkey="warehouse" />
      <BuildingRow
        state={state}
        name="Sect"
        level={sectLevel}
        effect={`+${fmt(FAME_BURST_PER_SECT_LEVEL)} fame on upgrade · +${fmt1(
          FAME_PER_SECT_LEVEL_PER_MONTH,
        )} fame/month per level`}
        cost={sectUpgradeCost(sectLevel)}
        onUpgrade={() => actions.upgradeSect()}
      />
    </Panel>
  );
}
