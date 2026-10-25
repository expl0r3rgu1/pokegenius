import type { Config, Game } from "./game";
export const GAME_NAMES: Record<Game, string> = {
  shadow: "Who's that Pokémon?",
  doku: "Pokédoku",
  pokedle: "Pokédle",
  dex: "DexCode",
  stat: "Higher or Lower",
};
export const GAME_SYMBOLS: Record<Game, string> = {
  shadow: "?",
  doku: "▦",
  pokedle: "Aa",
  dex: "#",
  stat: "↕",
};
export function maxScore(config: Config) {
  return (
    config.rounds *
    { shadow: 100, doku: 90, pokedle: 1, dex: 150, stat: 100 }[config.game]
  );
}
export function playerName(
  config: Config,
  index: number,
  t: (it: string, en: string) => string,
) {
  return (
    config.names?.[index]?.trim() || `${t("Giocatore", "Player")} ${index + 1}`
  );
}
