// Real-time driver: converts elapsed wall-clock time into simulated days, respecting speed/pause.

import type { Store } from "../../state/store";
import type { Rng } from "../rng/rng";
import { advanceDay } from "../../domain/simulation/advanceDay";

/** Real milliseconds per in-game day at 1x speed (PROJECT.md: 1 day ≈ 3s). */
export const DAY_DURATION_MS = 3000;

const MAX_CATCHUP_MS = 1000; // ignore larger gaps (e.g. backgrounded tab) -> no offline progress in v1
const MAX_DAYS_PER_FRAME = 60; // safety guard

export class GameLoop {
  private rafId = 0;
  private running = false;
  private acc = 0;
  private last = 0;

  constructor(
    private readonly store: Store,
    private readonly rng: Rng,
    private readonly onDayAdvanced: () => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.acc = 0;
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private frame = (now: number): void => {
    if (!this.running) return;

    let delta = now - this.last;
    this.last = now;
    if (delta > MAX_CATCHUP_MS) delta = MAX_CATCHUP_MS;

    const state = this.store.getState();
    if (state && !state.settings.paused) {
      const perDay = DAY_DURATION_MS / state.settings.speed;
      this.acc += delta;
      let advanced = false;
      let guard = 0;
      while (this.acc >= perDay && guard < MAX_DAYS_PER_FRAME) {
        this.acc -= perDay;
        advanceDay(state, this.rng);
        advanced = true;
        guard++;
      }
      if (advanced) {
        state.rngSeed = this.rng.state;
        this.store.notify();
        this.onDayAdvanced();
      }
    } else {
      this.acc = 0;
    }

    this.rafId = requestAnimationFrame(this.frame);
  };
}
