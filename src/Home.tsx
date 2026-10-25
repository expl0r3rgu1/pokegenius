import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Grid2X2,
  Play,
  ScanLine,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";
import { Pokeball, Sprite } from "./components";
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
  const recent = history().filter((e) => e.players === 1);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="welcome-tag">
            <span />
            {t(
              "Allenatori, benvenuti a casa.",
              "Trainers, make yourselves at home.",
            )}
          </span>
          <h1>
            {t("Quel Pokémon.\nLo conosci?", "You know that\nPokémon. Right?")}
          </h1>
          <p>
            {t(
              "Una sagoma. Un’intuizione. Una sfida tra amici. Metti alla prova tutto quello che sai sui Pokémon.",
              "A silhouette. A spark of genius. A friendly rivalry. Put everything you know about Pokémon to the test.",
            )}
          </p>
          <button
            className="button primary"
            onClick={() =>
              document.getElementById("games")?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "instant"
                  : "smooth",
              })
            }
          >
            {t("Scegli la tua sfida", "Find your challenge")}
            <ArrowRight size={20} />
          </button>
          <div className="hero-details">
            <span>
              <UsersRound size={16} />
              {t("Da solo o in due", "Solo or with a friend")}
            </span>
            <span>
              <Pokeball />
              {t("9 generazioni", "9 generations")}
            </span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="arena-ring ring-one" />
          <div className="arena-ring ring-two" />
          <div className="hero-cross" />
          <span className="hero-star star-one">✦</span>
          <span className="hero-star star-two">✧</span>
          <span className="hero-star star-three">✦</span>
          <img
            className="hero-pikachu"
            src="/art/25.png"
            alt=""
            fetchPriority="high"
          />
          <span className="speech-bubble">
            <Check size={19} strokeWidth={3} />
            {t("È Pikachu!", "It's Pikachu!")}
          </span>
          <span className="dex-sticker">
            <Pokeball />
            <span>
              Pokédex<strong>025</strong>
            </span>
          </span>
        </div>
      </section>
      {saved && saved.phase !== "finished" && (
        <div className="resume-banner">
          <span className="resume-icon">
            <Play size={20} />
          </span>
          <div>
            <strong>
              {t("La tua sfida ti aspetta.", "Your challenge is waiting.")}
            </strong>
            <p>
              {GAME_NAMES[saved.config.game]} ·{" "}
              {t(
                "Partita salvata su questo dispositivo",
                "Saved on this device",
              )}
            </p>
          </div>
          <button className="button small" onClick={onResume}>
            {t("Riprendi", "Resume")}
            <ChevronRight size={18} />
          </button>
        </div>
      )}
      <section className="games-section" id="games">
        <div className="section-heading">
          <div>
            <h2>
              {t(
                "Cinque sfide. Un vero PokéGenius.",
                "Five challenges. One PokéGenius.",
              )}
            </h2>
            <p>
              {t(
                "Scegli una sfida. Il divertimento lo mettiamo noi.",
                "Pick a challenge. Bring your Pokémon knowledge.",
              )}
            </p>
          </div>
          <button className="text-button" onClick={onRules}>
            <BookOpen size={17} />
            {t("Come si gioca", "How to play")}
          </button>
        </div>
        <div className="game-cards">
          <article className="game-card shadow-card">
            <div className="card-visual shadow-visual" aria-hidden="true">
              <div className="burst-circle" />
              <span className="question-mark">?</span>
              <img className="card-gengar" src="/art/94.png" alt="" />
              <span className="visual-sticker">
                <ScanLine size={15} />
                {t("Riconosci la sagoma", "Name the silhouette")}
              </span>
              <span className="spark">✦</span>
            </div>
            <div className="card-content">
              <div className="card-title-row">
                <h3>Who's that Pokémon?</h3>
                <span className="card-icon">
                  <ScanLine size={22} />
                </span>
              </div>
              <p>
                {t(
                  "Solo un’ombra, mille ricordi. Riesci a dare un nome a quel Pokémon?",
                  "Just a shadow, a thousand memories. Can you put a name to that Pokémon?",
                )}
              </p>
              <div className="card-bottom">
                <span>
                  <UsersRound size={16} />
                  1-2 {t("giocatori", "players")}
                </span>
                <button
                  className="button card-button"
                  onClick={() => onSetup("shadow")}
                >
                  {t("Gioca", "Play")}
                  <ArrowRight size={19} />
                </button>
              </div>
            </div>
          </article>
          <article className="game-card doku-card">
            <div className="card-visual doku-visual" aria-hidden="true">
              <div className="mini-doku">
                <span />
                <span className="mini-type mini-fire">
                  {t("Fuoco", "Fire")}
                </span>
                <span className="mini-type mini-water">
                  {t("Acqua", "Water")}
                </span>
                <span className="mini-type mini-grass">
                  {t("Erba", "Grass")}
                </span>
                {[
                  [4, 7, 1],
                  [155, 158, 152],
                  [255, 258, 252],
                ].map((ids, i) => (
                  <div className="mini-row" key={i}>
                    <span className="mini-region">
                      {["Kanto", "Johto", "Hoenn"][i]}
                    </span>
                    {ids.map((id, j) => (
                      <span
                        className={`mini-cell ${i === 1 && j === 1 ? "mini-chosen" : ""}`}
                        key={id}
                      >
                        {i === 1 && j === 1 ? (
                          <span className="mini-plus">+</span>
                        ) : (
                          <Sprite id={id} />
                        )}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              <span className="visual-sticker">
                <Grid2X2 size={15} />
                {t("Incrocia le tue conoscenze", "Connect your knowledge")}
              </span>
            </div>
            <div className="card-content">
              <div className="card-title-row">
                <h3>Pokédoku</h3>
                <span className="card-icon">
                  <Grid2X2 size={22} />
                </span>
              </div>
              <p>
                {t(
                  "Due categorie, un Pokémon. Completa la griglia o sfida un amico a tris.",
                  "Two categories, one Pokémon. Fill the grid or challenge a friend to tic-tac-toe.",
                )}
              </p>
              <div className="card-bottom">
                <span>
                  <UsersRound size={16} />
                  1-2 {t("giocatori", "players")}
                </span>
                <button
                  className="button card-button"
                  onClick={() => onSetup("doku")}
                >
                  {t("Gioca", "Play")}
                  <ArrowRight size={19} />
                </button>
              </div>
            </div>
          </article>
          {(
            [
              {
                game: "pokedle",
                image: 201,
                caption: t("Ogni lettera conta", "Every letter counts"),
                description: t(
                  "Sei tentativi, un nome da scoprire. Lasciati guidare dagli indizi, lettera dopo lettera.",
                  "Six guesses, one name to discover. Follow the clues, one letter at a time.",
                ),
                players: "1",
              },
              {
                game: "dex",
                image: 479,
                caption: t("Il numero è l’indizio", "The number is your clue"),
                description: t(
                  "Un numero del Pokédex. Quanto riesci ad avvicinarti? Una sfida in segreto, fino a quattro giocatori.",
                  "One Pokédex number. How close can you get? A secret guessing game for up to four players.",
                ),
                players: "1-4",
              },
              {
                game: "stat",
                image: 143,
                caption: t("Più alto o più basso?", "Higher or lower?"),
                description: t(
                  "Peso, velocità, attacco e molto altro. Confronta due Pokémon e dimostra quanto ne sai.",
                  "Weight, Speed, Attack and more. Compare two Pokémon and show what you know.",
                ),
                players: "1-2",
              },
            ] as const
          ).map((card) => (
            <article
              className={`game-card extra-card ${card.game}-card`}
              key={card.game}
            >
              <div
                className={`card-visual ${card.game}-visual`}
                aria-hidden="true"
              >
                {card.game === "pokedle" ? (
                  <div className="word-preview">
                    {"POKÉ".split("").map((letter, i) => (
                      <span
                        className={
                          i === 1
                            ? "letter-present"
                            : i === 3
                              ? "letter-absent"
                              : "letter-correct"
                        }
                        key={i}
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                ) : card.game === "dex" ? (
                  <span className="dex-preview-number">#479</span>
                ) : (
                  <div className="stat-preview-bars">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                )}
                <img src={`/art/${card.image}.png`} alt="" />
                <span className="visual-sticker">{card.caption}</span>
              </div>
              <div className="card-content">
                <div className="card-title-row">
                  <h3>{GAME_NAMES[card.game]}</h3>
                  <span className="card-icon">
                    {card.game === "pokedle"
                      ? "Aa"
                      : card.game === "dex"
                        ? "#"
                        : "↕"}
                  </span>
                </div>
                <p>{card.description}</p>
                <div className="card-bottom">
                  <span>
                    <UsersRound size={16} />
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
                    <ArrowRight size={19} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="club-strip">
        <div className="club-illustration" aria-hidden="true">
          <img src="/art/133.png" alt="" />
        </div>
        <div>
          <h2>
            {t(
              "Niente installazioni. Solo un altro round.",
              "No downloads. Just one more round.",
            )}
          </h2>
          <p>
            {t(
              "Tutti i Pokémon, da Kanto a Paldea. Gratis, senza account, con i tuoi progressi salvati qui.",
              "Every Pokémon from Kanto to Paldea. Free, no sign-up, with your progress saved right here.",
            )}
          </p>
        </div>
        <Sparkles size={28} className="club-spark" />
      </section>
      {recent.length > 0 && (
        <section className="personal-stats">
          <h2>
            <Trophy size={20} />
            {t("I tuoi ultimi risultati", "Your latest results")}
          </h2>
          <div>
            {recent.slice(0, 3).map((entry) => (
              <div className="history-entry" key={entry.id}>
                <span>
                  {entry.game === "shadow" ? (
                    <ScanLine size={18} />
                  ) : (
                    <Grid2X2 size={18} />
                  )}
                  {GAME_NAMES[entry.game]}
                </span>
                <strong>
                  {entry.game === "pokedle"
                    ? entry.score
                      ? t("Risolto!", "Solved!")
                      : t("Da riprovare", "Try again")
                    : `${entry.score} / ${entry.total} pt`}
                </strong>
                <small>
                  <Clock3 size={13} />
                  {new Date(entry.date).toLocaleDateString(t("it-IT", "en-GB"))}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
