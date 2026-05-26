// Detects when a newer build has been deployed while the player is on an old one.
// The running build's version is baked in (__APP_VERSION__); we poll the deployed version.json.

const CURRENT_VERSION = __APP_VERSION__;
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
const FIRST_CHECK_DELAY_MS = 5_000;

let notified = false;

async function fetchDeployedVersion(): Promise<string | null> {
  try {
    const res = await fetch(`./version.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null; // offline, dev mode (no version.json), etc. — ignore.
  }
}

async function check(onUpdate: () => void): Promise<void> {
  if (notified) return;
  const latest = await fetchDeployedVersion();
  if (latest && latest !== CURRENT_VERSION) {
    notified = true;
    onUpdate();
  }
}

/** Start watching for a newer deployed build; calls `onUpdate` once when one is found. */
export function startUpdateCheck(onUpdate: () => void): void {
  window.setTimeout(() => void check(onUpdate), FIRST_CHECK_DELAY_MS);
  window.setInterval(() => void check(onUpdate), CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void check(onUpdate);
  });
}
