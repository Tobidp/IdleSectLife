// Centered "a new version is available" overlay. Appended to <body> so it survives the
// controller's re-renders of #app.

import { el } from "./components/el";

export function showUpdateBanner(): void {
  if (document.querySelector(".update-overlay")) return;

  const overlay = el("div", { class: "update-overlay" }, [
    el("div", { class: "update-modal" }, [
      el("div", { class: "update-title", text: "New version available" }),
      el("p", {
        class: "update-text",
        text: "A new version of IdleSectLife has been released. Refresh the page to play the latest version.",
      }),
      el("div", { class: "update-actions" }, [
        el("button", {
          class: "update-refresh",
          text: "Refresh now",
          onClick: () => window.location.reload(),
        }),
        el("button", {
          class: "update-later",
          text: "Later",
          onClick: () => overlay.remove(),
        }),
      ]),
    ]),
  ]);

  document.body.appendChild(overlay);
}
