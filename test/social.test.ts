import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  FRIEND_CODE_ALPHABET, INVITE_TTL_MS, bannerKey, inviteAlive, isValidFriendCode, makeFriendCode,
  normalizeFriendCode, pairId, pickBanner, relationOf, type FriendRequest, type Invite,
} from '../src/lib/socialLogic';

const invite = (over: Partial<Invite> = {}): Invite => ({
  id: 'a_me', from: 'a', fromName: 'Anis', roomCode: 'K7M2QX', roomName: 'Room', createdAt: 1000, ...over,
});
const request = (over: Partial<FriendRequest> = {}): FriendRequest => ({
  id: 'b_me', from: 'b', fromName: 'Babu', createdAt: 1000, ...over,
});
const base = { invites: [], requests: [], friends: ['a'], dismissed: [], now: 2000, currentRoomCode: null, gameRunning: false };

test('friend codes use the safe alphabet and the right length', () => {
  for (let i = 0; i < 200; i++) {
    const code = makeFriendCode();
    assert.equal(code.length, 6);
    assert.ok(isValidFriendCode(code));
    assert.ok([...code].every((ch) => FRIEND_CODE_ALPHABET.includes(ch)));
  }
  assert.equal(makeFriendCode(() => 0), 'AAAAAA');
  assert.equal(makeFriendCode(() => 0.999999), '999999');
});

test('typed codes are cleaned up', () => {
  assert.equal(normalizeFriendCode(' k7m-2qx '), 'K7M2QX');
  assert.equal(normalizeFriendCode('abcdefghij'), 'ABCDEF');
  assert.ok(!isValidFriendCode('K7M2Q0')); // 0 is not in the alphabet
  assert.ok(!isValidFriendCode('K7M2Q'));
});

test('pair ids are directional', () => {
  assert.equal(pairId('a', 'b'), 'a_b');
  assert.notEqual(pairId('a', 'b'), pairId('b', 'a'));
});

test('an invite expires after the TTL, a pending one never does', () => {
  assert.ok(inviteAlive(1000, 1000 + INVITE_TTL_MS - 1));
  assert.ok(!inviteAlive(1000, 1000 + INVITE_TTL_MS));
  assert.ok(inviteAlive(null, 10 ** 12));
});

test('relation to another player', () => {
  const r = (other: string | null) => relationOf('me', other, ['f'], ['i'], ['o']);
  assert.equal(r('me'), 'self');
  assert.equal(r('f'), 'friend');
  assert.equal(r('i'), 'incoming');
  assert.equal(r('o'), 'outgoing');
  assert.equal(r('x'), 'none');
  assert.equal(r(null), 'none');
  assert.equal(relationOf(null, 'f', ['f'], [], []), 'none');
});

test('banner: newest live invite from a friend wins over a request', () => {
  const older = invite({ id: 'a_me', createdAt: 1000 });
  const newer = invite({ id: 'c_me', from: 'c', createdAt: 1500 });
  const b = pickBanner({ ...base, friends: ['a', 'c'], invites: [older, newer], requests: [request()] });
  assert.equal(b?.kind, 'invite');
  assert.equal(b?.kind === 'invite' && b.invite.id, 'c_me');
  assert.equal(pickBanner({ ...base, requests: [request()] })?.kind, 'request');
});

test('banner: stale, own-room, stranger and dismissed invites are skipped', () => {
  assert.equal(pickBanner({ ...base, invites: [invite({ createdAt: 1 })], now: 1 + INVITE_TTL_MS }), null);
  assert.equal(pickBanner({ ...base, invites: [invite()], currentRoomCode: 'K7M2QX' }), null);
  assert.equal(pickBanner({ ...base, invites: [invite({ from: 'stranger' })] }), null);
  const inv = invite();
  assert.equal(pickBanner({ ...base, invites: [inv], dismissed: [bannerKey({ kind: 'invite', invite: inv })] }), null);
  // a re-sent invite (new timestamp) shows again
  assert.equal(pickBanner({ ...base, invites: [{ ...inv, createdAt: 1800 }], dismissed: [bannerKey({ kind: 'invite', invite: inv })] })?.kind, 'invite');
});

test('banner: nothing pops up over a running game, and a request from an existing friend is ignored', () => {
  assert.equal(pickBanner({ ...base, invites: [invite()], requests: [request()], gameRunning: true }), null);
  assert.equal(pickBanner({ ...base, friends: ['a', 'b'], requests: [request()] }), null);
});
