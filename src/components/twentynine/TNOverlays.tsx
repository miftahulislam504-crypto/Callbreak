import { Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { PANEL_FRAME } from '@/constants/ui';
import { PanelShine } from '@/components/frame';
import { Button, PillButton } from '@/components/kit';
import { Text } from '@/components/text';
import { useCountdownSeconds } from '@/components/table/hooks';
import { CARD_BLACK, CARD_RED, CREAM, GOLD, GREEN_OK, MUTED, SCRIM } from '@/constants/palette';
import { SUIT_SYMBOL } from '@/lib/cards';
import type { T } from '@/lib/i18n';
import type { Suit, TNGameView, TNRoomView } from '@/lib/types';

export const teamSeats = (team: number): number[] => (team === 0 ? [0, 2] : [1, 3]);
export const teamOfSeat = (seat: number): number => seat % 2;
export const teamName = (view: TNRoomView, team: number): string => teamSeats(team).map((s) => view.seats[s]?.name ?? '').join(' + ');
const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
const suitColor = (s: Suit) => (s === 'H' || s === 'D' ? CARD_RED : CARD_BLACK);

const dim = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center' as const, justifyContent: 'center' as const };

/** Summary of the round that just ended, until the next one is dealt. */
export function TNRoundEndOverlay({ view, game, t }: { view: TNRoomView; game: TNGameView; t: T }) {
  const { width } = useWindowDimensions();
  const secs = useCountdownSeconds(view.nextRoundAt, view.serverTime);
  const r = game.history[game.history.length - 1];
  if (!r) return null;
  const dTeam = teamOfSeat(r.declarer);
  const myTeam = teamOfSeat(view.mySeat);
  return (
    <View style={[dim, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
      <View style={[PANEL_FRAME, { width: Math.min(560, width - 80), padding: 14, gap: 8 }]}>
        <PanelShine />
        <Text style={{ color: GOLD, fontSize: 20, fontWeight: '900', textAlign: 'center' }}>{t('roundOver', { n: r.round })}</Text>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={{ color: CREAM, fontWeight: '800' }}>
            {t('tnBidLine', { name: view.seats[r.declarer]?.name ?? '', n: r.contract })}
            {'  '}
            <Text style={{ color: suitColor(r.trumpSuit) === CARD_BLACK ? CREAM : CARD_RED, fontSize: 16 }}>{SUIT_SYMBOL[r.trumpSuit]}</Text>
          </Text>
          <Text style={{ color: MUTED, fontSize: 12.5 }}>{t('tnNeedLine', { n: r.need })}</Text>
          {r.pairTeam !== null ? <Text style={{ color: GOLD, fontSize: 12.5 }}>{t('tnPairNote', { who: teamName(view, r.pairTeam) })}</Text> : null}
        </View>
        {[0, 1].map((team) => (
          <View key={team} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: CREAM, fontWeight: '800' }}>
                {teamName(view, team)}{team === myTeam ? ` (${t('you')})` : ''}
              </Text>
              <Text style={{ color: MUTED, fontSize: 12 }}>{t('tnPointsGot', { n: r.teamPoints[team] })}</Text>
            </View>
            <Text style={{ color: r.delta[team] > 0 ? GREEN_OK : r.delta[team] < 0 ? CARD_RED : MUTED, fontWeight: '900', width: 48, textAlign: 'right', fontSize: 16 }}>
              {signed(r.delta[team])}
            </Text>
            <Text style={{ color: game.totals[team] === Math.max(...game.totals) ? GOLD : CREAM, fontWeight: '900', width: 48, textAlign: 'right', fontSize: 16 }}>
              {signed(game.totals[team])}
            </Text>
          </View>
        ))}
        <Text style={{ color: r.success ? GREEN_OK : CARD_RED, textAlign: 'center', fontWeight: '900', fontSize: 15 }}>
          {r.success ? t('tnMade') : t('tnFailed')} · {teamName(view, dTeam)}
        </Text>
        <Text style={{ color: MUTED, textAlign: 'center', fontSize: 12.5 }}>
          {t('tnTargetChip', { n: game.targetScore })}
          {secs !== null ? ` · ${t('nextRoundIn', { s: secs })}` : ''}
        </Text>
      </View>
    </View>
  );
}

export function TNGameOverOverlay({
  view, game, t, onRematch, onScores, onLeave,
}: { view: TNRoomView; game: TNGameView; t: T; onRematch: () => void; onScores: () => void; onLeave: () => void }) {
  const { width, height } = useWindowDimensions();
  const winners = game.winners ?? [];
  const iWon = winners.includes(view.mySeat);
  const tie = winners.length === 4;
  const winTeam = tie ? -1 : teamOfSeat(winners[0] ?? 0);
  const isHost = view.mySeat === view.hostSeat;
  const order = winTeam === 1 ? [1, 0] : [0, 1]; // the winning team first
  return (
    <View style={[dim, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
      <View style={[PANEL_FRAME, { width: Math.min(700, width - 60), maxHeight: height - 20, flexDirection: 'row', gap: 16, padding: 16 }]}>
        <PanelShine />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Text style={{ fontSize: 54 }}>{iWon ? '🏆' : '🎴'}</Text>
          <Text style={{ color: GOLD, fontSize: 24, fontWeight: '900', textAlign: 'center' }}>{iWon ? t('youWon') : t('gameOver')}</Text>
          {!tie ? <Text style={{ color: CREAM, textAlign: 'center' }}>{t('winnerIs', { names: teamName(view, winTeam) })}</Text> : null}
        </View>
        <View style={{ flex: 1.2, gap: 8 }}>
          <View style={{ gap: 6 }}>
            {order.map((team) => (
              <View key={team} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, backgroundColor: winners.includes(teamSeats(team)[0]) ? 'rgba(242,193,78,0.14)' : 'rgba(255,255,255,0.05)' }}>
                <Text numberOfLines={1} style={{ flex: 1, color: CREAM, fontWeight: '800' }}>
                  {teamName(view, team)}{team === teamOfSeat(view.mySeat) ? ` (${t('you')})` : ''}
                </Text>
                <Text style={{ color: winners.includes(teamSeats(team)[0]) ? GOLD : CREAM, fontWeight: '900', fontSize: 16 }}>{signed(game.totals[team])}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {isHost ? <Button compact variant="gold" title={t('rematch')} onPress={onRematch} /> : <Text style={{ color: MUTED, fontSize: 12.5, alignSelf: 'center' }}>{t('waitHostRematch')}</Text>}
            <Button compact variant="secondary" title={t('scoreSheet')} onPress={onScores} />
            <Button compact variant="danger" title={t('leave')} onPress={onLeave} />
          </View>
        </View>
      </View>
    </View>
  );
}

/** Round by round: who bid what, the trump, the points each team took, and the running game points. */
export function TNScoreSheet({
  visible, onClose, view, game, t,
}: { visible: boolean; onClose: () => void; view: TNRoomView; game: TNGameView; t: T }) {
  const { width, height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: SCRIM, alignItems: 'center', justifyContent: 'center' }}>
        <Pressable style={[PANEL_FRAME, { width: Math.min(680, width - 60), maxHeight: height - 24, padding: 14 }]}>
          <PanelShine />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: CREAM, fontSize: 18, fontWeight: '900' }}>
              {t('scoreSheet')} · <Text style={{ color: GOLD }}>{t('tnTargetChip', { n: game.targetScore })}</Text>
            </Text>
            <PillButton label={`${t('close')} ✕`} onPress={onClose} />
          </View>
          <View style={{ flexDirection: 'row', paddingBottom: 4 }}>
            <Text style={{ width: 30, color: MUTED, fontSize: 11 }}>#</Text>
            <Text style={{ flex: 1.3, color: MUTED, fontSize: 11 }}>{t('tnColBidder')}</Text>
            <Text style={{ flex: 1, color: MUTED, fontSize: 11, textAlign: 'center' }}>{t('tnColPoints')}</Text>
            {[0, 1].map((team) => (
              <Text key={team} numberOfLines={1} style={{ width: 70, color: CREAM, fontSize: 11.5, fontWeight: '800', textAlign: 'center' }}>
                {teamSeats(team).map((s) => view.seats[s]?.name.slice(0, 5)).join('+')}
              </Text>
            ))}
          </View>
          <ScrollView style={{ flexShrink: 1 }}>
            {game.history.map((r, idx) => (
              <View key={r.round} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: idx % 2 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                <Text style={{ width: 30, color: MUTED, fontSize: 12 }}>{r.round}</Text>
                <Text numberOfLines={1} style={{ flex: 1.3, color: CREAM, fontSize: 12.5 }}>
                  {view.seats[r.declarer]?.name} · {r.contract} <Text style={{ color: r.trumpSuit === 'H' || r.trumpSuit === 'D' ? CARD_RED : CREAM }}>{SUIT_SYMBOL[r.trumpSuit]}</Text>
                </Text>
                <Text style={{ flex: 1, color: r.success ? GREEN_OK : CARD_RED, fontSize: 12.5, fontWeight: '800', textAlign: 'center' }}>
                  {r.teamPoints[teamOfSeat(r.declarer)]}/{r.need}
                </Text>
                {[0, 1].map((team) => (
                  <Text key={team} style={{ width: 70, textAlign: 'center', color: r.delta[team] > 0 ? GREEN_OK : r.delta[team] < 0 ? CARD_RED : MUTED, fontWeight: '800' }}>
                    {signed(r.delta[team])}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', paddingTop: 8, marginTop: 4, borderTopWidth: 2, borderTopColor: 'rgba(242,193,78,0.5)', alignItems: 'center' }}>
            <Text style={{ width: 30, color: GOLD, fontSize: 13, fontWeight: '900' }}>Σ</Text>
            <View style={{ flex: 2.3 }} />
            {game.totals.map((tot, i) => (
              <Text key={i} style={{ width: 70, textAlign: 'center', color: tot === Math.max(...game.totals) ? GOLD : CREAM, fontSize: 17, fontWeight: '900' }}>{signed(tot)}</Text>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
