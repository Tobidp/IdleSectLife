// Top-level React error boundary. Any uncaught render error inside the app — including a
// corrupted save being applied to a panel — surfaces here instead of going to a blank tab.
// Gives the player explicit recovery: download the raw save (so support / future-fix has
// the data), clear local storage, or reload to try again.

import { Component, type ReactNode } from "react";

const SAVE_KEY = "idle-sect-life:save:v1";

interface Props {
  children: ReactNode;
}

interface State {
  err: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: { componentStack?: string | null }): void {
    // Detailed stack in the console for devs; the UI shows only a short summary.
    console.error("Sect: Ascendant: render crashed —", err, info.componentStack);
  }

  private downloadSave = (): void => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sect-ascendant-save-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("Sect: Ascendant: download failed", e);
    }
  };

  private clearAndReload = (): void => {
    if (!window.confirm("Delete the local save and reload? This can't be undone.")) return;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.warn("Sect: Ascendant: clear failed", e);
    }
    window.location.reload();
  };

  private reload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.err) return this.props.children;
    const hasSave = (() => {
      try {
        return localStorage.getItem(SAVE_KEY) !== null;
      } catch {
        return false;
      }
    })();
    return (
      <div className="crash-screen">
        <div className="crash-card">
          <h1 className="crash-title">Something broke.</h1>
          <p className="crash-text">
            The game hit an unexpected error and stopped to keep your save safe. Try reloading;
            if it keeps happening, download your save (so the problem can be looked at) and
            clear it to start fresh.
          </p>
          <p className="crash-detail muted">
            {this.state.err.name}: {this.state.err.message.slice(0, 200)}
          </p>
          <div className="crash-actions">
            <button onClick={this.reload}>Reload</button>
            {hasSave && (
              <button onClick={this.downloadSave}>Download save</button>
            )}
            <button className="crash-danger" onClick={this.clearAndReload}>
              Clear save &amp; reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
