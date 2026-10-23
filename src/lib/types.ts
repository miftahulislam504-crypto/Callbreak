// Mirrors the server's wire format (callbreak-server: engine/game.ts + rooms/CallBreakRoom.ts).
export type Suit = 'S' | 'H' | 'D' | 'C';
export interface Card {
  suit: Suit;
  rank: number; // 2..14 (J=11 Q=12 K=13 A=14)
}
export interface PlayedCard {
  seat: number;
  card: Card;
}
export type Phase = 'lobby' | 'dealing' | 'bidding' | 'playing' | 'roundEnd' | 'finished';

export interface RoundResult {
  round: number;
  dealer: number;
  bids: number[];
  tricks: number[];
  scores10: number[];
  totals10: number[];
}

export interface GameView {
  phase: Phase;
  round: number;
  dealer: number;
  turn: number;
  targetScore: number;
  minBid: number;
  maxBid: number;
  maxRounds: number;
  myHand: Card[];
  legal: Card[];
  handCounts: number[];
  bids: (number | null)[];
  tricksWon: number[];
  trick: PlayedCard[];
  lastTrick: { cards: PlayedCard[]; winner: number } | null;
  /** Whole points. */
  totals: number[];
  history: RoundResult[];
  winners: number[] | null;
  ranking: number[] | null;
}

export type RoomStatus = 'lobby' | 'dealing' | 'bidding' | 'playing' | 'roundEnd' | 'finished';

export interface PublicSeat {
  seat: number;
  occupied: boolean;
  name: string;
  isBot: boolean;
  connected: boolean;
  auto: boolean;
  /** Done looking at the cards (bots always are). */
  ready?: boolean;
  /** The player's account id (humans only), so you can add them as a friend. */
  uid?: string | null;
}

export interface RoomView {
  /** Absent on views from older servers: that always means Call Break. */
  gameId?: 'callbreak';
  roomCode: string;
  roomName: string;
  isPrivate: boolean;
  status: RoomStatus;
  hostSeat: number;
  mySeat: number;
  targetScore: number;
  seats: PublicSeat[];
  deadline: number | null;
  nextRoundAt: number | null;
  /** Dealing phase: epoch ms the cards were dealt, how long the dealing animation and the look-at-cards time last. */
  dealAt?: number | null;
  dealMs?: number;
  viewMs?: number;
  serverTime: number;
  /** How long a human has to bid / play. */
  bidSeconds: number;
  playSeconds: number;
  game: GameView | null;
}

/** One row of GET /rooms. */
export interface PublicRoom {
  roomCode: string;
  clients: number;
  maxClients: number;
  name: string;
  /** Call Break: target score. 29: game points to win. Absent in poker rooms. */
  targetScore?: number;
  /** Poker rooms: everyone's starting chips. */
  startingChips?: number;
  humans: number;
  bots: number;
  status: string;
  host: string;
}

export interface ServerError {
  code: string;
  message: string;
}

/** Why the server gave no voice token (the `reason` of a refused `voice` message). */
export type VoiceDeniedReason = 'disabled' | 'not_seated' | 'rate_limited';

/** The server's "yes": everything needed to join the voice channel. */
export interface VoiceGrant {
  enabled: true;
  appId: string;
  /** Agora channel: "cb-<roomCode>". */
  channel: string;
  /** Agora uid: seat + 1 (1..4), so "who is speaking" maps straight to a seat. */
  uid: number;
  token: string;
  /** Epoch ms when the token stops working. */
  expiresAt: number;
}

/** The server's "no". */
export interface VoiceDenied {
  enabled: false;
  reason: VoiceDeniedReason;
}

/** The server's answer to `voiceToken` (the `voice` message). */
export type VoiceInfo = VoiceGrant | VoiceDenied;

/* ----------------------------------------------------------------------------
 * Games
 * ------------------------------------------------------------------------- */

export type GameId = 'callbreak' | 'twentynine' | 'poker';

/** The fields every game's room view carries (lobby, voice and friends only need these). */
export interface CommonRoomView {
  gameId?: GameId;
  roomCode: string;
  roomName: string;
  isPrivate: boolean;
  status: string;
  hostSeat: number;
  mySeat: number;
  seats: PublicSeat[];
  deadline: number | null;
  nextRoundAt: number | null;
  dealAt?: number | null;
  serverTime: number;
}

/* ------------------------------ 29 ------------------------------ */
// Mirrors the server's engine/twentynine.ts + rooms/TwentyNineRoom.ts.

export type TNPhase = 'lobby' | 'dealing' | 'bidding' | 'trump' | 'playing' | 'roundEnd' | 'finished';

export interface TNPlayed {
  seat: number;
  card: Card;
  /** The card was played as trump (trump had already been shown). */
  asTrump: boolean;
}

export interface TNRoundResult {
  round: number;
  dealer: number;
  declarer: number;
  contract: number;
  /** Points the bidder's team had to reach (the bid, moved by a pair). */
  need: number;
  trumpSuit: Suit;
  pairTeam: number | null;
  /** Card points per team (includes the last-trick bonus). */
  teamPoints: number[];
  success: boolean;
  delta: number[];
  totals: number[];
}

export interface TNGameView {
  phase: TNPhase;
  round: number;
  dealer: number;
  turn: number;
  targetScore: number;
  minBid: number;
  maxBid: number;
  maxRounds: number;
  myHand: Card[];
  legal: Card[];
  /** I may ask for the hidden trump to be shown right now. */
  canReveal: boolean;
  handCounts: number[];
  /** Last bid per seat: a number, 0 = pass, null = has not acted. */
  bids: (number | null)[];
  highBid: number;
  highBidder: number;
  /** Everyone else passed and it is my turn: I cannot pass. */
  forcedBid: boolean;
  declarer: number;
  contract: number;
  need: number;
  /** The trump suit if I may know it (I am the bidder, or it was shown); otherwise null. */
  trumpSuit: Suit | null;
  trumpRevealed: boolean;
  /** Trump has been picked but is hidden from me. */
  trumpHidden: boolean;
  revealedBy: number;
  pair: { seat: number; team: number } | null;
  tricksWon: number[];
  /** Card points per team so far this round. */
  teamPoints: number[];
  trick: TNPlayed[];
  lastTrick: { cards: TNPlayed[]; winner: number; points: number } | null;
  /** Game points per team (team 0 = seats 0 and 2, team 1 = seats 1 and 3). */
  totals: number[];
  history: TNRoundResult[];
  winners: number[] | null;
  ranking: number[] | null;
}

export interface TNRoomView extends CommonRoomView {
  gameId: 'twentynine';
  status: TNPhase;
  targetScore: number;
  dealMs: number;
  viewMs: number;
  bidSeconds: number;
  playSeconds: number;
  game: TNGameView | null;
}

/* ------------------------------ Poker ------------------------------ */
// Mirrors the server's engine/poker.ts + rooms/PokerRoom.ts.

export type PokerPhase = 'lobby' | 'betting' | 'handEnd' | 'finished';
export type Street = 'preflop' | 'flop' | 'turn' | 'river';
export type PokerActionType = 'fold' | 'check' | 'call' | 'raise' | 'allin';

export interface LegalActions {
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canRaise: boolean;
  /** "Raise to": the total bet for this street. */
  minRaiseTo: number;
  maxRaiseTo: number;
}

export interface PokerPlayerView {
  seat: number;
  inGame: boolean;
  inHand: boolean;
  chips: number;
  bet: number;
  folded: boolean;
  allIn: boolean;
  /** 'sb' | 'bb' | 'fold' | 'check' | 'call' | 'raise' | 'allin' | null */
  lastAction: string | null;
  /** Cards everyone may see (showdown only). */
  shown: Card[] | null;
}

export interface PokerPotResult {
  amount: number;
  winners: number[];
  eligible: number[];
}

export interface PokerHandResult {
  handNo: number;
  board: Card[];
  showdown: boolean;
  pots: PokerPotResult[];
  players: { seat: number; hole: Card[] | null; handName: string | null; folded: boolean; delta: number; chips: number }[];
  winners: number[];
}

export interface PokerGameView {
  phase: PokerPhase;
  handNo: number;
  maxHands: number;
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
  handsToNextLevel: number;
  button: number;
  sbSeat: number;
  bbSeat: number;
  street: Street;
  board: Card[];
  /** Everything in the middle, current bets included. */
  pot: number;
  turn: number;
  currentBet: number;
  players: PokerPlayerView[];
  myHole: Card[];
  /** What I can do right now; null when it is not my turn. */
  actions: LegalActions | null;
  lastResult: PokerHandResult | null;
  winners: number[] | null;
  ranking: number[] | null;
}

export interface PokerRoomView extends CommonRoomView {
  gameId: 'poker';
  status: PokerPhase;
  startingChips: number;
  actionSeconds: number;
  game: PokerGameView | null;
}

/** Whatever game the player is in. */
export type AnyRoomView = RoomView | TNRoomView | PokerRoomView;

export const isTwentyNine = (v: AnyRoomView | null | undefined): v is TNRoomView => v?.gameId === 'twentynine';
export const isPoker = (v: AnyRoomView | null | undefined): v is PokerRoomView => v?.gameId === 'poker';
export const isCallBreak = (v: AnyRoomView | null | undefined): v is RoomView => !!v && v.gameId !== 'twentynine' && v.gameId !== 'poker';
export const gameIdOf = (v: { gameId?: GameId } | null | undefined): GameId => v?.gameId ?? 'callbreak';
