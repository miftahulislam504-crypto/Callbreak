# 29 and Poker in the app

The home, quick match and new-room screens have a game switch (Call Break / 29 / Poker). The choice is remembered.

- `src/lib/games.ts` lists the games (seats, fewest players to start, presets for the target / chips).
- `src/state/gamePick.ts` remembers which game is picked.
- `src/lib/gameClient.ts` creates / joins / quick-matches a room of the chosen game (`create`, `joinOrCreate`).
- `src/app/game.tsx` shows the right screen: `CallBreakGame` (unchanged), `TwentyNineScreen` or `PokerScreen`.
- `src/components/twentynine/*` : table, bid sheet, trump picker, round / game-over overlays, score sheet.
- `src/components/poker/*` : seats, table, bet slider and buttons, game-over overlay.
- The lobby shows 4 seats (Call Break, 29) or 6 seats in two rows (Poker), and the right setting picker.
- Voice chat covers up to 6 seats (`VOICE_SEATS`).

Pure-logic tests (no device needed): `npx tsx --test test/tableEvents.test.ts test/twentynineEvents.test.ts`.
