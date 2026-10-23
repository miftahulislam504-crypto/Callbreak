import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/kit';
import { PokerScreen } from '@/components/poker/PokerScreen';
import { BidSheet } from '@/components/table/BidSheet';
import { GameOverOverlay } from '@/components/table/GameOverOverlay';
import { useDealClock, useTrickDisplay, useTurnTimer } from '@/components/table/hooks';
import { RoundEndOverlay } from '@/components/table/RoundEndOverlay';
import { ScoreSheet } from '@/components/table/ScoreSheet';
import { Table } from '@/components/table/Table';
import { VoiceButton } from '@/components/table/VoiceButton';
import { TwentyNineScreen } from '@/components/twentynine/TwentyNineScreen';
import { CREAM, GOLD } from '@/constants/palette';
import { hapticTurn } from '@/lib/haptics';
import { errorText, useT } from '@/lib/i18n';
import { isNoBidRound } from '@/lib/rules';
import { isCallBreak, isPoker, isTwentyNine, type Card } from '@/lib/types';
import { useRoom } from '@/state/room';

const chip = {
  paddingHorizontal: 12, height: 32, borderRadius: 16, alignItems: 'center' as const, justifyContent: 'center' as const,
  backgroundColor: 'rgba(20,12,4,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
};

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

        {showReadyButton ? (
          <View pointerEvents="box-none" style={{ position: 'absolute', right: 14, top: 64, zIndex: 15 }}>
            <Pressable
              disabled={amReady}
              onPress={() => send('ready')}
              hitSlop={8}
              style={({ pressed }) => ({
                paddingHorizontal: 18, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
                backgroundColor: amReady ? 'rgba(20,12,4,0.7)' : GOLD, borderWidth: 2, borderColor: amReady ? 'rgba(255,255,255,0.2)' : '#C99A2E',
                opacity: pressed ? 0.85 : 1,
              })}>
              <Text style={{ color: amReady ? CREAM : '#2A1B00', fontWeight: '900', fontSize: 15 }}>
                {amReady ? t('waitingOthers') : game.round <= 1 || isNoBidRound(game.round) ? t('readyPlay') : t('readyBid')}
              </Text>
            </Pressable>
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

      <Modal visible={confirmingLeave} transparent animationType="fade" supportedOrientations={['landscape', 'landscape-left', 'landscape-right']} onRequestClose={() => setConfirmingLeave(false)}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <View style={{ width: 340, maxWidth: '90%', borderRadius: 18, padding: 18, gap: 12, backgroundColor: '#0B2F21', borderWidth: 2, borderColor: '#C99A2E' }}>
            <Text style={{ color: CREAM, fontSize: 18, fontWeight: '900' }}>{t('leaveConfirmTitle')}</Text>
            <Text style={{ color: 'rgba(246,241,227,0.8)', fontSize: 13.5 }}>{t('leaveConfirmBody')}</Text>
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
              <Pressable onPress={() => setConfirmingLeave(false)} style={[chip, { height: 40, paddingHorizontal: 18 }]}>
                <Text style={{ color: CREAM, fontWeight: '800', fontSize: 14 }}>{t('stay')}</Text>
              </Pressable>
              <Pressable onPress={doLeave} style={[chip, { height: 40, paddingHorizontal: 18, backgroundColor: 'rgba(160,30,36,0.9)' }]}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{t('leave')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScoreSheet visible={scores} onClose={() => setScores(false)} view={view} game={game} t={t} />
    </SafeAreaView>
  );
}
