import { Pressable, useWindowDimensions, View } from 'react-native';

import { PANEL_FRAME } from '@/constants/ui';
import { Button } from '@/components/kit';
import { PanelShine } from '@/components/frame';
import { Text } from '@/components/text';
import { CARD_BLACK, CARD_RED, CREAM, GOLD, IVORY, IVORY_EDGE, MUTED, ROSE } from '@/constants/palette';
import { hapticTap } from '@/lib/haptics';
import type { T } from '@/lib/i18n';
import { SUIT_SYMBOL } from '@/lib/cards';
import type { Suit, TNGameView } from '@/lib/types';

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
const panelBase = {
  ...PANEL_FRAME, paddingVertical: 14, paddingHorizontal: 18, gap: 12, alignItems: 'center' as const,
};
const dim = { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: 'rgba(0,0,0,0.38)' };

/** Your turn to bid: 16..28 or pass. Numbers that do not beat the current bid are greyed out. */
export function TNBidSheet({ game, names, onBid, t }: { game: TNGameView; names: string[]; onBid: (n: number) => void; t: T }) {
  const { width, height } = useWindowDimensions();
  const bids = Array.from({ length: game.maxBid - game.minBid + 1 }, (_, i) => game.minBid + i);
  const gap = 8;
  const perRow = bids.length > 7 ? 7 : bids.length;
  const cellW = Math.max(44, Math.min(60, Math.floor((Math.min(width - 140, 560) - gap * (perRow - 1)) / perRow)));
  return (
    <View pointerEvents="box-none" style={dim}>
      <View style={[panelBase, { maxHeight: height - 30, maxWidth: width - 40 }]}>
        <PanelShine />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={{ color: CREAM, fontSize: 20, fontWeight: '900' }}>{t('chooseBid')}</Text>
          <Text style={{ color: MUTED, fontSize: 12.5 }}>{t('tnBidHint')}</Text>
          <Text style={{ color: GOLD, fontSize: 13, fontWeight: '800' }}>
            {game.highBid > 0 ? t('tnHighBid', { n: game.highBid, name: names[game.highBidder] ?? '' }) : t('tnNoBidYet')}
          </Text>
          {game.forcedBid ? <Text style={{ color: ROSE, fontSize: 12.5 }}>{t('tnForcedBid', { n: game.minBid })}</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, justifyContent: 'center', maxWidth: perRow * (cellW + gap) }}>
          {bids.map((b) => {
            const ok = b > game.highBid;
            return (
              <Pressable
                key={b}
                disabled={!ok}
                onPress={() => {
                  hapticTap();
                  onBid(b);
                }}
                style={({ pressed }) => ({
                  width: cellW, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: ok ? IVORY : 'rgba(255,255,255,0.08)', borderWidth: 2, borderColor: pressed && ok ? GOLD : ok ? IVORY_EDGE : 'transparent',
                  opacity: ok ? 1 : 0.5, transform: [{ scale: pressed && ok ? 1.05 : 1 }],
                })}>
                <Text style={{ color: ok ? CARD_BLACK : MUTED, fontSize: 20, fontWeight: '900' }}>{b}</Text>
              </Pressable>
            );
          })}
        </View>
        <Button
          variant="danger"
          title={t('passWord')}
          disabled={game.forcedBid}
          onPress={() => onBid(0)}
          style={{ minWidth: 150 }}
        />
      </View>
    </View>
  );
}

/** The bidder picks the trump suit after seeing the first four cards. Nobody else is told which one it is. */
export function TNTrumpSheet({ onPick, t }: { onPick: (s: Suit) => void; t: T }) {
  const { width } = useWindowDimensions();
  const cell = Math.max(64, Math.min(88, Math.floor((width - 200) / 4)));
  return (
    <View pointerEvents="box-none" style={dim}>
      <View style={panelBase}>
        <PanelShine />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={{ color: CREAM, fontSize: 20, fontWeight: '900' }}>{t('tnPickTrump')}</Text>
          <Text style={{ color: MUTED, fontSize: 12.5, textAlign: 'center' }}>{t('tnPickTrumpHint')}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {SUITS.map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                hapticTap();
                onPick(s);
              }}
              style={({ pressed }) => ({
                width: cell, height: cell * 1.1, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                backgroundColor: IVORY, borderWidth: 2, borderColor: pressed ? GOLD : IVORY_EDGE, transform: [{ scale: pressed ? 1.06 : 1 }],
              })}>
              <Text style={{ color: s === 'H' || s === 'D' ? CARD_RED : CARD_BLACK, fontSize: cell * 0.6, lineHeight: cell * 0.72 }}>{SUIT_SYMBOL[s]}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
