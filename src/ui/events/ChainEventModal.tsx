// Modal for the current event chain stage. Mirrors PersonalEventModal but the data
// source is state.activeEventChains[0] — one chain at a time, and each choice either
// transitions the stage (modal re-renders with new text) or ends the chain (modal closes).

import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
import { getChainDef } from "../../data/events/chainDefs";

export function ChainEventModal({ state }: { state: GameState }): JSX.Element | null {
  const actions = useActions();
  const active = state.activeEventChains[0];
  if (!active) return null;
  const def = getChainDef(active.chainId);
  const stage = def?.stages[active.stageId];
  if (!def || !stage) return null;
  return (
    <div className="event-overlay" role="dialog" aria-modal="true" aria-labelledby="chain-title">
      <div className="event-modal">
        <div className="event-header">
          <span id="chain-title" className="event-title">
            {def.title}
          </span>
          <span className="event-sub muted">Event chain · {active.stageId}</span>
        </div>
        <p className="event-text">{stage.text}</p>
        <div className="event-choices">
          {stage.choices.map((c) => (
            <button
              key={c.id}
              className="event-choice"
              onClick={() => actions.resolveChainChoice(active.chainId, c.id)}
            >
              <span className="event-choice-label">{c.label}</span>
              <span className="event-choice-preview muted">{c.preview}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
