import { createContext, useContext, type ReactNode } from 'react';
import {
  StyleSheet, Text as RNText, TextInput as RNTextInput,
  type StyleProp, type TextInputProps, type TextProps, type TextStyle,
} from 'react-native';

import { FONT, fontForWeight, isGameFont } from '@/constants/fonts';

/**
 * The game's <Text> and <TextInput>. Same API as react-native's, but every piece of text comes out in the
 * game's own fonts so no screen falls back to the system font:
 *  - a `fontWeight` in the style picks the matching family (and is dropped, see constants/fonts.ts),
 *  - text without a weight gets the regular game weight,
 *  - a `lineHeight` is added when only a `fontSize` is given (emoji and symbols get clipped otherwise),
 *  - the chunky display face gets a touch of letter spacing,
 *  - text nested inside another <Text> keeps the parent's weight unless it sets its own.
 */
const Nested = createContext(false);

function resolve(style: StyleProp<TextStyle>, nested: boolean, withLineHeight: boolean): StyleProp<TextStyle> {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const { fontWeight, ...rest } = flat;
  // Someone chose a specific family (e.g. monospace): leave it alone.
  if (rest.fontFamily && !isGameFont(rest.fontFamily)) return flat;
  if (!rest.fontFamily) {
    // Nested text without its own weight inherits the parent's family.
    if (!(nested && fontWeight === undefined)) rest.fontFamily = fontForWeight(fontWeight);
  }
  if (withLineHeight && rest.fontSize !== undefined && rest.lineHeight === undefined) {
    rest.lineHeight = Math.round(rest.fontSize * 1.28);
  }
  if (rest.fontFamily === FONT.heavy && rest.letterSpacing === undefined) {
    rest.letterSpacing = (rest.fontSize ?? 14) >= 22 ? 0.6 : 0.3;
  }
  return rest;
}

export function Text({ style, children, ...rest }: TextProps & { children?: ReactNode }) {
  const nested = useContext(Nested);
  return (
    <Nested.Provider value>
      <RNText {...rest} style={resolve(style, nested, true)}>{children}</RNText>
    </Nested.Provider>
  );
}

export function TextInput({ style, ...rest }: TextInputProps) {
  return <RNTextInput {...rest} style={resolve(style as StyleProp<TextStyle>, false, false)} />;
}

export { FONT };
