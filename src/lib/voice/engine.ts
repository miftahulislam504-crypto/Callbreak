// The audio side of voice chat: a thin wrapper around the Agora SDK (react-native-agora).
//
// - The SDK is loaded lazily inside try/catch. Expo Go and the web have no native Agora module, so there
//   voice is simply "not available" and the game is untouched.
// - Nothing here knows about React, zustand or the game: `useVoiceSync` drives it, and every outcome
//   comes back through the VoiceEvents callbacks.
// - The mic is OFF when joining: no capture, nothing published, and no permission asked. The first unmute
//   asks for the microphone permission and starts capture. After that, muting only stops *sending*
//   (muteLocalAudioStream), because switching capture on and off interrupts what the player hears.
// - Agora uid = seat + 1 (the server fixes it in the token), so uids 1..4 map straight to seats.
import { PermissionsAndroid, Platform } from 'react-native';
import type { IRtcEngine, IRtcEngineEventHandler } from 'react-native-agora';

import type { VoiceGrant } from '@/lib/types';
import { createSpeakingTracker, type SpeakingTracker } from './speaking';

type AgoraSdk = typeof import('react-native-agora');

export interface VoiceEvents {
  /** In the channel (also fires again when the SDK reconnects after a network blip). */
  onJoined(): void;
  /** The session is over and the engine has already left: the join failed or the connection is gone for good. */
  onFailed(reason: string): void;
  /** Agora uids (1..4 = seat + 1) that are speaking now. Includes me only while my mic is live. */
  onSpeaking(uids: number[]): void;
}

/** ok = done (or superseded by a newer call); denied = the player refused the microphone permission. */
export type MicResult = 'ok' | 'denied' | 'unavailable';

const SPEAKING_REPORT_MS = 200; // how often Agora reports volumes
const SPEAKING_TICK_MS = 250; // how often "who is speaking" is re-evaluated (lets silent speakers fade)

interface Session {
  grant: VoiceGrant;
  events: VoiceEvents;
  tracker: SpeakingTracker;
  /** Capture has been switched on at least once in this session. */
  capturing: boolean;
  /** My mic is live: unmuted and sending. */
  micLive: boolean;
  /** Seats' uids I muted on this device. Re-applied when they (re)join the channel. */
  mutedUids: Set<number>;
  tick: ReturnType<typeof setInterval>;
  lastSpeaking: string;
}

let sdk: AgoraSdk | null | undefined;
let engine: IRtcEngine | null = null;
let engineAppId = '';
let session: Session | null = null;
let micSeq = 0;

function loadSdk(): AgoraSdk | null {
  if (sdk !== undefined) return sdk;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sdk = require('react-native-agora') as AgoraSdk;
  } catch {
    sdk = null; // Expo Go / no native module in this build
  }
  return sdk;
}

/** Voice can work in this build (the native SDK is there). Always false on the web. */
export function isVoiceAvailable(): boolean {
  return loadSdk() !== null;
}

/** We are in (or joining) a voice channel. */
export function isVoiceJoined(): boolean {
  return session !== null;
}

/** The session a callback belongs to, or null for a late callback of a session we already left. */
function sessionOf(connection: { channelId?: string }): Session | null {
  return session && connection.channelId === session.grant.channel ? session : null;
}

const handler: IRtcEngineEventHandler = {
  onJoinChannelSuccess(connection) {
    sessionOf(connection)?.events.onJoined();
  },

  onConnectionStateChanged(connection, state) {
    const s = sessionOf(connection);
    const sdkRef = loadSdk();
    if (!s || !sdkRef) return;
    if (state === sdkRef.ConnectionStateType.ConnectionStateConnected) {
      s.events.onJoined();
    } else if (state === sdkRef.ConnectionStateType.ConnectionStateFailed) {
      // Includes an expired or invalid token. (Reconnecting is left to the SDK, which keeps retrying.)
      fail(s, 'connection failed');
    }
  },

  onAudioVolumeIndication(connection, speakers) {
    const s = sessionOf(connection);
    if (!s) return;
    const now = Date.now();
    for (const sp of speakers) {
      const uid = sp.uid === 0 ? s.grant.uid : sp.uid; // uid 0 is me
      if (uid === undefined) continue;
      // After the first unmute capture stays on, and Agora keeps reporting my volume while I am muted.
      if (uid === s.grant.uid && !s.micLive) continue;
      s.tracker.hear(uid, sp.volume ?? 0, now);
    }
  },

  onUserJoined(connection, remoteUid) {
    const s = sessionOf(connection);
    if (s?.mutedUids.has(remoteUid)) engine?.muteRemoteAudioStream(remoteUid, true);
  },

  onError(code, msg) {
    console.warn(`[voice] agora error ${String(code)}: ${msg}`);
  },
};

function fail(s: Session, reason: string): void {
  if (session !== s) return;
  leaveVoice();
  s.events.onFailed(reason);
}

function ensureEngine(agora: AgoraSdk, appId: string): IRtcEngine {
  if (engine && engineAppId === appId) return engine;
  if (engine) {
    // The App ID changed (should not happen): start again with the new one.
    try {
      engine.unregisterEventHandler(handler);
      engine.release();
    } catch {
      // already gone
    }
    engine = null;
  }
  const e = agora.createAgoraRtcEngine();
  const rc = e.initialize({
    appId,
    channelProfile: agora.ChannelProfileType.ChannelProfileCommunication,
    audioScenario: agora.AudioScenarioType.AudioScenarioDefault,
  });
  if (rc < 0) throw new Error(`initialize failed (${rc})`);
  e.registerEventHandler(handler);
  engine = e;
  engineAppId = appId;
  return e;
}

/**
 * Joins the voice channel with the server's grant, with the mic off. Returns false when it cannot even
 * start (no SDK, bad App ID, ...). Later outcomes come through `events`. Any earlier session is left first.
 */
export function joinVoice(grant: VoiceGrant, events: VoiceEvents): boolean {
  const agora = loadSdk();
  if (!agora) return false;
  leaveVoice();
  try {
    const e = ensureEngine(agora, grant.appId);
    const tracker = createSpeakingTracker();
    const s: Session = {
      grant,
      events,
      tracker,
      capturing: false,
      micLive: false,
      mutedUids: new Set(),
      lastSpeaking: '',
      tick: setInterval(() => {
        const uids = tracker.active(Date.now());
        const key = uids.join(',');
        if (key === s.lastSpeaking) return;
        s.lastSpeaking = key;
        events.onSpeaking(uids);
      }, SPEAKING_TICK_MS),
    };
    session = s;

    e.enableAudio();
    e.enableLocalAudio(false); // no capture (and no permission needed) until the first unmute
    e.setDefaultAudioRouteToSpeakerphone(true); // phone on the table: speaker, not the earpiece (a headset still wins)
    e.enableAudioVolumeIndication(SPEAKING_REPORT_MS, 3, true);
    const rc = e.joinChannel(grant.token, grant.channel, grant.uid, {
      channelProfile: agora.ChannelProfileType.ChannelProfileCommunication,
      clientRoleType: agora.ClientRoleType.ClientRoleBroadcaster,
      publishMicrophoneTrack: false,
      publishCameraTrack: false,
      autoSubscribeAudio: true,
      autoSubscribeVideo: false,
    });
    if (rc < 0) throw new Error(`joinChannel failed (${rc})`);
    return true;
  } catch (err) {
    console.warn(`[voice] join failed: ${err instanceof Error ? err.message : String(err)}`);
    leaveVoice();
    return false;
  }
}

/** Leaves the channel and stops everything. Safe to call any time, any number of times. */
export function leaveVoice(): void {
  const s = session;
  session = null; // first, so late callbacks of this session are ignored
  micSeq++; // a microphone request still waiting for the permission dialog is now void
  if (!s) return;
  clearInterval(s.tick);
  try {
    engine?.leaveChannel();
  } catch {
    // already gone
  }
}

async function ensureMicPermission(): Promise<boolean> {
  // iOS asks by itself the first time capture starts (NSMicrophoneUsageDescription in app.json).
  if (Platform.OS !== 'android') return true;
  const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
  if (await PermissionsAndroid.check(permission)) return true;
  return (await PermissionsAndroid.request(permission)) === PermissionsAndroid.RESULTS.GRANTED;
}

/** Turns my microphone on or off. The permission is asked on the first "on". */
export async function setMic(on: boolean): Promise<MicResult> {
  const s = session;
  if (!s || !engine) return 'unavailable';
  const seq = ++micSeq;
  try {
    if (!on) {
      s.micLive = false;
      s.tracker.forget(s.grant.uid);
      if (s.capturing) engine.muteLocalAudioStream(true);
      return 'ok';
    }
    if (!(await ensureMicPermission())) return 'denied';
    if (session !== s || seq !== micSeq) return 'ok'; // left, or asked again while the dialog was open: the newer call decides
    if (!s.capturing) {
      engine.enableLocalAudio(true);
      engine.updateChannelMediaOptions({ publishMicrophoneTrack: true });
      s.capturing = true;
    }
    engine.muteLocalAudioStream(false);
    s.micLive = true;
    return 'ok';
  } catch (err) {
    console.warn(`[voice] mic failed: ${err instanceof Error ? err.message : String(err)}`);
    return 'unavailable';
  }
}

/** Mutes or unmutes one other player (Agora uid = seat + 1) on this device only. */
export function setRemoteMuted(uid: number, muted: boolean): void {
  const s = session;
  if (!s || !engine) return;
  if (!muted && !s.mutedUids.has(uid)) return; // nothing to undo
  if (muted) s.mutedUids.add(uid);
  else s.mutedUids.delete(uid);
  try {
    engine.muteRemoteAudioStream(uid, muted);
  } catch {
    // best effort
  }
}
