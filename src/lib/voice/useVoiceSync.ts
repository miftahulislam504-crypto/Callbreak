// The one place that connects the room to the audio engine. Mounted once, in the root layout, so voice keeps
// running when the screen changes from the lobby to the table. It never throws into the game: any voice
// problem ends as `status: 'error'` or `'off'` in the voice store, and the game goes on.
//
//   room + what the player asked for  --voicePlan-->  join | leave
//   join:  ask the server for a token (once)  -->  store gets the grant  -->  engine joins  -->  status 'on'
//   leave: engine leaves  -->  status 'off'
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useRoom } from '@/state/room';
import { useVoice } from '@/state/voice';
import { isVoiceAvailable, isVoiceJoined, joinVoice, leaveVoice, setMic, setRemoteMuted } from './engine';
import { BACKGROUND_GRACE_MS, voicePlan } from './plan';

/** The "use headphones" tip is shown once per app run, the first time voice connects. */
let headphonesTipShown = false;

/** Joining that has not finished after this long counts as failed. */
const JOIN_TIMEOUT_MS = 15_000;
/** The server hands out one token per 5 s per player (CB_VOICE_TOKEN_MIN_GAP_MS); this is a little more. */
const RATE_LIMIT_RETRY_MS = 5_500;

/**
 * Tracks the app going to the background. `away` turns true after BACKGROUND_GRACE_MS (so voice is left, which
 * saves Agora minutes); `epoch` goes up when the app returns after such a long absence (so voice is joined
 * again from scratch, even if the phone froze our timers while we were away).
 */
function useAppAway(): { away: boolean; epoch: number } {
  const [state, setState] = useState({ away: false, epoch: 0 });
  useEffect(() => {
    let leftAt: number | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = AppState.addEventListener('change', (next) => {
      clearTimeout(timer);
      if (next === 'active') {
        const long = leftAt !== null && Date.now() - leftAt >= BACKGROUND_GRACE_MS;
        leftAt = null;
        setState((s) => ({ away: false, epoch: long ? s.epoch + 1 : s.epoch }));
        return;
      }
      leftAt ??= Date.now();
      timer = setTimeout(() => setState((s) => ({ ...s, away: true })), BACKGROUND_GRACE_MS);
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);
  return state;
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
  const { away, epoch } = useAppAway();

  const roomCode = view?.roomCode ?? null;
  const mySeat = view?.mySeat ?? -1;
  const plan = voicePlan({ view, choice, away, available: isVoiceAvailable() });

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
      leaveVoice();
      useVoice.getState().setStatus('error');
      useVoice.getState().setNotice('failed');
    };
    // The token is only good for this channel and seat. Anything else is a stale or wrong grant.
    if (grant.channel !== `cb-${roomCode}` || grant.uid !== mySeat + 1) {
      fail('grant does not match this room and seat');
      return;
    }
    const started = joinVoice(grant, {
      onJoined: () => {
        useVoice.getState().setStatus('on');
        if (!headphonesTipShown) {
          headphonesTipShown = true;
          useVoice.getState().setNotice('headphones');
        }
      },
      onFailed: (why) => fail(why),
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
      if (result === 'ok') return;
      useVoice.getState().setMic(false);
      if (result === 'denied') useVoice.getState().setNotice('mic_denied');
    });
  }, [status, micOn]);

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
