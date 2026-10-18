import { Redirect } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Banner, Button, Card, Chip, Row, Screen } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { ACCENT, GOLD } from '@/constants/palette';
import { cardLabel, isRed } from '@/lib/cards';
import { errorText, useT } from '@/lib/i18n';
import type { Card as CardT } from '@/lib/types';
import { useRoom } from '@/state/room';

/**
 * Temporary "test table": enough UI to play a whole game end to end.
 * The real table (card layout, animations, sounds) is Phase 3.
 */
export default function Game() {
  const t = useT();
  const { view, link, error, send, leaveRoom, clearError } = useRoom();

  if (!view) return <Redirect href="/" />;
  if (view.status === 'lobby') return <Redirect href="/lobby" />;
  const g = view.game;
  if (!g) return <Redirect href="/lobby" />;

  const me = view.mySeat;
  const name = (seat: number) => view.seats[seat]?.name ?? '';
  const myTurn = g.turn === me;
  const canBid = g.phase === 'bidding' && myTurn;
  const canPlay = g.phase === 'playing' && myTurn;
  const isLegal = (c: CardT) => g.legal.some((l) => l.suit === c.suit && l.rank === c.rank);
  const bids = Array.from({ length: g.maxBid - g.minBid + 1 }, (_, i) => g.minBid + i);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <ThemedText type="subtitle">{t('gameTitle')}</ThemedText>
        <ThemedText type="smallBold">{t('roundN', { n: g.round })} · {g.targetScore}</ThemedText>
      </Row>
      <ThemedText type="small" themeColor="textSecondary">{t('phase3Note')}</ThemedText>
      {link === 'reconnecting' ? <Banner text={t('reconnecting')} /> : null}
      {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}

      <Card>
        {g.phase === 'bidding' || g.phase === 'playing' ? (
          <ThemedText type="smallBold" style={{ color: myTurn ? ACCENT : undefined }}>
            {myTurn ? t('yourTurn') : t('turnOf', { name: name(g.turn) })}
          </ThemedText>
        ) : null}
        {g.phase === 'roundEnd' ? <ThemedText type="smallBold">{t('nextRoundSoon')}</ThemedText> : null}
        {g.phase === 'finished' ? (
          <>
            <ThemedText type="subtitle" style={{ color: GOLD }}>{t('gameOver')}</ThemedText>
            <ThemedText type="smallBold">{t('winnerIs', { names: (g.winners ?? []).map(name).join(', ') })}</ThemedText>
          </>
        ) : null}

        {view.seats.map((s) => (
          <Row key={s.seat} style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">
                {s.name}{s.seat === me ? ` (${t('you')})` : ''}{s.seat === g.dealer ? ' ◆' : ''}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('bidTricks', { bid: g.bids[s.seat] ?? '–', won: g.tricksWon[s.seat] })}
              </ThemedText>
            </View>
            <ThemedText type="smallBold">{t('totalPts', { n: g.totals[s.seat].toFixed(1) })}</ThemedText>
          </Row>
        ))}
      </Card>

      {g.trick.length > 0 ? (
        <Card>
          <ThemedText type="small" themeColor="textSecondary">{t('trickNow')}</ThemedText>
          <Row style={{ flexWrap: 'wrap' }}>
            {g.trick.map((p) => (
              <ThemedText key={p.seat} type="smallBold" style={{ color: isRed(p.card) ? '#D9363E' : undefined }}>
                {name(p.seat)}: {cardLabel(p.card)}
              </ThemedText>
            ))}
          </Row>
        </Card>
      ) : null}

      {canBid ? (
        <Card>
          <ThemedText type="smallBold">{t('chooseBid')}</ThemedText>
          <Row style={{ flexWrap: 'wrap' }}>
            {bids.map((b) => (
              <Chip key={b} label={String(b)} onPress={() => send('bid', { bid: b })} />
            ))}
          </Row>
        </Card>
      ) : null}

      <Card>
        <ThemedText type="small" themeColor="textSecondary">{t('myHand')}</ThemedText>
        <Row style={{ flexWrap: 'wrap' }}>
          {g.myHand.map((c) => {
            const ok = canPlay && isLegal(c);
            return (
              <Pressable
                key={`${c.suit}${c.rank}`}
                disabled={!ok}
                onPress={() => send('play', { suit: c.suit, rank: c.rank })}
                style={{ borderWidth: 1.5, borderColor: ok ? ACCENT : '#8884', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, opacity: canPlay && !ok ? 0.35 : 1 }}>
                <ThemedText type="smallBold" style={{ color: isRed(c) ? '#D9363E' : undefined, fontSize: 18 }}>{cardLabel(c)}</ThemedText>
              </Pressable>
            );
          })}
        </Row>
      </Card>

      {g.phase === 'finished' && me === view.hostSeat ? (
        <Button title={t('rematch')} onPress={() => send('rematch')} />
      ) : null}
      <Button title={t('leave')} variant="danger" onPress={() => void leaveRoom()} />
    </Screen>
  );
}
