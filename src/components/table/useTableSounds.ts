import { useEffect, useRef } from 'react';

import { dealProgress } from '@/lib/dealing';
import { ownPlayRecently, sfx } from '@/lib/sound';
import type { TrickSnapshot } from '@/lib/trickPlayer';

import type { DealClock } from './hooks';

/**
 * The sounds of the cards on the table, driven by the same animated state the screen draws:
 * a card landing makes its slap, a finished trick being swept away makes its whoosh.
 * Your own card already played its sound when you tapped it, so the echo is skipped (unless the game
 * played it for you because your timer ran out).
 */
export function useTrickSounds(trick: TrickSnapshot, mySeat: number): void {
  const shownCount = useRef(trick.shown.length);
  const swept = useRef(trick.sweepTo);
  useEffect(() => {
    if (trick.shown.length > shownCount.current) {
      const fresh = trick.shown.slice(shownCount.current);
      if (fresh.some((c) => c.seat !== mySeat || !ownPlayRecently())) sfx('card_play');
    }
    shownCount.current = trick.shown.length;
    if (trick.sweepTo !== null && swept.current === null) sfx('trick_win');
    swept.current = trick.sweepTo;
  }, [trick, mySeat]);
}

/** One flick per card leaving the pack while the deal animation runs, and the start sound of a new deal. */
export function useDealSounds(clock: DealClock | null, round: number | undefined): void {
  const launched = useRef(0);
  const active = useRef(false);
  useEffect(() => {
    if (!clock) {
      active.current = false;
      launched.current = 0;
      return;
    }
    if (!active.current) {
      active.current = true;
      launched.current = 0;
      if (round === 1) sfx('start');
    }
    if (clock.stage === 'dealing') {
      const n = dealProgress(clock.elapsed, clock.dealMs).launched;
      if (n > launched.current) {
        launched.current = n;
        sfx('card_deal');
      }
    }
  });
}

/**
 * Ticks once a second for the last five seconds of your own turn, so nobody loses a turn by surprise.
 * Uses plain timers (no state), so the table is not re-drawn four times a second just for this.
 */
export function useTurnTicks(active: boolean, deadline: number | null, serverTime: number): void {
  useEffect(() => {
    if (!active || deadline === null) return;
    const endLocal = Date.now() + (deadline - serverTime);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let s = 5; s >= 1; s--) {
      const wait = endLocal - s * 1000 - Date.now();
      if (wait > -150) timers.push(setTimeout(() => sfx('tick'), Math.max(0, wait)));
    }
    return () => timers.forEach(clearTimeout);
  }, [active, deadline, serverTime]);
}
