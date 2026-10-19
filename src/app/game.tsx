import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/kit';
import { BidSheet } from '@/components/table/BidSheet';
import { GameOverOverlay } from '@/components/table/GameOverOverlay';
import { useDealClock, useTrickDisplay, useTurnTimer } from '@/components/table/hooks';
import { RoundEndOverlay } from '@/components/table/RoundEndOverlay';
import { ScoreSheet } from '@/components/table/ScoreSheet';
import { Table } from '@/components/table/Table';
import { CREAM, GOLD } from '@/constants/palette';
import { hapticTurn } from '@/lib/haptics';
import { errorText, useT } from '@/lib/i18n';
import type { Card } from '@/lib/types';
import { useRoom } from '@/state/room';

const chip = {
  paddingHorizontal: 12, height: 32, borderRadius: 16, alignItems: 'center' as const, justifyContent: 'center' as const,
  backgroundColor: 'rgba(20,12,4,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
};

export default function Game() {
  const t = useT();
  const { view, link, error, send, leaveRoom, clearError } = useRoom();
  const game = view?.game ?? null;
  const trick = useTrickDisplay(game);
  const turnTimer = useTurnTimer(view);
  const dealClock = useDealClock(view);
  const [scores, setScores] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const me = view?.mySeat ?? 0;
  const live = !!game && (game.phase === 'bidding' || game.phase === 'playing');
  const myTurn = live && game.turn === me;

  // A nudge when it becomes your turn (once per turn: the key changes with your hand size).
  const turnKey = myTurn ? `${game.round}:${game.phase}:${game.handCounts[me]}` : null;
  useEffect(() => {
    if (turnKey) hapticTurn();
  }, [turnKey]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  if (!view) return <Redirect href="/" />;
  if (view.status === 'lobby' || !game) return <Redirect href="/lobby" />;

  const confirmLeave = () =>
    Alert.alert(t('leaveConfirmTitle'), t('leaveConfirmBody'), [
      { text: t('stay'), style: 'cancel' },
      { text: t('leave'), style: 'destructive', onPress: () => void leaveRoom() },
    ]);

  const status = dealClock
    ? dealClock.stage === 'dealing'
      ? t('dealingCards')
      : t('lookAtCards', { s: dealClock.secondsLeft })
    : !live
    ? ''
    : game.phase === 'bidding'
      ? myTurn ? t('chooseBid') : t('turnOf', { name: view.seats[game.turn]?.name ?? '' })
      : myTurn ? t('yourTurn') : t('turnOf', { name: view.seats[game.turn]?.name ?? '' });

  const showBidSheet = game.phase === 'bidding' && myTurn;

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: '#5A3718' }}>
      <StatusBar hidden />
      <View style={{ flex: 1 }}>
        <Table
          view={view}
          game={game}
          shown={trick.shown}
          sweepTo={trick.sweepTo}
          turnTimer={turnTimer}
          dealClock={dealClock}
          status={status}
          myTurn={myTurn && !showBidSheet}
          toast={toast}
          onPlay={(c: Card) => send('play', { suit: c.suit, rank: c.rank })}
          onIllegal={() => setToast(t('cardNotAllowed'))}
          t={t}
        />

        {/* Header overlay: round + target on the left, actions on the right */}
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 6, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={[chip, { height: 44, alignItems: 'flex-start', paddingVertical: 4 }]}>
            <Text style={{ color: GOLD, fontWeight: '900', fontSize: 14 }}>{t('roundN', { n: game.round })}</Text>
            <Text style={{ color: 'rgba(246,241,227,0.8)', fontSize: 11 }}>{t('targetReach', { n: game.targetScore })}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => setScores(true)} hitSlop={6} style={chip}>
              <Text style={{ color: CREAM, fontWeight: '800', fontSize: 13 }}>{t('scoreSheet')}</Text>
            </Pressable>
            <Pressable onPress={confirmLeave} hitSlop={6} style={[chip, { backgroundColor: 'rgba(160,30,36,0.7)' }]}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{t('leave')}</Text>
            </Pressable>
          </View>
        </View>

        {link === 'reconnecting' || error ? (
          <View style={{ position: 'absolute', top: 6, left: '28%', right: '28%', zIndex: 20 }}>
            {link === 'reconnecting' ? <Banner text={t('reconnecting')} /> : null}
            {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}
          </View>
        ) : null}

        {showBidSheet ? <BidSheet game={game} onBid={(n) => send('bid', { bid: n })} t={t} /> : null}
        {game.phase === 'roundEnd' && trick.idle ? <RoundEndOverlay view={view} game={game} t={t} /> : null}
        {game.phase === 'finished' && trick.idle ? (
          <GameOverOverlay
            view={view}
            game={game}
            t={t}
            onRematch={() => send('rematch')}
            onScores={() => setScores(true)}
            onLeave={() => void leaveRoom()}
          />
        ) : null}
      </View>

      <ScoreSheet visible={scores} onClose={() => setScores(false)} view={view} game={game} t={t} />
    </SafeAreaView>
  );
}
