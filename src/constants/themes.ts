// The looks a player can pick: card designs, card backs and table (board) designs.
// Pure data, no React, so it can be tested and read from anywhere. Colours that belong to ONE look live here
// (like palette.ts, but per look); colours shared by the whole app stay in palette.ts.
// Adding a look = add its id to the union, one entry below, and (for a board) one case in components/table/Board.tsx.
import type { Suit } from '@/lib/types';

export type CardDesignId = 'classic' | 'royal' | 'midnight' | 'fourColor' | 'rose' | 'emerald';
export type CardBackId = 'sapphire' | 'crimson' | 'night' | 'rainbow' | 'blossom' | 'jade';
export type BoardId = 'walnut' | 'felt' | 'velvet' | 'lounge' | 'twilight' | 'sunrise';

export interface Look {
  card: CardDesignId;
  back: CardBackId;
  board: BoardId;
}

/** What a new player (and "Reset") gets: the original look of the game. */
export const DEFAULT_LOOK: Look = { card: 'classic', back: 'sapphire', board: 'walnut' };

// ---- card faces ---------------------------------------------------------------------------------------

export interface CardDesign {
  id: CardDesignId;
  name: string;
  /** The card back that goes with this face (picked together until the player chooses a back of their own). */
  back: CardBackId;
  paper: string;
  edge: string;
  edgeWidth: number;
  /** Colour of each suit. Four different colours = a four-colour deck. */
  ink: Record<Suit, string>;
  /** Fine lines, crowns and rings. */
  accent: string;
  /** A fine inner line a little inside the edge. */
  frame: boolean;
  /** 'single' = one big suit in the middle, 'full' = the traditional pip layouts (2 to 10 pips). */
  pips: 'single' | 'full';
  /** J, Q and K get a shield / crown above the letter. */
  crest: boolean;
  /** A thin ring around the big suit (aces on "full" designs, every number card on "single" ones). */
  ring: boolean;
  /** Typeface of the corner numbers. */
  type: 'display' | 'serif' | 'sans';
  /** A thin bar in the suit colour along the top edge, so the suit shows even on a half-covered card. */
  topBar: boolean;
  /** Layer over a card that cannot be played right now. */
  dim: string;
}

export const CARD_DESIGNS: Record<CardDesignId, CardDesign> = {
  // The original look of the game.
  classic: {
    id: 'classic', name: 'Classic', back: 'sapphire',
    paper: '#FFFDF7', edge: '#CFCABD', edgeWidth: 1,
    ink: { S: '#1B1B1F', C: '#1B1B1F', H: '#D9363E', D: '#D9363E' },
    accent: '#1B1B1F', frame: false, pips: 'single', crest: false, ring: false, type: 'display', topBar: false,
    dim: 'rgba(20,20,20,0.5)',
  },
  royal: {
    id: 'royal', name: 'Royal Court', back: 'crimson',
    paper: '#FBF3DC', edge: '#C9A24B', edgeWidth: 1.5,
    ink: { S: '#1D2340', C: '#1D2340', H: '#B3202F', D: '#B3202F' },
    accent: '#B8892B', frame: true, pips: 'full', crest: true, ring: true, type: 'serif', topBar: false,
    dim: 'rgba(40,24,8,0.5)',
  },
  midnight: {
    id: 'midnight', name: 'Midnight', back: 'night',
    paper: '#171B33', edge: '#3F4678', edgeWidth: 1.5,
    ink: { S: '#E9ECFF', C: '#E9ECFF', H: '#FF6482', D: '#FF6482' },
    accent: '#F2C14E', frame: true, pips: 'single', crest: true, ring: false, type: 'display', topBar: false,
    dim: 'rgba(4,6,18,0.58)',
  },
  // Four colours so spades (always trump in Call Break) and clubs can never be mixed up.
  fourColor: {
    id: 'fourColor', name: 'Four Colour', back: 'rainbow',
    paper: '#FBFCFF', edge: '#C5CDE0', edgeWidth: 1,
    ink: { S: '#1C1C24', H: '#D8323F', D: '#1F6FE0', C: '#0F7D3E' },
    accent: '#1C1C24', frame: false, pips: 'single', crest: false, ring: false, type: 'sans', topBar: true,
    dim: 'rgba(20,20,30,0.5)',
  },
  rose: {
    id: 'rose', name: 'Rose Quartz', back: 'blossom',
    paper: '#FFF4F1', edge: '#E3B4B6', edgeWidth: 1.5,
    ink: { S: '#4A1D3F', C: '#4A1D3F', H: '#D6336C', D: '#D6336C' },
    accent: '#B86A7E', frame: true, pips: 'full', crest: true, ring: true, type: 'serif', topBar: false,
    dim: 'rgba(52,16,36,0.48)',
  },
  emerald: {
    id: 'emerald', name: 'Emerald', back: 'jade',
    paper: '#F3FBF5', edge: '#A6CBB4', edgeWidth: 1.5,
    ink: { S: '#0D3B2A', C: '#0D3B2A', H: '#C2312F', D: '#C2312F' },
    accent: '#B8942F', frame: true, pips: 'single', crest: true, ring: true, type: 'display', topBar: false,
    dim: 'rgba(6,36,26,0.5)',
  },
};

export const CARD_DESIGN_LIST: CardDesign[] = [
  CARD_DESIGNS.classic, CARD_DESIGNS.royal, CARD_DESIGNS.midnight,
  CARD_DESIGNS.fourColor, CARD_DESIGNS.rose, CARD_DESIGNS.emerald,
];

// ---- card backs ---------------------------------------------------------------------------------------

export type BackPattern = 'diamond' | 'lattice' | 'stars' | 'suits' | 'rosette' | 'star8';

export interface CardBack {
  id: CardBackId;
  name: string;
  pattern: BackPattern;
  /** Main colour of the back. */
  base: string;
  /** The border around it (the "paper" of the card). */
  rim: string;
  /** Pattern lines, a soft fill for pattern shapes, and the centre mark. */
  line: string;
  fill: string;
  glyph: string;
}

export const CARD_BACKS: Record<CardBackId, CardBack> = {
  // The original back of the game.
  sapphire: {
    id: 'sapphire', name: 'Sapphire', pattern: 'diamond',
    base: '#1F4E9E', rim: '#F4F1E8', line: 'rgba(255,255,255,0.35)', fill: 'rgba(255,255,255,0.18)', glyph: 'rgba(255,255,255,0.75)',
  },
  crimson: {
    id: 'crimson', name: 'Crimson Gold', pattern: 'lattice',
    base: '#6E1226', rim: '#E7C57A', line: 'rgba(231,197,122,0.5)', fill: 'rgba(231,197,122,0.2)', glyph: '#F1D58E',
  },
  night: {
    id: 'night', name: 'Night Sky', pattern: 'stars',
    base: '#141A3C', rim: '#D9B45A', line: 'rgba(242,193,78,0.6)', fill: 'rgba(242,193,78,0.16)', glyph: '#F2C14E',
  },
  rainbow: {
    id: 'rainbow', name: 'Four Suits', pattern: 'suits',
    base: '#0F6E6B', rim: '#F7F7F2', line: 'rgba(255,255,255,0.4)', fill: 'rgba(255,255,255,0.14)', glyph: '#FFFFFF',
  },
  blossom: {
    id: 'blossom', name: 'Blossom', pattern: 'rosette',
    base: '#B83A6B', rim: '#FFF1EE', line: 'rgba(255,241,238,0.65)', fill: 'rgba(255,241,238,0.2)', glyph: '#FFE9E4',
  },
  jade: {
    id: 'jade', name: 'Jade Star', pattern: 'star8',
    base: '#0E5C45', rim: '#E9D9A6', line: 'rgba(233,217,166,0.6)', fill: 'rgba(233,217,166,0.2)', glyph: '#F0DFA8',
  },
};

export const CARD_BACK_LIST: CardBack[] = [
  CARD_BACKS.sapphire, CARD_BACKS.crimson, CARD_BACKS.night,
  CARD_BACKS.rainbow, CARD_BACKS.blossom, CARD_BACKS.jade,
];

// ---- boards (the table cloth behind everything) ---------------------------------------------------------

export interface BoardDesign {
  id: BoardId;
  name: string;
  /** Behind the screen edges (a notch at the side) and under the cloth; also the darkest tone of the board. */
  edge: string;
  /** Top, middle and bottom colour of the cloth. */
  cloth: [string, string, string];
  /** Soft light in the middle of the table, as an "r,g,b" triple for rgba(). */
  glow: string;
  /** Fine lines and ornaments. */
  line: string;
  /** The one bright thing on the board: gold trim, the moon, the sun. */
  accent: string;
}

export const BOARDS: Record<BoardId, BoardDesign> = {
  // The original wooden planks (drawn from WOOD in palette.ts).
  walnut: {
    id: 'walnut', name: 'Walnut',
    edge: '#5A3718', cloth: ['#B8793F', '#AD6E38', '#A86A36'], glow: '255,214,138', line: 'rgba(90,50,20,0.25)', accent: '#F2C14E',
  },
  felt: {
    id: 'felt', name: 'Emerald Felt',
    edge: '#06241A', cloth: ['#14724A', '#0E5A3A', '#08402B'], glow: '31,160,106', line: 'rgba(242,193,78,0.3)', accent: '#F2C14E',
  },
  velvet: {
    id: 'velvet', name: 'Royal Velvet',
    edge: '#081634', cloth: ['#1D4390', '#142F6C', '#0B1D4A'], glow: '90,140,255', line: 'rgba(242,193,78,0.36)', accent: '#F2C14E',
  },
  lounge: {
    id: 'lounge', name: 'Crimson Lounge',
    edge: '#2A050F', cloth: ['#7A1B33', '#5A1024', '#3A0816'], glow: '255,120,140', line: 'rgba(255,214,138,0.1)', accent: '#F2C14E',
  },
  twilight: {
    id: 'twilight', name: 'Twilight',
    edge: '#0B0828', cloth: ['#35238A', '#241A66', '#120D3A'], glow: '160,140,255', line: 'rgba(255,255,255,0.7)', accent: '#E8E0FF',
  },
  sunrise: {
    id: 'sunrise', name: 'Green Sunrise',
    edge: '#04281C', cloth: ['#0F6B4B', '#0A4F38', '#063828'], glow: '40,200,140', line: 'rgba(255,231,163,0.3)', accent: '#D7263D',
  },
};

export const BOARD_LIST: BoardDesign[] = [
  BOARDS.walnut, BOARDS.felt, BOARDS.velvet, BOARDS.lounge, BOARDS.twilight, BOARDS.sunrise,
];

// ---- helpers --------------------------------------------------------------------------------------------

/** "#RRGGBB" + opacity -> "rgba(r,g,b,a)". Anything that is not a 6-digit hex comes back unchanged. */
export function withAlpha(hex: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const has = (o: object, k: unknown): boolean => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);

/** Reads the saved look. Anything missing or unknown (an old save, a look that was removed) falls back to the default. */
export function parseLook(raw: string | null | undefined): Look {
  if (!raw) return { ...DEFAULT_LOOK };
  try {
    const o = JSON.parse(raw) as Partial<Record<keyof Look, unknown>> | null;
    if (!o || typeof o !== 'object') return { ...DEFAULT_LOOK };
    return {
      card: has(CARD_DESIGNS, o.card) ? (o.card as CardDesignId) : DEFAULT_LOOK.card,
      back: has(CARD_BACKS, o.back) ? (o.back as CardBackId) : DEFAULT_LOOK.back,
      board: has(BOARDS, o.board) ? (o.board as BoardId) : DEFAULT_LOOK.board,
    };
  } catch {
    return { ...DEFAULT_LOOK };
  }
}
