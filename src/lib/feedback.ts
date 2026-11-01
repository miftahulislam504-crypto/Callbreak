// What a press feels and sounds like: the small buzz plus the click. Use this on every button.
import { hapticTap } from './haptics';
import { sfx } from './sound';

export const uiTap = () => {
  hapticTap();
  sfx('tap');
};
