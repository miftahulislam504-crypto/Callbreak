/**
 * Two typefaces, both loaded in _layout.tsx:
 *  - Lilita One: a chunky "game" display face for titles, buttons, scores and card numbers (it has one weight only).
 *  - Rubik: a sturdy, clean sans for small text and descriptions.
 * Android/iOS pick the weight from the family name, so never put a fontWeight next to one of these. The shared
 * <Text> / <TextInput> in components/text.tsx map any fontWeight to the right family automatically, so a plain
 * `fontWeight: '800'` in a screen still comes out in Lilita One.
 */
export const FONT = {
  regular: 'Rubik_500Medium',
  bold: 'Rubik_600SemiBold',
  heavy: 'LilitaOne_400Regular',
} as const;

/** True for the families above (anything else was picked on purpose, e.g. monospace). */
export const isGameFont = (family?: string): boolean =>
  !!family && (family.startsWith('Rubik_') || family.startsWith('LilitaOne_'));

/** Maps a CSS-style fontWeight to a family: 400-600 → Rubik medium, 700 → Rubik semi-bold, 800-900 → Lilita One. */
export function fontForWeight(weight: unknown): string {
  const w = weight === 'bold' ? 700 : typeof weight === 'number' ? weight : parseInt(String(weight ?? ''), 10);
  if (!Number.isFinite(w) || w < 650) return FONT.regular;
  if (w < 780) return FONT.bold;
  return FONT.heavy;
}

/** Font + size + a line height that leaves room for emoji and suit symbols. `heavy` is the Lilita One display face. */
export const txt = (size: number, heavy = true) =>
  ({ fontFamily: heavy ? FONT.heavy : FONT.bold, fontSize: size, lineHeight: Math.round(size * 1.28) }) as const;
