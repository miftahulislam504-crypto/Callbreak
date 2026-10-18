import { SERVER_HTTP_URL } from './env';
import type { PublicRoom } from './types';

/** Public, joinable rooms (the server hides private and started rooms). */
export async function fetchPublicRooms(): Promise<PublicRoom[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${SERVER_HTTP_URL}/rooms`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`rooms_${res.status}`);
    return (await res.json()) as PublicRoom[];
  } finally {
    clearTimeout(timer);
  }
}

export interface WakeOptions {
  baseUrl?: string;
  /** Give up after this long (a cold start on a free host takes 30-60 s). */
  totalMs?: number;
  /** Per-attempt timeout. */
  tryMs?: number;
  retryMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Free hosts put an idle server to sleep. This keeps asking /health until the game server
 * itself answers (a host's "starting up" page also returns 200, so the JSON body is checked).
 */
export async function waitForServer(o: WakeOptions = {}): Promise<boolean> {
  const { baseUrl = SERVER_HTTP_URL, totalMs = 75_000, tryMs = 8_000, retryMs = 2_000, fetchImpl = fetch } = o;
  const started = Date.now();
  for (;;) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), tryMs);
    try {
      const res = await fetchImpl(`${baseUrl}/health`, { signal: ctrl.signal });
      if (res.ok && ((await res.json()) as { ok?: boolean })?.ok === true) return true;
    } catch {
      // not up yet (connection refused, timeout, or a non-JSON "starting" page)
    } finally {
      clearTimeout(timer);
    }
    if (Date.now() - started + retryMs >= totalMs) return false;
    await new Promise((r) => setTimeout(r, retryMs));
  }
}
