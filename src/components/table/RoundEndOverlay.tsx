import { Text, View } from 'react-native';

import { CARD_RED, GOLD, GREEN_OK } from '@/constants/palette';
import type { T } from '@/lib/i18n';
import type { GameView, RoomView } from '@/lib/types';

import { useCountdownSeconds } from './hooks';
import { signed } from './ScoreSheet';

/** Summary of the round that just ended, until the next one is dealt. */
export function RoundEndOverlay({ view, game, t }: { view: RoomView; game: GameView; t: T }) {
  const secs = useCountdownSeconds(view.nextRoundAt, view.serverTime);
  const r = game.history[game.history.length - 1];
  if (!r) return null;
  const top = Math.max(...game.totals);
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'center', padding: 20 }}>
      <View style={{ backgroundColor: '#12281F', borderRadius: 20, padding: 18, gap: 10 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' }}>{t('roundOver', { n: r.round })}</Text>
        {view.seats.map((s, i) => {
          const met = r.tricks[i] >= r.bids[i];
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '700' }}>
                  {s.name}{i === view.mySeat ? ` (${t('you')})` : ''}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{r.bids[i]} → {r.tricks[i]}</Text>
              </View>
              <Text style={{ color: met ? GREEN_OK : CARD_RED, fontWeight: '800', width: 60, textAlign: 'right' }}>
                {signed(r.scores10[i])}
              </Text>
              <Text style={{ color: game.totals[i] === top ? GOLD : '#fff', fontWeight: '800', width: 54, textAlign: 'right' }}>
                {game.totals[i].toFixed(1)}
              </Text>
            </View>
          );
        })}
        <Text style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4 }}>
          {t('targetReach', { n: game.targetScore })}
          {secs !== null ? ` · ${t('nextRoundIn', { s: secs })}` : ''}
        </Text>
      </View>
    </View>
  );
}
