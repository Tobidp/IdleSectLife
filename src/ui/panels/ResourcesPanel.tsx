// Resource stockpiles with caps, a per-day net rate, and a manual +1 gather button.

import { Panel } from "../components/Panel";
import { fmt, fmtCap } from "../components/format";
import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
import {
  RESOURCE_ICON,
  RESOURCE_LABEL,
  isCollectable,
  type ResourceType,
} from "../../domain/resources/resourceTypes";
import { capFor } from "../../domain/resources/resources";
import { dailyNet } from "../../domain/simulation/projection";

const ROW_ORDER: ResourceType[] = ["stone", "wood", "food", "cloth", "gold"];

function RateSpan({ type, rate }: { type: ResourceType; rate: number }): JSX.Element {
  if (!isCollectable(type)) return <span className="res-rate flat">—</span>;
  const rounded = Math.round(rate);
  const cls = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  const sign = rounded < 0 ? "−" : "+";
  return (
    <span className={`res-rate ${cls}`} title="Net change per day (collection − consumption)">
      {sign}
      {Math.abs(rounded)}/day
    </span>
  );
}

export function ResourcesPanel({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const rates = dailyNet(state);

  return (
    <Panel title="Resources" className="resources">
      {ROW_ORDER.map((type) => {
        const amount = state.resources[type];
        const cap = capFor(state, type);
        const atCap = cap !== Infinity && amount >= cap;
        return (
          <div className="res-row" key={type}>
            <span className="res-icon">{RESOURCE_ICON[type]}</span>
            <span className="res-name">{RESOURCE_LABEL[type]}</span>
            <span className={`res-amount ${atCap ? "at-cap" : ""}`.trim()}>
              {fmt(amount)} / {fmtCap(cap)}
            </span>
            <RateSpan type={type} rate={rates[type]} />
            {isCollectable(type) && (
              <button
                className="res-gather"
                title={`Gather 1 ${RESOURCE_LABEL[type]} by hand`}
                disabled={atCap}
                onClick={() => actions.manualCollect(type)}
              >
                +1
              </button>
            )}
          </div>
        );
      })}
    </Panel>
  );
}
