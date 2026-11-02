import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { handVisibleHeight } from './Hand';

/** Height kept free for the "your turn" status pill that sits just above the hand. */
const STATUS_PILL = 40;

/**
 * Where the bid / trump sheets live: in the band above your hand, with no dimming layer.
 * Your cards stay fully visible (and bright) along the bottom edge while you decide.
 * Taps outside the sheet pass straight through.
 */
export function BidDock({ children }: { children: ReactNode }) {
  const [h, setH] = useState(360);
  return (
    <View
      pointerEvents="box-none"
      onLayout={(e) => setH(e.nativeEvent.layout.height)}
      style={{
        position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: handVisibleHeight(h) + STATUS_PILL,
      }}>
      {children}
    </View>
  );
}
