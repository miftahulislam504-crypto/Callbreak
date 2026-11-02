import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { Card, CardTitle, MenuBackdrop, PageHeader, PillButton } from '@/components/kit';
import { goHome } from '@/components/menu';
import { Board } from '@/components/table/Board';
import { CardBackFace } from '@/components/table/CardBack';
import { CARD_RATIO, PlayingCard } from '@/components/table/PlayingCard';
import { txt } from '@/constants/fonts';
import { BG_DEEP, CREAM, GOLD, GOLD_DEEP, GOLD_LINE, MUTED, ON_GOLD, TILE, TILE_EDGE, TILE_PICKED } from '@/constants/palette';
import { BOARDS, BOARD_LIST, CARD_BACKS, CARD_BACK_LIST, CARD_DESIGN_LIST, CARD_DESIGNS, type CardDesignId } from '@/constants/themes';
import { R, shadow } from '@/constants/ui';
import { uiTap } from '@/lib/feedback';
import { useT } from '@/lib/i18n';
import type { Card as PlayCard } from '@/lib/types';
import { useLook } from '@/state/look';

const GAP = 10;
const COLUMNS = 3;

/** One pick: a framed tile with the sample on top and its name under it. The picked one gets a gold frame and a tick. */
function Tile({
  name, selected, onPress, width, children,
}: { name: string; selected: boolean; onPress: () => void; width: number; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={name}
      onPress={() => {
        uiTap();
        onPress();
      }}
      style={({ pressed }) => ({
        width, borderRadius: R.sm, padding: 6, gap: 5, alignItems: 'center',
        backgroundColor: selected ? TILE_PICKED : TILE,
        borderWidth: 2, borderColor: selected ? GOLD : TILE_EDGE,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}>
      <View style={{ height: 62, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>{children}</View>
      <Text numberOfLines={1} style={[txt(12.5), { color: selected ? GOLD : CREAM }]}>{name}</Text>
      {selected ? (
        <View
          style={{
            position: 'absolute', top: -7, right: -7, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
            backgroundColor: GOLD, borderWidth: 1.5, borderColor: GOLD_DEEP,
          }}>
          <Ionicons name="checkmark" size={14} color={ON_GOLD} />
        </View>
      ) : null}
    </Pressable>
  );
}

const SAMPLE: PlayCard[] = [
  { suit: 'H', rank: 13 }, { suit: 'C', rank: 10 }, { suit: 'D', rank: 14 },
];

/** What the picker shows for a card design: three cards, a face card, a pip card and an ace, in a small fan. */
function FaceSample({ id }: { id: CardDesignId }) {
  const w = 34;
  const step = 18;
  return (
    <View style={{ width: w + step * 2 + 6, height: Math.round(w * CARD_RATIO) + 4 }}>
      {SAMPLE.map((c, i) => (
        <View key={i} style={{ position: 'absolute', left: i * step + 3, top: 2 + Math.abs(i - 1) * 1.5, transform: [{ rotate: `${(i - 1) * 7}deg` }] }}>
          <PlayingCard card={c} width={w} design={id} />
        </View>
      ))}
    </View>
  );
}

/** The mini table at the top left: the picked board, an opponent's hand of backs, a trick and your hand. */
function Preview() {
  const [size, setSize] = useState({ w: 330, h: 230 });
  const { w, h } = size;
  const handW = Math.round(Math.min(46, Math.max(30, h * 0.2)));
  const trickW = Math.round(handW * 0.78);
  const backW = Math.round(handW * 0.46);
  const hand: PlayCard[] = [
    { suit: 'S', rank: 14 }, { suit: 'H', rank: 13 }, { suit: 'S', rank: 12 }, { suit: 'D', rank: 11 },
    { suit: 'C', rank: 10 }, { suit: 'H', rank: 7 }, { suit: 'D', rank: 3 },
  ];
  const step = Math.min(handW * 0.62, (w - handW - 24) / (hand.length - 1));
  const left0 = (w - (step * (hand.length - 1) + handW)) / 2;
  const trickH = trickW * CARD_RATIO;
  const cx = w / 2 - trickW / 2;
  const cy = h * 0.4 - trickH / 2;
  const trick: { card: PlayCard; dx: number; dy: number; rot: number; glow?: boolean }[] = [
    { card: { suit: 'D', rank: 9 }, dx: -trickW * 1.08, dy: 0, rot: -4 },
    { card: { suit: 'S', rank: 12 }, dx: 0, dy: -trickH * 0.46, rot: 2 },
    { card: { suit: 'H', rank: 13 }, dx: trickW * 1.08, dy: 0, rot: 3 },
    { card: { suit: 'S', rank: 14 }, dx: 0, dy: trickH * 0.46, rot: -2, glow: true },
  ];

  return (
    <View
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={{ flex: 1, borderRadius: R.lg, overflow: 'hidden', borderWidth: 2.5, borderColor: GOLD_DEEP, ...shadow(2) }}>
      <Board />
      {/* an opponent's hand: backs in a row */}
      <View style={{ position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center' }}>
        <View style={{ width: backW + 5 * 7, height: Math.round(backW * CARD_RATIO) }}>
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={{ position: 'absolute', left: i * 7, top: 0 }}>
              <PlayingCard faceDown width={backW} />
            </View>
          ))}
        </View>
      </View>
      {trick.map((t, i) => (
        <View key={i} style={{ position: 'absolute', left: cx + t.dx, top: cy + t.dy, transform: [{ rotate: `${t.rot}deg` }] }}>
          <PlayingCard card={t.card} width={trickW} />
        </View>
      ))}
      {/* your hand, fanned along the bottom edge */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: -handW * CARD_RATIO * 0.24, height: handW * CARD_RATIO + 14 }}>
        {hand.map((c, i) => {
          const off = i - (hand.length - 1) / 2;
          return (
            <View key={i} style={{ position: 'absolute', left: left0 + i * step, top: 10 + off * off * 0.5 - (i === 1 ? 10 : 0), transform: [{ rotate: `${off * 2}deg` }] }}>
              <PlayingCard card={c} width={handW} dimmed={i === 5 || i === 6} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function Customize() {
  const t = useT();
  const { card, back, board, setCard, setBack, setBoard, reset } = useLook();
  const [paneW, setPaneW] = useState(380);
  // Three tiles per row inside a Card (14 padding and a 1.5 border on each side, plus a pixel to spare).
  const tileW = Math.floor((paneW - 32 - GAP * (COLUMNS - 1)) / COLUMNS);
  const grid = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: GAP };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG_DEEP }}>
      <MenuBackdrop />
      <PageHeader
        title={t('customizeTitle')}
        hint={t('customizeHint')}
        backLabel={t('back')}
        onBack={goHome}
        right={<PillButton label={t('resetLook')} onPress={reset} />}
      />

      <View style={{ flex: 1, flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Animated.View entering={FadeInLeft.duration(260)} style={{ flex: 1, minWidth: 0, gap: 8 }}>
          <Preview />
          <View style={{ alignItems: 'center' }}>
            <Text numberOfLines={1} style={[txt(14), { color: GOLD }]}>
              {[CARD_DESIGNS[card].name, CARD_BACKS[back].name, BOARDS[board].name].join('  ·  ')}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInRight.duration(260).delay(40)} style={{ flex: 1, minWidth: 0 }} onLayout={(e) => setPaneW(e.nativeEvent.layout.width)}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 6, paddingTop: 6 }}>
            <Card>
              <CardTitle title={t('cardDesign')} />
              <View style={grid}>
                {CARD_DESIGN_LIST.map((d) => (
                  <Tile key={d.id} name={d.name} selected={card === d.id} width={tileW} onPress={() => setCard(d.id)}>
                    <FaceSample id={d.id} />
                  </Tile>
                ))}
              </View>
            </Card>

            <Card>
              <CardTitle title={t('cardBack')} />
              <View style={grid}>
                {CARD_BACK_LIST.map((b) => (
                  <Tile key={b.id} name={b.name} selected={back === b.id} width={tileW} onPress={() => setBack(b.id)}>
                    <CardBackFace back={b} width={44} />
                  </Tile>
                ))}
              </View>
            </Card>

            <Card>
              <CardTitle title={t('tableDesign')} />
              <View style={grid}>
                {BOARD_LIST.map((b) => (
                  <Tile key={b.id} name={b.name} selected={board === b.id} width={tileW} onPress={() => setBoard(b.id)}>
                    <View style={{ width: '100%', height: 62, borderRadius: 9, overflow: 'hidden', borderWidth: 1.5, borderColor: GOLD_LINE }}>
                      <Board id={b.id} />
                    </View>
                  </Tile>
                ))}
              </View>
            </Card>
            <Text style={[txt(12, false), { color: MUTED, textAlign: 'center' }]}>{t('appearanceHint')}</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
