// Shared look of the game: corner radii, shadows, button tones and the frame of every dialog.
import {
  CREAM, DANGER_DEEP, GOLD, GOLD_DEEP, GOLD_EDGE, GOLD_RIM, GREEN_EDGE, GREEN_FACE, GREEN_RIM, INK, ON_GOLD, ROSE,
} from './palette';

/** Corner radii. Cards and panels use lg / xl, buttons md, inputs and small plates sm. */
export const R = { xs: 8, sm: 12, md: 16, lg: 20, xl: 24 } as const;

/** Soft drop shadow in three depths (iOS shadow props + Android elevation). */
export const shadow = (level: 1 | 2 | 3) =>
  ({
    shadowColor: '#000',
    shadowOpacity: [0.25, 0.35, 0.5][level - 1],
    shadowRadius: [4, 8, 14][level - 1],
    shadowOffset: { width: 0, height: [2, 4, 8][level - 1] },
    elevation: [3, 6, 12][level - 1],
  }) as const;

/** Soft dark shadow behind headings, so they sit on the felt instead of floating. */
export const TITLE_SHADOW = {
  textShadowColor: 'rgba(0,0,0,0.5)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 3,
} as const;

/**
 * The chunky "game" button colours: a face, a thick darker edge underneath, a bright rim, and the
 * colours for the text, icon and icon badge. Used by both GameButton and the plain Button.
 */
export const TONES = {
  gold: { face: GOLD, edge: GOLD_EDGE, rim: GOLD_RIM, text: ON_GOLD, icon: ON_GOLD, badge: 'rgba(42,27,0,0.14)' },
  green: { face: GREEN_FACE, edge: GREEN_EDGE, rim: GREEN_RIM, text: '#FFFFFF', icon: '#FFFFFF', badge: 'rgba(0,0,0,0.2)' },
  dark: { face: '#17563C', edge: '#082A1D', rim: 'rgba(255,255,255,0.14)', text: CREAM, icon: GOLD, badge: 'rgba(0,0,0,0.22)' },
  danger: { face: '#D6393F', edge: '#7E1A1F', rim: ROSE, text: '#FFFFFF', icon: '#FFFFFF', badge: 'rgba(0,0,0,0.2)' },
} as const;
export type Tone = keyof typeof TONES;

/**
 * Frame of every dialog, sheet and overlay: dark plate, gold rim, deep shadow. Add layout (width, padding,
 * gap) next to it and put <PanelShine /> as the first child for the inner gold line and top highlight.
 */
export const PANEL_FRAME = {
  backgroundColor: INK,
  borderWidth: 2,
  borderColor: GOLD_DEEP,
  borderRadius: R.xl,
  ...shadow(3),
} as const;

/** The small dark "HUD" plate used for the round / target info at the top of a table. */
export const HUD_PLATE = {
  paddingHorizontal: 12,
  borderRadius: R.sm,
  justifyContent: 'center' as const,
  backgroundColor: 'rgba(8,24,16,0.72)',
  borderWidth: 1.5,
  borderColor: 'rgba(242,193,78,0.35)',
};

export { DANGER_DEEP };
