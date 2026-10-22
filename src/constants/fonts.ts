/**
 * Menu font: Baloo Da 2 (rounded, game-like, has both Latin and Bengali glyphs). Loaded in _layout.tsx.
 * Android/iOS pick the weight from the family name, so do NOT add fontWeight next to these.
 */
export const FONT = {
  bold: 'BalooDa2_700Bold',
  heavy: 'BalooDa2_800ExtraBold',
} as const;

/** Font + size + a roomy line height (Bengali matras are tall, so a tight line box would clip them). */
export const txt = (size: number, heavy = true) =>
  ({ fontFamily: heavy ? FONT.heavy : FONT.bold, fontSize: size, lineHeight: Math.round(size * 1.3) }) as const;
