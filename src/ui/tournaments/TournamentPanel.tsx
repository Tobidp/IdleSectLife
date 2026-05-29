// Tournament panel: when an active tournament is in flight, shows the name + countdown +
// the entry roster with add/remove controls. When idle, shows a short hint about when
// the next tournament is expected.

import { Panel } from "../components/Panel";
import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
import { TOURNAMENTS } from "../../domain/tournaments/tournaments";
import { effectiveLevel } from "../../domain/disciples/attributes";

export function TournamentPanel({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const t = state.activeTournament;

  if (!t) {
    return (
      <Panel title="Tournaments" className="tournaments-panel">
        <p className="muted">
          No tournament in progress. The next regional cycle will be announced when it's
          ready — watch the log.
        </p>
      </Panel>
    );
  }

  const def = TOURNAMENTS[t.defId];
  if (!def) return <Panel title="Tournaments">Unknown tournament.</Panel>;

  const daysToDeadline = Math.max(0, t.entryDeadline - state.time.totalDays);
  const daysToResolve = Math.max(0, t.resolvesOn - state.time.totalDays);
  const entryClosed = state.time.totalDays > t.entryDeadline;
  const entries = t.entries
    .map((id) => state.disciples.find((d) => d.id === id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));
  const eligible = state.disciples.filter(
    (d) => d.status === "active" && !t.entries.includes(d.id),
  );

  return (
    <Panel title={`Tournament · ${def.name}`} className="tournaments-panel">
      <div className="tournament-meta muted">
        Entry closes in {daysToDeadline}d · Resolves in {daysToResolve}d ·{" "}
        {t.entries.length}/{def.maxEntries} entries · baseline {def.baselineRivalStrength}
      </div>

      <div className="tournament-section">
        <div className="tournament-section-title">Your entries</div>
        {entries.length === 0 ? (
          <p className="muted">No disciples entered yet.</p>
        ) : (
          entries.map((d) => (
            <div className="tournament-row" key={d.id}>
              <span className="tournament-name">{d.name}</span>
              <span className="muted">
                STR {effectiveLevel(d.attributes.strength)} · DEX{" "}
                {effectiveLevel(d.attributes.dexterity)} · VIT{" "}
                {effectiveLevel(d.attributes.vitality)}
              </span>
              {!entryClosed && (
                <button
                  className="tournament-withdraw"
                  onClick={() => actions.withdrawTournamentEntry(d.id)}
                >
                  Withdraw
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {!entryClosed && t.entries.length < def.maxEntries && (
        <div className="tournament-section">
          <div className="tournament-section-title">Eligible disciples</div>
          {eligible.length === 0 ? (
            <p className="muted">No active disciples available.</p>
          ) : (
            eligible.map((d) => (
              <div className="tournament-row" key={d.id}>
                <span className="tournament-name">{d.name}</span>
                <span className="muted">
                  STR {effectiveLevel(d.attributes.strength)} · DEX{" "}
                  {effectiveLevel(d.attributes.dexterity)} · VIT{" "}
                  {effectiveLevel(d.attributes.vitality)}
                </span>
                <button
                  className="tournament-enter"
                  onClick={() => actions.enterTournament(d.id)}
                >
                  Enter
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </Panel>
  );
}
