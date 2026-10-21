// The one place that connects the room to the audio engine. Mounted once, in the root layout, so voice keeps
// running when the screen changes from the lobby to the table. It never throws into the game: any voice
// problem ends as `status: 'error'` or `'off'` in the voice store, and the game goes on.
//
//   room + what the player asked for  --voicePlan-->  join | leave
//   join:  ask the server for a token (once)  -->  store gets the grant  -->  engine joins  -->  status 'on'
//   leave: engine leaves  -->  status 'off'
//   stay:  while joined, a fresh token is asked for before the old one runs out and handed to the SDK
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useRoom } from '@/state/room';
import { useVoice, type VoiceNotice } from '@/state/voice';
import { isVoiceAvailable, isVoiceJoined, joinVoice, leaveVoice, renewVoiceToken, setMic, setRemoteMuted } from './engine';
import type { VoiceFailureKind } from './failure';
import { BACKGROUND_GRACE_MS, voicePlan } from './plan';
import { RENEW_ANSWER_WAIT_MS, RENEW_RETRY_MS, renewDelayMs } from './renew';
import { routeCausesEcho } from './route';

/** The "use headphones" tip is shown once per app run, the first time the mic goes live with the sound on a speaker. */
let headphonesTipShown = false;

/** What the player is told when the voice session ends because of each kind of failure. */
const FAILURE_NOTICE: Record<VoiceFailureKind, VoiceNotice> = {
  network: 'network',
  service: 'service',
  token: 'session_ended',
  other: 'failed',
};

/** Ends the voice session with a short message. The game is untouched; the button turns into "retry". */
function endWithError(notice: VoiceNotice): void {
  leaveVoice();
  useVoice.getState().setStatus('error');
  useVoice.getState().setNotice(notice);
}

/** Asks the server for a fresh token (the answer lands in useVoice). Only while the app is in front: a phone in a pocket stays out. */
function askForToken(): boolean {
  return AppState.currentState === 'active' && useRoom.getState().requestVoice();
}

/** After a long absence the room is refreshed (see foreground() in state/room.ts); voice waits for that, or this long. */
const RESYNC_WAIT_MS = 4_000;

/** Joining that has not finished after this long counts as failed. */
const JOIN_TIMEOUT_MS = 15_000;
/** The server hands out one token per 5 s per player (CB_VOICE_TOKEN_MIN_GAP_MS); this is a little more. */
const RATE_LIMIT_RETRY_MS = 5_500;

/**
 * Tracks the app going to the background. `away` turns true after BACKGROUND_GRACE_MS (so voice is left, which
 * saves Agora minutes); `epoch` goes up when the app returns after such a long absence (so voice is joined
 * again from scratch, even if the phone froze our timers while we were away).
 *
 * On that return the room is being refreshed by foreground() at the same moment, and the table we still hold
 * may be old (a friend may have left). `resync` stays true until the fresh table arrives (or RESYNC_WAIT_MS
 * passes), so voice does not join a channel only to leave it again a second later.
 */
function useAppAway(): { away: boolean; epoch: number; resync: boolean; baseline: number; settle(): void } {
  const [state, setState] = useState({ away: false, epoch: 0, resync: false, baseline: 0 });
  useEffect(() => {
    let leftAt: number | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let resyncTimer: ReturnType<typeof setTimeout> | undefined;
    const sub = AppState.addEventListener('change', (next) => {
      clearTimeout(timer);
      if (next === 'active') {
        const long = leftAt !== null && Date.now() - leftAt >= BACKGROUND_GRACE_MS;
        leftAt = null;
        if (long) {
          const baseline = useRoom.getState().view?.serverTime ?? 0;
          setState((s) => ({ away: false, epoch: s.epoch + 1, resync: true, baseline }));
          clearTimeout(resyncTimer);
          resyncTimer = setTimeout(() => setState((s) => (s.resync ? { ...s, resync: false } : s)), RESYNC_WAIT_MS);
        } else {
          setState((s) => ({ ...s, away: false }));
        }
        return;
      }
      leftAt ??= Date.now();
      timer = setTimeout(() => setState((s) => ({ ...s, away: true })), BACKGROUND_GRACE_MS);
    });
    return () => {
      clearTimeout(timer);
      clearTimeout(resyncTimer);
      sub.remove();
    };
  }, []);
  const settle = useCallback(() => setState((s) => (s.resync ? { ...s, resync: false } : s)), []);
  return { ...state, settle };
}

export function useVoiceSync(): void {
  const view = useRoom((s) => s.view);
  const link = useRoom((s) => s.link);
  const choice = useVoice((s) => s.choice);
  const status = useVoice((s) => s.status);
  const grant = useVoice((s) => s.grant);
  const denied = useVoice((s) => s.denied);
  const retryKey = useVoice((s) => s.retryKey);
  const micOn = useVoice((s) => s.micOn);
  const mutedSeats = useVoice((s) => s.mutedSeats);
  const { away, epoch, resync, baseline, settle } = useAppAway();

  const roomCode = view?.roomCode ?? null;
  const mySeat = view?.mySeat ?? -1;
  const serverTime = view?.serverTime ?? 0;
  const plan = voicePlan({ view, choice, away: away || resync, available: isVoiceAvailable() });

  // 0) The refreshed table arrived after a long absence: voice may decide now.
  useEffect(() => {
    if (resync && serverTime !== baseline) settle();
  }, [resync, serverTime, baseline, settle]);

  // 1) Join or leave. One token request per "episode": a room, until we leave, are sent away, or come back.
  const episode = useRef<string | null>(null);
  useEffect(() => {
    if (plan === 'leave' || roomCode === null) {
      episode.current = null;
      if (isVoiceJoined()) leaveVoice();
      if (useVoice.getState().status !== 'off') useVoice.getState().setStatus('off');
      return;
    }
    const key = `${roomCode}#${epoch}#${retryKey}`;
    if (episode.current === key) return;
    // A new room, or back from a long time in the background: start clean.
    if (isVoiceJoined()) leaveVoice();
    useVoice.getState().setStatus('off');
    episode.current = key;
    // No socket right now (reconnecting): forget the episode so the next change (link back online) asks again.
    if (!useRoom.getState().requestVoice()) episode.current = null;
  }, [plan, roomCode, epoch, retryKey, link]);

  // 2) The server said yes: join the channel.
  useEffect(() => {
    if (status !== 'connecting' || !grant || plan !== 'join') return;
    const fail = (why: string) => {
      console.warn(`[voice] ${why}`);
      endWithError('failed');
    };
    // The token is only good for this channel and seat. Anything else is a stale or wrong grant.
    if (grant.channel !== `cb-${roomCode}` || grant.uid !== mySeat + 1) {
      fail('grant does not match this room and seat');
      return;
    }
    const started = joinVoice(grant, {
      onJoined: () => {
        const v = useVoice.getState();
        v.setStatus('on');
        if (v.notice === 'reconnecting') v.setNotice(null); // the SDK got the connection back
      },
      onFailed: (kind, why) => {
        console.warn(`[voice] ${why}`);
        const v = useVoice.getState();
        v.setStatus('error');
        v.setNotice(FAILURE_NOTICE[kind]);
      },
      onReconnecting: () => {
        if (useVoice.getState().status === 'on') useVoice.getState().setNotice('reconnecting');
      },
      onTokenWillExpire: () => {
        askForToken();
      },
      onTokenExpired: () => {
        if (askForToken()) return;
        // Out of sight (or no socket): do not renew. The session ends here, and coming back to the app starts a fresh one.
        episode.current = null;
        leaveVoice();
        useVoice.getState().setStatus('off');
      },
      onRoute: (route) => useVoice.getState().setRoute(route),
      onSpeaking: (uids) => useVoice.getState().setSpeaking(uids.map((uid) => uid - 1)),
    });
    if (!started) {
      fail('could not start');
      return;
    }
    const timer = setTimeout(() => {
      if (useVoice.getState().status === 'connecting') fail('join timed out');
    }, JOIN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status, grant, plan, roomCode, mySeat]);

  // 2b) Rejoined within the server's 5 s limit (e.g. the only other player blipped): ask once more after it passes.
  useEffect(() => {
    if (denied !== 'rate_limited' || status !== 'off' || plan !== 'join') return;
    const timer = setTimeout(() => useRoom.getState().requestVoice(), RATE_LIMIT_RETRY_MS);
    return () => clearTimeout(timer);
  }, [denied, status, plan]);

  // 3) My microphone. The store says what I want; a refused permission puts it back to off.
  useEffect(() => {
    if (status !== 'on') return;
    void setMic(micOn).then((result) => {
      if (result !== 'ok') {
        useVoice.getState().setMic(false);
        if (result === 'denied') useVoice.getState().setNotice('mic_denied');
        return;
      }
      // First time the mic goes live with the sound coming out of a speaker: two phones in one room will echo.
      const v = useVoice.getState();
      if (v.micOn && v.status === 'on' && !headphonesTipShown && routeCausesEcho(v.route)) {
        headphonesTipShown = true;
        v.setNotice('headphones');
      }
    });
  }, [status, micOn]);

  // 3b) A refreshed token (the server's answer to a renewal) goes to the SDK; the call is not interrupted.
  useEffect(() => {
    if (status === 'on' && grant) renewVoiceToken(grant);
  }, [status, grant]);

  // 3c) Keep the token fresh. Ask well before it runs out, again after a refusal or silence, and stop the
  // session (the game goes on) when the server says voice is off. Nothing is asked while the app is out of sight.
  useEffect(() => {
    if (status !== 'on' || !grant || plan !== 'join') return;
    if (denied === 'disabled') {
      endWithError('service');
      return;
    }
    if (denied === 'not_seated') return; // no seat: the plan ends voice by itself
    let timer: ReturnType<typeof setTimeout>;
    const attempt = () => {
      timer = setTimeout(attempt, askForToken() ? RENEW_ANSWER_WAIT_MS : RENEW_RETRY_MS);
    };
    timer = setTimeout(attempt, denied === 'rate_limited' ? RENEW_RETRY_MS : renewDelayMs(grant.expiresAt, Date.now()));
    return () => clearTimeout(timer);
  }, [status, grant, plan, denied]);

  // 4a) Someone else sat down in a seat I had muted: the mute was about the old player, so drop it.
  const seatIds = useRef<string[]>([]);
  useEffect(() => {
    if (!view) {
      seatIds.current = [];
      return;
    }
    view.seats.forEach((s, i) => {
      const id = `${s.occupied}:${s.isBot}:${s.name}`;
      const before = seatIds.current[i];
      if (before !== undefined && before !== id) useVoice.getState().setSeatMuted(i, false);
      seatIds.current[i] = id;
    });
  }, [view]);

  // 4) Players I muted on this device.
  useEffect(() => {
    if (status !== 'on') return;
    mutedSeats.forEach((muted, seat) => {
      if (seat !== mySeat) setRemoteMuted(seat + 1, muted);
    });
  }, [status, mutedSeats, mySeat]);
}
