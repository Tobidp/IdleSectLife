// Story tab — Journal/Dossier panel. Discovered clues grouped by category, investigations
// ready to resolve (with an inline accusation picker), and resolved cases.

import { Panel } from "../components/Panel";
import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
import { useView, useViewDispatch } from "../viewContext";
import { getDossierByCategory } from "../../domain/evidence/dossier";
import { CLUE_CATEGORY_LABEL } from "../../data/narrative/clues";
import { readyInvestigations, getInvestigationById } from "../../domain/investigations/investigation";
import { npcDisplayName } from "../../domain/npcs/npc";

export function JournalPanel({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const view = useView();
  const dispatch = useViewDispatch();
  const groups = getDossierByCategory(state.narrative);
  const ready = readyInvestigations(state.narrative);
  const { completedInvestigations, investigationResults } = state.narrative;

  return (
    <Panel title="Journal" className="journal-panel">
      {groups.size === 0 ? (
        <p className="muted">No clues uncovered yet. Keep playing — the past will surface.</p>
      ) : (
        [...groups.entries()].map(([category, clues]) => (
          <div key={category}>
            <div className="clue-group">{CLUE_CATEGORY_LABEL[category]}</div>
            {clues.map((clue) => (
              <div className="clue-card" key={clue.id}>
                <div className="clue-title">{clue.title}</div>
                <div className="clue-desc muted">{clue.description}</div>
              </div>
            ))}
          </div>
        ))
      )}

      {ready.length > 0 && (
        <>
          <div className="clue-group">Investigations</div>
          {ready.map((inv) => {
            const open = view.openInvestigationId === inv.id;
            return (
              <div className="investigation-card" key={inv.id}>
                <div className="inv-title">{inv.title}</div>
                <div className="inv-desc muted">{inv.description}</div>
                <button
                  className="inv-toggle"
                  onClick={() => dispatch({ type: "openInvestigation", id: open ? null : inv.id })}
                >
                  {open ? "Cancel" : "Investigate"}
                </button>
                {open && (
                  <>
                    <div className="inv-accuse-label muted">Accuse — using your gathered clues:</div>
                    <div className="inv-suspects">
                      {inv.suspects.map((suspect) => (
                        <button
                          key={suspect}
                          className="suspect-btn"
                          onClick={() => {
                            actions.submitInvestigation(inv.id, suspect);
                            dispatch({ type: "openInvestigation", id: null });
                          }}
                        >
                          {npcDisplayName(suspect)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </>
      )}

      {completedInvestigations.length > 0 && (
        <>
          <div className="clue-group">Closed cases</div>
          {completedInvestigations.map((invId) => {
            const inv = getInvestigationById(invId);
            const result = investigationResults[invId];
            if (!inv || !result) return null;
            return (
              <div className={`investigation-card resolved inv-${result.outcome}`} key={invId}>
                <div className="inv-title">{inv.title}</div>
                <div className="inv-outcome">{result.message}</div>
              </div>
            );
          })}
        </>
      )}
    </Panel>
  );
}
