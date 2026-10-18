// Pure logic: turns two consecutive server states into the table events the UI should animate.
import type { Card, GameView } from './types';

export type TableEvent =
  | { type: 'played'; seat: number; card: Card }
  | { type: 'trickWon'; seat: number }
  | { type: 'reset' };

const tricksDone = (g: GameView): number => g.tricksWon.reduce((a, b) => a + b, 0);
const played = (p: { seat: number; card: Card }): TableEvent => ({ type: 'played', seat: p.seat, card: p.card });

/**
 * The server sends a full state after every move, so animations are derived by diffing.
 * Handles a trick completing (the 4th card only ever shows up in `lastTrick`), the next leader
 * already playing, and gaps (reconnect) by falling back to a reset.
 */
export function diffGame(prev: GameView | null, next: GameView): TableEvent[] {
  if (!prev) return [];
  if (next.phase === 'lobby') return [{ type: 'reset' }];
  if (next.round !== prev.round || next.history.length < prev.history.length) return [{ type: 'reset' }];

  const before = tricksDone(prev);
  const after = tricksDone(next);
  if (after < before) return [{ type: 'reset' }];

  if (after === before) {
    if (next.trick.length < prev.trick.length) return [{ type: 'reset' }];
    return next.trick.slice(prev.trick.length).map(played);
  }

  if (after === before + 1 && next.lastTrick) {
    return [
      ...next.lastTrick.cards.slice(prev.trick.length).map(played),
      { type: 'trickWon', seat: next.lastTrick.winner },
      ...next.trick.map(played),
    ];
  }

  // Missed more than one trick: show where we are now, without replaying.
  return [{ type: 'reset' }, ...next.trick.map(played)];
}
