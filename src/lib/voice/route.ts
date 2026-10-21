// Where the sound goes right now (Agora's onAudioRoutingChanged code). Pure, so it can be tested in Node.
//
// Codes (AudioRoute in react-native-agora): -1 default, 0 headset with mic, 1 earpiece, 2 headset without mic,
// 3 built-in speaker, 4 external speaker, 5 Bluetooth HFP, 6 USB, 7 HDMI, 8 DisplayPort, 9 AirPlay, 10 Bluetooth A2DP.

export type AudioRouteKind = 'unknown' | 'speaker' | 'earpiece' | 'headset' | 'bluetooth';

export function audioRouteKind(code: number): AudioRouteKind {
  switch (code) {
    case 0:
    case 2:
    case 6:
      return 'headset';
    case 5:
    case 10:
      return 'bluetooth';
    case 1:
      return 'earpiece';
    case 3:
    case 4:
      return 'speaker';
    default:
      return 'unknown';
  }
}

/** Echo happens when the sound comes out of a speaker the microphone can hear: no headset or Bluetooth on. */
export function routeCausesEcho(kind: AudioRouteKind): boolean {
  return kind !== 'headset' && kind !== 'bluetooth';
}
