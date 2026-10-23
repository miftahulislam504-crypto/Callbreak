import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { txt } from '@/constants/fonts';
import { CREAM, GOLD, LINE } from '@/constants/palette';
import { GAME_LIST } from '@/lib/games';
import { useT } from '@/lib/i18n';
import { useGamePick } from '@/state/gamePick';

/** A row of the games to choose from: Call Break, 29, Poker. */
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
            onPress={() => setGame(g.id)}
            style={({ pressed }) => ({
              flex: 1, minWidth: 0, height: compact ? 38 : 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
              paddingHorizontal: 4, borderWidth: 2, borderColor: on ? GOLD : LINE,
              backgroundColor: on ? 'rgba(242,193,78,0.18)' : 'rgba(0,0,0,0.25)', opacity: pressed ? 0.8 : 1,
            })}>
            <Ionicons name={g.icon} size={15} color={on ? GOLD : CREAM} />
            <Text numberOfLines={1} adjustsFontSizeToFit style={[txt(13), { color: on ? GOLD : CREAM, flexShrink: 1 }]}>{t(g.titleKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
