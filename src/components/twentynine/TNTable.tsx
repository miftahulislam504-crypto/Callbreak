import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { Hand, handVisibleHeight } from '@/components/table/Hand';
import { PlayerSeat, type SeatSide } from '@/components/table/PlayerSeat';
import { MuteMenu, Wood } from '@/components/table/Table';
import type { TurnTimer } from '@/components/table/TimerBar';
import { TrickArea, trickAreaSize, trickCardWidth } from '@/components/table/TrickArea';
import { CREAM, GOLD, GOLD_DEEP, ON_GOLD } from '@/constants/palette';
import type { T } from '@/lib/i18n';
import type { ShownCard } from '@/lib/trickPlayer';
import type { Card, TNGameView, TNRoomView } from '@/lib/types';
import { canMuteSeat } from '@/lib/voice/ui';
import { useRoom } from '@/state/room';
import { useVoice } from '@/state/voice';

/**
 * 29 table, laid out like the Call Break one: opponents top / left / right, the trick in a cross in the
 * middle, your seat bottom-left and your hand along the bottom edge.
 */
export function TNTable({
  view, game, shown, sweepTo, turnTimer, status, myTurn, toast, onPlay, onIllegal, onReveal, t,
}: {
  view: TNRoomView; game: TNGameView; shown: ShownCard[]; sweepTo: number | null;
  turnTimer: { seat: number; timer: TurnTimer } | null;
  status: string; myTurn: boolean; toast: string | null;
  onPlay: (c: Card) => void; onIllegal: () => void; onReveal: () => void; t: T;
}) {
  const avatars = useRoom((s) => s.avatars);
  const voiceOn = useVoice((s) => s.status === 'on');
  const speaking = useVoice((s) => s.speaking);
  const mutedSeats = useVoice((s) => s.mutedSeats);
  const [menuSeat, setMenuSeat] = useState<number | null>(null);
  const [size, setSize] = useState({ w: 800, h: 360 });
  const { w, h } = size;
  const me = view.mySeat;
  const live = game.phase === 'bidding' || game.phase === 'trump' || game.phase === 'playing';

  const trickW = trickCardWidth(h);
  const area = trickAreaSize(trickW);
  const handTop = handVisibleHeight(h);
  const seatsSide = 150;

  const teamLabel = (i: number) => (i === me ? t('yourTeam') : i === (me + 2) % 4 ? t('partner') : t('opponent'));
  const scoreOf = (i: number): string => {
    if (game.phase === 'bidding') {
      const b = game.bids[i];
      return b === null ? '–' : b === 0 ? t('passWord') : String(b);
    }
    return `${game.tricksWon[i]}${game.declarer === i ? ` ★${game.contract}` : ''}`;
  };

  // Clockwise from you: 1 = left, 2 = across, 3 = right.
  const seat = (rel: number, side: SeatSide) => {
    const i = (me + rel) % 4;
    const s = view.seats[i];
    return (
      <PlayerSeat
        side={side}
        name={s.name}
        avatar={avatars[i] ?? null}
        isMe={rel === 0}
        isBot={s.isBot}
        offline={s.occupied && !s.isBot && !s.connected}
        auto={s.auto}
        isDealer={game.dealer === i}
        isTurn={live && game.turn === i}
        scoreText={scoreOf(i)}
        subText={teamLabel(i)}
        handCount={game.handCounts[i]}
        timer={turnTimer && turnTimer.seat === i ? turnTimer.timer : null}
        speaking={voiceOn && speaking[i] === true}
        voiceMuted={voiceOn && mutedSeats[i] === true}
        onPress={rel !== 0 && canMuteSeat(view, i, voiceOn) ? () => setMenuSeat(i) : undefined}
        t={t}
      />
    );
  };

  // Middle band between the top seat and the hand.
  const topSeatH = 96;
  const bandTop = topSeatH + 4;
  const bandBottom = h - handTop - 30;
  const trickTop = Math.max(bandTop, bandTop + (bandBottom - bandTop - area.h) / 2);

  return (
    <View style={{ flex: 1, overflow: 'hidden' }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Wood />

      <View style={{ position: 'absolute', top: 6, left: 0, right: 0, alignItems: 'center' }}>{seat(2, 'top')}</View>
      <View style={{ position: 'absolute', left: 14, top: (h - 150) / 2 - 8 }}>{seat(1, 'left')}</View>
      <View style={{ position: 'absolute', right: 14, top: (h - 150) / 2 - 8 }}>{seat(3, 'right')}</View>

      <View style={{ position: 'absolute', left: (w - area.w) / 2, top: trickTop }}>
        <TrickArea shown={shown} sweepTo={sweepTo} mySeat={me} cardW={trickW} />
      </View>

      {/* The hand grows from 4 to 8 cards once trump is chosen, so it is remounted then. */}
      <Hand
        key={`${game.round}:${game.myHand.length}`}
        cards={game.myHand}
        legal={game.legal}
        canPlay={game.phase === 'playing' && game.turn === me}
        onPlay={onPlay}
        onIllegal={onIllegal}
        areaW={w}
        areaH={h}
        leftInset={seatsSide - 20}
        rightInset={seatsSide - 40}
      />

      {/* my seat, bottom-left, in front of the hand */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 14, bottom: 10 }}>{seat(0, 'me')}</View>

      {/* a player who cannot follow suit may ask for the hidden trump */}
      {myTurn && game.canReveal ? (
        <View pointerEvents="box-none" style={{ position: 'absolute', left: w / 2 - 100, width: 200, bottom: handTop + 48, alignItems: 'center', zIndex: 12 }}>
          <Pressable
            onPress={onReveal}
            hitSlop={8}
            style={({ pressed }) => ({
              paddingHorizontal: 18, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
              backgroundColor: GOLD, borderWidth: 2, borderColor: GOLD_DEEP, opacity: pressed ? 0.85 : 1,
            })}>
            <Text style={{ color: ON_GOLD, fontWeight: '900', fontSize: 14 }}>{t('tnAskTrump')}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* whose turn it is / what to do */}
      {status ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', left: w / 2 - 160, width: 320, bottom: handTop + 6, alignItems: 'center',
            paddingVertical: 5, borderRadius: 16, backgroundColor: myTurn ? GOLD : 'rgba(20,12,4,0.65)',
            borderWidth: 1, borderColor: myTurn ? GOLD_DEEP : 'rgba(255,255,255,0.12)',
          }}>
          <Text numberOfLines={1} style={{ color: myTurn ? ON_GOLD : CREAM, fontWeight: '800', fontSize: 13 }}>{status}</Text>
        </View>
      ) : null}

      {menuSeat !== null && canMuteSeat(view, menuSeat, voiceOn) ? (
        <MuteMenu
          name={view.seats[menuSeat].name}
          rel={(menuSeat - me + 4) % 4}
          muted={mutedSeats[menuSeat] === true}
          h={h}
          w={w}
          onClose={() => setMenuSeat(null)}
          onToggle={() => {
            useVoice.getState().setSeatMuted(menuSeat, mutedSeats[menuSeat] !== true);
            setMenuSeat(null);
          }}
          t={t}
        />
      ) : null}

      {toast ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: w * 0.2, right: w * 0.2, bottom: handTop + 42, backgroundColor: 'rgba(0,0,0,0.82)', borderRadius: 12, padding: 10 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontSize: 13 }}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}
