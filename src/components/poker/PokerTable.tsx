import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useCountdownSeconds } from '@/components/table/hooks';
import { PlayingCard } from '@/components/table/PlayingCard';
import type { TurnTimer } from '@/components/table/TimerBar';
import { CREAM, FELT, GOLD, GREEN_OK, MUTED } from '@/constants/palette';
import type { T } from '@/lib/i18n';
import type { Card, LegalActions, PokerActionType, PokerGameView, PokerRoomView } from '@/lib/types';
import { useRoom } from '@/state/room';
import { useVoice } from '@/state/voice';

import { PokerActions } from './PokerActions';
import { PokerSeat, SEAT_H, SEAT_W } from './PokerSeat';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** A little stack of chips with the amount, shown in front of a player's seat. */
function BetChip({ amount, x, y }: { amount: number; x: number; y: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x - 30, top: y - 11, width: 60, height: 22, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'rgba(8,24,16,0.75)', borderWidth: 1, borderColor: 'rgba(242,193,78,0.5)' }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#D9363E', borderWidth: 2, borderColor: '#FFFDF7' }} />
      <Text style={{ color: CREAM, fontSize: 11.5, fontWeight: '900' }}>{amount}</Text>
    </View>
  );
}

/** Texas Hold'em table: an oval of felt, the board in the middle, players on an arc, you bottom-left. */
export function PokerTable({
  view, game, turnTimer, myTurn, status, onAct, t,
}: {
  view: PokerRoomView; game: PokerGameView;
  turnTimer: { seat: number; timer: TurnTimer } | null;
  myTurn: boolean; status: string;
  onAct: (type: PokerActionType, amount?: number) => void; t: T;
}) {
  const avatars = useRoom((s) => s.avatars);
  const voiceOn = useVoice((s) => s.status === 'on');
  const speaking = useVoice((s) => s.speaking);
  const mutedSeats = useVoice((s) => s.mutedSeats);
  const [size, setSize] = useState({ w: 800, h: 360 });
  const { w, h } = size;
  const me = view.mySeat;
  const n = view.seats.length;
  const secs = useCountdownSeconds(view.nextRoundAt, view.serverTime);

  const cx = w / 2;
  const cy = h * 0.54;
  const rx = w * 0.4;
  const ry = h * 0.3;
  const bw = clamp(h * 0.115, 34, 48);
  const bh = bw * 1.4;
  const holeW = clamp(h * 0.14, 40, 56);

  // The players after me, clockwise, spread along the arc from left over the top to right.
  const others: number[] = [];
  for (let k = 1; k < n; k++) {
    const i = (me + k) % n;
    if (view.seats[i].occupied) others.push(i);
  }
  const spots = new Map<number, { x: number; y: number }>();
  others.forEach((seatIdx, j) => {
    const a = (Math.PI * (j + 0.5)) / others.length;
    spots.set(seatIdx, { x: cx - rx * Math.cos(a), y: cy - ry * Math.sin(a) });
  });
  const mySpot = { x: 14 + SEAT_W / 2, y: h - 10 - SEAT_H / 2 };
  spots.set(me, mySpot);

  const result = game.phase === 'handEnd' || game.phase === 'finished' ? game.lastResult : null;
  const winnersNow = new Set(result?.winners ?? []);
  const deltaOf = (seat: number) => result?.players.find((p) => p.seat === seat)?.delta ?? null;

  const seatEl = (seatIdx: number) => {
    const p = game.players[seatIdx];
    const s = view.seats[seatIdx];
    const pos = spots.get(seatIdx)!;
    return (
      <View key={seatIdx} style={{ position: 'absolute', left: pos.x - SEAT_W / 2, top: pos.y - SEAT_H / 2 }}>
        <PokerSeat
          p={p}
          seat={s}
          avatar={avatars[seatIdx] ?? null}
          isMe={seatIdx === me}
          isTurn={game.phase === 'betting' && game.turn === seatIdx}
          isButton={game.button === seatIdx && p.inGame}
          won={winnersNow.has(seatIdx)}
          delta={deltaOf(seatIdx)}
          timer={turnTimer && turnTimer.seat === seatIdx ? turnTimer.timer : null}
          speaking={voiceOn && speaking[seatIdx] === true}
          voiceMuted={voiceOn && mutedSeats[seatIdx] === true}
          t={t}
        />
      </View>
    );
  };

  const board: (Card | null)[] = Array.from({ length: 5 }, (_, i) => game.board[i] ?? null);
  const actionsW = clamp(w - (14 + SEAT_W + holeW * 2 + 30) - 14, 220, 380);
  const myP = game.players[me];

  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: '#05281B' }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {/* the felt: a rounded oval with a wooden rim */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', left: w * 0.06, right: w * 0.06, top: h * 0.1, bottom: h * 0.05, borderRadius: h * 0.42,
          backgroundColor: FELT, borderWidth: 9, borderColor: '#8A5A2E',
        }}>
        <View style={{ flex: 1, borderRadius: h * 0.4, borderWidth: 2, borderColor: 'rgba(0,0,0,0.25)' }} />
      </View>

      {/* the pot and the board */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: cy - bh / 2 - 30, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 24, borderRadius: 12, backgroundColor: 'rgba(8,24,16,0.7)' }}>
          <Ionicons name="layers" size={13} color={GOLD} />
          <Text style={{ color: CREAM, fontSize: 13, fontWeight: '900' }}>{t('pkPotLabel', { n: game.pot })}</Text>
        </View>
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: cy - bh / 2, flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
        {board.map((c, i) =>
          c ? (
            <PlayingCard key={i} card={c} width={bw} />
          ) : (
            <View key={i} style={{ width: bw, height: bh, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(0,0,0,0.12)' }} />
          ),
        )}
      </View>

      {/* who won the hand that just ended */}
      {result ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: w * 0.22, right: w * 0.22, top: cy + bh / 2 + 10, alignItems: 'center', gap: 2, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(8,24,16,0.82)', borderWidth: 1, borderColor: 'rgba(242,193,78,0.4)' }}>
          {result.pots.map((pot, i) => {
            const names = pot.winners.map((s) => view.seats[s]?.name ?? '').join(', ');
            const hand = result.showdown && pot.winners.length === 1 ? result.players.find((p) => p.seat === pot.winners[0])?.handName : null;
            return (
              <Text key={i} numberOfLines={1} style={{ color: i === 0 ? GOLD : CREAM, fontSize: 12.5, fontWeight: '800' }}>
                {t('pkWins', { name: names, n: pot.amount })}{hand ? ` · ${hand}` : ''}
              </Text>
            );
          })}
          {secs !== null && game.phase === 'handEnd' ? <Text style={{ color: MUTED, fontSize: 11 }}>{t('pkNextHandIn', { s: secs })}</Text> : null}
        </View>
      ) : null}

      {/* everyone's seat, and what they have put in on this street */}
      {[...spots.keys()].map((seatIdx) => seatEl(seatIdx))}
      {[...spots.entries()].map(([seatIdx, pos]) => {
        const bet = game.players[seatIdx]?.bet ?? 0;
        if (bet <= 0 || game.phase !== 'betting') return null;
        return <BetChip key={`b${seatIdx}`} amount={bet} x={pos.x + (cx - pos.x) * 0.5} y={pos.y + (cy - pos.y) * 0.5} />;
      })}

      {/* my two cards, big, next to my seat */}
      {game.myHole.length > 0 ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 14 + SEAT_W + 6, bottom: 10, flexDirection: 'row', opacity: myP?.folded ? 0.45 : 1 }}>
          {game.myHole.map((c, i) => (
            <View key={i} style={{ marginLeft: i === 0 ? 0 : -holeW * 0.28, transform: [{ rotate: `${i === 0 ? -5 : 5}deg` }] }}>
              <PlayingCard card={c} width={holeW} />
            </View>
          ))}
        </View>
      ) : null}

      {/* my moves */}
      {myTurn && game.actions ? (
        <View style={{ position: 'absolute', right: 14, bottom: 10, width: actionsW }}>
          <PokerActions key={`${game.handNo}:${game.street}:${game.turn}:${game.currentBet}`} game={game} actions={game.actions as LegalActions} onAct={onAct} t={t} />
        </View>
      ) : status ? (
        <View pointerEvents="none" style={{ position: 'absolute', right: 14, bottom: 14, maxWidth: actionsW, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(8,24,16,0.75)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' }}>
          <Text numberOfLines={1} style={{ color: game.phase === 'betting' ? CREAM : GREEN_OK, fontWeight: '800', fontSize: 13 }}>{status}</Text>
        </View>
      ) : null}
    </View>
  );
}
