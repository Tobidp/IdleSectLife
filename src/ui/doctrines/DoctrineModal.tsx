// Doctrine selection modal — opens once the sect reaches level 2 (canPickDoctrine) and
// no doctrine is set yet. Lists every doctrine with its bonus/penalty preview; clicking
// commits the choice for the rest of the run.

import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
import { DOCTRINES, ALL_DOCTRINE_IDS } from "../../data/doctrines/doctrineDefs";
import { canPickDoctrine } from "../../domain/doctrines/effects";

export function DoctrineModal({ state }: { state: GameState }): JSX.Element | null {
  const actions = useActions();
  if (!canPickDoctrine(state)) return null;

  return (
    <div className="event-overlay" role="dialog" aria-modal="true" aria-labelledby="doctrine-title">
      <div className="event-modal doctrine-modal">
        <div className="event-header">
          <span id="doctrine-title" className="event-title">
            Choose a doctrine
          </span>
          <span className="event-sub muted">
            The sect has reached level 2 — commit to a path. This choice cannot be undone.
          </span>
        </div>
        <div className="doctrine-list">
          {ALL_DOCTRINE_IDS.map((id) => {
            const def = DOCTRINES[id];
            return (
              <button
                key={id}
                className="doctrine-card"
                onClick={() => actions.pickDoctrine(id)}
              >
                <div className="doctrine-card-title">{def.label}</div>
                <div className="doctrine-card-desc">{def.description}</div>
                <div className="doctrine-card-effects">
                  <span className="doctrine-bonus">+ {def.bonus}</span>
                  <span className="doctrine-penalty">− {def.penalty}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
