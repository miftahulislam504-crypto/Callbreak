import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CREAM, GOLD, WOOD, WOOD_LINE } from '@/constants/palette';
import { isNoBidRound } from '@/lib/rules';
import { canMuteSeat } from '@/lib/voice/ui';
import { useRoom } from '@/state/room';
import { useVoice } from '@/state/voice';
import type { T } from '@/lib/i18n';
import type { ShownCard } from '@/lib/trickPlayer';
import type { Card, GameView, RoomView } from '@/lib/types';

import { cardsReceived, dealProgress } from '@/lib/dealing';

import { DealAnimation } from './DealAnimation';
import { Hand, handVisibleHeight } from './Hand';
import type { DealClock } from './hooks';
import { PlayerSeat, type SeatSide } from './PlayerSeat';
import type { TurnTimer } from './TimerBar';
import { TrickArea, trickAreaSize, trickCardWidth } from './TrickArea';

/** Wooden planks, like the reference table, with a soft dark edge so the cards stand out. */
export function Wood() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: WOOD[0] }}>
      {WOOD.map((c, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: c, borderBottomWidth: 1.5, borderBottomColor: WOOD_LINE }}>
          <View style={{ position: 'absolute', left: `${(i * 23) % 60}%`, top: '38%', width: '22%', height: 1, backgroundColor: 'rgba(90,50,20,0.25)' }} />
          <View style={{ position: 'absolute', left: `${30 + ((i * 41) % 50)}%`, top: '66%', width: '14%', height: 1, backgroundColor: 'rgba(90,50,20,0.2)' }} />
        </View>
      ))}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '22%', backgroundColor: 'rgba(0,0,0,0.12)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '34%', backgroundColor: 'rgba(0,0,0,0.16)' }} />
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '8%', backgroundColor: 'rgba(0,0,0,0.08)' }} />
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8%', backgroundColor: 'rgba(0,0,0,0.08)' }} />
    </View>
  );
}

/** Small popup next to a seat: mute or unmute that player (on this device only). Tap outside to close. */
export function MuteMenu({
  name, rel, muted, w, h, onClose, onToggle, t,
}: { name: string; rel: number; muted: boolean; w: number; h: number; onClose: () => void; onToggle: () => void; t: T }) {
  const width = 200;
  const pos = rel === 2
    ? { left: (w - width) / 2, top: 108 } // across: under the top seat
    : rel === 1
      ? { left: 14, top: (h - 150) / 2 + 100 }
      : { right: 14, top: (h - 150) / 2 + 100 };
  return (
    <>
      <Pressable onPress={onClose} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 40 }} />
      <View
        style={{
          position: 'absolute', width, zIndex: 41, borderRadius: 14, padding: 10, gap: 8, ...pos,
          backgroundColor: '#0B2F21', borderWidth: 1.5, borderColor: GOLD,
        }}>
        <Text numberOfLines={1} style={{ color: CREAM, fontWeight: '800', fontSize: 13, textAlign: 'center' }}>{name}</Text>
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 19,
            backgroundColor: muted ? 'rgba(52,195,143,0.25)' : 'rgba(229,72,77,0.25)', opacity: pressed ? 0.75 : 1,
          })}>
          <Ionicons name={muted ? 'volume-high' : 'volume-mute'} size={18} color={CREAM} />
          <Text style={{ color: CREAM, fontWeight: '800', fontSize: 13.5 }}>{muted ? t('unmutePlayer') : t('mutePlayer')}</Text>
        </Pressable>
      </View>
    </>
  );
}

/**
 * Landscape table: opponents at the top, left and right, the trick in a cross in the middle,
 * your seat bottom-left and your hand fanned along the bottom edge.
 */
export function Table({
  view, game, shown, sweepTo, turnTimer, dealClock, status, myTurn, toast, onPlay, onIllegal, t,
}: {
  view: RoomView; game: GameView; shown: ShownCard[]; sweepTo: number | null;
  dealClock: DealClock | null;
  turnTimer: { seat: number; timer: TurnTimer } | null;
  status: string; myTurn: boolean; toast: string | null;
  onPlay: (c: Card) => void; onIllegal: () => void; t: T;
}) {
  const avatars = useRoom((s) => s.avatars);
  const voiceOn = useVoice((s) => s.status === 'on');
  const speaking = useVoice((s) => s.speaking);
  const mutedSeats = useVoice((s) => s.mutedSeats);
  const [menuSeat, setMenuSeat] = useState<number | null>(null);
  const [size, setSize] = useState({ w: 800, h: 360 });
  const { w, h } = size;
  const me = view.mySeat;
  const live = game.phase === 'bidding' || game.phase === 'playing';
  const noBid = isNoBidRound(game.round);

  const trickW = trickCardWidth(h);
  const area = trickAreaSize(trickW);
  const handTop = handVisibleHeight(h);
  const seatsSide = 150;

  // Dealing: cards go out one by one, clockwise from the player after the dealer.
  const dealing = game.phase === 'dealing';
  const progress = dealing && dealClock ? dealProgress(dealClock.elapsed, dealClock.dealMs) : { launched: 52, landed: 52 };
  const dealtTo = (seatIdx: number): number => {
    if (!dealing) return game.handCounts[seatIdx];
    const k = (seatIdx - game.dealer - 1 + 8) % 4; // 0 = first to be dealt a card
    return Math.min(13, cardsReceived(progress.landed, k));
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
        bid={game.bids[i]}
        noBid={noBid}
        won={game.tricksWon[i]}
        handCount={dealtTo(i)}
        total={game.totals[i]}
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

  // Where each player's cards land, in dealing order (first receiver first), for the deal animation.
  const spot = (rel: number) =>
    rel === 0 ? { x: w / 2, y: h - handTop / 2 }
      : rel === 1 ? { x: 120, y: h / 2 - 8 }
        : rel === 2 ? { x: w / 2 + 52, y: 44 }
          : { x: w - 120, y: h / 2 - 8 };
  const dealCenter = { x: w / 2, y: trickTop + area.h / 2 };
  const dealTargets = [0, 1, 2, 3].map((k) => spot((((game.dealer + 1 + k) % 4) - me + 4) % 4));
  const myK = (me - game.dealer - 1 + 8) % 4;
  const myDealt = dealing ? Math.min(13, cardsReceived(progress.landed, myK)) : game.myHand.length;

  return (
    <View style={{ flex: 1, overflow: 'hidden' }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Wood />

      <View style={{ position: 'absolute', top: 6, left: 0, right: 0, alignItems: 'center' }}>{seat(2, 'top')}</View>
      <View style={{ position: 'absolute', left: 14, top: (h - 150) / 2 - 8 }}>{seat(1, 'left')}</View>
      <View style={{ position: 'absolute', right: 14, top: (h - 150) / 2 - 8 }}>{seat(3, 'right')}</View>

      <View style={{ position: 'absolute', left: (w - area.w) / 2, top: trickTop }}>
        <TrickArea shown={shown} sweepTo={sweepTo} mySeat={me} cardW={trickW} />
      </View>

      {dealing && dealClock ? <DealAnimation center={dealCenter} targets={dealTargets} progress={progress} /> : null}

      <Hand
        key={game.round}
        cards={dealing ? game.myHand.slice(0, myDealt) : game.myHand}
        legal={game.legal}
        hidden={dealing && dealClock?.stage === 'dealing'}
        instant={dealing}
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

      {/* whose turn it is / what to do */}
      {status ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', left: w / 2 - 160, width: 320, bottom: handTop + 6, alignItems: 'center',
            paddingVertical: 5, borderRadius: 16, backgroundColor: myTurn ? GOLD : 'rgba(20,12,4,0.65)',
            borderWidth: 1, borderColor: myTurn ? '#C99A2E' : 'rgba(255,255,255,0.12)',
          }}>
          <Text numberOfLines={1} style={{ color: myTurn ? '#2A1B00' : CREAM, fontWeight: '800', fontSize: 13 }}>{status}</Text>
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
