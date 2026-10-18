import { useState } from 'react';
import { View } from 'react-native';

import { Chip, Field, Row } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
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
    <View style={{ gap: Spacing.two }}>
      <ThemedText type="small" themeColor="textSecondary">{t('targetScore')}</ThemedText>
      <Row style={{ flexWrap: 'wrap' }}>
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
            <ThemedText type="small" themeColor="textSecondary">
              {t('targetRange', { min: LIMITS.minTarget, max: LIMITS.maxTarget })}
            </ThemedText>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
