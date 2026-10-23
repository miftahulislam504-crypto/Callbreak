import { ScrollView, useWindowDimensions, View } from 'react-native';

import { PANEL_FRAME } from '@/constants/ui';
import { PanelShine } from '@/components/frame';
import { Button } from '@/components/kit';
import { Text } from '@/components/text';
import { CREAM, GOLD, MUTED } from '@/constants/palette';
import type { T } from '@/lib/i18n';
import type { PokerGameView, PokerRoomView } from '@/lib/types';

const MEDAL = ['🥇', '🥈', '🥉'];

/** The freezeout is over: the standings (everyone's chips, in the order they finished) and the buttons. */
export function PokerGameOver({
  view, game, t, onRematch, onLeave,
}: { view: PokerRoomView; game: PokerGameView; t: T; onRematch: () => void; onLeave: () => void }) {
  const { width, height } = useWindowDimensions();
  const winners = game.winners ?? [];
  const iWon = winners.includes(view.mySeat);
  const order = game.ranking ?? [];
  const isHost = view.mySeat === view.hostSeat;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 30 }}>
      <View style={[PANEL_FRAME, { width: Math.min(700, width - 60), maxHeight: height - 20, flexDirection: 'row', gap: 16, padding: 16 }]}>
        <PanelShine />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Text style={{ fontSize: 54 }}>{iWon ? '🏆' : '🎴'}</Text>
          <Text style={{ color: GOLD, fontSize: 24, fontWeight: '900', textAlign: 'center' }}>{iWon ? t('youWon') : t('gameOver')}</Text>
          <Text style={{ color: CREAM, textAlign: 'center' }}>{t('winnerIs', { names: winners.map((s) => view.seats[s]?.name ?? '').join(', ') })}</Text>
          <Text style={{ color: MUTED, fontSize: 12 }}>{t('pkHandsPlayed', { n: game.handNo })}</Text>
        </View>
        <View style={{ flex: 1.2, gap: 8 }}>
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 6 }}>
            {order.map((seat, pos) => (
              <View key={seat} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12, backgroundColor: winners.includes(seat) ? 'rgba(242,193,78,0.14)' : 'rgba(255,255,255,0.05)' }}>
                <Text style={{ width: 30, fontSize: 18, textAlign: 'center', color: CREAM }}>{MEDAL[pos] ?? pos + 1}</Text>
                <Text numberOfLines={1} style={{ flex: 1, color: CREAM, fontWeight: '800' }}>
                  {view.seats[seat]?.name}{seat === view.mySeat ? ` (${t('you')})` : ''}
                </Text>
                <Text style={{ color: winners.includes(seat) ? GOLD : CREAM, fontWeight: '900' }}>{game.players[seat]?.chips ?? 0}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {isHost ? <Button compact variant="gold" title={t('rematch')} onPress={onRematch} /> : <Text style={{ color: MUTED, fontSize: 12.5, alignSelf: 'center' }}>{t('waitHostRematch')}</Text>}
            <Button compact variant="danger" title={t('leave')} onPress={onLeave} />
          </View>
        </View>
      </View>
    </View>
  );
}
