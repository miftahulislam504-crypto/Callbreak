import assert from 'node:assert/strict';
import { test } from 'node:test';

import { waitForServer } from '../src/lib/api';

const ok = (body: unknown) => ({ ok: true, json: async () => body }) as Response;
const fast = { baseUrl: 'http://x', tryMs: 50, retryMs: 5 };

test('waitForServer: retries until the game server answers', async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls++;
    if (calls < 3) throw new Error('ECONNREFUSED');
    return ok({ ok: true });
  }) as unknown as typeof fetch;
  assert.equal(await waitForServer({ ...fast, totalMs: 1000, fetchImpl }), true);
  assert.equal(calls, 3);
});

test('waitForServer: a host "starting up" page (200 but not our JSON) does not count', async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls++;
    if (calls < 3) return { ok: true, json: async () => { throw new SyntaxError('not json'); } } as unknown as Response;
    return ok({ ok: true });
  }) as unknown as typeof fetch;
  assert.equal(await waitForServer({ ...fast, totalMs: 1000, fetchImpl }), true);
  assert.equal(calls, 3);
});

test('waitForServer: gives up after totalMs', async () => {
  const fetchImpl = (async () => {
    throw new Error('down');
  }) as unknown as typeof fetch;
  const t0 = Date.now();
  assert.equal(await waitForServer({ ...fast, totalMs: 80, fetchImpl }), false);
  assert.ok(Date.now() - t0 < 500);
});

test('waitForServer: an attempt that hangs is cut off by tryMs', async () => {
  const fetchImpl = ((_u: string, init?: RequestInit) =>
    new Promise((_res, rej) => init?.signal?.addEventListener('abort', () => rej(new Error('aborted'))))) as unknown as typeof fetch;
  assert.equal(await waitForServer({ ...fast, tryMs: 20, totalMs: 100, fetchImpl }), false);
});
