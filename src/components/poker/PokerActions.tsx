import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CREAM, GOLD, MUTED } from '@/constants/palette';
import { hapticTap } from '@/lib/haptics';
import type { T } from '@/lib/i18n';
import type { LegalActions, PokerActionType, PokerGameView } from '@/lib/types';

const TRACK_H = 28;

function Btn({ label, sub, bg, fg = '#fff', onPress, flex = 1, disabled = false }: {
  label: string; sub?: string; bg: string; fg?: string; onPress: () => void; flex?: number; disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        hapticTap();
        onPress();
      }}
      style={({ pressed }) => ({
        flex, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
        backgroundColor: bg, borderBottomWidth: pressed ? 2 : 4, borderBottomColor: 'rgba(0,0,0,0.3)', opacity: disabled ? 0.4 : pressed ? 0.9 : 1,
      })}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: fg, fontWeight: '900', fontSize: 15 }}>{label}</Text>
      {sub ? <Text numberOfLines={1} style={{ color: fg, opacity: 0.85, fontSize: 11, fontWeight: '800' }}>{sub}</Text> : null}
    </Pressable>
  );
}

/** A draggable track: touch or drag anywhere on it to pick a value between min and max. */
function Slider({ min, max, value, onChange }: { min: number; max: number; value: number; onChange: (n: number) => void }) {
  const [w, setW] = useState(1);
  const frac = max > min ? (value - min) / (max - min) : 1;
  const setFromX = (x: number) => {
    const f = Math.min(1, Math.max(0, x / w));
    onChange(Math.round(min + f * (max - min)));
  };
  return (
    <View
      onLayout={(e) => setW(Math.max(1, e.nativeEvent.layout.width))}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => setFromX(e.nativeEvent.locationX)}
      onResponderMove={(e) => setFromX(e.nativeEvent.locationX)}
      style={{ height: TRACK_H, justifyContent: 'center' }}>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' }}>
        <View style={{ width: `${frac * 100}%`, height: 8, borderRadius: 4, backgroundColor: GOLD }} />
      </View>
      <View style={{ position: 'absolute', left: `${frac * 100}%`, marginLeft: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFDF7', borderWidth: 3, borderColor: GOLD }} />
    </View>
  );
}

/**
 * Fold / check or call / raise, shown only on your turn. Raise opens a panel: a slider, quick sizes
 * (min, half pot, 3/4 pot, pot, all-in) and a confirm button.
 */
export function PokerActions({
  game, actions, onAct, t,
}: { game: PokerGameView; actions: LegalActions; onAct: (type: PokerActionType, amount?: number) => void; t: T }) {
  const [open, setOpen] = useState(false);
  const min = actions.minRaiseTo;
  const max = actions.maxRaiseTo;
  const [raiseTo, setRaiseTo] = useState(min);

  const sizes = useMemo(() => {
    const potAfterCall = game.pot + actions.callAmount;
    const at = (frac: number) => Math.min(max, Math.max(min, Math.round(game.currentBet + frac * potAfterCall)));
    return [
      { key: 'min', label: t('pkMin'), v: min },
      { key: 'half', label: '½', v: at(0.5) },
      { key: 'three', label: '¾', v: at(0.75) },
      { key: 'pot', label: t('pkPot'), v: at(1) },
      { key: 'allin', label: t('pkAllIn'), v: max },
    ];
  }, [game.pot, game.currentBet, actions.callAmount, min, max, t]);

  const confirm = () => {
    const to = Math.min(max, Math.max(min, raiseTo));
    if (to >= max) onAct('allin');
    else onAct('raise', to);
    setOpen(false);
  };

  const raiseLabel = game.currentBet === 0 ? t('pkBet') : t('pkRaise');

  if (open && actions.canRaise) {
    return (
      <View style={{ gap: 6, padding: 8, borderRadius: 16, backgroundColor: 'rgba(8,24,16,0.88)', borderWidth: 1.5, borderColor: 'rgba(242,193,78,0.5)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: MUTED, fontSize: 12, fontWeight: '700' }}>{game.currentBet === 0 ? t('pkBetTo') : t('pkRaiseTo')}</Text>
          <Text style={{ color: GOLD, fontSize: 20, fontWeight: '900' }}>{raiseTo >= max ? `${raiseTo} · ${t('pkAllIn')}` : raiseTo}</Text>
        </View>
        <Slider min={min} max={max} value={raiseTo} onChange={setRaiseTo} />
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {sizes.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setRaiseTo(s.v)}
              style={({ pressed }) => ({
                flex: 1, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                backgroundColor: raiseTo === s.v ? 'rgba(242,193,78,0.25)' : 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: raiseTo === s.v ? GOLD : 'transparent', opacity: pressed ? 0.7 : 1,
              })}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: CREAM, fontWeight: '800', fontSize: 12 }}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn label={t('pkBack')} bg="#2B4A3C" onPress={() => setOpen(false)} flex={1} />
          <Btn label={raiseTo >= max ? t('pkAllIn') : `${raiseLabel} ${raiseTo}`} bg={GOLD} fg="#2A1B00" onPress={confirm} flex={2} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Btn label={t('pkFold')} bg="#A01E24" onPress={() => onAct('fold')} />
      {actions.canCheck ? (
        <Btn label={t('pkCheck')} bg="#1B8F5E" onPress={() => onAct('check')} />
      ) : (
        <Btn label={t('pkCall')} sub={String(actions.callAmount)} bg="#1B8F5E" onPress={() => onAct('call')} />
      )}
      <Btn
        label={raiseLabel}
        bg={GOLD}
        fg="#2A1B00"
        disabled={!actions.canRaise}
        onPress={() => {
          setRaiseTo(min);
          setOpen(true);
        }}
      />
    </View>
  );
}

