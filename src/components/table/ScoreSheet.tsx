import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { CARD_RED, CREAM, GOLD, GREEN_OK, MUTED } from '@/constants/palette';
import type { T } from '@/lib/i18n';
import { fmtPts, isNoBidRound } from '@/lib/rules';
import type { GameView, RoomView } from '@/lib/types';

export const signed = (score10: number): string => `${score10 >= 0 ? '+' : '−'}${fmtPts(Math.abs(score10) / 10)}`;

/** Round by round scores plus the running totals. */
export function ScoreSheet({
  visible, onClose, view, game, t,
}: { visible: boolean; onClose: () => void; view: RoomView; game: GameView; t: T }) {
  const { width, height } = useWindowDimensions();
  const names = view.seats.map((s) => s.name);
  const top = Math.max(...game.totals);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'center' }}>
        <Pressable
          style={{ width: Math.min(680, width - 60), maxHeight: height - 24, backgroundColor: '#0B2F21', borderRadius: 20, padding: 14, borderWidth: 2, borderColor: '#C99A2E' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: CREAM, fontSize: 18, fontWeight: '900' }}>
              {t('scoreSheet')} · <Text style={{ color: GOLD }}>{t('targetReach', { n: game.targetScore })}</Text>
            </Text>
            <Pressable onPress={onClose} hitSlop={8} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <Text style={{ color: CREAM, fontWeight: '800' }}>{t('close')} ✕</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', paddingBottom: 4 }}>
            <Text style={{ width: 34, color: MUTED, fontSize: 11 }}>#</Text>
            {names.map((n, i) => (
              <Text key={i} numberOfLines={1} style={{ flex: 1, color: CREAM, fontSize: 12.5, fontWeight: '800', textAlign: 'center' }}>
                {n}
              </Text>
            ))}
          </View>
          <ScrollView style={{ flexShrink: 1 }}>
            {game.history.map((r, idx) => (
              <View
                key={r.round}
                style={{ flexDirection: 'row', paddingVertical: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: idx % 2 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                <Text style={{ width: 34, color: MUTED, fontSize: 12, paddingTop: 2 }}>{r.round}</Text>
                {r.scores10.map((sc, i) => (
                  <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: MUTED, fontSize: 11 }}>{isNoBidRound(r.round) ? `${t('noBidShort')} → ${r.tricks[i]}` : `${r.bids[i]} → ${r.tricks[i]}`}</Text>
                    <Text style={{ color: sc >= 0 ? GREEN_OK : CARD_RED, fontSize: 14, fontWeight: '800' }}>{signed(sc)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', paddingTop: 8, marginTop: 4, borderTopWidth: 2, borderTopColor: 'rgba(242,193,78,0.5)' }}>
            <Text style={{ width: 34, color: GOLD, fontSize: 13, fontWeight: '900' }}>Σ</Text>
            {game.totals.map((tot, i) => (
              <Text key={i} style={{ flex: 1, textAlign: 'center', color: tot === top ? GOLD : CREAM, fontSize: 17, fontWeight: '900' }}>
                {fmtPts(tot)}
              </Text>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
