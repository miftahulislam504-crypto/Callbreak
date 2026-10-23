import type { GameId } from './types';

export interface GameInfo {
  id: GameId;
  /** i18n key of the game's name. */
  titleKey: 'gameCallbreak' | 'gameTwentynine' | 'gamePoker';
  /** Ionicons name. */
  icon: 'layers' | 'people' | 'logo-bitcoin';
  /** Seats at the table. */
  seats: number;
  /** Fewest players the host may start with (bots count). */
  minPlayers: number;
}

export const GAME_LIST: GameInfo[] = [
  { id: 'callbreak', titleKey: 'gameCallbreak', icon: 'layers', seats: 4, minPlayers: 4 },
  { id: 'twentynine', titleKey: 'gameTwentynine', icon: 'people', seats: 4, minPlayers: 4 },
  { id: 'poker', titleKey: 'gamePoker', icon: 'logo-bitcoin', seats: 6, minPlayers: 2 },
];

export const gameInfo = (id: GameId): GameInfo => GAME_LIST.find((g) => g.id === id) ?? GAME_LIST[0];

/** 29: game points a team needs to win. */
export const TN_TARGETS = [2, 3, 5, 7];
export const TN_DEFAULT_TARGET = 3;

/** Poker: starting stacks (play-money chips). */
export const POKER_CHIPS = [500, 1000, 2000, 5000];
export const POKER_DEFAULT_CHIPS = 1000;
