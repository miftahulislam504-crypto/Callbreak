import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { CREAM, DANGER, GOLD, GREEN_OK, LINE, MUTED } from '@/constants/palette';
import { type T, useT } from '@/lib/i18n';
import { isVoiceAvailable } from '@/lib/voice/engine';
import { canLeaveVoice, canMuteSeat, voiceButtonState, type VoiceButtonState } from '@/lib/voice/ui';
import { useRoom } from '@/state/room';
import { useVoice, type VoiceNotice } from '@/state/voice';

const NOTICE_MS = 5000;

function noticeText(t: T, n: VoiceNotice): string {
  switch (n) {
    case 'headphones': return t('voiceHeadphones');
    case 'mic_denied': return t('micDenied');
    case 'need_players': return t('voiceNeedPlayers');
    case 'failed': return t('voiceFailed');
  }
}

/** The voice chip: join, mic on/off, retry. Next to it a small "x" leaves voice. Hidden where voice cannot work. */
export function VoiceButton({ variant }: { variant: 'table' | 'menu' }) {
  const t = useT();
  const view = useRoom((s) => s.view);
  const status = useVoice((s) => s.status);
  const micOn = useVoice((s) => s.micOn);
  const choice = useVoice((s) => s.choice);
  const denied = useVoice((s) => s.denied);
  const notice = useVoice((s) => s.notice);
  const iSpeak = useVoice((s) => (view ? s.speaking[view.mySeat] === true : false));

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => useVoice.getState().setNotice(null), NOTICE_MS);
    return () => clearTimeout(id);
  }, [notice]);

  const state = voiceButtonState({ available: isVoiceAvailable(), view, status, micOn, choice, denied });
  if (state === 'hidden') return null;

  const tap = () => {
    const v = useVoice.getState();
    switch (state) {
      case 'join': v.setChoice('on'); break;
      case 'muted': v.setMic(true); break;
      case 'live': v.setMic(false); break;
      case 'error': v.retry(); break;
      case 'disabled': v.setNotice('need_players'); break;
      case 'connecting': break;
    }
  };

  const h = variant === 'table' ? 32 : 36;
  const base = variant === 'table'
    ? { bg: 'rgba(20,12,4,0.62)', border: 'rgba(255,255,255,0.18)' }
    : { bg: 'rgba(255,255,255,0.10)', border: LINE };
  const look = chipLook(state, iSpeak, base);

  return (
    <View style={{ position: 'relative', flexDirection: 'row', gap: 6 }}>
      <Pressable
        onPress={tap}
        hitSlop={6}
        accessibilityRole="button"
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: 6, height: h, minWidth: 40, paddingHorizontal: 12, borderRadius: h / 2,
          justifyContent: 'center', backgroundColor: look.bg, borderWidth: 1, borderColor: look.border,
          opacity: state === 'disabled' ? 0.5 : pressed ? 0.75 : 1,
        })}>
        {state === 'connecting' ? <ActivityIndicator size="small" color={GOLD} /> : <Ionicons name={look.icon} size={17} color={look.color} />}
        {look.label ? <Text style={{ color: CREAM, fontWeight: '800', fontSize: 13 }}>{t(look.label)}</Text> : null}
      </Pressable>

      {canLeaveVoice(state) ? (
        <Pressable
          onPress={() => useVoice.getState().setChoice('off')}
          hitSlop={6}
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: h, height: h, borderRadius: h / 2, alignItems: 'center', justifyContent: 'center',
            backgroundColor: base.bg, borderWidth: 1, borderColor: base.border, opacity: pressed ? 0.7 : 1,
          })}>
          <Ionicons name="close" size={17} color={CREAM} />
        </Pressable>
      ) : null}

      {notice ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', top: h + 6, right: 0, width: 210, zIndex: 30, borderRadius: 12, paddingVertical: 7, paddingHorizontal: 10,
            backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 1, borderColor: notice === 'failed' || notice === 'mic_denied' ? DANGER : 'rgba(255,255,255,0.2)',
          }}>
          <Text style={{ color: '#fff', fontSize: 12.5, textAlign: 'center' }}>{noticeText(t, notice)}</Text>
        </View>
      ) : null}
    </View>
  );
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function chipLook(state: VoiceButtonState, speaking: boolean, base: { bg: string; border: string }): {
  icon: IconName; color: string; bg: string; border: string; label: 'voiceOn' | 'micMuted' | 'micLive' | 'voiceRetry' | null;
} {
  switch (state) {
    case 'live':
      return { icon: 'mic', color: GREEN_OK, bg: speaking ? 'rgba(52,195,143,0.5)' : 'rgba(52,195,143,0.2)', border: GREEN_OK, label: 'micLive' };
    case 'muted':
      return { icon: 'mic-off', color: '#FF9A9E', bg: base.bg, border: base.border, label: 'micMuted' };
    case 'error':
      return { icon: 'refresh', color: '#FF9A9E', bg: 'rgba(229,72,77,0.22)', border: 'rgba(229,72,77,0.5)', label: 'voiceRetry' };
    case 'connecting':
      return { icon: 'mic-outline', color: GOLD, bg: base.bg, border: base.border, label: null };
    default: // join, disabled
      return { icon: 'mic-outline', color: CREAM, bg: base.bg, border: base.border, label: 'voiceOn' };
  }
}

/** A small speaker button on another player's row: mute or unmute them on this device. Renders nothing when it cannot apply. */
export function SeatMuteButton({ seat }: { seat: number }) {
  const t = useT();
  const view = useRoom((s) => s.view);
  const status = useVoice((s) => s.status);
  const muted = useVoice((s) => s.mutedSeats[seat] === true);
  if (!view || !canMuteSeat(view, seat, status === 'on')) return null;
  return (
    <Pressable
      onPress={() => useVoice.getState().setSeatMuted(seat, !muted)}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={muted ? t('unmutePlayer') : t('mutePlayer')}
      style={({ pressed }) => ({
        width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
        backgroundColor: muted ? 'rgba(229,72,77,0.22)' : 'rgba(255,255,255,0.10)',
        borderWidth: 1, borderColor: muted ? 'rgba(229,72,77,0.5)' : LINE, opacity: pressed ? 0.7 : 1,
      })}>
      <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={18} color={muted ? '#FF9A9E' : MUTED} />
    </Pressable>
  );
}
