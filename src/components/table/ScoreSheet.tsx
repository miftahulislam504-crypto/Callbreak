import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { CARD_RED, GOLD, GREEN_OK } from '@/constants/palette';
import type { T } from '@/lib/i18n';
import type { GameView, RoomView } from '@/lib/types';

export const signed = (score10: number): string => `${score10 >= 0 ? '+' : '−'}${(Math.abs(score10) / 10).toFixed(1)}`;

/** Round by round scores plus the running totals. */
export function ScoreSheet({
  visible, onClose, view, game, t,
}: { visible: boolean; onClose: () => void; view: RoomView; game: GameView; t: T }) {
  const names = view.seats.map((s) => s.name);
  const top = Math.max(...game.totals);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 }}>
        <Pressable style={{ backgroundColor: '#12281F', borderRadius: 18, padding: 14, maxHeight: '80%' }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 10 }}>
            {t('scoreSheet')} · {t('targetReach', { n: game.targetScore })}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <Text style={{ width: 34, color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>#</Text>
            {names.map((n, i) => (
              <Text key={i} numberOfLines={1} style={{ flex: 1, color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
                {n}
              </Text>
            ))}
          </View>
          <ScrollView style={{ marginTop: 6 }}>
            {game.history.map((r) => (
              <View key={r.round} style={{ flexDirection: 'row', paddingVertical: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
                <Text style={{ width: 34, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{r.round}</Text>
                {r.scores10.map((sc, i) => (
                  <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>{r.bids[i]}/{r.tricks[i]}</Text>
                    <Text style={{ color: sc >= 0 ? GREEN_OK : CARD_RED, fontSize: 13, fontWeight: '700' }}>{signed(sc)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', paddingTop: 8, marginTop: 4, borderTopWidth: 2, borderTopColor: 'rgba(255,255,255,0.25)' }}>
            <Text style={{ width: 34, color: '#fff', fontSize: 11, fontWeight: '700' }}>Σ</Text>
            {game.totals.map((tot, i) => (
              <Text key={i} style={{ flex: 1, textAlign: 'center', color: tot === top ? GOLD : '#fff', fontSize: 15, fontWeight: '800' }}>
                {tot.toFixed(1)}
              </Text>
            ))}
          </View>
          <Pressable onPress={onClose} style={{ alignSelf: 'center', marginTop: 12, paddingHorizontal: 20, paddingVertical: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{t('close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
