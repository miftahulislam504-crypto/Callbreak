// "Who is speaking right now?" from Agora's volume reports. Pure (no React Native), so it can be tested in Node.
//
// Agora sends the volume reports in two separate callbacks (one for me, one for up to 3 other people), and
// it does not say when someone stops: a person is "speaking" while a loud enough report is recent.

/** Agora volume is 0..255. Quiet room noise sits well below this; tune it on real phones. */
export const SPEAKING_VOLUME = 25;
/** A report keeps its speaker lit this long, which also smooths over the gaps between words. */
export const SPEAKING_HOLD_MS = 700;

export interface SpeakingTracker {
  /** One person's volume report. */
  hear(uid: number, volume: number, now: number): void;
  /** Stop showing this person as speaking right away (e.g. I just muted myself). */
  forget(uid: number): void;
  /** The uids that are speaking at `now`, sorted. */
  active(now: number): number[];
  clear(): void;
}

export function createSpeakingTracker(): SpeakingTracker {
  const lastLoud = new Map<number, number>();
  return {
    hear(uid, volume, now) {
      if (volume >= SPEAKING_VOLUME) lastLoud.set(uid, now);
    },
    forget(uid) {
      lastLoud.delete(uid);
    },
    active(now) {
      const out: number[] = [];
      for (const [uid, at] of lastLoud) {
        if (now - at <= SPEAKING_HOLD_MS) out.push(uid);
        else lastLoud.delete(uid);
      }
      return out.sort((a, b) => a - b);
    },
    clear() {
      lastLoud.clear();
    },
  };
}
