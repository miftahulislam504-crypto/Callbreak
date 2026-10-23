import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { R, TONES, type Tone } from '@/constants/ui';
import { Gloss } from '@/components/frame';
import { Text } from '@/components/text';
import { CREAM, GOLD, IVORY, MUTED } from '@/constants/palette';
import { hapticTap } from '@/lib/haptics';
import type { T } from '@/lib/i18n';
import type { LegalActions, PokerActionType, PokerGameView } from '@/lib/types';

const TRACK_H = 28;

function Btn({ label, sub, tone, onPress, flex = 1, disabled = false }: {
  label: string; sub?: string; tone: Tone; onPress: () => void; flex?: number; disabled?: boolean;
}) {
  const c = TONES[tone];
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        hapticTap();
        onPress();
      }}
      style={{ flex, opacity: disabled ? 0.4 : 1 }}>
      {({ pressed }) => (
        <View style={{ borderRadius: R.sm, backgroundColor: c.edge, paddingBottom: 4 }}>
          <View
            style={{
              height: 46, borderRadius: R.sm, backgroundColor: c.face, borderWidth: 1.5, borderColor: c.rim, overflow: 'hidden',
              alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, transform: [{ translateY: pressed ? 3 : 0 }],
            }}>
            <Gloss radius={R.sm} />
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: c.text, fontWeight: '900', fontSize: 15 }}>{label}</Text>
            {sub ? <Text numberOfLines={1} style={{ color: c.text, opacity: 0.85, fontSize: 11, fontWeight: '800' }}>{sub}</Text> : null}
          </View>
        </View>
      )}
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
      <View style={{ position: 'absolute', left: `${frac * 100}%`, marginLeft: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: IVORY, borderWidth: 3, borderColor: GOLD }} />
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
          <Btn label={t('pkBack')} tone="dark" onPress={() => setOpen(false)} flex={1} />
          <Btn label={raiseTo >= max ? t('pkAllIn') : `${raiseLabel} ${raiseTo}`} tone="gold" onPress={confirm} flex={2} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Btn label={t('pkFold')} tone="danger" onPress={() => onAct('fold')} />
      {actions.canCheck ? (
        <Btn label={t('pkCheck')} tone="green" onPress={() => onAct('check')} />
      ) : (
        <Btn label={t('pkCall')} sub={String(actions.callAmount)} tone="green" onPress={() => onAct('call')} />
      )}
      <Btn
        label={raiseLabel}
        tone="gold"
        disabled={!actions.canRaise}
        onPress={() => {
          setRaiseTo(min);
          setOpen(true);
        }}
      />
    </View>
  );
}

