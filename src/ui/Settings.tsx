// Per-device settings modal. Toggles & enums that live in the prefs context (not the save).

import { useState } from "react";
import { usePrefs, useSetPrefs, type HiddenBehavior } from "./prefsContext";

const HIDDEN_OPTIONS: { value: HiddenBehavior; label: string; help: string }[] = [
  { value: "normal", label: "Run normally", help: "Full speed — when you return, all missed time is applied." },
  { value: "half", label: "Run at half speed", help: "When you return, half of the missed time is applied." },
  { value: "pause", label: "Pause", help: "Freeze the simulation while the tab is hidden." },
];

export function Settings(): JSX.Element {
  const prefs = usePrefs();
  const setPrefs = useSetPrefs();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="settings-btn" title="Settings" onClick={() => setOpen(true)}>
        ⚙ Settings
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
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
            <div className="modal-actions">
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
