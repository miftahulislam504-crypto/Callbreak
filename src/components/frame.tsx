import { View } from 'react-native';

import { GOLD_LINE_SOFT, GOLD_RIM } from '@/constants/palette';
import { R } from '@/constants/ui';

/** The glossy highlight across the top half of a chunky button. */
export function Gloss({ radius }: { radius: number }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 6, right: 6, top: 2, height: '38%', borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.18)' }}
    />
  );
}

/**
 * Finishing touch for a dialog / sheet frame (see PANEL_FRAME): a fine inner gold line and a bright
 * highlight on the top edge. Absolute, so it never changes the layout. Make it the first child.
 */
export function PanelShine({ radius = R.xl }: { radius?: number }) {
  return (
    <>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 4, right: 4, top: 4, bottom: 4, borderRadius: Math.max(radius - 4, 4), borderWidth: 1, borderColor: GOLD_LINE_SOFT }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 22, right: 22, top: 0, height: 2, borderRadius: 1, backgroundColor: GOLD_RIM, opacity: 0.55 }}
      />
    </>
  );
}
