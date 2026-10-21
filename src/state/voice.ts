import { create } from 'zustand';

import type { VoiceDeniedReason, VoiceGrant, VoiceInfo } from '@/lib/types';
import type { VoiceChoice } from '@/lib/voice/plan';
import type { AudioRouteKind } from '@/lib/voice/route';

/** Call Break always has 4 seats. */
export const VOICE_SEATS = 4;

/** A short one-off message for the voice button to show for a few seconds. */
export type VoiceNotice =
  | 'headphones'
  | 'mic_denied'
  | 'need_players'
  | 'failed'
  | 'network' //      the connection is gone for good
  | 'service' //      the voice service refused us or is switched off
  | 'session_ended' // the token ran out and could not be renewed
  | 'reconnecting'; // the SDK lost the connection and is trying to get it back

/** off = not in the voice channel, connecting = joining, on = in the channel, error = joining or staying failed. */
export type VoiceStatus = 'off' | 'connecting' | 'on' | 'error';

interface VoiceState {
  status: VoiceStatus;
  /** The server's latest "yes": what the audio engine joins with. Cleared when voice goes off. */
  grant: VoiceGrant | null;
  /** The server's latest "no" (why there is no token). Cleared by the next grant. */
  denied: VoiceDeniedReason | null;
  /**
   * What I asked for: 'default' follows the room (private rooms join by themselves, public rooms wait),
   * 'on' / 'off' are my explicit taps. Cleared by reset().
   */
  choice: VoiceChoice;
  /** My microphone is live. Muted by default, and only ever true while status is 'on'. */
  micOn: boolean;
  /** Bumped by retry(): the sync hook treats it as a fresh start (a new token, a new join). */
  retryKey: number;
  /** What the voice button should tell the player right now (it clears itself after a few seconds). */
  notice: VoiceNotice | null;
  /** Where the sound goes now (speaker, headset, Bluetooth, ...). Only meaningful while status is 'on'. */
  route: AudioRouteKind;
  /** Per seat: that player is speaking right now. */
  speaking: boolean[];
  /**
   * Per seat: I muted that player on this device. Kept while voice reconnects, cleared only by reset().
   * It is keyed by seat, so it should be cleared for a seat when someone else sits down there.
   */
  mutedSeats: boolean[];

  /** The server answered `voiceToken` (wire this to GameConnection's onVoice). */
  receive(info: VoiceInfo): void;
  /** The audio side reports where it is. Leaving 'on' always switches the mic off and clears who is speaking. */
  setStatus(status: VoiceStatus): void;
  /** Join (or stay out of) voice on purpose; the voice sync hook does the joining and leaving. */
  setChoice(choice: VoiceChoice): void;
  /** After a failed join: try again from scratch. */
  retry(): void;
  setNotice(notice: VoiceNotice | null): void;
  setRoute(route: AudioRouteKind): void;
  /** Ignored while not connected, so the mic can never be "on" without a call. */
  setMic(on: boolean): void;
  /** The seats that are speaking right now (from the engine's volume callback). Ignored while not connected. */
  setSpeaking(seats: readonly number[]): void;
  setSeatMuted(seat: number, muted: boolean): void;
  /** Back to the start (the room is closed). */
  reset(): void;
}

const none = (): boolean[] => Array.from({ length: VOICE_SEATS }, () => false);
const validSeat = (seat: number): boolean => Number.isInteger(seat) && seat >= 0 && seat < VOICE_SEATS;
const same = (a: boolean[], b: boolean[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);

const initial = () => ({
  status: 'off' as VoiceStatus,
  grant: null as VoiceGrant | null,
  denied: null as VoiceDeniedReason | null,
  choice: 'default' as VoiceChoice,
  micOn: false,
  retryKey: 0,
  notice: null as VoiceNotice | null,
  route: 'unknown' as AudioRouteKind,
  speaking: none(),
  mutedSeats: none(),
});

export const useVoice = create<VoiceState>((set, get) => ({
  ...initial(),

  receive(info) {
    if (info.enabled) {
      // A fresh token while we are already talking (a renewal) must not flicker the status.
      set((s) => ({ grant: info, denied: null, status: s.status === 'on' ? 'on' : 'connecting' }));
    } else if (get().status === 'on') {
      // A refusal while we are talking (e.g. a renewal asked too soon) must not cut the call:
      // the token we joined with stays valid until it expires.
      set({ denied: info.reason });
    } else {
      set({ grant: null, denied: info.reason, status: 'off', micOn: false, route: 'unknown', speaking: none() });
    }
  },

  setStatus(status) {
    set((s) => ({
      status,
      ...(status === 'off' ? { grant: null } : {}),
      ...(status !== 'on' ? { micOn: false, route: 'unknown' as AudioRouteKind, speaking: same(s.speaking, none()) ? s.speaking : none() } : {}),
    }));
  },

  setChoice(choice) {
    if (get().choice !== choice) set({ choice });
  },

  retry() {
    set((s) => ({ retryKey: s.retryKey + 1, status: 'off', grant: null, denied: null, notice: null, micOn: false, route: 'unknown' as AudioRouteKind, speaking: none() }));
  },

  setNotice(notice) {
    if (get().notice !== notice) set({ notice });
  },

  setRoute(route) {
    if (get().route !== route) set({ route });
  },

  setMic(on) {
    if (on && get().status !== 'on') return;
    if (get().micOn !== on) set({ micOn: on });
  },

  setSpeaking(seats) {
    if (get().status !== 'on') return;
    const next = none();
    for (const seat of seats) if (validSeat(seat)) next[seat] = true;
    if (!same(get().speaking, next)) set({ speaking: next });
  },

  setSeatMuted(seat, muted) {
    if (!validSeat(seat) || get().mutedSeats[seat] === muted) return;
    set((s) => ({ mutedSeats: s.mutedSeats.map((m, i) => (i === seat ? muted : m)) }));
  },

  reset: () => set(initial()),
}));
