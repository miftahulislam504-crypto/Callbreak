import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { TrickPlayer, type TrickSnapshot } from '@/lib/trickPlayer';
import type { TrickSource } from '@/lib/tableEvents';
import type { RoomView } from '@/lib/types';

import type { TurnTimer } from './TimerBar';

/** What is on the table right now, animated in order (see lib/trickPlayer). */
export function useTrickDisplay(game: TrickSource | null): TrickSnapshot {
  const [player] = useState(() => new TrickPlayer(game));
  useEffect(() => {
    player.update(game);
  }, [player, game]);
  useEffect(() => () => player.dispose(), [player]);
  return useSyncExternalStore(player.subscribe, player.getSnapshot);
}

// Fallbacks for an older server that does not send its turn lengths.
const BID_MS = 20_000;
const PLAY_MS = 30_000;

/** What the turn countdown needs from a Call Break or 29 room view. */
export interface TimedView {
  deadline: number | null;
  serverTime: number;
  bidSeconds: number;
  playSeconds: number;
  game: { phase: string; turn: number } | null;
}

/** The countdown of the human whose turn it is (the server sends no deadline for bots). */
export function useTurnTimer(view: TimedView | null): { seat: number; timer: TurnTimer } | null {
  return useMemo(() => {
    const g = view?.game;
    if (!view || !g || view.deadline === null) return null;
    // 29 also has a trump-picking turn, which runs on the bidding clock.
    if (g.phase !== 'bidding' && g.phase !== 'trump' && g.phase !== 'playing') return null;
    const bidClock = g.phase !== 'playing';
    const remainingMs = Math.max(0, view.deadline - view.serverTime);
    const configured = bidClock ? view.bidSeconds * 1000 : view.playSeconds * 1000;
    const totalMs = Math.max(Number.isFinite(configured) && configured > 0 ? configured : bidClock ? BID_MS : PLAY_MS, remainingMs);
    return { seat: g.turn, timer: { key: String(view.deadline), remainingMs, totalMs } };
  }, [view]);
}

/** Whole seconds until a server timestamp; null when there is none. */
export function useCountdownSeconds(deadline: number | null, serverTime: number): number | null {
  const [secs, setSecs] = useState<number | null>(() =>
    deadline === null ? null : Math.max(0, Math.ceil((deadline - serverTime) / 1000)),
  );
  useEffect(() => {
    if (deadline === null) return;
    const endLocal = Date.now() + (deadline - serverTime);
    const id = setInterval(() => setSecs(Math.max(0, Math.ceil((endLocal - Date.now()) / 1000))), 250);
    return () => clearInterval(id);
  }, [deadline, serverTime]);
  return deadline === null ? null : secs;
}

// Fallbacks for an older server that does not send its dealing lengths.
const DEAL_MS = 3000;
const VIEW_MS = 5000;

export interface DealClock {
  /** ms since the cards were dealt. */
  elapsed: number;
  dealMs: number;
  viewMs: number;
  /** 'dealing' = cards flying out; 'viewing' = everyone looks at their hand before bidding. */
  stage: 'dealing' | 'viewing';
  /** Whole seconds until bidding starts. */
  secondsLeft: number;
}

/**
 * Clock for the "cards are being dealt, then everyone looks at them" phase. Null in every other
 * phase. Works from the server's timestamps, so a player who reconnects half way sees the right stage.
 */
export function useDealClock(view: RoomView | null): DealClock | null {
  const g = view?.game ?? null;
  const active = !!view && !!g && g.phase === 'dealing';
  const dealMs = view?.dealMs ?? DEAL_MS;
  const viewMs = view?.viewMs ?? VIEW_MS;
  const dealAt = view?.dealAt ?? null;
  const key = active ? `${g!.round}:${dealAt}` : '';

  // Local clock time the deal started, fixed once per deal (corrects for clock skew via serverTime).
  const startLocal = useMemo(() => {
    if (!key || !view) return 0;
    const already = dealAt !== null ? Math.max(0, view.serverTime - dealAt) : 0;
    return Date.now() - already;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const [, tick] = useState(0);
  useEffect(() => {
    if (!key) return;
    const id = setInterval(() => tick((n) => n + 1), 50);
    return () => clearInterval(id);
  }, [key]);

  if (!key) return null;
  const elapsed = Math.max(0, Date.now() - startLocal);
  const stage = elapsed < dealMs ? 'dealing' : 'viewing';
  const secondsLeft = Math.max(0, Math.ceil((dealMs + viewMs - elapsed) / 1000));
  return { elapsed, dealMs, viewMs, stage, secondsLeft };
}
