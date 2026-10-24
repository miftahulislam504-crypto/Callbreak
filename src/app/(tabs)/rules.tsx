import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, MenuBackdrop, PageHeader, PillButton } from '@/components/kit';
import { goHome } from '@/components/menu';
import { BlockView, SectionCard } from '@/components/rules';
import { Text } from '@/components/text';
import { txt } from '@/constants/fonts';
import { BG_DEEP, CREAM, GOLD, GOLD_LINE_SOFT, MUTED, PANEL } from '@/constants/palette';
import { R, TITLE_SHADOW } from '@/constants/ui';
import { GAME_LIST } from '@/lib/games';
import { useLang, useT } from '@/lib/i18n';
import { GUIDES, GUIDE_UI } from '@/lib/rulesContent';
import type { GameId } from '@/lib/types';

/** "How to play": the rules of all three games with examples, for new players. */
export default function RulesScreen() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const { game } = useLocalSearchParams<{ game?: string }>();
  const guides = GUIDES[lang];
  const ui = GUIDE_UI[lang];

  const [id, setId] = useState<GameId>(GAME_LIST.some((g) => g.id === game) ? (game as GameId) : 'callbreak');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const guide = guides.find((g) => g.id === id) ?? guides[0];
  const isOpen = (sid: string, i: number) => open[`${id}:${sid}`] ?? i === 0;
  const allOpen = guide.sections.every((s, i) => isOpen(s.id, i));

  useEffect(() => {
    scroller.current?.scrollTo({ y: 0, animated: false });
  }, [id]);

  const setAll = (value: boolean) =>
    setOpen((o) => ({ ...o, ...Object.fromEntries(guide.sections.map((s) => [`${id}:${s.id}`, value])) }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG_DEEP }}>
      <MenuBackdrop />
      <PageHeader
        title={`📖 ${t('rulesTitle')}`}
        hint={t('rulesHint')}
        backLabel={t('back')}
        onBack={goHome}
        right={<PillButton label={allOpen ? ui.closeAll : ui.openAll} onPress={() => setAll(!allOpen)} />}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8, flexWrap: 'wrap' }}>
        {GAME_LIST.map((g) => (
          <Chip key={g.id} label={t(g.titleKey)} selected={g.id === id} onPress={() => setId(g.id)} />
        ))}
      </View>

      <ScrollView ref={scroller} showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', padding: 16, paddingTop: 4, paddingBottom: 32 }}>
        <View style={{ width: '100%', maxWidth: 720, gap: 12 }}>
          {/* The game in one minute */}
          <View style={{ borderRadius: R.lg, padding: 14, gap: 8, backgroundColor: PANEL, borderWidth: 1.5, borderColor: GOLD_LINE_SOFT }}>
            <Text style={[txt(22), { color: CREAM }, TITLE_SHADOW]}>{guide.name}</Text>
            <Text style={[txt(13.5, false), { color: MUTED }]}>{guide.tagline}</Text>
            <View style={{ height: 1.5, backgroundColor: GOLD_LINE_SOFT, marginVertical: 2 }} />
            <Text style={[txt(14), { color: GOLD }]}>{ui.quick}</Text>
            {guide.quick.map((q, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 9 }}>
                <Text style={[txt(10), { color: GOLD, marginTop: 5 }]}>◆</Text>
                <Text style={[txt(14.5, false), { color: 'rgba(246,241,227,0.92)', flex: 1 }]}>{q}</Text>
              </View>
            ))}
          </View>

          {guide.sections.map((s, i) => (
            <SectionCard key={`${id}:${s.id}`} index={i + 1} title={s.title} open={isOpen(s.id, i)} onToggle={() => setOpen((o) => ({ ...o, [`${id}:${s.id}`]: !isOpen(s.id, i) }))}>
              {s.blocks.map((b, bi) => (
                <BlockView key={bi} block={b} lang={lang} />
              ))}
            </SectionCard>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
