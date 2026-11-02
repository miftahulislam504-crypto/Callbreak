// Where everything sits on a drawn playing card. Pure numbers, no React, so the layouts can be tested.
// All sizes follow the card `width`; positions inside the pip field are fractions (0 to 1).

export const CARD_RATIO = 1.4;

export interface CardSize {
  width: number;
  height: number;
  radius: number;
}

export function cardSize(width: number): CardSize {
  return { width, height: Math.round(width * CARD_RATIO), radius: Math.max(3, Math.round(width * 0.1)) };
}

/** Font sizes of the corner index (rank over suit). `full` cards have a smaller index to leave room for the pips. */
export function cornerSizes(width: number, label: string, full: boolean): { rank: number; suit: number } {
  const long = label.length > 1;
  return full
    ? { rank: width * (long ? 0.19 : 0.24), suit: width * 0.17 }
    : { rank: width * (long ? 0.27 : 0.32), suit: width * 0.26 };
}

// ---- pips (2 to 10) -------------------------------------------------------------------------------------

export interface PipSpot {
  /** 0 = left column, 0.5 = middle, 1 = right column of the pip field. */
  x: number;
  /** 0 = top row, 1 = bottom row of the pip field. */
  y: number;
}

const L = 0;
const C = 0.5;
const R = 1;
const T3 = 1 / 3;

const LAYOUT: Record<number, [number, number][]> = {
  2: [[C, 0], [C, 1]],
  3: [[C, 0], [C, 0.5], [C, 1]],
  4: [[L, 0], [R, 0], [L, 1], [R, 1]],
  5: [[L, 0], [R, 0], [C, 0.5], [L, 1], [R, 1]],
  6: [[L, 0], [R, 0], [L, 0.5], [R, 0.5], [L, 1], [R, 1]],
  7: [[L, 0], [R, 0], [C, 0.25], [L, 0.5], [R, 0.5], [L, 1], [R, 1]],
  8: [[L, 0], [R, 0], [C, 0.25], [L, 0.5], [R, 0.5], [C, 0.75], [L, 1], [R, 1]],
  9: [[L, 0], [R, 0], [L, T3], [R, T3], [C, 0.5], [L, 2 * T3], [R, 2 * T3], [L, 1], [R, 1]],
  10: [[L, 0], [R, 0], [C, 1 / 6], [L, T3], [R, T3], [L, 2 * T3], [R, 2 * T3], [C, 5 / 6], [L, 1], [R, 1]],
};

/**
 * The pips of a number card (2 to 10), in the pip field. Aces, face cards and unknown ranks have none.
 * All pips stand upright (a real card turns the lower ones upside down): an upside-down heart looks like a spade,
 * and in Call Break spades are trump.
 */
export function pipSpots(rank: number): PipSpot[] {
  return (LAYOUT[rank] ?? []).map(([x, y]) => ({ x, y }));
}

export interface PipField {
  /** Top-left corner and size of the area the pips are spread over (pixels, centres of the outer pips). */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Font size of one pip. */
  size: number;
}

export function pipField(width: number): PipField {
  const { height } = cardSize(width);
  return { left: width * 0.355, top: height * 0.205, width: width * 0.29, height: height * 0.59, size: width * 0.19 };
}

// ---- face cards, aces ----------------------------------------------------------------------------------

/** The framed box in the middle of J, Q and K. `crest` cards get a taller one to fit the crown. */
export function faceFrame(width: number, crest: boolean): { width: number; height: number } {
  const { height } = cardSize(width);
  return { width: width * 0.5, height: height * (crest ? 0.6 : 0.56) };
}

/** Font size of the big suit on an ace (or on any number card of a "single" design). */
export function bigSuitSize(width: number, rank: number, full: boolean): { size: number; line: number } {
  if (rank === 14) return full ? { size: width * 0.6, line: width * 0.7 } : { size: width * 0.7, line: width * 0.8 };
  return { size: width * 0.5, line: width * 0.58 };
}

/** Diameter of the ring around the big suit of an ace (0.74 of the width) or of a number card on a "single" design. */
export function ringSize(width: number, rank: number): number {
  return width * (rank === 14 ? 0.74 : 0.62);
}

/** The soft drop shadow under every card. */
export const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.35,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
} as const;
