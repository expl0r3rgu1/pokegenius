import { ArrowRight, Check, UserRound, UsersRound } from "lucide-react";
import { useState } from "react";
import { Dialog } from "./components";
import { useText } from "./context";
import { GROUPS, poolFor, type Config, type Game } from "./game";
import { GAME_NAMES, GAME_SYMBOLS } from "./catalog";
export function Setup({
  game,
  initial,
  onClose,
  onStart,
}: {
  game: Game;
  initial: Config;
  onClose: () => void;
  onStart: (config: Config) => void;
}) {
  const t = useText();
  const [config, setConfig] = useState<Config>({
    ...initial,
    game,
    players:
      game === "pokedle"
        ? 1
        : game === "dex"
          ? initial.players
          : initial.players > 2
            ? 2
            : initial.players,
    rounds:
      game === "pokedle" || (game === "doku" && initial.players === 2)
        ? 1
        : initial.rounds === 1
          ? 5
          : initial.rounds,
  });
  const groups = [
    {
      title: t("I classici", "The classics"),
      detail: "Gen 1-4",
      regions: "Kanto, Johto, Hoenn, Sinnoh",
      sprite: 25,
    },
    {
      title: t("Nuovi orizzonti", "New horizons"),
      detail: "Gen 5-6",
      regions: "Unova, Kalos",
      sprite: 653,
    },
    {
      title: t("La nuova era", "The new era"),
      detail: "Gen 7-9",
      regions: "Alola, Galar, Paldea",
      sprite: 722,
    },
  ];
  const playerOptions: Config["players"][] =
    game === "dex" ? [1, 2, 3, 4] : [1, 2];
  return (
    <Dialog
      title={t("Prepariamo la partita", "Make it your game")}
      onClose={onClose}
    >
      <div className="setup-game">
        <span className={`tiny-game-icon ${game}`}>{GAME_SYMBOLS[game]}</span>
        <div>
          <strong>{GAME_NAMES[game]}</strong>
          <p>
            {game === "stat"
              ? t(
                  "10 confronti per round. Chi ne sa di più?",
                  "10 comparisons per round. Who knows more?",
                )
              : game === "pokedle"
                ? t("Un Pokémon. Sei tentativi.", "One Pokémon. Six guesses.")
                : t(
                    "Il prossimo colpo di genio è tuo.",
                    "Your next bright idea starts here.",
                  )}
          </p>
        </div>
      </div>
      {game !== "pokedle" && (
        <fieldset>
          <legend>{t("Chi gioca?", "Who's playing?")}</legend>
          <div
            className={`segmented players ${game === "dex" ? "four-players" : ""}`}
          >
            {playerOptions.map((players) => (
              <button
                type="button"
                key={players}
                aria-pressed={config.players === players}
                className={config.players === players ? "selected" : ""}
                onClick={() =>
                  setConfig({
                    ...config,
                    players,
                    rounds:
                      game === "doku" && players === 2
                        ? 1
                        : config.rounds === 1
                          ? 5
                          : config.rounds,
                  })
                }
              >
                {players === 1 ? (
                  <UserRound size={18} />
                ) : (
                  <UsersRound size={18} />
                )}
                <span>
                  {players === 1
                    ? t("Da solo", "Solo")
                    : game === "dex"
                      ? `${players} ${t("giocatori", "players")}`
                      : t("Con un amico", "With a friend")}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {game === "dex" && config.players > 1 && (
        <fieldset className="player-name-fields">
          <legend>{t("I nomi degli allenatori", "Trainer names")}</legend>
          {Array.from({ length: config.players }, (_, index) => (
            <label key={index}>
              <span>
                {t("Giocatore", "Player")} {index + 1}
              </span>
              <input
                autoComplete="off"
                maxLength={24}
                value={config.names?.[index] ?? ""}
                placeholder={`${t("Giocatore", "Player")} ${index + 1}`}
                onChange={(e) => {
                  const names = Array.from(
                    { length: 4 },
                    (_, i) => config.names?.[i] ?? "",
                  );
                  names[index] = e.target.value;
                  setConfig({ ...config, names });
                }}
              />
            </label>
          ))}
        </fieldset>
      )}
      {game !== "pokedle" && !(game === "doku" && config.players === 2) && (
        <fieldset>
          <legend>
            {game === "shadow" && config.players === 1
              ? t("Quante sagome?", "How many silhouettes?")
              : t("Quanti round?", "How many rounds?")}
          </legend>
          <div className="segmented">
            {([3, 5, 10] as const).map((rounds) => (
              <button
                type="button"
                key={rounds}
                aria-pressed={config.rounds === rounds}
                className={config.rounds === rounds ? "selected" : ""}
                onClick={() => setConfig({ ...config, rounds })}
              >
                {rounds}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <div className="legend-row">
          <legend>{t("Il tuo Pokédex", "Your Pokédex")}</legend>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setConfig({
                ...config,
                groups: config.groups.length === 3 ? [] : [0, 1, 2],
              })
            }
          >
            {config.groups.length === 3
              ? t("Deseleziona", "Clear all")
              : t("Seleziona tutte", "Select all")}
          </button>
        </div>
        <div className="gen-options">
          {groups.map((group, i) => (
            <button
              type="button"
              className={`gen-option ${config.groups.includes(i) ? "selected" : ""}`}
              aria-pressed={config.groups.includes(i)}
              key={group.title}
              onClick={() =>
                setConfig({
                  ...config,
                  groups: config.groups.includes(i)
                    ? config.groups.filter((g) => g !== i)
                    : [...config.groups, i].sort(),
                })
              }
            >
              <img src={`/sprites/${group.sprite}.png`} alt="" />
              <span>
                <strong>
                  {group.title}
                  <small>{group.detail}</small>
                </strong>
                <span>{group.regions}</span>
              </span>
              <span className="checkbox">
                {config.groups.includes(i) && (
                  <Check size={14} strokeWidth={3} />
                )}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      {game === "doku" && config.players === 2 && (
        <p className="duel-rule">
          {t(
            "Una griglia. Due allenatori. Fai tris per vincere!",
            "One board. Two trainers. Three in a row wins!",
          )}
        </p>
      )}
      <p className="selection-summary" role="status">
        {config.groups.length
          ? `${poolFor(config).length} Pokémon ${t("da scoprire", "to discover")} · ${config.groups.flatMap((g) => GROUPS[g]).length} ${t("generazioni", "generations")}`
          : t(
              "Seleziona almeno un gruppo per giocare.",
              "Select at least one group to play.",
            )}
      </p>
      <button
        className="button primary full"
        disabled={!config.groups.length}
        onClick={() => onStart(config)}
      >
        {t("Si gioca!", "Let's play!")}
        <ArrowRight size={20} />
      </button>
      {config.players > 1 && (
        <p className="setup-note">
          {t(
            "Passatevi lo stesso dispositivo. Nessun account necessario.",
            "Share the same device. No account needed.",
          )}
        </p>
      )}
      <p className="setup-note">
        {t(
          "Una nuova partita sostituisce il salvataggio in corso.",
          "A new match replaces the current save.",
        )}
      </p>
    </Dialog>
  );
}
