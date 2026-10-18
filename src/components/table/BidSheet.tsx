import { Pressable, Text, View } from 'react-native';

import { ACCENT } from '@/constants/palette';
import type { T } from '@/lib/i18n';
import type { GameView } from '@/lib/types';

/** Shown over the middle of the table on your turn to bid. */
export function BidSheet({ game, onBid, t }: { game: GameView; onBid: (n: number) => void; t: T }) {
  const bids = Array.from({ length: game.maxBid - game.minBid + 1 }, (_, i) => game.minBid + i);
  return (
    <View
      style={{
        position: 'absolute', left: 16, right: 16, top: '30%', backgroundColor: 'rgba(8,24,17,0.94)',
        borderRadius: 18, padding: 16, gap: 12, alignItems: 'center',
      }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{t('chooseBid')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {bids.map((b) => (
          <Pressable
            key={b}
            onPress={() => onBid(b)}
            style={({ pressed }) => ({
              width: 64, height: 54, borderRadius: 12, backgroundColor: ACCENT,
              alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1,
            })}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{b}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
