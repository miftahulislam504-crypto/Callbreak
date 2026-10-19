import { Text, useWindowDimensions, View } from 'react-native';

import { CARD_RED, CREAM, GOLD, GREEN_OK, MUTED } from '@/constants/palette';
import type { T } from '@/lib/i18n';
import { isNoBidRound } from '@/lib/rules';
import type { GameView, RoomView } from '@/lib/types';

import { useCountdownSeconds } from './hooks';
import { signed } from './ScoreSheet';

/** Summary of the round that just ended, until the next one is dealt. */
export function RoundEndOverlay({ view, game, t }: { view: RoomView; game: GameView; t: T }) {
  const { width } = useWindowDimensions();
  const secs = useCountdownSeconds(view.nextRoundAt, view.serverTime);
  const r = game.history[game.history.length - 1];
  if (!r) return null;
  const top = Math.max(...game.totals);
  const noBid = isNoBidRound(r.round);
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: Math.min(560, width - 80), backgroundColor: '#0B2F21', borderRadius: 20, padding: 14, gap: 6, borderWidth: 2, borderColor: '#C99A2E' }}>
        <Text style={{ color: GOLD, fontSize: 20, fontWeight: '900', textAlign: 'center' }}>{t('roundOver', { n: r.round })}</Text>
        {view.seats.map((s, i) => {
          const met = noBid ? true : r.tricks[i] >= r.bids[i];
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3, borderTopWidth: i ? 1 : 0, borderTopColor: 'rgba(255,255,255,0.08)' }}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: CREAM, fontWeight: '800' }}>
                  {s.name}{i === view.mySeat ? ` (${t('you')})` : ''}
                </Text>
                <Text style={{ color: MUTED, fontSize: 12 }}>{noBid ? `${t('noBidShort')} → ${r.tricks[i]}` : `${r.bids[i]} → ${r.tricks[i]}`}</Text>
              </View>
              <Text style={{ color: met ? GREEN_OK : CARD_RED, fontWeight: '900', width: 64, textAlign: 'right', fontSize: 15 }}>
                {signed(r.scores10[i])}
              </Text>
              <Text style={{ color: game.totals[i] === top ? GOLD : CREAM, fontWeight: '900', width: 58, textAlign: 'right', fontSize: 15 }}>
                {game.totals[i].toFixed(1)}
              </Text>
            </View>
          );
        })}
        <Text style={{ color: MUTED, textAlign: 'center', marginTop: 2, fontSize: 12.5 }}>
          {t('targetReach', { n: game.targetScore })}
          {secs !== null ? ` · ${t('nextRoundIn', { s: secs })}` : ''}
        </Text>
      </View>
    </View>
  );
}
