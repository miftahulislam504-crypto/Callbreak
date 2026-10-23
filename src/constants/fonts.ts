/**
 * One typeface for the whole game: Baloo Da 2 (rounded, game-like, has both Latin and Bengali glyphs).
 * Loaded in _layout.tsx. Android/iOS pick the weight from the family name, so never put a fontWeight
 * next to one of these. The shared <Text> / <TextInput> in components/text.tsx map any fontWeight to the
 * right family automatically, so a plain `fontWeight: '800'` in a screen still comes out in Baloo.
 */
export const FONT = {
  regular: 'BalooDa2_600SemiBold',
  bold: 'BalooDa2_700Bold',
  heavy: 'BalooDa2_800ExtraBold',
} as const;

/** Maps a CSS-style fontWeight to the Baloo family: 400-600 → semi-bold, 700 → bold, 800-900 → extra-bold. */
export function fontForWeight(weight: unknown): string {
  const w = weight === 'bold' ? 700 : typeof weight === 'number' ? weight : parseInt(String(weight ?? ''), 10);
  if (!Number.isFinite(w) || w < 650) return FONT.regular;
  if (w < 780) return FONT.bold;
  return FONT.heavy;
}

/** Font + size + a roomy line height (Bengali matras are tall, so a tight line box would clip them). */
export const txt = (size: number, heavy = true) =>
  ({ fontFamily: heavy ? FONT.heavy : FONT.bold, fontSize: size, lineHeight: Math.round(size * 1.3) }) as const;
