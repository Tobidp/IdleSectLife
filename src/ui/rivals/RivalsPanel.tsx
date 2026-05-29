// Rivals panel: one row per known rival sect with influence progress bar + leader +
// archetype tag. The runtime ticks influence daily and writes archetype actions to the
// event log on month change; this panel is read-only context for now.

import { Panel } from "../components/Panel";
import type { GameState } from "../../state/gameState";
import { RIVALS, RIVAL_ARCHETYPE_LABEL, type RivalArchetypeId } from "../../data/rivals/rivalDefs";

const ARCHETYPE_CLASS: Record<RivalArchetypeId, string> = {
  military: "rival-military",
  merchant: "rival-merchant",
  spiritual: "rival-spiritual",
  shadow: "rival-shadow",
  diplomatic: "rival-diplomatic",
};

export function RivalsPanel({ state }: { state: GameState }): JSX.Element {
  return (
    <Panel title="Rival Sects" className="rivals-panel">
      {state.rivals.length === 0 ? (
        <p className="muted">No rivals on the map yet.</p>
      ) : (
        <div className="rival-list">
          {state.rivals.map((r) => {
            const def = RIVALS[r.id];
            if (!def) return null;
            const pct = Math.round(r.influence);
            return (
              <div
                key={r.id}
                className="rival-row"
                title={`${def.description}\nLed by ${def.leader}.`}
                aria-label={`${def.name} — ${pct}% influence (${RIVAL_ARCHETYPE_LABEL[def.archetype]})`}
              >
                <div className="rival-head">
                  <span className="rival-name">{def.name}</span>
                  <span className={`rival-tag ${ARCHETYPE_CLASS[def.archetype]}`}>
                    {RIVAL_ARCHETYPE_LABEL[def.archetype]}
                  </span>
                </div>
                <div className="rival-leader muted">Led by {def.leader}</div>
                <div className="rival-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className={`rival-bar-fill ${ARCHETYPE_CLASS[def.archetype]}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
