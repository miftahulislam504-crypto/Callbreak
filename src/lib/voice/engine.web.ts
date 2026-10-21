// The web build has no voice: react-native-agora is a native module. Same exports as engine.ts, all inert,
// so the game itself runs the same everywhere.
import type { VoiceGrant } from '@/lib/types';
import type { MicResult, VoiceEvents } from './engine';

export type { MicResult, VoiceEvents } from './engine';

export const isVoiceAvailable = (): boolean => false;
export const isVoiceJoined = (): boolean => false;
export const joinVoice = (_grant: VoiceGrant, _events: VoiceEvents): boolean => false;
export const leaveVoice = (): void => {};
export const setMic = async (_on: boolean): Promise<MicResult> => 'unavailable';
export const setRemoteMuted = (_uid: number, _muted: boolean): void => {};
