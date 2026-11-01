// One short, calm set of transitions for dialogs, sheets and overlays (screens use the router's own fade / slide).
// Keep them small: a card-room game should feel crisp, not busy.
import { FadeIn, FadeInDown, Keyframe } from 'react-native-reanimated';

/** A dialog or panel: fades in while growing from 92% to full size. */
export const POP_IN = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.92 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(180);

/** A sheet that sits on the table (bid, trump): fades in while rising a little. */
export const SHEET_IN = FadeInDown.duration(200);

/** The dim layer behind an overlay. */
export const DIM_IN = FadeIn.duration(180);
