# PokéGenius

Play at [pokegenius.vercel.app](https://pokegenius.vercel.app).

A free Pokémon fan game with five complete games:

- **Who's that Pokémon?** Solo silhouette guessing, or a two-player match with steals and a coin toss.
- **Pokédoku.** Solo category grids, or two-player category tic-tac-toe with 40-second turns.
- **Pokédle.** Find a complete Pokémon name in six guesses, with repeated-letter-aware clues.
- **DexCode.** Guess a Pokédex number, alone or with up to four players, with private answers and distance-based scores.
- **Higher or Lower / Stat Match.** Compare nine Pokémon attributes over ten questions per round. Two players privately answer identical question sets.

Choose 3, 5, or 10 rounds and any combination of generation groups 1-4, 5-6, and 7-9. Full rules are available in the game. In solo silhouette play, the round count is the number of Pokémon; in Pokédoku it is the number of boards. Multiplayer modes share one device. Pokédle has one puzzle per game and six guesses.

The interface supports Italian and English, touch and keyboard, optional locally generated music and sound, reduced motion, saved matches, and local result history. Progress lives in this browser, and a new match replaces the previous saved match. Multiplayer timers keep running while the game is in another tab or on the game-room screen; returning resolves an expired turn.

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

Vite produces `dist/`, containing the entire application. Vercel serves those files with no functions, API routes, backend, database, runtime secrets, or external requests during gameplay. The app fetches its own static assets as needed; a fresh offline load is not supported.

The repository is connected to the Vercel `pokegenius` project. Pushing `main` deploys production. `vercel.json` supplies the Vite configuration. The project uses `ENABLE_EXPERIMENTAL_COREPACK=1` to respect the pinned pnpm version. Do not commit `.vercel/` or `.env*` files.

## Pokémon data and credits

The checked-in dataset contains National Pokédex species 001-1025, their English display names, introduction generations, current types, height, weight, and all six base stats of their default forms. Regional variants and Mega Evolutions are excluded. Fairy is included. All sprites, artwork, fonts, and data are served locally.

Data is from [PokéAPI's CSV dataset](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv); images are from [PokeAPI/sprites](https://github.com/PokeAPI/sprites). Fonts are Outfit and Space Grotesk, distributed by Fontsource under their included open font licenses. Icons are Lucide (ISC).

To intentionally refresh the dataset and missing sprites, run `pnpm data:refresh` with Python 3 and an internet connection, review the changed data, and rerun checks. This is a maintainer operation, not a build or gameplay dependency.

Pokémon and character artwork belong to Nintendo, Game Freak, and The Pokémon Company. This project is an unofficial, non-commercial fan game and is not affiliated with those companies.
