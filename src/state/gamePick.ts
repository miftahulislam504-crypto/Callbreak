import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { GameId } from '@/lib/types';

const KEY = 'cb.game';
const VALID: GameId[] = ['callbreak', 'twentynine', 'poker'];

/** The game the home, quick match and new-room screens are set to (remembered between launches). */
export const useGamePick = create<{ game: GameId; setGame(g: GameId): void; load(): Promise<void> }>((set) => ({
  game: 'callbreak',
  setGame(g) {
    set({ game: g });
    void AsyncStorage.setItem(KEY, g).catch(() => undefined);
  },
  async load() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw && (VALID as string[]).includes(raw)) set({ game: raw as GameId });
    } catch {
      // keep the default
    }
  },
}));
