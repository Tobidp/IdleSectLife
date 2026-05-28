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
  pavilionMaxLevel,
  pavilionMaxed,
  quartersCapacity,
  disciplesCapacity,
  merchantSellMultiplier,
  type PavilionKey,
} from "../../domain/buildings/buildings";
import { assignedSlotCount, isJobBuilding } from "../../domain/buildings/jobs";
import { sectUpgradeCost } from "../../domain/sect/sect";
import {
  FAME_BURST_PER_SECT_LEVEL,
  FAME_PER_SECT_LEVEL_PER_MONTH,
  INFIRMARY_HEAL_PER_LEVEL,
  TRAINING_HALL_XP_PER_LEVEL,
  TRAINING_HALL_XP_CAP,
  HERB_PER_LEVEL_PER_DAY,
} from "../../data/balance";

/** Per-pavilion "workers X/Y" badge for buildings that accept jobs (B8). */
function WorkersTag({ state, pkey }: { state: GameState; pkey: PavilionKey }): JSX.Element | null {
  if (!isJobBuilding(pkey)) return null;
  const cap = state.buildings[pkey].level;
  if (cap === 0) return null;
  const assigned = assignedSlotCount(state, pkey);
  const over = assigned > cap;
  return (
    <span
      className={`workers-tag ${over ? "over" : ""}`.trim()}
      title={
        over
          ? `${assigned} job slots assigned but capacity is ${cap} — extras are dropped`
          : `${assigned} of ${cap} worker slot${cap === 1 ? "" : "s"} filled`
      }
    >
      👷 {assigned}/{cap}
    </span>
  );
}

function BuildingRow({
  state,
  pkey,
  name,
  level,
  effect,
  cost,
  onUpgrade,
  actionLabel = "Upgrade",
}: {
  state: GameState;
  pkey?: PavilionKey;
  name: string;
  level: number;
  effect: string;
  cost: Cost;
  onUpgrade: () => void;
  actionLabel?: string;
}): JSX.Element {
  const maxed = pkey ? pavilionMaxed(state, pkey) : false;
  const max = pkey ? pavilionMaxLevel(pkey) : null;
  const affordable = canAfford(state, cost);
  return (
    <div className="building-row">
      <div className="building-info">
        <div className="building-name">
          {name}
          {level > 0 ? ` · Lv ${level}${max !== null ? ` / ${max}` : ""}` : ""}
          {pkey && <WorkersTag state={state} pkey={pkey} />}
        </div>
        <div className="building-effect muted">{effect}</div>
      </div>
      <div className="building-upgrade">
        <div className="building-cost">{maxed ? "—" : formatCost(cost)}</div>
        {maxed ? (
          <button disabled title={`${name} is at its hard cap (Lv ${max}).`}>
            Maxed
          </button>
        ) : (
          <button disabled={!affordable} title={affordable ? "" : "Not enough resources"} onClick={onUpgrade}>
            {actionLabel}
          </button>
        )}
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
      pkey="merchant"
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
      pkey="infirmary"
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
      pkey="alchemyLab"
      name={PAVILION_LABEL.alchemyLab}
      level={level}
      effect={effect}
      cost={pavilionUpgradeCost("alchemyLab", level)}
      actionLabel={level === 0 ? "Build" : "Upgrade"}
      onUpgrade={() => actions.upgradePavilion("alchemyLab")}
    />
  );
}

function ForgeRow({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const level = state.buildings.forge.level;
  const effect =
    level === 0
      ? "Build to craft equipment from discovered blueprints"
      : `Lv ${level} — blueprints up to tier ${level} can be forged`;
  return (
    <BuildingRow
      state={state}
      pkey="forge"
      name={PAVILION_LABEL.forge}
      level={level}
      effect={effect}
      cost={pavilionUpgradeCost("forge", level)}
      actionLabel={level === 0 ? "Build" : "Upgrade"}
      onUpgrade={() => actions.upgradePavilion("forge")}
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
      pkey="herbGarden"
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
      pkey="trainingHall"
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
      pkey={pkey}
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
      <ForgeRow state={state} />
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
