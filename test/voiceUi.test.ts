import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { RoomView } from '../src/lib/types';
import { canLeaveVoice, canMuteSeat, voiceButtonState, type VoiceButtonInput } from '../src/lib/voice/ui';

type Kind = 'human' | 'bot' | 'empty';

function room(kinds: Kind[], o: { mySeat?: number; isPrivate?: boolean } = {}): RoomView {
  return {
    roomCode: 'ABC234',
    roomName: 'Test',
    isPrivate: o.isPrivate ?? true,
    status: 'lobby',
    hostSeat: 0,
    mySeat: o.mySeat ?? 0,
    targetScore: 49,
    seats: kinds.map((k, i) => ({
      seat: i, occupied: k !== 'empty', name: k === 'empty' ? '' : `P${i}`, isBot: k === 'bot', connected: k !== 'empty', auto: false,
    })),
    deadline: null,
    nextRoundAt: null,
    serverTime: 0,
    bidSeconds: 20,
    playSeconds: 20,
    game: null,
  };
}

const two = room(['human', 'human', 'bot', 'bot']);
const publicTwo = room(['human', 'human', 'empty', 'empty'], { isPrivate: false });

const state = (o: Partial<VoiceButtonInput>) =>
  voiceButtonState({ available: true, view: two, status: 'off', micOn: false, choice: 'default', denied: null, ...o });

describe('voiceButtonState', () => {
  test('hidden without the native SDK or without a seat in a room', () => {
    assert.equal(state({ available: false }), 'hidden');
    assert.equal(state({ view: null }), 'hidden');
    assert.equal(state({ view: room(['human', 'human', 'empty', 'empty'], { mySeat: -1 }) }), 'hidden');
  });

  test('in voice: the mic decides between muted and live', () => {
    assert.equal(state({ status: 'on', micOn: false }), 'muted');
    assert.equal(state({ status: 'on', micOn: true }), 'live');
  });

  test('joining and failed joins', () => {
    assert.equal(state({ status: 'connecting' }), 'connecting');
    assert.equal(state({ status: 'error' }), 'error');
  });

  test('alone with bots the button is disabled (a tap explains why)', () => {
    assert.equal(state({ view: room(['human', 'bot', 'bot', 'bot']) }), 'disabled');
    assert.equal(state({ view: room(['human', 'bot', 'bot', 'bot']), choice: 'on' }), 'disabled');
  });

  test('private room: voice wants to start by itself, so it reads as connecting, not as a join button', () => {
    assert.equal(state({}), 'connecting');
  });

  test('private room, after the player left voice on purpose: a join button', () => {
    assert.equal(state({ choice: 'off' }), 'join');
  });

  test('public room: a join button until the player turns voice on', () => {
    assert.equal(state({ view: publicTwo }), 'join');
    assert.equal(state({ view: publicTwo, choice: 'on' }), 'connecting');
  });

  test('the server refused the token: back to a join button instead of spinning forever', () => {
    assert.equal(state({ denied: 'disabled' }), 'join');
  });
});

describe('canLeaveVoice', () => {
  test('only while there is something to leave', () => {
    for (const s of ['connecting', 'muted', 'live', 'error'] as const) assert.equal(canLeaveVoice(s), true, s);
    for (const s of ['hidden', 'disabled', 'join'] as const) assert.equal(canLeaveVoice(s), false, s);
  });
});

describe('canMuteSeat', () => {
  const v = room(['human', 'human', 'bot', 'empty'], { mySeat: 0 });
  test('another human, while I am in voice', () => {
    assert.equal(canMuteSeat(v, 1, true), true);
  });
  test('not myself, not a bot, not an empty seat, not while I am out of voice', () => {
    assert.equal(canMuteSeat(v, 0, true), false);
    assert.equal(canMuteSeat(v, 2, true), false);
    assert.equal(canMuteSeat(v, 3, true), false);
    assert.equal(canMuteSeat(v, 1, false), false);
    assert.equal(canMuteSeat(v, 9, true), false);
  });
});
