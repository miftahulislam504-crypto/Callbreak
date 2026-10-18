import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toAppError } from '../src/lib/errors';

const err = (message: string, code?: string) => Object.assign(new Error(message), code ? { code } : {});

test('unreachable server is classified as a network error', () => {
  assert.equal(toAppError(err('fetch failed', 'ECONNREFUSED')).code, 'network');
  assert.equal(toAppError(err('Network request failed')).code, 'network');
  assert.equal(toAppError(err('The operation was aborted')).code, 'network');
  assert.equal(toAppError(err('x', 'ENOTFOUND')).code, 'network');
});

test('"reconnection" in a message is not mistaken for ECONN*', () => {
  const e = toAppError(err('Invalid reconnection token format'));
  assert.notEqual(e.code, 'network');
});

test('room errors and auth errors', () => {
  assert.equal(toAppError(err('room "ABC123" not found')).code, 'room_not_found');
  assert.equal(toAppError(err('room is full')).code, 'room_full');
  assert.equal(toAppError(err('invalid_token')).code, 'auth');
  assert.equal(toAppError(err('something odd')).code, 'unknown');
});
