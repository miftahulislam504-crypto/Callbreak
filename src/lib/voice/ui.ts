// What the voice button shows. A pure function of the voice store and the room, so it can be tested in Node.
import type { RoomView } from '../types';
import { connectedHumans, MIN_VOICE_HUMANS, voicePlan, type VoiceChoice } from './plan';

/**
 * hidden      voice cannot exist here (Expo Go, web, or the server has voice switched off) or there is no room
 * disabled    not enough human players yet; a tap explains why
 * join        voice is off; a tap turns it on
 * connecting  joining
 * muted       in voice, my mic is off; a tap turns it on
 * live        in voice, my mic is on; a tap mutes it
 * error       joining failed; a tap tries again
 */
export type VoiceButtonState = 'hidden' | 'disabled' | 'join' | 'connecting' | 'muted' | 'live' | 'error';

export interface VoiceButtonInput {
  available: boolean;
  view: RoomView | null;
  status: 'off' | 'connecting' | 'on' | 'error';
  micOn: boolean;
  choice: VoiceChoice;
  denied: string | null;
}

export function voiceButtonState(i: VoiceButtonInput): VoiceButtonState {
  if (!i.available || !i.view || i.view.mySeat < 0) return 'hidden';
  if (i.status === 'error') return 'error';
  if (i.status === 'on') return i.micOn ? 'live' : 'muted';
  if (i.status === 'connecting') return 'connecting';
  if (connectedHumans(i.view) < MIN_VOICE_HUMANS) return 'disabled';
  // The server has voice switched off (kill switch, no keys): there is nothing to tap, and the game goes on without the button.
  if (i.denied === 'disabled') return 'hidden';
  // Off, but the room wants voice and the token is on its way (or was refused for asking too fast and is
  // being asked again by itself): not a "join" tap yet.
  const wants = voicePlan({ view: i.view, choice: i.choice, away: false, available: i.available }) === 'join';
  if (wants && (i.denied === null || i.denied === 'rate_limited')) return 'connecting';
  return 'join';
}

/** "✕" next to the button: leave voice on purpose. Only while there is something to leave. */
export function canLeaveVoice(state: VoiceButtonState): boolean {
  return state === 'connecting' || state === 'muted' || state === 'live' || state === 'error';
}

/** Tapping another player's seat can mute them: only a human, not me, and only while I am in voice. */
export function canMuteSeat(view: RoomView, seat: number, voiceOn: boolean): boolean {
  const s = view.seats[seat];
  return voiceOn && !!s && s.occupied && !s.isBot && seat !== view.mySeat;
}
