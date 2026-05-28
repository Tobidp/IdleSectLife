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
  merchantSellMultiplier,
  type PavilionKey,
} from "../../domain/buildings/buildings";
import { sectUpgradeCost } from "../../domain/sect/sect";
import {
  FAME_BURST_PER_SECT_LEVEL,
  FAME_PER_SECT_LEVEL_PER_MONTH,
  INFIRMARY_HEAL_PER_LEVEL,
  TRAINING_HALL_XP_PER_LEVEL,
  TRAINING_HALL_XP_CAP,
  HERB_PER_LEVEL_PER_DAY,
} from "../../data/balance";

function BuildingRow({
  state,
  name,
  level,
  effect,
  cost,
  onUpgrade,
  actionLabel = "Upgrade",
}: {
  state: GameState;
  name: string;
  level: number;
  effect: string;
  cost: Cost;
  onUpgrade: () => void;
  actionLabel?: string;
}): JSX.Element {
  const affordable = canAfford(state, cost);
  return (
    <div className="building-row">
      <div className="building-info">
        <div className="building-name">
          {name}
          {level > 0 ? ` · Lv ${level}` : ""}
        </div>
        <div className="building-effect muted">{effect}</div>
      </div>
      <div className="building-upgrade">
        <div className="building-cost">{formatCost(cost)}</div>
        <button disabled={!affordable} title={affordable ? "" : "Not enough resources"} onClick={onUpgrade}>
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function MerchantRow({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const level = state.buildings.merchant.level;
  const effect =
    level === 0
      ? "Build to auto-sell surplus resources for gold (configure in Market)"
      : `Auto-sell price ×${merchantSellMultiplier(level).toFixed(1)} → ×${merchantSellMultiplier(level + 1).toFixed(1)} next`;
  return (
    <BuildingRow
      state={state}
      name={PAVILION_LABEL.merchant}
      level={level}
      effect={effect}
      cost={pavilionUpgradeCost("merchant", level)}
      actionLabel={level === 0 ? "Build" : "Upgrade"}
      onUpgrade={() => actions.upgradePavilion("merchant")}
    />
  );
}

function InfirmaryRow({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const level = state.buildings.infirmary.level;
  const current = level * INFIRMARY_HEAL_PER_LEVEL;
  const next = (level + 1) * INFIRMARY_HEAL_PER_LEVEL;
  const effect =
    level === 0
      ? `Build for +${next} HP/day to every disciple`
      : `+${current} HP/day to every disciple → +${next} next`;
  return (
    <BuildingRow
      state={state}
      name={PAVILION_LABEL.infirmary}
      level={level}
      effect={effect}
      cost={pavilionUpgradeCost("infirmary", level)}
      actionLabel={level === 0 ? "Build" : "Upgrade"}
      onUpgrade={() => actions.upgradePavilion("infirmary")}
    />
  );
}

function AlchemyLabRow({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const level = state.buildings.alchemyLab.level;
  const effect =
    level === 0
      ? "Build to brew pills (open the Alchemy panel)"
      : `Lv ${level} — recipes up to tier ${level} unlocked`;
  return (
    <BuildingRow
      state={state}
      name={PAVILION_LABEL.alchemyLab}
      level={level}
      effect={effect}
      cost={pavilionUpgradeCost("alchemyLab", level)}
      actionLabel={level === 0 ? "Build" : "Upgrade"}
      onUpgrade={() => actions.upgradePavilion("alchemyLab")}
    />
  );
}

function HerbGardenRow({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const level = state.buildings.herbGarden.level;
  const current = level * HERB_PER_LEVEL_PER_DAY;
  const next = (level + 1) * HERB_PER_LEVEL_PER_DAY;
  const effect =
    level === 0
      ? `Build to grow ${fmt1(next)} 🌿/day passively`
      : `Grows ${fmt1(current)} 🌿/day → ${fmt1(next)} next`;
  return (
    <BuildingRow
      state={state}
      name={PAVILION_LABEL.herbGarden}
      level={level}
      effect={effect}
      cost={pavilionUpgradeCost("herbGarden", level)}
      actionLabel={level === 0 ? "Build" : "Upgrade"}
      onUpgrade={() => actions.upgradePavilion("herbGarden")}
    />
  );
}

function TrainingHallRow({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const level = state.buildings.trainingHall.level;
  const current = Math.min(TRAINING_HALL_XP_CAP, level * TRAINING_HALL_XP_PER_LEVEL);
  const next = Math.min(TRAINING_HALL_XP_CAP, (level + 1) * TRAINING_HALL_XP_PER_LEVEL);
  const capped = current >= TRAINING_HALL_XP_CAP;
  const effect =
    level === 0
      ? `Build for +${Math.round(next * 100)}% XP (sect-wide)`
      : capped
        ? `+${Math.round(current * 100)}% XP (maxed)`
        : `+${Math.round(current * 100)}% XP → +${Math.round(next * 100)}% next`;
  return (
    <BuildingRow
      state={state}
      name={PAVILION_LABEL.trainingHall}
      level={level}
      effect={effect}
      cost={pavilionUpgradeCost("trainingHall", level)}
      actionLabel={level === 0 ? "Build" : "Upgrade"}
      onUpgrade={() => actions.upgradePavilion("trainingHall")}
    />
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
      <MerchantRow state={state} />
      <InfirmaryRow state={state} />
      <TrainingHallRow state={state} />
      <HerbGardenRow state={state} />
      <AlchemyLabRow state={state} />
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
