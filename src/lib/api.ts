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
