import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/kit';
import { useTrickDisplay, useTurnTimer } from '@/components/table/hooks';
import { LeaveDialog } from '@/components/table/LeaveDialog';
import { VoiceButton } from '@/components/table/VoiceButton';
import { CARD_RED, CREAM, GOLD } from '@/constants/palette';
import { SUIT_SYMBOL } from '@/lib/cards';
import { hapticTurn } from '@/lib/haptics';
import { errorText, useT } from '@/lib/i18n';
import type { Card, Suit, TNRoomView } from '@/lib/types';
import { useRoom } from '@/state/room';

import { TNGameOverOverlay, TNRoundEndOverlay, TNScoreSheet, teamOfSeat } from './TNOverlays';
import { TNBidSheet, TNTrumpSheet } from './TNSheets';
import { TNTable } from './TNTable';

const chip = {
  paddingHorizontal: 12, height: 32, borderRadius: 16, alignItems: 'center' as const, justifyContent: 'center' as const,
  backgroundColor: 'rgba(20,12,4,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
};
const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');

/** The 29 game screen: table, header chips, the bid / trump sheets and the round / game over overlays. */
export function TwentyNineScreen({ view }: { view: TNRoomView }) {
  const t = useT();
  const { link, error, send, leaveRoom, clearError } = useRoom();
  const game = view.game;
  const trick = useTrickDisplay(game);
  const turnTimer = useTurnTimer(view);
  const [scores, setScores] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const me = view.mySeat;
  const live = !!game && (game.phase === 'bidding' || game.phase === 'trump' || game.phase === 'playing');
  const myTurn = live && game!.turn === me;

  // A nudge when it becomes your turn (once per turn: the key changes with the phase and your hand size).
  const turnKey = myTurn ? `${game!.round}:${game!.phase}:${game!.handCounts[me]}:${game!.bids[me]}` : null;
  useEffect(() => {
    if (turnKey) hapticTurn();
  }, [turnKey]);

  // Tell everyone when someone asks for trump and it is shown.
  const seenReveal = useRef<string>('');
  const revealKey = game && game.trumpRevealed ? `${game.round}` : '';
  useEffect(() => {
    if (!game || !revealKey || seenReveal.current === revealKey) {
      if (!revealKey) seenReveal.current = '';
      return;
    }
    seenReveal.current = revealKey;
    if (game.phase === 'playing' && game.trumpSuit && game.revealedBy >= 0) {
      setToast(t('tnTrumpShown', { name: view.seats[game.revealedBy]?.name ?? '', suit: SUIT_SYMBOL[game.trumpSuit] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealKey]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  if (view.status === 'lobby' || !game) return <Redirect href="/lobby" />;

  const names = view.seats.map((s) => s.name);
  const myTeam = teamOfSeat(me);
  const turnName = names[game.turn] ?? '';
  const status = !live
    ? ''
    : game.phase === 'bidding'
      ? myTurn ? t('chooseBid') : t('turnOf', { name: turnName })
      : game.phase === 'trump'
        ? myTurn ? t('tnPickTrump') : t('tnWaitTrump', { name: turnName })
        : myTurn ? t('yourTurn') : t('turnOf', { name: turnName });

  const showBidSheet = game.phase === 'bidding' && myTurn;
  const showTrumpSheet = game.phase === 'trump' && myTurn;
  const trumpLine =
    game.declarer < 0
      ? ''
      : game.trumpSuit
        ? `${t('tnTrump')} ${SUIT_SYMBOL[game.trumpSuit]}`
        : game.trumpHidden
          ? t('tnTrumpHidden')
          : '';
  const trumpRed = game.trumpSuit === 'H' || game.trumpSuit === 'D';

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: '#5A3718' }}>
      <StatusBar hidden />
      <View style={{ flex: 1 }}>
        <TNTable
          view={view}
          game={game}
          shown={trick.shown}
          sweepTo={trick.sweepTo}
          turnTimer={turnTimer}
          status={status}
          myTurn={myTurn && game.phase === 'playing'}
          toast={toast}
          onPlay={(c: Card) => send('play', { suit: c.suit, rank: c.rank })}
          onIllegal={() => setToast(t('tnCardNotAllowed'))}
          onReveal={() => send('reveal')}
          t={t}
        />

        {/* Header overlay: round and score + the contract on the left, actions on the right */}
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 6, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', gap: 6, flexShrink: 1 }}>
            <View style={[chip, { height: 44, alignItems: 'flex-start', paddingVertical: 4 }]}>
              <Text style={{ color: GOLD, fontWeight: '900', fontSize: 14 }}>{t('roundN', { n: game.round })}</Text>
              <Text style={{ color: 'rgba(246,241,227,0.85)', fontSize: 11 }}>
                {t('yourTeam')} {signed(game.totals[myTeam])} · {t('opponent')} {signed(game.totals[1 - myTeam])}
              </Text>
            </View>
            {game.declarer >= 0 ? (
              <View style={[chip, { height: 44, alignItems: 'flex-start', paddingVertical: 4 }]}>
                <Text numberOfLines={1} style={{ color: CREAM, fontWeight: '800', fontSize: 12.5 }}>
                  {t('tnBidChip', { n: game.contract })} · {names[game.declarer]}
                  {game.need !== game.contract ? ` (${t('tnNeedChip', { n: game.need })})` : ''}
                </Text>
                {trumpLine ? (
                  <Text style={{ color: game.trumpSuit ? (trumpRed ? '#FF8A8F' : CREAM) : 'rgba(246,241,227,0.7)', fontSize: 12, fontWeight: '800' }}>{trumpLine}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <VoiceButton variant="table" />
            <Pressable onPress={() => setScores(true)} hitSlop={6} style={chip}>
              <Text style={{ color: CREAM, fontWeight: '800', fontSize: 13 }}>{t('scoreSheet')}</Text>
            </Pressable>
            <Pressable onPress={() => setConfirmingLeave(true)} hitSlop={6} style={[chip, { backgroundColor: 'rgba(160,30,36,0.7)' }]}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{t('leave')}</Text>
            </Pressable>
          </View>
        </View>

        {link === 'reconnecting' || error ? (
          <View style={{ position: 'absolute', top: 54, left: '28%', right: '28%', zIndex: 20 }}>
            {link === 'reconnecting' ? <Banner text={t('reconnecting')} /> : null}
            {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}
          </View>
        ) : null}

        {showBidSheet ? <TNBidSheet game={game} names={names} onBid={(n) => send('bid', { bid: n })} t={t} /> : null}
        {showTrumpSheet ? <TNTrumpSheet onPick={(s: Suit) => send('trump', { suit: s })} t={t} /> : null}
        {game.phase === 'roundEnd' && trick.idle ? <TNRoundEndOverlay view={view} game={game} t={t} /> : null}
        {game.phase === 'finished' && trick.idle ? (
          <TNGameOverOverlay
            view={view}
            game={game}
            t={t}
            onRematch={() => send('rematch')}
            onScores={() => setScores(true)}
            onLeave={() => void leaveRoom()}
          />
        ) : null}
      </View>

      <LeaveDialog
        visible={confirmingLeave}
        onStay={() => setConfirmingLeave(false)}
        onLeave={() => {
          setConfirmingLeave(false);
          void leaveRoom();
        }}
        t={t}
      />
      <TNScoreSheet visible={scores} onClose={() => setScores(false)} view={view} game={game} t={t} />
    </SafeAreaView>
  );
}
