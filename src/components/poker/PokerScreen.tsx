import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { Banner, PillButton } from '@/components/kit';
import { LeaveDialog } from '@/components/table/LeaveDialog';
import { VoiceButton } from '@/components/table/VoiceButton';
import { GOLD } from '@/constants/palette';
import { HUD_PLATE } from '@/constants/ui';
import { hapticTurn } from '@/lib/haptics';
import { errorText, useT } from '@/lib/i18n';
import type { PokerActionType, PokerRoomView } from '@/lib/types';
import { useRoom } from '@/state/room';

import { PokerGameOver } from './PokerOverlays';
import { PokerTable } from './PokerTable';

const chip = HUD_PLATE;

/** The poker screen: table, header, and the game-over overlay. */
export function PokerScreen({ view }: { view: PokerRoomView }) {
  const t = useT();
  const { link, error, send, leaveRoom, clearError } = useRoom();
  const game = view.game;
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const me = view.mySeat;
  const myTurn = !!game && game.phase === 'betting' && game.turn === me;

  // A nudge when it becomes your turn (once per street).
  const turnKey = myTurn ? `${game!.handNo}:${game!.street}:${game!.currentBet}` : null;
  useEffect(() => {
    if (turnKey) hapticTurn();
  }, [turnKey]);

  const turnTimer = useMemo(() => {
    const g = view.game;
    if (!g || g.phase !== 'betting' || view.deadline === null) return null;
    const remainingMs = Math.max(0, view.deadline - view.serverTime);
    const configured = view.actionSeconds * 1000;
    const totalMs = Math.max(Number.isFinite(configured) && configured > 0 ? configured : 25_000, remainingMs);
    return { seat: g.turn, timer: { key: String(view.deadline), remainingMs, totalMs } };
  }, [view]);

  if (view.status === 'lobby' || !game) return <Redirect href="/lobby" />;

  const turnName = view.seats[game.turn]?.name ?? '';
  const status =
    game.phase === 'betting'
      ? myTurn ? t('yourTurn') : t('turnOf', { name: turnName })
      : game.phase === 'handEnd' ? t('pkHandOver') : '';

  const act = (type: PokerActionType, amount?: number) => send('act', amount === undefined ? { type } : { type, amount });

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: '#05281B' }}>
      <StatusBar hidden />
      <View style={{ flex: 1 }}>
        <PokerTable view={view} game={game} turnTimer={turnTimer} myTurn={myTurn} status={status} onAct={act} t={t} />

        {/* Header overlay: the hand number and blinds on the left, actions on the right */}
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 6, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={[chip, { height: 44, alignItems: 'flex-start', paddingVertical: 4 }]}>
            <Text style={{ color: GOLD, fontWeight: '900', fontSize: 14 }}>{t('pkHandN', { n: game.handNo })}</Text>
            <Text style={{ color: 'rgba(246,241,227,0.85)', fontSize: 11 }}>
              {t('pkBlinds', { sb: game.smallBlind, bb: game.bigBlind })} · {t('pkLevelIn', { n: game.handsToNextLevel })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <VoiceButton variant="table" />
            <PillButton tone="danger" label={t('leave')} onPress={() => setConfirmingLeave(true)} />
          </View>
        </View>

        {link === 'reconnecting' || error ? (
          <View style={{ position: 'absolute', top: 54, left: '28%', right: '28%', zIndex: 20 }}>
            {link === 'reconnecting' ? <Banner text={t('reconnecting')} /> : null}
            {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}
          </View>
        ) : null}

        {game.phase === 'finished' ? (
          <PokerGameOver view={view} game={game} t={t} onRematch={() => send('rematch')} onLeave={() => void leaveRoom()} />
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
    </SafeAreaView>
  );
}
