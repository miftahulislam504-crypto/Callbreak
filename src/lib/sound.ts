// The game's sound: short effects (cards, buttons, turns, results) and a quiet menu-music loop.
// Built on expo-audio (SDK 58). Like haptics, sound is a nicety: nothing in here may ever throw into the game.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { AppState } from 'react-native';
import { create } from 'zustand';

export type SfxName =
  | 'tap' | 'select' | 'tick'
  | 'card_play' | 'card_deal' | 'card_flip'
  | 'trick_win' | 'your_turn' | 'bid' | 'chips' | 'illegal'
  | 'round_end' | 'win' | 'lose' | 'start'
  | 'join' | 'leave' | 'notify';

// Metro needs literal require() paths, so every file is listed here. Regenerate them with scripts/make-sounds.py.
const SOURCES: Record<SfxName, number> = {
  tap: require('@/assets/sounds/tap.wav'),
  select: require('@/assets/sounds/select.wav'),
  tick: require('@/assets/sounds/tick.wav'),
  card_play: require('@/assets/sounds/card_play.wav'),
  card_deal: require('@/assets/sounds/card_deal.wav'),
  card_flip: require('@/assets/sounds/card_flip.wav'),
  trick_win: require('@/assets/sounds/trick_win.wav'),
  your_turn: require('@/assets/sounds/your_turn.wav'),
  bid: require('@/assets/sounds/bid.wav'),
  chips: require('@/assets/sounds/chips.wav'),
  illegal: require('@/assets/sounds/illegal.wav'),
  round_end: require('@/assets/sounds/round_end.wav'),
  win: require('@/assets/sounds/win.wav'),
  lose: require('@/assets/sounds/lose.wav'),
  start: require('@/assets/sounds/start.wav'),
  join: require('@/assets/sounds/join.wav'),
  leave: require('@/assets/sounds/leave.wav'),
  notify: require('@/assets/sounds/notify.wav'),
};
const MUSIC_SOURCE: number = require('@/assets/sounds/menu_music.wav');

/** How loud each effect is (0 to 1). Too loud or too quiet somewhere? Change the number here, no need to rebuild the files. */
export const SFX_GAIN: Record<SfxName, number> = {
  tap: 0.5, select: 0.45, tick: 0.5,
  card_play: 0.85, card_deal: 0.55, card_flip: 0.4,
  trick_win: 0.7, your_turn: 0.7, bid: 0.7, chips: 0.7, illegal: 0.55,
  round_end: 0.7, win: 0.9, lose: 0.7, start: 0.75,
  join: 0.6, leave: 0.5, notify: 0.7,
};

/** Menu music volume. It stays low so it never fights with voice chat. */
export const MUSIC_VOLUME = 0.28;

/** Effects that can overlap themselves (a burst of dealt cards) get several players taking turns. */
const POOL: Partial<Record<SfxName, number>> = { card_deal: 4, card_play: 3, tap: 2, select: 2, chips: 2 };

const SFX_KEY = 'cb.sfx';
const MUSIC_KEY = 'cb.music';

interface SoundState {
  sfx: boolean;
  music: boolean;
  setSfx(on: boolean): void;
  setMusic(on: boolean): void;
  /** One switch for everything: if anything is on it turns all off, otherwise all on. */
  toggleAll(): void;
}

export const useSound = create<SoundState>((set, get) => ({
  sfx: true,
  music: true,
  setSfx(on) {
    set({ sfx: on });
    void AsyncStorage.setItem(SFX_KEY, on ? '1' : '0').catch(() => undefined);
  },
  setMusic(on) {
    set({ music: on });
    void AsyncStorage.setItem(MUSIC_KEY, on ? '1' : '0').catch(() => undefined);
    syncMusic();
  },
  toggleAll() {
    const on = !(get().sfx || get().music);
    get().setSfx(on);
    get().setMusic(on);
  },
}));

// ---- effects ------------------------------------------------------------------------------------------
const voices = new Map<SfxName, { players: AudioPlayer[]; next: number }>();

function voice(name: SfxName) {
  let v = voices.get(name);
  if (!v) {
    const count = POOL[name] ?? 1;
    // updateInterval is long on purpose: nobody listens to the status of a 50 ms effect.
    v = { players: Array.from({ length: count }, () => createAudioPlayer(SOURCES[name], { updateInterval: 5000 })), next: 0 };
    voices.set(name, v);
  }
  return v;
}

export function sfx(name: SfxName): void {
  try {
    if (!useSound.getState().sfx) return;
    const v = voice(name);
    const p = v.players[v.next];
    v.next = (v.next + 1) % v.players.length;
    p.volume = SFX_GAIN[name];
    // expo-audio does not rewind a finished sound by itself.
    void p.seekTo(0).catch(() => undefined);
    p.play();
    // Browsers only allow sound after a first tap: this is also the moment the menu music may start.
    if (musicWanted && !musicPlaying) syncMusic();
  } catch {
    // no audio device, or a web build that blocks autoplay: stay silent
  }
}

// ---- own card plays -----------------------------------------------------------------------------------
// Tapping your own card plays its sound at once. The table sound hook skips the matching card that the
// server echoes back, but still plays it when the game played the card for you (the turn timer ran out).
let ownPlayAt = 0;
export const markOwnPlay = () => {
  ownPlayAt = Date.now();
};
export const ownPlayRecently = () => Date.now() - ownPlayAt < 2500;

// ---- music --------------------------------------------------------------------------------------------
let music: AudioPlayer | null = null;
let musicWanted = false;
let musicPlaying = false;
let appActive = true;
let ready = false; // the saved switches have been read
let fade: ReturnType<typeof setInterval> | null = null;

function fadeTo(player: AudioPlayer, target: number, ms: number, done?: () => void) {
  if (fade) clearInterval(fade);
  const from = player.volume;
  const steps = 14;
  let i = 0;
  fade = setInterval(() => {
    i++;
    try {
      player.volume = from + (target - from) * (i / steps);
    } catch {
      // player released meanwhile
    }
    if (i >= steps) {
      if (fade) clearInterval(fade);
      fade = null;
      done?.();
    }
  }, ms / steps);
}

/** Starts or stops the loop so it matches: a screen wants music + the player allows it + the app is in front. */
function syncMusic(): void {
  try {
    if (!ready) return;
    const shouldPlay = musicWanted && useSound.getState().music && appActive;
    if (shouldPlay && !musicPlaying) {
      if (!music) {
        music = createAudioPlayer(MUSIC_SOURCE, { updateInterval: 5000 });
        music.loop = true;
      }
      music.volume = 0;
      music.play();
      musicPlaying = true;
      fadeTo(music, MUSIC_VOLUME, 900);
    } else if (!shouldPlay && musicPlaying && music) {
      musicPlaying = false;
      const p = music;
      fadeTo(p, 0, 500, () => {
        // only pause if nothing asked for music again during the fade
        if (!musicPlaying) p.pause();
      });
    }
  } catch {
    musicPlaying = false;
  }
}

/** Screens ask for music (menus, lobby) or silence (the table). */
export function setMusicWanted(on: boolean): void {
  musicWanted = on;
  syncMusic();
}

// ---- start-up -----------------------------------------------------------------------------------------
let started = false;

/** Call once when the app starts: reads the saved switches, sets the audio mode, warms up the effects. */
export async function initSound(): Promise<void> {
  if (started) return;
  started = true;
  try {
    const [s, m] = await Promise.all([AsyncStorage.getItem(SFX_KEY), AsyncStorage.getItem(MUSIC_KEY)]);
    useSound.setState({ sfx: s !== '0', music: m !== '0' });
  } catch {
    // keep the defaults (everything on)
  }
  ready = true;
  try {
    // mixWithOthers: no audio focus is taken, so voice chat and the player's own music app are left alone.
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false });
  } catch {
    // ignore
  }
  AppState.addEventListener('change', (state) => {
    appActive = state === 'active';
    syncMusic();
  });
  // Create every player now so the first card lands without a hitch.
  (Object.keys(SOURCES) as SfxName[]).forEach((n) => {
    try {
      voice(n);
    } catch {
      // ignore
    }
  });
  syncMusic();
}
