// Pure timing maths for the card-dealing animation (kept free of React Native so it can be unit tested).

/** Cards in a pack, and how long one card takes to fly from the middle to a player. */
export const DECK = 52;
export const FLIGHT_MS = 320;

export interface DealProgress {
  /** Cards that have left the middle. */
  launched: number;
  /** Cards that have arrived (the first `landed` cards of the deal are in the players' hands). */
  landed: number;
}

/** Cards are dealt one by one, clockwise from the player after the dealer, over `dealMs`. */
export function dealProgress(elapsed: number, dealMs: number): DealProgress {
  if (dealMs <= FLIGHT_MS || elapsed >= dealMs) return { launched: DECK, landed: DECK };
  const per = (dealMs - FLIGHT_MS) / (DECK - 1);
  const clamp = (n: number) => Math.max(0, Math.min(DECK, n));
  return {
    launched: clamp(Math.floor(elapsed / per) + 1),
    landed: clamp(Math.floor((elapsed - FLIGHT_MS) / per) + 1),
  };
}

/** How many of the first `landed` cards went to the player in dealing position `k` (0 = first to receive). */
export const cardsReceived = (landed: number, k: number): number => Math.max(0, Math.floor((landed + 3 - k) / 4));
