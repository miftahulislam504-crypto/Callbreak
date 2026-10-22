// Pure helpers for the friend system (no React Native / Firebase imports, so they run under `npm test`).

export const FRIEND_CODE_LENGTH = 6;
/** No 0/O/1/I, so a code read out loud or typed from a screenshot is hard to get wrong. */
export const FRIEND_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** An invite older than this is ignored (the room has most likely moved on). */
export const INVITE_TTL_MS = 5 * 60_000;
/** Minimum gap before the same friend can be invited again from the lobby. */
export const REINVITE_COOLDOWN_MS = 15_000;
export const MAX_FRIENDS = 100;

export function makeFriendCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < FRIEND_CODE_LENGTH; i++) {
    code += FRIEND_CODE_ALPHABET[Math.floor(random() * FRIEND_CODE_ALPHABET.length)];
  }
  return code;
}

/** What the user typed -> the code to look up (upper case, letters and digits only, at most 6). */
export function normalizeFriendCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, FRIEND_CODE_LENGTH);
}

export function isValidFriendCode(code: string): boolean {
  return new RegExp(`^[${FRIEND_CODE_ALPHABET}]{${FRIEND_CODE_LENGTH}}$`).test(code);
}

/** Doc id of a friend request or an invite: "<fromUid>_<toUid>". */
export const pairId = (from: string, to: string): string => `${from}_${to}`;

export interface FriendRequest {
  id: string;
  from: string;
  fromName: string;
  /** Epoch ms; null while the server timestamp is still pending. */
  createdAt: number | null;
}

export interface Invite {
  id: string;
  from: string;
  fromName: string;
  roomCode: string;
  roomName: string;
  createdAt: number | null;
}

export function inviteAlive(createdAt: number | null, now: number, ttl = INVITE_TTL_MS): boolean {
  return createdAt === null || now - createdAt < ttl;
}

export type Relation = 'self' | 'friend' | 'incoming' | 'outgoing' | 'none';

/** How `other` relates to `me`: used to pick the button next to a player's name. */
export function relationOf(
  me: string | null | undefined,
  other: string | null | undefined,
  friends: readonly string[],
  incomingFrom: readonly string[],
  outgoingTo: readonly string[],
): Relation {
  if (!me || !other) return 'none';
  if (me === other) return 'self';
  if (friends.includes(other)) return 'friend';
  if (incomingFrom.includes(other)) return 'incoming';
  if (outgoingTo.includes(other)) return 'outgoing';
  return 'none';
}

export type BannerItem = { kind: 'invite'; invite: Invite } | { kind: 'request'; request: FriendRequest };

/** Same id with a newer timestamp (a re-sent invite) counts as new, so it can pop up again after a dismissal. */
export const bannerKey = (item: BannerItem): string => {
  const x = item.kind === 'invite' ? item.invite : item.request;
  return `${item.kind}:${x.id}@${x.createdAt ?? 'pending'}`;
};

const newestFirst = <T extends { createdAt: number | null }>(a: T, b: T): number =>
  (b.createdAt ?? Infinity) - (a.createdAt ?? Infinity);

export interface BannerInput {
  invites: readonly Invite[];
  requests: readonly FriendRequest[];
  friends: readonly string[];
  /** Banner keys the player already closed. */
  dismissed: readonly string[];
  now: number;
  /** The room we are sitting in, if any (an invite to it is pointless). */
  currentRoomCode: string | null;
  /** A game is being played: do not pop anything over the table. */
  gameRunning: boolean;
}

/** The one notification to show on top of the screen right now: newest invite first, then a friend request. */
export function pickBanner(i: BannerInput): BannerItem | null {
  if (i.gameRunning) return null;
  const open = (item: BannerItem) => !i.dismissed.includes(bannerKey(item));

  const invite = [...i.invites]
    .filter((v) => inviteAlive(v.createdAt, i.now) && v.roomCode !== i.currentRoomCode && i.friends.includes(v.from))
    .sort(newestFirst)
    .map((v): BannerItem => ({ kind: 'invite', invite: v }))
    .find(open);
  if (invite) return invite;

  return (
    [...i.requests]
      .filter((r) => !i.friends.includes(r.from))
      .sort(newestFirst)
      .map((r): BannerItem => ({ kind: 'request', request: r }))
      .find(open) ?? null
  );
}
