import { useState } from 'react';
import { Text, View } from 'react-native';

import { Chip, Field, Row } from '@/components/kit';
import { MUTED } from '@/constants/palette';
import { LIMITS } from '@/lib/env';
import { useT } from '@/lib/i18n';

const PRESETS = [29, 49, 99];

/** 29 / 49 / 99 or a custom score. Calls onChange only with a valid number. */
export function TargetPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const t = useT();
  const [custom, setCustom] = useState(!PRESETS.includes(value));
  const [text, setText] = useState(PRESETS.includes(value) ? '' : String(value));
  const n = Number(text);
  const valid = Number.isInteger(n) && n >= LIMITS.minTarget && n <= LIMITS.maxTarget;

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: MUTED, fontSize: 12.5, fontWeight: '600' }}>{t('targetScore')}</Text>
      <Row style={{ flexWrap: 'wrap', gap: 6 }}>
        {PRESETS.map((p) => (
          <Chip
            key={p}
            label={String(p)}
            selected={!custom && value === p}
            onPress={() => {
              setCustom(false);
              onChange(p);
            }}
          />
        ))}
        <Chip label={t('custom')} selected={custom} onPress={() => setCustom(true)} />
      </Row>
      {custom ? (
        <>
          <Field
            value={text}
            keyboardType="number-pad"
            maxLength={3}
            placeholder={`${LIMITS.minTarget}–${LIMITS.maxTarget}`}
            onChangeText={(s) => {
              const digits = s.replace(/\D/g, '');
              setText(digits);
              const v = Number(digits);
              if (Number.isInteger(v) && v >= LIMITS.minTarget && v <= LIMITS.maxTarget) onChange(v);
            }}
          />
          {text !== '' && !valid ? (
            <Text style={{ color: MUTED, fontSize: 12.5 }}>{t('targetRange', { min: LIMITS.minTarget, max: LIMITS.maxTarget })}</Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
