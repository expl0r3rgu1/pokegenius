import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Grid2X2,
  Hash,
  Play,
  ScanLine,
  Trophy,
  UsersRound,
} from "lucide-react";
import { Sprite } from "./components";
import { useText } from "./context";
import { history } from "./storage";
import type { Game, Match } from "./game";
import type { ExtraMatch } from "./extraGames";
import { GAME_NAMES } from "./catalog";
export function Home({
  onSetup,
  onRules,
  saved,
  onResume,
}: {
  onSetup: (game: Game) => void;
  onRules: () => void;
  saved: Match | ExtraMatch | null;
  onResume: () => void;
}) {
  const t = useText();
  const recent = history()
    .filter((e) => e.players === 1)
    .slice(0, 3);
  const cards = [
    {
      game: "shadow",
      sprite: 25,
      icon: <ScanLine size={18} />,
      hint: t("Indovina la sagoma", "Name the silhouette"),
      players: "1-2",
      description: t("Un’ombra. Un solo nome.", "One shadow. One name."),
    },
    {
      game: "doku",
      sprite: 1,
      icon: <Grid2X2 size={18} />,
      hint: t("Incrocia i tipi", "Match the categories"),
      players: "1-2",
      description: t(
        "Completa la griglia o fai tris.",
        "Fill the grid or get three in a row.",
      ),
    },
    {
      game: "pokedle",
      sprite: 201,
      icon: <span>Aa</span>,
      hint: t("Ogni lettera conta", "Every letter counts"),
      players: "1",
      description: t("Un nome, sei tentativi.", "One name, six guesses."),
    },
    {
      game: "dex",
      sprite: 479,
      icon: <Hash size={18} />,
      hint: t("Decifra il Pokédex", "Crack the Pokédex"),
      players: "1-4",
      description: t(
        "Il numero è il tuo unico indizio.",
        "The number is your only clue.",
      ),
    },
    {
      game: "stat",
      sprite: 143,
      icon: <span>↕</span>,
      hint: t("Più alto o più basso?", "Higher or lower?"),
      players: "1-2",
      description: t(
        "Metti alla prova le tue conoscenze.",
        "Put your trainer knowledge to the test.",
      ),
    },
  ] as const;
  return (
    <div className="game-room">
      <section className="room-heading">
        <div>
          <span className="console-label">
            <i />
            {t("Pronto a giocare", "Ready to play")}
          </span>
          <h1>{t("Scegli la tua sfida.", "Choose your challenge.")}</h1>
          <p>
            {t(
              "Cinque giochi. Tutti i tuoi Pokémon.",
              "Five games. All your Pokémon.",
            )}
          </p>
        </div>
        <Sprite id={25} className="room-mascot" />
      </section>
      {saved && saved.phase !== "finished" && (
        <div className="resume-banner">
          <Play size={19} />
          <div>
            <strong>{t("Partita in corso", "Game in progress")}</strong>
            <p>{GAME_NAMES[saved.config.game]}</p>
          </div>
          <button className="button small" onClick={onResume}>
            {t("Riprendi", "Resume")}
            <ChevronRight size={17} />
          </button>
        </div>
      )}
      <section
        id="games"
        className="game-cards"
        aria-label={t("Scegli un gioco", "Choose a game")}
      >
        {cards.map((card) => (
          <article className={`game-card ${card.game}-card`} key={card.game}>
            <div className="cartridge-art" aria-hidden="true">
              <Sprite id={card.sprite} />
              <span>{card.icon}</span>
            </div>
            <div className="card-content">
              <span className="cartridge-label">{card.hint}</span>
              <h2>{GAME_NAMES[card.game]}</h2>
              <p>{card.description}</p>
              <div className="card-bottom">
                <span>
                  <UsersRound size={14} />
                  {card.players}{" "}
                  {t(
                    card.players === "1" ? "giocatore" : "giocatori",
                    card.players === "1" ? "player" : "players",
                  )}
                </span>
                <button
                  className="button card-button"
                  onClick={() => onSetup(card.game)}
                >
                  {t("Gioca", "Play")}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
      <div className="room-footer">
        <span>
          {t(
            "Tutto sul tuo dispositivo. Anche offline.",
            "Everything on your device. Offline, too.",
          )}
        </span>
        <button className="text-button" onClick={onRules}>
          <BookOpen size={16} />
          {t("Come si gioca", "How to play")}
        </button>
      </div>
      {recent.length > 0 && (
        <section className="personal-stats">
          <h2>
            <Trophy size={17} />
            {t("I tuoi ultimi risultati", "Your latest results")}
          </h2>
          <div>
            {recent.map((entry) => (
              <div className="history-entry" key={entry.id}>
                <span>{GAME_NAMES[entry.game]}</span>
                <strong>
                  {entry.game === "pokedle"
                    ? entry.score
                      ? t("Risolto!", "Solved!")
                      : t("Da riprovare", "Try again")
                    : `${entry.score} / ${entry.total} pt`}
                </strong>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
