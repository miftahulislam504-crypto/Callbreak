// When should this phone be in the voice channel? A pure decision, so it can be tested in Node
// (no React Native imports). The rules are section 5 of the voice plan.
import type { CommonRoomView } from '../types';

/**
 * What the player asked for. 'default' follows the room: private rooms join by themselves,
 * public rooms wait for the player to turn voice on. 'on' / 'off' are explicit taps.
 */
export type VoiceChoice = 'default' | 'on' | 'off';

export type VoicePlan = 'join' | 'leave';

/** Voice only makes sense between people: a human with only bots around stays out (and costs no minutes). */
export const MIN_VOICE_HUMANS = 2;

/** After this long in the background the phone leaves the voice channel, because Agora bills every minute. */
export const BACKGROUND_GRACE_MS = 30_000;

/**
 * Humans sitting at the table and online right now (bots never use voice). I always count myself: if my own
 * game connection blips, the voice call has its own reconnect and should not be torn down and rebuilt.
 */
export function connectedHumans(view: CommonRoomView): number {
  return view.seats.filter((s) => s.occupied && !s.isBot && (s.connected || s.seat === view.mySeat)).length;
}

export interface VoicePlanInput {
  view: CommonRoomView | null;
  choice: VoiceChoice;
  /** The app has been in the background longer than BACKGROUND_GRACE_MS. */
  away: boolean;
  /** The native voice SDK is in this build (false in Expo Go and on the web). */
  available: boolean;
}

export function voicePlan({ view, choice, away, available }: VoicePlanInput): VoicePlan {
  if (!available || away || !view || view.mySeat < 0) return 'leave';
  if (connectedHumans(view) < MIN_VOICE_HUMANS) return 'leave';
  if (choice === 'off') return 'leave';
  if (choice === 'on') return 'join';
  return view.isPrivate ? 'join' : 'leave';
}
