// Per-device settings modal. Toggles & enums that live in the prefs context (not the save),
// plus a Danger Zone that holds the now-typed-confirmation hard reset (moved out of the
// footer where it was one stray click away from wiping a save).

import { useState } from "react";
import { usePrefs, useSetPrefs, type HiddenBehavior } from "./prefsContext";
import { useActions } from "./engineContext";

const ABANDON_PHRASE = "ABANDON";

const HIDDEN_OPTIONS: { value: HiddenBehavior; label: string; help: string }[] = [
  { value: "normal", label: "Run normally", help: "Full speed — when you return, all missed time is applied." },
  { value: "half", label: "Run at half speed", help: "When you return, half of the missed time is applied." },
  { value: "pause", label: "Pause", help: "Freeze the simulation while the tab is hidden." },
];

export function Settings(): JSX.Element {
  const prefs = usePrefs();
  const setPrefs = useSetPrefs();
  const actions = useActions();
  const [open, setOpen] = useState(false);
  const [abandonInput, setAbandonInput] = useState("");
  const canAbandon = abandonInput.trim().toUpperCase() === ABANDON_PHRASE;

  const closeModal = (): void => {
    setOpen(false);
    setAbandonInput("");
  };

  const onAbandon = (): void => {
    if (!canAbandon) return;
    closeModal();
    actions.hardReset();
  };

  return (
    <>
      <button className="settings-btn" title="Settings" onClick={() => setOpen(true)}>
        ⚙ Settings
      </button>
      {open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Settings</div>
            <label className="setting-row">
              <input
                type="checkbox"
                checked={prefs.notifications}
                onChange={(e) => setPrefs({ ...prefs, notifications: e.target.checked })}
              />
              <span>Show notifications (toasts)</span>
            </label>
            <label className="setting-row" title="Allow dragging and resizing the dashboard panels.">
              <input
                type="checkbox"
                checked={prefs.customizeLayout}
                onChange={(e) => setPrefs({ ...prefs, customizeLayout: e.target.checked })}
              />
              <span>Customize dashboard layout (drag & resize panels)</span>
            </label>
            <div className="setting-group">
              <div className="setting-group-title">When the browser tab is hidden</div>
              {HIDDEN_OPTIONS.map((opt) => (
                <label className="setting-row" key={opt.value} title={opt.help}>
                  <input
                    type="radio"
                    name="hiddenBehavior"
                    value={opt.value}
                    checked={prefs.hiddenBehavior === opt.value}
                    onChange={() => setPrefs({ ...prefs, hiddenBehavior: opt.value })}
                  />
                  <span>{opt.label}</span>
                  <span className="setting-help muted">{opt.help}</span>
                </label>
              ))}
            </div>
            <div className="setting-group danger-zone">
              <div className="setting-group-title danger-title">Danger zone</div>
              <p className="setting-help muted">
                Abandon this sect and start over. This permanently deletes your save and
                cannot be undone. Type <strong>{ABANDON_PHRASE}</strong> to confirm.
              </p>
              <div className="abandon-row">
                <input
                  type="text"
                  className="abandon-input"
                  placeholder={ABANDON_PHRASE}
                  value={abandonInput}
                  onChange={(e) => setAbandonInput(e.target.value)}
                  aria-label={`Type ${ABANDON_PHRASE} to enable the abandon button`}
                />
                <button
                  className="abandon-btn"
                  disabled={!canAbandon}
                  title={
                    canAbandon
                      ? "Permanently delete this save and return to sect selection"
                      : `Type ${ABANDON_PHRASE} above to enable`
                  }
                  onClick={onAbandon}
                >
                  Abandon sect
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
