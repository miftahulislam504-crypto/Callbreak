import type { Card, Suit } from './types';

export const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const RANK_LABEL: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

export const cardLabel = (c: Card): string => `${SUIT_SYMBOL[c.suit]}${RANK_LABEL[c.rank] ?? c.rank}`;
export const isRed = (c: Card): boolean => c.suit === 'H' || c.suit === 'D';
