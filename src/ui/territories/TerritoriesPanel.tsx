// Territories panel: each region shows player vs rival influence and an Invest button
// to push player influence at the cost of gold. The runtime ticks rival influence daily
// and pays out the def's monthly yield to whichever side has the higher value.

import { Panel } from "../components/Panel";
import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
import { TERRITORIES } from "../../data/territories/territoryDefs";
import {
  TERRITORY_INVEST_BUMP,
  TERRITORY_INVEST_COST,
} from "../../domain/territories/territories";

export function TerritoriesPanel({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const canAfford = state.resources.gold >= TERRITORY_INVEST_COST;
  return (
    <Panel title="Territories" className="territories-panel">
      <p className="muted territories-hint">
        Whoever holds the majority influence each month collects the region's yield.
      </p>
      <div className="territory-list">
        {state.territories.map((t) => {
          const def = TERRITORIES[t.id];
          if (!def) return null;
          const total = Math.max(1, t.playerInfluence + t.rivalInfluence);
          const playerPct = Math.round((t.playerInfluence / total) * 100);
          const controls = t.playerInfluence > t.rivalInfluence;
          return (
            <div
              key={t.id}
              className={`territory-row ${controls ? "ours" : "theirs"}`}
              title={def.description}
            >
              <div className="territory-head">
                <span className="territory-name">{def.name}</span>
                <span className={`territory-tag ${controls ? "controls-us" : "controls-them"}`}>
                  {controls ? "your control" : "rival lead"}
                </span>
              </div>
              <div className="territory-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={playerPct}>
                <div className="territory-bar-player" style={{ width: `${playerPct}%` }} />
                <div className="territory-bar-rival" style={{ width: `${100 - playerPct}%` }} />
              </div>
              <div className="territory-stats muted">
                Your influence {Math.round(t.playerInfluence)} · rivals {Math.round(t.rivalInfluence)}
              </div>
              <button
                className="territory-invest"
                disabled={!canAfford}
                title={canAfford ? `Spend ${TERRITORY_INVEST_COST} gold for +${TERRITORY_INVEST_BUMP} influence` : `Need ${TERRITORY_INVEST_COST} gold`}
                onClick={() => actions.investInTerritory(t.id)}
              >
                Invest {TERRITORY_INVEST_COST}🪙 (+{TERRITORY_INVEST_BUMP})
              </button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
