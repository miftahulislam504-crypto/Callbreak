// Plays TableEvents one after another (so a burst of server states still animates in order).
// Framework-free: the React hook is a thin useSyncExternalStore wrapper.
import { diffGame, type TableEvent } from './tableEvents';
import type { Card, GameView } from './types';

export interface ShownCard {
  key: string;
  seat: number;
  card: Card;
}

export interface TrickSnapshot {
  shown: ShownCard[];
  /** Seat the finished trick is being swept towards. */
  sweepTo: number | null;
  /** True when nothing is queued or animating. */
  idle: boolean;
}

export interface Timing {
  /** Pause after each card lands. */
  playMs: number;
  /** How long a finished trick stays on the table. */
  holdMs: number;
  sweepMs: number;
}

export const DEFAULT_TIMING: Timing = { playMs: 260, holdMs: 850, sweepMs: 380 };

export class TrickPlayer {
  private snap: TrickSnapshot;
  private prev: GameView | null;
  private queue: TableEvent[] = [];
  private busy = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private seq = 0;
  private listeners = new Set<() => void>();

  constructor(
    initial: GameView | null,
    private timing: Timing = DEFAULT_TIMING,
  ) {
    this.prev = initial;
    this.snap = { shown: initial ? initial.trick.map((p) => this.entry(p.seat, p.card)) : [], sweepTo: null, idle: true };
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): TrickSnapshot => this.snap;

  update(next: GameView | null): void {
    if (!next) {
      this.hardReset();
      this.prev = null;
      return;
    }
    if (!this.prev) {
      // First game state we see (joined or resumed mid-trick): show it as is.
      this.hardReset();
      this.set({ shown: next.trick.map((p) => this.entry(p.seat, p.card)), sweepTo: null, idle: true });
      this.prev = next;
      return;
    }
    const events = diffGame(this.prev, next);
    this.prev = next;
    for (const e of events) {
      if (e.type === 'reset') this.hardReset();
      else this.queue.push(e);
    }
    this.pump();
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.queue = [];
    this.busy = false;
  }

  private entry(seat: number, card: Card): ShownCard {
    return { key: `c${this.seq++}`, seat, card };
  }

  private set(s: TrickSnapshot): void {
    this.snap = s;
    this.listeners.forEach((l) => l());
  }

  private hardReset(): void {
    this.dispose();
    this.set({ shown: [], sweepTo: null, idle: true });
  }

  private pump(): void {
    if (this.busy) return;
    const e = this.queue.shift();
    if (!e) {
      if (!this.snap.idle) this.set({ ...this.snap, idle: true });
      return;
    }
    this.busy = true;
    if (e.type === 'played') {
      this.set({ shown: [...this.snap.shown, this.entry(e.seat, e.card)], sweepTo: null, idle: false });
      this.wait(this.timing.playMs, () => this.next());
    } else if (e.type === 'trickWon') {
      this.set({ ...this.snap, idle: false });
      this.wait(this.timing.holdMs, () => {
        this.set({ ...this.snap, sweepTo: e.seat });
        this.wait(this.timing.sweepMs, () => {
          this.set({ shown: [], sweepTo: null, idle: false });
          this.next();
        });
      });
    }
  }

  private next(): void {
    this.busy = false;
    this.pump();
  }

  private wait(ms: number, fn: () => void): void {
    this.timer = setTimeout(() => {
      this.timer = null;
      fn();
    }, ms);
  }
}
