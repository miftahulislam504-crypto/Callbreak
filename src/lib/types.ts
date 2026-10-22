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
  targetScore: number;
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
