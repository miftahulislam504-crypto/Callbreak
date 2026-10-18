import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { TrickPlayer, type TrickSnapshot } from '@/lib/trickPlayer';
import type { GameView, RoomView } from '@/lib/types';

import type { TurnTimer } from './TimerBar';

/** What is on the table right now, animated in order (see lib/trickPlayer). */
export function useTrickDisplay(game: GameView | null): TrickSnapshot {
  const [player] = useState(() => new TrickPlayer(game));
  useEffect(() => {
    player.update(game);
  }, [player, game]);
  useEffect(() => () => player.dispose(), [player]);
  return useSyncExternalStore(player.subscribe, player.getSnapshot);
}

// Matches the server defaults (CB_BID_SECONDS / CB_PLAY_SECONDS); only used to size the bar.
const BID_MS = 20_000;
const PLAY_MS = 30_000;

/** The countdown of the human whose turn it is (the server sends no deadline for bots). */
export function useTurnTimer(view: RoomView | null): { seat: number; timer: TurnTimer } | null {
  return useMemo(() => {
    const g = view?.game;
    if (!view || !g || view.deadline === null) return null;
    if (g.phase !== 'bidding' && g.phase !== 'playing') return null;
    const remainingMs = Math.max(0, view.deadline - view.serverTime);
    const totalMs = Math.max(g.phase === 'bidding' ? BID_MS : PLAY_MS, remainingMs);
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
