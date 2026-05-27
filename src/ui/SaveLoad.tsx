// Save/Load via a portable base64 code, so progress can move between devices.
// Save (only with a game in play): show the code to copy or download.
// Load (always available): paste a code or pick a file, then it replaces the current game.

import { useState, type ChangeEvent } from "react";
import { useActions, useGameState } from "./engineContext";

type Mode = "none" | "save" | "load";

export function SaveLoad(): JSX.Element {
  const actions = useActions();
  const hasGame = useGameState() !== null;
  const [mode, setMode] = useState<Mode>("none");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");

  const openSave = (): void => {
    const c = actions.exportSave();
    if (!c) {
      setStatus("No game to save.");
      return;
    }
    setCode(c);
    setStatus("");
    setMode("save");
  };
  const openLoad = (): void => {
    setCode("");
    setStatus("");
    setMode("load");
  };
  const close = (): void => setMode("none");

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Copied to clipboard.");
    } catch {
      setStatus("Couldn't copy automatically — select the text and copy it manually.");
    }
  };

  const download = (): void => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sect-ascendant-save.txt";
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Downloaded.");
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    void file.text().then((t) => {
      setCode(t.trim());
      setStatus("File loaded — review and press Load.");
    });
  };

  const doLoad = (): void => {
    if (!code.trim()) {
      setStatus("Paste a save code (or pick a file) first.");
      return;
    }
    if (!window.confirm("Load this save? Your current progress will be replaced.")) return;
    if (actions.importSave(code.trim())) {
      close();
    } else {
      setStatus("That save code is invalid or corrupted.");
    }
  };

  return (
    <>
      {hasGame && (
        <button className="save-btn" onClick={openSave}>
          Save
        </button>
      )}
      <button className="load-btn" onClick={openLoad}>
        Load
      </button>

      {mode !== "none" && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{mode === "save" ? "Save code" : "Load a save"}</div>
            <p className="modal-text muted">
              {mode === "save"
                ? "Copy this code or download it, then paste/upload it on another device to continue."
                : "Paste a save code or pick a save file. Loading replaces your current progress."}
            </p>
            <textarea
              className="save-code"
              readOnly={mode === "save"}
              value={code}
              spellCheck={false}
              placeholder={mode === "load" ? "Paste your save code here…" : undefined}
              onChange={(e) => setCode(e.target.value)}
            />
            {status && <div className="modal-status">{status}</div>}
            <div className="modal-actions">
              {mode === "save" ? (
                <>
                  <button className="primary" onClick={copy}>
                    Copy
                  </button>
                  <button onClick={download}>Download</button>
                </>
              ) : (
                <>
                  <label className="file-label">
                    Choose file
                    <input type="file" accept=".txt,.json,text/plain" onChange={onFile} />
                  </label>
                  <button className="primary" onClick={doLoad}>
                    Load
                  </button>
                </>
              )}
              <button onClick={close}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
