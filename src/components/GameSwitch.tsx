import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { txt } from '@/constants/fonts';
import { CREAM, GOLD, GOLD_RIM, GOLD_TOP, LINE, ON_GOLD } from '@/constants/palette';
import { shadow } from '@/constants/ui';
import { uiTap } from '@/lib/feedback';
import { GAME_LIST } from '@/lib/games';
import { useT } from '@/lib/i18n';
import { useGamePick } from '@/state/gamePick';

/** A row of the games to choose from: Call Break, 29, Poker. The picked one lights up like a brass plate. */
export function GameSwitch({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const game = useGamePick((s) => s.game);
  const setGame = useGamePick((s) => s.setGame);
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {GAME_LIST.map((g) => {
        const on = g.id === game;
        return (
          <Pressable
            key={g.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (!on) uiTap();
              setGame(g.id);
            }}
            style={({ pressed }) => ({
              flex: 1, minWidth: 0, height: compact ? 38 : 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
              paddingHorizontal: 4, borderWidth: 2, borderColor: on ? GOLD_RIM : LINE, overflow: 'hidden',
              backgroundColor: on ? GOLD : 'rgba(0,0,0,0.3)', opacity: pressed ? 0.8 : 1, ...(on ? shadow(1) : {}),
            })}>
            {on ? <LinearGradient pointerEvents="none" colors={[GOLD_TOP, GOLD]} style={StyleSheet.absoluteFill} /> : null}
            <Ionicons name={g.icon} size={15} color={on ? ON_GOLD : CREAM} />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[txt(13), { color: on ? ON_GOLD : CREAM, flexShrink: 1 }]}>{t(g.titleKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
