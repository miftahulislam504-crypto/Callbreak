import { useWindowDimensions, View } from 'react-native';

import { FELT } from '@/constants/palette';
import type { T } from '@/lib/i18n';
import type { ShownCard } from '@/lib/trickPlayer';
import type { Card, GameView, RoomView } from '@/lib/types';

import { Hand } from './Hand';
import { PlayerSeat, SEAT_WIDTH } from './PlayerSeat';
import type { TurnTimer } from './TimerBar';
import { TrickArea } from './TrickArea';

/** The felt table: you at the bottom, the other three around, trick in the middle, your hand below. */
export function Table({
  view, game, shown, sweepTo, turnTimer, onPlay, onIllegal, t,
}: {
  view: RoomView; game: GameView; shown: ShownCard[]; sweepTo: number | null;
  turnTimer: { seat: number; timer: TurnTimer } | null;
  onPlay: (c: Card) => void; onIllegal: () => void; t: T;
}) {
  const { width } = useWindowDimensions();
  const me = view.mySeat;
  const live = game.phase === 'bidding' || game.phase === 'playing';
  const cardW = Math.min(52, (width - 2 * SEAT_WIDTH - 12) / 3.1);

  // Clockwise from you: 1 = left, 2 = across, 3 = right.
  const seat = (rel: number) => {
    const i = (me + rel) % 4;
    const s = view.seats[i];
    return (
      <PlayerSeat
        name={s.name}
        isMe={rel === 0}
        isBot={s.isBot}
        offline={s.occupied && !s.isBot && !s.connected}
        auto={s.auto}
        isDealer={game.dealer === i}
        isTurn={live && game.turn === i}
        bid={game.bids[i]}
        won={game.tricksWon[i]}
        handCount={game.handCounts[i]}
        total={game.totals[i]}
        timer={turnTimer && turnTimer.seat === i ? turnTimer.timer : null}
        showHandCount={rel !== 0}
        t={t}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: FELT }}>
      <View style={{ alignItems: 'center', paddingTop: 6 }}>{seat(2)}</View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 }}>
        {seat(1)}
        <TrickArea shown={shown} sweepTo={sweepTo} mySeat={me} cardW={cardW} />
        {seat(3)}
      </View>
      <View style={{ alignItems: 'center' }}>{seat(0)}</View>
      <Hand
        key={game.round}
        cards={game.myHand}
        legal={game.legal}
        canPlay={game.phase === 'playing' && game.turn === me}
        onPlay={onPlay}
        onIllegal={onIllegal}
      />
    </View>
  );
}
