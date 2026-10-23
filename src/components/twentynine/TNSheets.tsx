import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { CARD_BLACK, CARD_RED, CREAM, GOLD, GOLD_DEEP, MUTED } from '@/constants/palette';
import { hapticTap } from '@/lib/haptics';
import type { T } from '@/lib/i18n';
import { SUIT_SYMBOL } from '@/lib/cards';
import type { Suit, TNGameView } from '@/lib/types';

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
const panelBase = {
  borderRadius: 22, paddingVertical: 14, paddingHorizontal: 18, gap: 12, alignItems: 'center' as const,
  backgroundColor: '#0B2F21', borderWidth: 2, borderColor: GOLD_DEEP,
  shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 12,
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
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={{ color: CREAM, fontSize: 20, fontWeight: '900' }}>{t('chooseBid')}</Text>
          <Text style={{ color: MUTED, fontSize: 12.5 }}>{t('tnBidHint')}</Text>
          <Text style={{ color: GOLD, fontSize: 13, fontWeight: '800' }}>
            {game.highBid > 0 ? t('tnHighBid', { n: game.highBid, name: names[game.highBidder] ?? '' }) : t('tnNoBidYet')}
          </Text>
          {game.forcedBid ? <Text style={{ color: '#FF9A9E', fontSize: 12.5 }}>{t('tnForcedBid', { n: game.minBid })}</Text> : null}
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
                  backgroundColor: ok ? '#FFFDF7' : 'rgba(255,255,255,0.08)', borderWidth: 2, borderColor: pressed && ok ? GOLD : ok ? '#D9D3C2' : 'transparent',
                  opacity: ok ? 1 : 0.5, transform: [{ scale: pressed && ok ? 1.05 : 1 }],
                })}>
                <Text style={{ color: ok ? CARD_BLACK : MUTED, fontSize: 20, fontWeight: '900' }}>{b}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          disabled={game.forcedBid}
          onPress={() => {
            hapticTap();
            onBid(0);
          }}
          style={({ pressed }) => ({
            paddingHorizontal: 30, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(160,30,36,0.85)', opacity: game.forcedBid ? 0.35 : pressed ? 0.8 : 1,
          })}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{t('passWord')}</Text>
        </Pressable>
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
                backgroundColor: '#FFFDF7', borderWidth: 2, borderColor: pressed ? GOLD : '#D9D3C2', transform: [{ scale: pressed ? 1.06 : 1 }],
              })}>
              <Text style={{ color: s === 'H' || s === 'D' ? CARD_RED : CARD_BLACK, fontSize: cell * 0.6, lineHeight: cell * 0.72 }}>{SUIT_SYMBOL[s]}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
