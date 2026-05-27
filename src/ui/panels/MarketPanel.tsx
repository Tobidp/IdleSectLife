// Buy/sell resources for gold.

import { Panel } from "../components/Panel";
import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
import { MARKET_PRICES } from "../../data/prices";
import { RESOURCE_ICON, RESOURCE_LABEL, type ResourceType } from "../../domain/resources/resourceTypes";
import { merchantBuilt } from "../../domain/buildings/buildings";
import { AUTOSELLABLE } from "../../domain/market/autoSell";

const TRADE_ORDER: ResourceType[] = ["stone", "wood", "food", "cloth"];
const QTY = 10;

function AutoSellConfig({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  if (!merchantBuilt(state)) {
    return (
      <p className="muted autosell-hint">
        Build the Merchant Pavilion to auto-sell surplus when a store fills up.
      </p>
    );
  }
  return (
    <div className="autosell">
      <div className="autosell-head">Auto-sell when full</div>
      {AUTOSELLABLE.map((res) => (
        <div className="autosell-row" key={res}>
          <span className="res-icon">{RESOURCE_ICON[res]}</span>
          <span className="res-name">{RESOURCE_LABEL[res]}</span>
          <input
            type="number"
            className="autosell-pct"
            min={0}
            max={100}
            value={state.autoSell[res] ?? 0}
            onChange={(e) => actions.setAutoSell(res, Number(e.target.value) || 0)}
          />
          <span className="muted">% of cap</span>
        </div>
      ))}
    </div>
  );
}

export function MarketPanel({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();

  return (
    <Panel title="Market" className="market">
      <p className="muted market-note">
        Gold: {Math.round(state.resources.gold)} 🪙 · trades in batches of {QTY}
      </p>
      {TRADE_ORDER.map((type) => {
        const price = MARKET_PRICES[type];
        const owned = state.resources[type];
        return (
          <div className="market-row" key={type}>
            <span className="res-icon">{RESOURCE_ICON[type]}</span>
            <span className="res-name">{RESOURCE_LABEL[type]}</span>
            <div className="trade-btns">
              {price.sell !== null && (
                <button
                  className="trade-btn sell"
                  disabled={owned < QTY}
                  onClick={() => actions.sell(type, QTY)}
                >
                  Sell {QTY} (+{price.sell * QTY}🪙)
                </button>
              )}
              {price.buy !== null && (
                <button
                  className="trade-btn buy"
                  disabled={state.resources.gold < price.buy * QTY}
                  onClick={() => actions.buy(type, QTY)}
                >
                  Buy {QTY} (−{price.buy * QTY}🪙)
                </button>
              )}
            </div>
          </div>
        );
      })}
      <AutoSellConfig state={state} />
    </Panel>
  );
}
