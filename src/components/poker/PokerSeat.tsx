import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/kit';
import { PlayingCard } from '@/components/table/PlayingCard';
import { TimerBar, type TurnTimer } from '@/components/table/TimerBar';
import { CREAM, GOLD, GREEN_OK } from '@/constants/palette';
import type { T } from '@/lib/i18n';
import type { Card, PokerPlayerView, PublicSeat } from '@/lib/types';

export const SEAT_W = 104;
export const SEAT_H = 96;

const actionKey = {
  sb: 'pkSb', bb: 'pkBb', fold: 'pkFold', check: 'pkCheck', call: 'pkCall', raise: 'pkRaise', allin: 'pkAllIn',
} as const;

/** One player at the poker table: photo, name, chips, last action and (small) cards. */
export function PokerSeat({
  p, seat, avatar, isMe, isTurn, isButton, won, delta, timer, speaking, voiceMuted, onPress, t,
}: {
  p: PokerPlayerView; seat: PublicSeat; avatar: string | null; isMe: boolean; isTurn: boolean; isButton: boolean;
  /** This player won chips in the hand that just ended. */
  won: boolean; delta: number | null;
  timer: TurnTimer | null; speaking: boolean; voiceMuted: boolean; onPress?: () => void; t: T;
}) {
  const out = !p.inGame;
  const folded = p.folded;
  const label = p.lastAction && p.lastAction in actionKey ? t(actionKey[p.lastAction as keyof typeof actionKey]) : '';
  const faded = out || folded;
  const showCards: Card[] | null = p.shown;
  const holding = p.inHand && !folded && !isMe;
  const ring = isTurn ? GOLD : won ? GREEN_OK : speaking ? GREEN_OK : 'transparent';

  return (
    <Pressable disabled={!onPress} onPress={onPress} hitSlop={4} style={{ width: SEAT_W, alignItems: 'center', gap: 2, opacity: faded ? 0.5 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
        <View style={{ padding: 2, borderRadius: 11, borderWidth: 3, borderColor: ring }}>
          <Avatar name={seat.name || '?'} uri={avatar} bot={seat.isBot} size={38} />
          {voiceMuted ? (
            <View style={{ position: 'absolute', right: -4, bottom: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: '#B3262D', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="volume-mute" size={10} color="#fff" />
            </View>
          ) : null}
          {isButton ? (
            <View style={{ position: 'absolute', right: -7, top: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#7B4A24' }}>
              <Text style={{ color: '#3A2400', fontSize: 10, fontWeight: '900' }}>D</Text>
            </View>
          ) : null}
        </View>
        {/* the other players' two cards: backs, or face up at a showdown */}
        {showCards ? (
          <View style={{ flexDirection: 'row', gap: 1 }}>
            {showCards.map((c, i) => <PlayingCard key={i} card={c} width={22} />)}
          </View>
        ) : holding ? (
          <View style={{ flexDirection: 'row' }}>
            <PlayingCard faceDown width={18} />
            <View style={{ marginLeft: -9 }}><PlayingCard faceDown width={18} /></View>
          </View>
        ) : null}
      </View>
      <View style={{ backgroundColor: 'rgba(8,24,16,0.78)', borderRadius: 11, paddingHorizontal: 8, paddingVertical: 2, alignItems: 'center', minWidth: 80, maxWidth: SEAT_W, borderWidth: isTurn || won ? 1.5 : 0, borderColor: won ? GREEN_OK : GOLD }}>
        <Text numberOfLines={1} style={{ color: CREAM, fontSize: 11.5, fontWeight: '800' }}>{seat.name}</Text>
        <Text style={{ color: GOLD, fontSize: 12.5, fontWeight: '900' }}>{out ? t('pkOut') : p.chips}</Text>
      </View>
      {won && delta !== null && delta > 0 ? (
        <Text style={{ color: GREEN_OK, fontSize: 12, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 2 }}>+{delta}</Text>
      ) : label && !out ? (
        <Text style={{ color: p.allIn ? '#FFB36B' : 'rgba(255,255,255,0.9)', fontSize: 10.5, fontWeight: '800', textShadowColor: '#000', textShadowRadius: 2 }}>{label}</Text>
      ) : seat.auto || (!seat.isBot && !seat.connected) ? (
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9.5, fontWeight: '700' }}>
          {[seat.auto ? t('badgeAuto') : '', !seat.isBot && !seat.connected ? t('offline') : ''].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
      {timer ? <TimerBar timer={timer} width={70} /> : null}
    </Pressable>
  );
}
