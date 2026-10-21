// When to ask the server for a fresh voice token. Pure (no React Native), so it can be tested in Node.
//
// A token lives ~1 hour (CB_VOICE_TOKEN_SECONDS). The player asks for a new one well before that and hands
// it to the SDK (renewToken), so a long session never drops. Three safety nets sit behind this timer:
//   - the SDK's own "token will expire in 30 s" callback asks right away,
//   - a refusal ("rate_limited") is retried a little later,
//   - a token that really runs out ends the voice session, and the game goes on.

/** Ask for the new token this long before the old one expires (shortened for very short tokens). */
export const RENEW_LEAD_MS = 5 * 60_000;
/** Never renew more often than this, whatever the phone's clock says (a fast clock must not cause a request storm). */
export const MIN_RENEW_GAP_MS = 60_000;
/** After a refusal or when the socket is down: try again after this (a little over the server's 5 s limit). */
export const RENEW_RETRY_MS = 6_000;
/** A request that got no answer at all: ask again after this. */
export const RENEW_ANSWER_WAIT_MS = 12_000;

/**
 * Milliseconds from `now` until the next renewal request for a token that expires at `expiresAt` (server epoch ms).
 * If the phone's clock is far behind the server's this is large, and the SDK's 30-second callback covers it.
 */
export function renewDelayMs(expiresAt: number, now: number): number {
  const remaining = expiresAt - now;
  const lead = Math.min(RENEW_LEAD_MS, Math.max(0, remaining) / 2);
  return Math.max(MIN_RENEW_GAP_MS, remaining - lead);
}
