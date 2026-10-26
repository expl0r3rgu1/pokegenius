# PokéGenius

Play at [pokegenius.vercel.app](https://pokegenius.vercel.app).

A free Pokémon fan game with five complete games:

- **Who's that Pokémon?** Solo silhouette guessing, or a two-player match with steals and a coin toss.
- **Pokédoku.** Solo category grids, or a single two-player tic-tac-toe board with 40-second turns. A tris wins immediately; there are no multiplayer points.
- **Pokédle.** Find a complete Pokémon name in six guesses, with repeated-letter-aware clues.
- **DexCode.** Guess a Pokédex number, alone or with up to four players, with private answers and distance-based scores.
- **Higher or Lower / Stat Match.** Compare nine Pokémon attributes over ten questions per round. Two players privately answer identical question sets.

Choose 3, 5, or 10 rounds and any combination of generation groups 1-4, 5-6, and 7-9. Full rules are available in the game. In solo silhouette play, the round count is the number of Pokémon; in solo Pokédoku it is the number of boards. Two-player Pokédoku always uses one board. Multiplayer modes share one device. Pokédle has one puzzle per game and six guesses.

The interface supports Italian and English, touch and keyboard, optional locally generated music and sound, WebHaptics feedback, reduced motion, saved matches, and local result history. Progress lives in this browser, and a new match replaces the previous saved match. Multiplayer timers keep running while the game is in another tab or on the game-room screen; returning resolves an expired turn.

## Development

Use Node.js 22 and pnpm 11.8.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

```sh
pnpm test          # Game rules, board generation, saved-state validation
pnpm build         # Type check and static production build
pnpm test:e2e      # Desktop and phone browser flows, failure recovery, accessibility
```

Browser tests use Playwright Chromium. If it is not installed, run `pnpm exec playwright install chromium`. `TEST_BASE_URL` can point browser tests at a deployed site; all game mutations are local to the test browser. Phone tests emulate a mobile viewport and touch, without testing a physical device's keyboard.

## Static deployment

Vite produces `dist/`, containing the entire application. Vercel serves those files with no functions, API routes, backend, database, runtime secrets, or external requests during gameplay. A service worker caches all five games, fonts, and all 1,025 sprites during the first online visit. Wait for the offline-ready status in Settings before your first offline launch. Later launches and games work without a connection. New app versions prompt before reloading, preserving an active match until you choose to update.

The repository is connected to the Vercel `pokegenius` project. Pushing `main` deploys production. `vercel.json` supplies the Vite configuration. The project uses `ENABLE_EXPERIMENTAL_COREPACK=1` to respect the pinned pnpm version. Do not commit `.vercel/` or `.env*` files.

## Install on your phone

Use the install button in the header. If the browser does not offer an install prompt, the app explains how to add it to your home screen. On iPhone or iPad, use Share > Add to Home Screen. Android and desktop browsers offer Install app in their menu. A dedicated icon, maskable icon, and Apple touch icon are included.

Sound, music, and haptics can be changed in Settings. Haptic hardware support depends on the device and browser. Motion respects the system reduced-motion preference.

## Pokémon data and credits

The checked-in dataset contains National Pokédex species 001-1025, their English display names, introduction generations, current types, height, weight, and all six base stats of their default forms. Regional variants and Mega Evolutions are excluded. Fairy is included. All sprites, artwork, fonts, and data are served locally.

Data is from [PokéAPI's CSV dataset](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv); images are from [PokeAPI/sprites](https://github.com/PokeAPI/sprites). Fonts are Outfit and Press Start 2P, distributed by Fontsource under their included open font licenses. Icons are Lucide (ISC).

To intentionally refresh the dataset and missing sprites, run `pnpm data:refresh` with Python 3 and an internet connection, review the changed data, and rerun checks. This is a maintainer operation, not a build or gameplay dependency.

Pokémon and character artwork belong to Nintendo, Game Freak, and The Pokémon Company. This project is an unofficial, non-commercial fan game and is not affiliated with those companies.
