// Why a voice session ended, from Agora's connection-change reason. Pure, so it can be tested in Node.
//
// Reason codes (ConnectionChangedReasonType in react-native-agora): 2 interrupted, 3 banned by server,
// 4 join failed, 6 invalid App ID, 7 invalid channel name, 8 invalid token, 9 token expired,
// 10 rejected by server, 14 keep-alive timeout, 16 lost.

export type VoiceFailureKind =
  | 'network' // the connection is gone for good
  | 'service' // Agora refused us (banned, rejected, bad App ID): a quota or account problem, not the player's phone
  | 'token' //   the token ran out or was refused
  | 'other';

export function classifyFailure(reason: number): VoiceFailureKind {
  switch (reason) {
    case 3:
    case 6:
    case 10:
      return 'service';
    case 8:
    case 9:
      return 'token';
    case 2:
    case 14:
    case 16:
      return 'network';
    default:
      return 'other';
  }
}
