# UI style: one look on every page

The home page is the reference: dark green felt, gold rims, chunky game buttons, rounded Baloo Da 2 text.
Everything else uses the same shared pieces, so a new screen looks right without extra work.

| Need | Use | File |
| --- | --- | --- |
| Text / text input | `Text`, `TextInput` from `@/components/text` (never from `react-native`) | `components/text.tsx` |
| Colours | tokens from `constants/palette.ts` (no hex in screens) | `constants/palette.ts` |
| Corner radius, shadow, button tones, dialog frame | `R`, `shadow`, `TONES`, `PANEL_FRAME`, `HUD_PLATE`, `TITLE_SHADOW` | `constants/ui.ts` |
| Buttons | `Button` (any page), `GameButton` (big home / lobby buttons), `PillButton` (header), `Chip` (choices) | `components/kit.tsx`, `components/gameui.tsx` |
| Cards / sections | `Card`, `CardTitle` | `components/kit.tsx` |
| Page top bar | `PageHeader` (or `MenuPage`, which already has it) | `components/kit.tsx` |
| Dialogs, sheets, overlays | `PANEL_FRAME` + `<PanelShine />` as first child | `constants/ui.ts`, `components/frame.tsx` |
| Dim layer behind a dialog | `SCRIM` | `constants/palette.ts` |

Rules of thumb:

- The font is one family. `Text` maps `fontWeight` to the right Baloo weight for you (400-600 semi-bold, 700 bold, 800-900 extra-bold)
  and adds a roomy `lineHeight` so Bengali matras are not clipped. Do not set `fontFamily` and `fontWeight` together.
- Primary action = gold, normal action = green, quiet action = `secondary` (dark), leaving / deleting = `danger`.
- Gold is for emphasis (titles, the picked option, the main button); do not use it for body text.
- A new colour goes into `palette.ts` first, then into the screen.
