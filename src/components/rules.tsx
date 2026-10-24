import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { PlayingCard } from '@/components/table/PlayingCard';
import { Text } from '@/components/text';
import { txt } from '@/constants/fonts';
import { ACCENT, CREAM, GOLD, GOLD_LINE, GOLD_LINE_SOFT, LINE, MUTED, ON_GOLD, PANEL } from '@/constants/palette';
import { R } from '@/constants/ui';
import { GUIDE_UI, type Block } from '@/lib/rulesContent';
import type { Lang } from '@/lib/i18n';
import type { Card, Suit } from '@/lib/types';

const BODY = 'rgba(246,241,227,0.92)';
const RANKS: Record<string, number> = { J: 11, Q: 12, K: 13, A: 14 };

/** "10H" -> { suit: 'H', rank: 10 }; "JS" -> { suit: 'S', rank: 11 }. */
export function parseCard(code: string): Card {
  const rank = code.slice(0, -1);
  return { suit: code.slice(-1) as Suit, rank: RANKS[rank] ?? Number(rank) };
}

function CardRow({ cards, width, overlap = 0 }: { cards: string[]; width: number; overlap?: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
      {cards.map((c, i) => (
        <View key={`${c}${i}`} style={{ marginLeft: i === 0 ? 0 : overlap ? -overlap : 8, marginBottom: 6 }}>
          <PlayingCard card={parseCard(c)} width={width} />
        </View>
      ))}
    </View>
  );
}

const body = [txt(14.5, false), { color: BODY }] as const;

function Box({ children, tint, line }: { children: ReactNode; tint: string; line: string }) {
  return (
    <View style={{ borderRadius: R.sm, padding: 12, gap: 8, backgroundColor: tint, borderWidth: 1.5, borderColor: line }}>{children}</View>
  );
}

/** One piece of a rules section: text, list, steps, sample cards, a played trick, an example box, a table... */
export function BlockView({ block: b, lang }: { block: Block; lang: Lang }) {
  const ui = GUIDE_UI[lang];

  switch (b.t) {
    case 'p':
      return <Text style={body}>{b.text}</Text>;

    case 'list':
      return (
        <View style={{ gap: 7 }}>
          {b.items.map((it, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 9 }}>
              <Text style={[txt(10), { color: GOLD, marginTop: 5 }]}>◆</Text>
              <Text style={[body, { flex: 1 }]}>{it}</Text>
            </View>
          ))}
        </View>
      );

    case 'steps':
      return (
        <View style={{ gap: 9 }}>
          {b.items.map((it, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                <Text style={[txt(13), { color: ON_GOLD, lineHeight: 17 }]}>{i + 1}</Text>
              </View>
              <Text style={[body, { flex: 1 }]}>{it}</Text>
            </View>
          ))}
        </View>
      );

    case 'cards':
      return (
        <View style={{ gap: 4 }}>
          <CardRow cards={b.cards} width={40} />
          {b.caption ? <Text style={[txt(12.5, false), { color: MUTED }]}>{b.caption}</Text> : null}
        </View>
      );

    case 'trick':
      return (
        <Box tint="rgba(0,0,0,0.22)" line={GOLD_LINE_SOFT}>
          <Text style={[txt(15), { color: GOLD }]}>{b.title}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {b.plays.map((p, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <Text style={[txt(12.5), { color: i === b.winner ? GOLD : MUTED }]}>{p.who}</Text>
                <PlayingCard card={parseCard(p.card)} width={46} glow={i === b.winner} />
                <Text style={[txt(11), { color: GOLD }]}>{i === b.winner ? '✓' : ' '}</Text>
              </View>
            ))}
          </View>
          <Text style={[txt(14), { color: GOLD }]}>{`✓ ${b.won}`}</Text>
          <Text style={body}>{b.note}</Text>
        </Box>
      );

    case 'example':
      return (
        <Box tint="rgba(0,0,0,0.22)" line={GOLD_LINE_SOFT}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ paddingHorizontal: 8, paddingVertical: 1, borderRadius: 8, backgroundColor: GOLD }}>
              <Text style={[txt(11.5), { color: ON_GOLD }]}>{ui.example}</Text>
            </View>
            <Text style={[txt(15), { color: GOLD, flex: 1 }]}>{b.title}</Text>
          </View>
          {b.cards ? <CardRow cards={b.cards} width={36} /> : null}
          {b.lines.map((l, i) => (
            <Text key={i} style={body}>{l}</Text>
          ))}
        </Box>
      );

    case 'table': {
      const two = b.head.length === 2;
      const flexOf = (c: number) => (two ? (c === 0 ? 1 : 3) : 1);
      return (
        <View style={{ borderRadius: R.sm, borderWidth: 1.5, borderColor: GOLD_LINE, backgroundColor: 'rgba(0,0,0,0.18)' }}>
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(242,193,78,0.16)', borderTopLeftRadius: R.sm - 2, borderTopRightRadius: R.sm - 2 }}>
            {b.head.map((h, c) => (
              <Text key={c} style={[txt(13), { flex: flexOf(c), color: GOLD, paddingHorizontal: 10, paddingVertical: 5 }]}>{h}</Text>
            ))}
          </View>
          {b.rows.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: LINE }}>
              {row.map((cell, c) => (
                <Text key={c} style={[c === 0 ? txt(13.5) : txt(13.5, false), { flex: flexOf(c), color: c === 0 ? CREAM : BODY, paddingHorizontal: 10, paddingVertical: 6 }]}>{cell}</Text>
              ))}
            </View>
          ))}
        </View>
      );
    }

    case 'ranks':
      return (
        <View style={{ gap: 10 }}>
          {b.rows.map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 10, borderBottomWidth: i === b.rows.length - 1 ? 0 : 1, borderBottomColor: LINE }}>
              <View style={{ width: 5 * 30 - 4 * 14 + 2 }}>
                <CardRow cards={row.cards} width={30} overlap={14} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[txt(14.5), { color: GOLD }]}>{row.name}</Text>
                <Text style={[txt(13, false), { color: BODY }]}>{row.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      );

    case 'tip':
      return (
        <Box tint="rgba(31,160,106,0.14)" line="rgba(31,160,106,0.45)">
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <Ionicons name="bulb" size={19} color={GOLD} style={{ marginTop: 2 }} />
            <Text style={[body, { flex: 1 }]}>{b.text}</Text>
          </View>
        </Box>
      );

    case 'warn':
      return (
        <Box tint="rgba(242,193,78,0.10)" line={GOLD_LINE}>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <Ionicons name="alert-circle" size={19} color={GOLD} style={{ marginTop: 2 }} />
            <Text style={[body, { flex: 1 }]}>{b.text}</Text>
          </View>
        </Box>
      );
  }
}

/** A collapsible rules section: tap the title to open or close it. */
export function SectionCard({
  index, title, open, onToggle, children,
}: { index: number; title: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <View style={{ borderRadius: R.lg, backgroundColor: PANEL, borderWidth: 1.5, borderColor: open ? GOLD_LINE : GOLD_LINE_SOFT }}>
      <Pressable accessibilityRole="button" onPress={onToggle} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, opacity: pressed ? 0.8 : 1 })}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: open ? GOLD : 'rgba(242,193,78,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[txt(14), { color: open ? ON_GOLD : GOLD, lineHeight: 18 }]}>{index}</Text>
        </View>
        <Text style={[txt(16.5), { color: CREAM, flex: 1 }]}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={open ? GOLD : ACCENT} />
      </Pressable>
      {open ? <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12 }}>{children}</View> : null}
    </View>
  );
}
