// Modal that surfaces the front-of-queue personal event from state.pendingPersonalEvents.
// Auto-opens whenever there's a queued event; the player picks a choice; the engine action
// applies it and pops the entry, and the next pending event (if any) takes its place.

import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
import { getPersonalEventDef } from "../../data/disciples/personalEvents";

export function PersonalEventModal({ state }: { state: GameState }): JSX.Element | null {
  const actions = useActions();
  const pending = state.pendingPersonalEvents[0];
  if (!pending) return null;
  const disciple = state.disciples.find((d) => d.id === pending.discipleId);
  const def = getPersonalEventDef(pending.eventId);
  if (!disciple || !def) {
    // Stale entry — caller will pop it on the next resolve attempt; render nothing.
    return null;
  }
  return (
    <div
      className="event-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-title"
    >
      <div className="event-modal">
        <div className="event-header">
          <span id="event-title" className="event-title">
            {def.title(disciple)}
          </span>
          <span className="event-sub muted">Personal event · {disciple.name}</span>
        </div>
        <p className="event-text">{def.text(disciple)}</p>
        <div className="event-choices">
          {def.choices.map((c) => (
            <button
              key={c.id}
              className="event-choice"
              onClick={() => actions.resolvePersonalEvent(disciple.id, c.id)}
            >
              <span className="event-choice-label">{c.label}</span>
              <span className="event-choice-preview muted">{c.preview}</span>
            </button>
          ))}
        </div>
        {state.pendingPersonalEvents.length > 1 && (
          <p className="event-queue-hint muted">
            {state.pendingPersonalEvents.length - 1} more event
            {state.pendingPersonalEvents.length - 1 === 1 ? "" : "s"} waiting after this one.
          </p>
        )}
      </div>
    </div>
  );
}
