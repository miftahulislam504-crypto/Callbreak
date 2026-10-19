import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { ACCENT, CARD_RED, CREAM, GOLD, MUTED } from '@/constants/palette';
import type { T } from '@/lib/i18n';
import type { GameView, RoomView } from '@/lib/types';

const MEDAL = ['🥇', '🥈', '🥉', '4'];

function Btn({ title, onPress, bg }: { title: string; onPress: () => void; bg: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ backgroundColor: bg, borderRadius: 12, minHeight: 42, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14.5 }}>{title}</Text>
    </Pressable>
  );
}

export function GameOverOverlay({
  view, game, t, onRematch, onScores, onLeave,
}: {
  view: RoomView; game: GameView; t: T;
  onRematch: () => void; onScores: () => void; onLeave: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const winners = game.winners ?? [];
  const iWon = winners.includes(view.mySeat);
  const order = game.ranking ?? [0, 1, 2, 3];
  const isHost = view.mySeat === view.hostSeat;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: Math.min(700, width - 60), maxHeight: height - 20, flexDirection: 'row', gap: 16, backgroundColor: '#0B2F21', borderRadius: 22, padding: 16, borderWidth: 2, borderColor: '#C99A2E' }}>
        {/* left: result */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Text style={{ fontSize: 54 }}>{iWon ? '🏆' : '🎴'}</Text>
          <Text style={{ color: GOLD, fontSize: 24, fontWeight: '900', textAlign: 'center' }}>{iWon ? t('youWon') : t('gameOver')}</Text>
          <Text style={{ color: CREAM, textAlign: 'center' }}>{t('winnerIs', { names: winners.map((w) => view.seats[w].name).join(', ') })}</Text>
        </View>
        {/* right: ranking and buttons */}
        <View style={{ flex: 1.2, gap: 8 }}>
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 6 }}>
            {order.map((seat, pos) => (
              <View key={seat} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12, backgroundColor: winners.includes(seat) ? 'rgba(242,193,78,0.14)' : 'rgba(255,255,255,0.05)' }}>
                <Text style={{ width: 30, fontSize: 20, textAlign: 'center', color: CREAM }}>{MEDAL[pos] ?? pos + 1}</Text>
                <Text numberOfLines={1} style={{ flex: 1, color: CREAM, fontWeight: '800' }}>
                  {view.seats[seat].name}{seat === view.mySeat ? ` (${t('you')})` : ''}
                </Text>
                <Text style={{ color: winners.includes(seat) ? GOLD : CREAM, fontWeight: '900' }}>{game.totals[seat].toFixed(1)}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {isHost ? <Btn title={t('rematch')} onPress={onRematch} bg={ACCENT} /> : <Text style={{ color: MUTED, fontSize: 12.5, alignSelf: 'center' }}>{t('waitHostRematch')}</Text>}
            <Btn title={t('scoreSheet')} onPress={onScores} bg="#2B4A3C" />
            <Btn title={t('leave')} onPress={onLeave} bg={CARD_RED} />
          </View>
        </View>
      </View>
    </View>
  );
}
