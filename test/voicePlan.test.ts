import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { PublicSeat, RoomView } from '../src/lib/types';
import { BACKGROUND_GRACE_MS, connectedHumans, voicePlan, type VoicePlanInput } from '../src/lib/voice/plan';
import { createSpeakingTracker, SPEAKING_HOLD_MS, SPEAKING_VOLUME } from '../src/lib/voice/speaking';

type SeatSpec = 'human' | 'offline' | 'bot' | 'empty';

function seat(i: number, kind: SeatSpec): PublicSeat {
  return {
    seat: i,
    occupied: kind !== 'empty',
    name: kind === 'empty' ? '' : `P${i}`,
    isBot: kind === 'bot',
    connected: kind === 'human' || kind === 'bot',
    auto: false,
  };
}

function room(seats: SeatSpec[], o: { mySeat?: number; isPrivate?: boolean } = {}): RoomView {
  return {
    roomCode: 'ABC234',
    roomName: 'Test',
    isPrivate: o.isPrivate ?? true,
    status: 'lobby',
    hostSeat: 0,
    mySeat: o.mySeat ?? 0,
    targetScore: 49,
    seats: seats.map((k, i) => seat(i, k)),
    deadline: null,
    nextRoundAt: null,
    serverTime: 0,
    bidSeconds: 20,
    playSeconds: 20,
    game: null,
  };
}

const plan = (view: RoomView | null, o: Partial<VoicePlanInput> = {}) =>
  voicePlan({ view, choice: 'default', away: false, available: true, ...o });

describe('connectedHumans', () => {
  test('counts online humans only: no bots, no empty seats, no offline humans', () => {
    assert.equal(connectedHumans(room(['human', 'human', 'bot', 'empty'])), 2);
    assert.equal(connectedHumans(room(['human', 'offline', 'bot', 'bot'])), 1);
  });

  test('I always count myself, even if my own seat shows offline', () => {
    assert.equal(connectedHumans(room(['offline', 'human', 'empty', 'empty'], { mySeat: 0 })), 2);
    assert.equal(connectedHumans(room(['offline', 'offline', 'empty', 'empty'], { mySeat: 0 })), 1);
  });
});

describe('voicePlan', () => {
  test('a private room with two online humans joins by itself', () => {
    assert.equal(plan(room(['human', 'human', 'bot', 'bot'])), 'join');
  });

  test('a public room waits until the player turns voice on', () => {
    const pub = room(['human', 'human', 'empty', 'empty'], { isPrivate: false });
    assert.equal(plan(pub), 'leave');
    assert.equal(plan(pub, { choice: 'on' }), 'join');
  });

  test('turning voice off wins, even in a private room', () => {
    assert.equal(plan(room(['human', 'human', 'empty', 'empty']), { choice: 'off' }), 'leave');
  });

  test('alone with bots there is no voice, whatever was asked', () => {
    const alone = room(['human', 'bot', 'bot', 'bot']);
    assert.equal(plan(alone), 'leave');
    assert.equal(plan(alone, { choice: 'on' }), 'leave');
    assert.equal(plan(room(['human', 'offline', 'bot', 'bot']), { choice: 'on' }), 'leave', 'the other human is offline');
  });

  test('no room, no seat, no native SDK, or away too long: leave', () => {
    const ok = room(['human', 'human', 'empty', 'empty']);
    assert.equal(plan(null), 'leave');
    assert.equal(plan(room(['human', 'human', 'empty', 'empty'], { mySeat: -1 })), 'leave');
    assert.equal(plan(ok, { available: false }), 'leave');
    assert.equal(plan(ok, { away: true }), 'leave');
    assert.equal(plan(ok), 'join');
  });

  test('the background grace is 30 seconds (the plan promises that, and Agora bills by the minute)', () => {
    assert.equal(BACKGROUND_GRACE_MS, 30_000);
  });
});

describe('speaking tracker', () => {
  test('a loud report lights the speaker, a quiet one does not', () => {
    const t = createSpeakingTracker();
    t.hear(2, SPEAKING_VOLUME - 1, 1000);
    assert.deepEqual(t.active(1000), []);
    t.hear(2, SPEAKING_VOLUME, 1000);
    assert.deepEqual(t.active(1000), [2]);
  });

  test('the light stays on for a short hold, then fades without a new report', () => {
    const t = createSpeakingTracker();
    t.hear(3, 200, 1000);
    assert.deepEqual(t.active(1000 + SPEAKING_HOLD_MS), [3]);
    assert.deepEqual(t.active(1000 + SPEAKING_HOLD_MS + 1), []);
  });

  test('two separate reports (me, then the others) add up instead of replacing each other', () => {
    const t = createSpeakingTracker();
    t.hear(1, 100, 1000); // my callback
    t.hear(4, 100, 1010); // the remote callback
    t.hear(2, 100, 1010);
    assert.deepEqual(t.active(1020), [1, 2, 4]);
  });

  test('forget turns one person off at once; clear turns everyone off', () => {
    const t = createSpeakingTracker();
    t.hear(1, 200, 1000);
    t.hear(2, 200, 1000);
    t.forget(1);
    assert.deepEqual(t.active(1000), [2]);
    t.clear();
    assert.deepEqual(t.active(1000), []);
  });
});
