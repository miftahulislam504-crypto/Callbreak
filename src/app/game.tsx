import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { Banner, Button, PillButton } from '@/components/kit';
import { PokerScreen } from '@/components/poker/PokerScreen';
import { BidSheet } from '@/components/table/BidSheet';
import { GameOverOverlay } from '@/components/table/GameOverOverlay';
import { useDealClock, useTrickDisplay, useTurnTimer } from '@/components/table/hooks';
import { LeaveDialog } from '@/components/table/LeaveDialog';
import { RoundEndOverlay } from '@/components/table/RoundEndOverlay';
import { ScoreSheet } from '@/components/table/ScoreSheet';
import { Table } from '@/components/table/Table';
import { VoiceButton } from '@/components/table/VoiceButton';
import { TwentyNineScreen } from '@/components/twentynine/TwentyNineScreen';
import { GOLD } from '@/constants/palette';
import { HUD_PLATE } from '@/constants/ui';
import { hapticTurn } from '@/lib/haptics';
import { errorText, useT } from '@/lib/i18n';
import { isNoBidRound } from '@/lib/rules';
import { isCallBreak, isPoker, isTwentyNine, type Card } from '@/lib/types';
import { useRoom } from '@/state/room';

const chip = HUD_PLATE;

/** Which game screen to show: each game keeps its own table, sheets and overlays. */
export default function Game() {
  const view = useRoom((s) => s.view);
  if (!view) return <Redirect href="/" />;
  if (view.status === 'lobby') return <Redirect href="/lobby" />;
  if (isTwentyNine(view)) return <TwentyNineScreen view={view} />;
  if (isPoker(view)) return <PokerScreen view={view} />;
  return <CallBreakGame />;
}

function CallBreakGame() {
  const t = useT();
  const { view: anyView, link, error, send, leaveRoom, clearError } = useRoom();
  const view = isCallBreak(anyView) ? anyView : null;
  const game = view?.game ?? null;
  const trick = useTrickDisplay(game);
  const turnTimer = useTurnTimer(view);
  const dealClock = useDealClock(view);
  const [scores, setScores] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
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

  // Our own dialog: react-native-web's Alert.alert ignores buttons, so Leave did nothing on the web.
  const confirmLeave = () => setConfirmingLeave(true);
  const doLeave = () => {
    setConfirmingLeave(false);
    void leaveRoom();
  };

  const amReady = view.seats[me]?.ready === true;
  const showReadyButton = !!dealClock && dealClock.stage === 'viewing';

  const status = dealClock
    ? dealClock.stage === 'dealing'
      ? t('dealingCards')
      : amReady ? t('waitingOthers') : t('lookAtCards', { s: dealClock.secondsLeft })
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
            <VoiceButton variant="table" />
            <PillButton label={t('scoreSheet')} onPress={() => setScores(true)} />
            <PillButton tone="danger" label={t('leave')} onPress={confirmLeave} />
          </View>
        </View>

        {link === 'reconnecting' || error ? (
          <View style={{ position: 'absolute', top: 6, left: '28%', right: '28%', zIndex: 20 }}>
            {link === 'reconnecting' ? <Banner text={t('reconnecting')} /> : null}
            {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}
          </View>
        ) : null}

        {showReadyButton ? (
          <View pointerEvents="box-none" style={{ position: 'absolute', right: 14, top: 64, zIndex: 15 }}>
            <Button
              compact
              variant={amReady ? 'secondary' : 'gold'}
              disabled={amReady}
              title={amReady ? t('waitingOthers') : game.round <= 1 || isNoBidRound(game.round) ? t('readyPlay') : t('readyBid')}
              onPress={() => send('ready')}
            />
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

      <LeaveDialog visible={confirmingLeave} onStay={() => setConfirmingLeave(false)} onLeave={doLeave} t={t} />

      <ScoreSheet visible={scores} onClose={() => setScores(false)} view={view} game={game} t={t} />
    </SafeAreaView>
  );
}
