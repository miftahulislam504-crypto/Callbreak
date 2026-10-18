import { Pressable, Text, View } from 'react-native';

import { ACCENT, CARD_RED, GOLD } from '@/constants/palette';
import type { T } from '@/lib/i18n';
import type { GameView, RoomView } from '@/lib/types';

const MEDAL = ['🥇', '🥈', '🥉', '4'];

function Btn({ title, onPress, bg }: { title: string; onPress: () => void; bg: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ backgroundColor: bg, borderRadius: 12, minHeight: 46, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}

export function GameOverOverlay({
  view, game, t, onRematch, onScores, onLeave,
}: {
  view: RoomView; game: GameView; t: T;
  onRematch: () => void; onScores: () => void; onLeave: () => void;
}) {
  const winners = game.winners ?? [];
  const iWon = winners.includes(view.mySeat);
  const order = game.ranking ?? [0, 1, 2, 3];
  const isHost = view.mySeat === view.hostSeat;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 20 }}>
      <View style={{ backgroundColor: '#12281F', borderRadius: 20, padding: 18, gap: 12 }}>
        <Text style={{ color: GOLD, fontSize: 24, fontWeight: '800', textAlign: 'center' }}>
          {iWon ? t('youWon') : t('gameOver')}
        </Text>
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          {t('winnerIs', { names: winners.map((w) => view.seats[w].name).join(', ') })}
        </Text>
        {order.map((seat, pos) => (
          <View key={seat} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ width: 30, fontSize: 20, textAlign: 'center', color: '#fff' }}>{MEDAL[pos] ?? pos + 1}</Text>
            <Text numberOfLines={1} style={{ flex: 1, color: '#fff', fontWeight: '700' }}>
              {view.seats[seat].name}{seat === view.mySeat ? ` (${t('you')})` : ''}
            </Text>
            <Text style={{ color: winners.includes(seat) ? GOLD : '#fff', fontWeight: '800' }}>{game.totals[seat].toFixed(1)}</Text>
          </View>
        ))}
        <View style={{ gap: 8, marginTop: 4 }}>
          {isHost ? (
            <Btn title={t('rematch')} onPress={onRematch} bg={ACCENT} />
          ) : (
            <Text style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>{t('waitHostRematch')}</Text>
          )}
          <Btn title={t('scoreSheet')} onPress={onScores} bg="#2B4A3C" />
          <Btn title={t('leave')} onPress={onLeave} bg={CARD_RED} />
        </View>
      </View>
    </View>
  );
}
