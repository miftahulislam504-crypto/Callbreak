import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/kit';
import { BidSheet } from '@/components/table/BidSheet';
import { GameOverOverlay } from '@/components/table/GameOverOverlay';
import { useTrickDisplay, useTurnTimer } from '@/components/table/hooks';
import { RoundEndOverlay } from '@/components/table/RoundEndOverlay';
import { ScoreSheet } from '@/components/table/ScoreSheet';
import { Table } from '@/components/table/Table';
import { FELT_DARK, GOLD } from '@/constants/palette';
import { hapticTurn } from '@/lib/haptics';
import { errorText, useT } from '@/lib/i18n';
import type { Card } from '@/lib/types';
import { useRoom } from '@/state/room';

export default function Game() {
  const t = useT();
  const { view, link, error, send, leaveRoom, clearError } = useRoom();
  const game = view?.game ?? null;
  const trick = useTrickDisplay(game);
  const turnTimer = useTurnTimer(view);
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

  const status = !live
    ? ''
    : myTurn
      ? game.phase === 'bidding' ? t('chooseBid') : t('yourTurn')
      : t('turnOf', { name: view.seats[game.turn]?.name ?? '' });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: FELT_DARK }}>
      <StatusBar style="light" />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8 }}>
        <View>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t('roundN', { n: game.round })}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{t('targetReach', { n: game.targetScore })}</Text>
        </View>
        <Text style={{ color: myTurn ? GOLD : 'rgba(255,255,255,0.85)', fontWeight: '700', flexShrink: 1, textAlign: 'center', paddingHorizontal: 8 }} numberOfLines={1}>
          {status}
        </Text>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Pressable onPress={() => setScores(true)} hitSlop={8}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{t('scoreSheet')}</Text>
          </Pressable>
          <Pressable onPress={confirmLeave} hitSlop={8}>
            <Text style={{ color: '#FF8A8F', fontWeight: '700' }}>{t('leave')}</Text>
          </Pressable>
        </View>
      </View>

      {link === 'reconnecting' ? <Banner text={t('reconnecting')} /> : null}
      {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}

      <View style={{ flex: 1 }}>
        <Table
          view={view}
          game={game}
          shown={trick.shown}
          sweepTo={trick.sweepTo}
          turnTimer={turnTimer}
          onPlay={(c: Card) => send('play', { suit: c.suit, rank: c.rank })}
          onIllegal={() => setToast(t('cardNotAllowed'))}
          t={t}
        />
        {game.phase === 'bidding' && myTurn ? <BidSheet game={game} onBid={(n) => send('bid', { bid: n })} t={t} /> : null}
        {toast ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 20, right: 20, bottom: 190, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 12, padding: 12 }}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>{toast}</Text>
          </View>
        ) : null}
      </View>

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

      <ScoreSheet visible={scores} onClose={() => setScores(false)} view={view} game={game} t={t} />
    </SafeAreaView>
  );
}
