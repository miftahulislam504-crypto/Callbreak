import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
  BOARDS, CARD_DESIGNS, DEFAULT_LOOK, parseLook,
  type BoardDesign, type BoardId, type CardBackId, type CardDesignId, type Look,
} from '@/constants/themes';

const KEY = 'cb.look';

interface LookState extends Look {
  setCard(id: CardDesignId): void;
  setBack(id: CardBackId): void;
  setBoard(id: BoardId): void;
  /** Back to the original look of the game. */
  reset(): void;
  load(): Promise<void>;
}

function save(l: Look): void {
  void AsyncStorage.setItem(KEY, JSON.stringify({ card: l.card, back: l.back, board: l.board })).catch(() => undefined);
}

/**
 * The look the player picked for cards and table (remembered between launches). Every PlayingCard and the
 * table board read it, so a change shows up everywhere at once: the hand, the trick, the home page fan.
 */
export const useLook = create<LookState>((set, get) => ({
  ...DEFAULT_LOOK,
  setCard(id) {
    // A back that still belongs to the old face moves along to the new face; a back the player chose stays.
    const cur = get();
    const follows = cur.back === CARD_DESIGNS[cur.card].back;
    set({ card: id, back: follows ? CARD_DESIGNS[id].back : cur.back });
    save(get());
  },
  setBack(id) {
    set({ back: id });
    save(get());
  },
  setBoard(id) {
    set({ board: id });
    save(get());
  },
  reset() {
    set({ ...DEFAULT_LOOK });
    save(get());
  },
  async load() {
    try {
      set(parseLook(await AsyncStorage.getItem(KEY)));
    } catch {
      // keep the default look
    }
  },
}));

/** The picked board (its colours are also used behind the screen edges). */
export const useBoard = (): BoardDesign => BOARDS[useLook((s) => s.board)];

// Read the saved look as soon as the app starts, so no screen has to remember to do it.
void useLook.getState().load();
