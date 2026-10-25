import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  Delete,
  EyeOff,
  Hash,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GAME_NAMES, GAME_SYMBOLS, maxScore, playerName } from "./catalog";
import { PokemonSearch, Sprite } from "./components";
import { useText } from "./context";
import { byId, normalize, poolFor } from "./game";
import {
  extraWinners,
  rateWord,
  statValue,
  wordFor,
  type ExtraAction,
  type ExtraMatch,
  type StatKey,
  type TileStatus,
} from "./extraGames";
const STAT_LABELS: Record<StatKey, [string, string]> = {
  weight: ["Peso", "Weight"],
  height: ["Altezza", "Height"],
  hp: ["Punti salute", "HP"],
  attack: ["Attacco", "Attack"],
  defense: ["Difesa", "Defense"],
  "special-attack": ["Attacco speciale", "Special Attack"],
  "special-defense": ["Difesa speciale", "Special Defense"],
  speed: ["Velocità", "Speed"],
  total: ["Statistiche totali", "Base stat total"],
};
export function ExtraGameView({
  match: m,
  dispatch,
  onHome,
  onRules,
  onReplay,
}: {
  match: ExtraMatch;
  dispatch: (action: ExtraAction) => void;
  onHome: () => void;
  onRules: () => void;
  onReplay: () => void;
}) {
  const t = useText();
  const focusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (["handoff", "roundEnd", "finished"].includes(m.phase))
      focusRef.current?.focus();
  }, [m.phase]);
  if (m.phase === "finished")
    return <ExtraResults match={m} onHome={onHome} onReplay={onReplay} />;
  const name = playerName(m.config, m.playerIndex, t);
  const isDex = m.config.game === "dex";
  return (
    <div className="play-page extra-play-page">
      <div className="play-heading">
        <button className="text-button back-link" onClick={onHome}>
          <ArrowLeft size={18} />
          {t("Sala giochi", "Game room")}
        </button>
        <button className="text-button" onClick={onRules}>
          <BookOpen size={17} />
          {t("Regole", "Rules")}
        </button>
      </div>
      <div className="game-title-line">
        <span className={`tiny-game-icon ${m.config.game}`}>
          {GAME_SYMBOLS[m.config.game]}
        </span>
        <div>
          <h1>{GAME_NAMES[m.config.game]}</h1>
          <p>
            {m.config.game === "pokedle"
              ? t(
                  "Il nome giusto, lettera dopo lettera.",
                  "The right name, one letter at a time.",
                )
              : isDex
                ? t(
                    "Un numero. Il tuo istinto da allenatore.",
                    "One number. Your trainer instinct.",
                  )
                : t(
                    "Conosci davvero i tuoi Pokémon?",
                    "How well do you know your Pokémon?",
                  )}
          </p>
        </div>
        <span className="round-pill">
          {m.config.game === "pokedle" ? (
            <>
              {t("Tentativi", "Guesses")}{" "}
              <strong>{m.wordGuesses.length} / 6</strong>
            </>
          ) : (
            <>
              Round{" "}
              <strong>
                {m.round} / {m.config.rounds}
              </strong>
            </>
          )}
        </span>
      </div>
      <div className="match-progress" aria-hidden="true">
        {Array.from(
          { length: m.config.game === "pokedle" ? 6 : m.config.rounds },
          (_, i) => (
            <span
              key={i}
              className={
                i <
                (m.config.game === "pokedle"
                  ? m.wordGuesses.length
                  : m.round - 1)
                  ? "complete"
                  : i ===
                      (m.config.game === "pokedle"
                        ? m.wordGuesses.length
                        : m.round - 1)
                    ? "current"
                    : ""
              }
            />
          ),
        )}
      </div>
      {m.config.game === "pokedle" ? (
        <WordGame match={m} dispatch={dispatch} />
      ) : m.phase === "handoff" ? (
        <div className="handoff-stage" ref={focusRef} tabIndex={-1}>
          <span className="handoff-icon">
            <EyeOff size={35} />
          </span>
          <p className="eyebrow">
            {t("Passatevi il dispositivo", "Pass the device")}
          </p>
          <h2>
            {t("Tocca a te,", "Your turn,")} {name}.
          </h2>
          <p>
            {isDex
              ? t(
                  "Gli altri non devono vedere la tua risposta. Sveleremo tutto quando avranno giocato tutti.",
                  "Keep your answer to yourself. Everything is revealed after every player has guessed.",
                )
              : t(
                  "Rispondi alle 10 domande senza mostrare lo schermo. Gli altri riceveranno gli stessi confronti.",
                  "Answer 10 questions without showing your screen. The other player gets the same comparisons.",
                )}
          </p>
          <button
            className="button primary"
            onClick={() => dispatch({ type: "ready" })}
          >
            {t("Sono pronto", "I'm ready")}
            <ArrowRight size={19} />
          </button>
        </div>
      ) : m.phase === "roundEnd" ? (
        <div className="extra-round-result" ref={focusRef} tabIndex={-1}>
          <div className="round-result-title">
            <Trophy size={26} />
            <div>
              <h2>{t("Round completato!", "Round complete!")}</h2>
              <p>{t("Ecco com’è andata.", "Here's how you did.")}</p>
            </div>
          </div>
          {isDex && (
            <div className="dex-reveal">
              <Sprite id={m.targets[m.round - 1]} />
              <div>
                <small>
                  {t("Il Pokémon cercato era", "The mystery Pokémon was")}
                </small>
                <h3>
                  #{String(m.targets[m.round - 1]).padStart(3, "0")}{" "}
                  {byId.get(m.targets[m.round - 1])?.name}
                </h3>
              </div>
            </div>
          )}
          <div className="round-score-list">
            {m.roundScores.map((score, i) => (
              <div key={i}>
                <span>{playerName(m.config, i, t)}</span>
                {isDex && (
                  <span className="dex-guess-result">
                    <Sprite id={m.guesses[i]} />
                    <span>
                      {byId.get(m.guesses[i])?.name}
                      <small>
                        #{m.guesses[i]} · {t("distanza", "distance")}{" "}
                        {Math.abs(m.guesses[i] - m.targets[m.round - 1])}
                      </small>
                    </span>
                  </span>
                )}
                <strong>+{score} pt</strong>
              </div>
            ))}
          </div>
          {m.config.players > 1 && (
            <p className="round-winner-text">
              {m.results.at(-1)!.winners.length === 1
                ? `${playerName(m.config, m.results.at(-1)!.winners[0], t)} ${t("vince il round!", "wins the round!")}`
                : t(
                    "Round in parità. Stessa bravura!",
                    "A drawn round. Worthy rivals!",
                  )}
            </p>
          )}
          <button
            className="button primary"
            onClick={() => dispatch({ type: "advance" })}
          >
            {m.round >= m.config.rounds
              ? t("Risultati finali", "Final results")
              : t("Prossimo round", "Next round")}
            <ArrowRight size={19} />
          </button>
        </div>
      ) : isDex ? (
        <div className="game-layout dex-layout">
          <div className="dex-number-stage">
            <span className="dex-stage-label">
              <Hash size={18} />
              {t("Pokédex Nazionale", "National Pokédex")}
            </span>
            <strong>#{String(m.targets[m.round - 1]).padStart(3, "0")}</strong>
            <span className="dex-mystery-ball">
              <span>?</span>
            </span>
            <p>
              {t(
                "Quale Pokémon ha questo numero?",
                "Which Pokémon has this number?",
              )}
            </p>
          </div>
          <aside className="game-controls">
            <div className="turn-banner">
              <strong>{name}</strong>
              <span className="turn-count">
                {m.playerIndex + 1} / {m.config.players}
              </span>
            </div>
            <div className="answer-panel">
              <h2>
                {t("Fidati del tuo Pokédex.", "Trust your inner Pokédex.")}
              </h2>
              <p>
                {t(
                  "Cerca un nome e conferma. Se non è quello esatto, avvicinati il più possibile.",
                  "Choose a name and confirm. If you cannot get it exactly, get as close as possible.",
                )}
              </p>
              <PokemonSearch
                key={`${m.id}-${m.round}-${m.playerIndex}`}
                pool={poolFor(m.config)}
                label={t("La tua risposta segreta", "Your secret answer")}
                onGuess={(pokemon) => dispatch({ type: "dexGuess", pokemon })}
              />
            </div>
            <div className="game-tip">
              <Hash size={20} />
              <p>
                {m.config.players === 1
                  ? t(
                      "Esatto: 150 pt. Entro 10: 100 pt. Entro 25: 70 pt. Entro 50: 35 pt.",
                      "Exact: 150 pts. Within 10: 100 pts. Within 25: 70 pts. Within 50: 35 pts.",
                    )
                  : t(
                      "150 punti se indovini. Altrimenti: 100, 70, 50 e 20 punti in ordine di vicinanza. Pari distanza, pari punti.",
                      "150 points for an exact guess. Otherwise: 100, 70, 50 and 20 by closeness. Equal distances earn equal points.",
                    )}
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <StatGame match={m} dispatch={dispatch} />
      )}
    </div>
  );
}
function StatGame({
  match: m,
  dispatch,
}: {
  match: ExtraMatch;
  dispatch: (action: ExtraAction) => void;
}) {
  const t = useText();
  const q = m.questions[(m.round - 1) * 10 + m.questionIndex];
  const a = byId.get(q.a)!;
  const b = byId.get(q.b)!;
  const label = t(...STAT_LABELS[q.stat]);
  const value = (id: number) =>
    `${statValue(byId.get(id)!, q.stat)}${q.stat === "weight" ? " kg" : q.stat === "height" ? " m" : ""}`;
  const feedback = m.phase === "feedback";
  return (
    <div className="stat-game">
      <div className="stat-hud">
        <span>{playerName(m.config, m.playerIndex, t)}</span>
        <span>
          {t("Domanda", "Question")} <strong>{m.questionIndex + 1} / 10</strong>
        </span>
        <span>
          {t("Punti nel turno", "Turn score")}{" "}
          <strong>{m.roundScores[m.playerIndex]} / 100</strong>
        </span>
      </div>
      <div className="stat-question">
        <span className="stat-category">{label}</span>
        <h2>
          {t(
            "Il secondo Pokémon ha un valore...",
            "Does the second Pokémon have a value...",
          )}
        </h2>
      </div>
      <div className="stat-comparison">
        {[a, b].map((p, i) => (
          <div key={p.id} className={`comparison-card comparison-${i}`}>
            <span className="comparison-caption">
              {i === 0
                ? t("Il riferimento", "The reference")
                : t("La tua sfida", "Your challenge")}
            </span>
            <Sprite id={p.id} name={p.name} />
            <h3>{p.name}</h3>
            <span className="comparison-category">{label}</span>
            <strong className="comparison-value">
              {i === 0 || feedback ? value(p.id) : "?"}
            </strong>
          </div>
        ))}
        <span className="comparison-vs">vs</span>
      </div>
      {feedback ? (
        <div
          className={`stat-feedback ${m.feedback?.kind === "correct" ? "stat-correct" : "stat-wrong"}`}
          role="status"
        >
          <p>
            {m.feedback?.kind === "correct"
              ? t("Esatto! +10 punti.", "Correct! +10 points.")
              : t(
                  "Questa volta no. Si impara anche così!",
                  "Not this time. One more fact for your Pokédex!",
                )}
            {statValue(a, q.stat) === statValue(b, q.stat) && (
              <span>
                {t(
                  " I valori sono uguali: entrambe le risposte erano valide.",
                  " Equal values: either answer was accepted.",
                )}
              </span>
            )}
          </p>
          <button
            autoFocus
            className="button primary"
            onClick={() => dispatch({ type: "advance" })}
          >
            {m.questionIndex === 9
              ? t("Completa il turno", "Finish turn")
              : t("Prossima domanda", "Next question")}
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <div className="stat-choices">
          <button
            className="button choice-higher"
            onClick={() => dispatch({ type: "statChoice", choice: "higher" })}
          >
            <ArrowUp size={23} />
            {t("Più alto", "Higher")}
          </button>
          <button
            className="button choice-lower"
            onClick={() => dispatch({ type: "statChoice", choice: "lower" })}
          >
            <ArrowDown size={23} />
            {t("Più basso", "Lower")}
          </button>
        </div>
      )}
      <p className="stat-equality-note">
        {t(
          "Se i valori sono uguali, entrambe le risposte sono corrette. Ogni risposta esatta vale 10 punti.",
          "If values are equal, either answer is correct. Each correct answer earns 10 points.",
        )}
      </p>
    </div>
  );
}
function WordGame({
  match: m,
  dispatch,
}: {
  match: ExtraMatch;
  dispatch: (action: ExtraAction) => void;
}) {
  const t = useText();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const target = wordFor(byId.get(m.targets[0])!);
  const statuses = new Map<string, TileStatus>();
  const priority: Record<TileStatus, number> = {
    absent: 0,
    present: 1,
    correct: 2,
  };
  m.wordGuesses.forEach((g) =>
    rateWord(g, target).forEach((status, index) => {
      const old = statuses.get(g[index]);
      if (!old || priority[status] > priority[old])
        statuses.set(g[index], status);
    }),
  );
  const submit = () => {
    const word = normalize(input);
    if (word.length !== target.length) {
      setError(
        t(
          `Servono ${target.length} caratteri.`,
          `Enter ${target.length} characters.`,
        ),
      );
      return;
    }
    if (m.wordGuesses.includes(word)) {
      setError(
        t("Hai già provato questo nome.", "You already tried that name."),
      );
      return;
    }
    setError("");
    setInput("");
    dispatch({ type: "wordGuess", word });
    ref.current?.focus();
  };
  return (
    <div className="word-game">
      <div className="word-intro">
        <h2>{t("Un nome. Sei possibilità.", "One name. Six chances.")}</h2>
        <p>
          {target.length}{" "}
          {t(
            "caratteri. Spazi, accenti e punteggiatura non contano.",
            "characters. Spaces, accents and punctuation are removed.",
          )}
        </p>
      </div>
      <WordBoard match={m} input={input} />
      <form
        className="word-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="word-input">
          {t("Il nome che hai in mente", "The name you have in mind")}
        </label>
        <div>
          <input
            ref={ref}
            id="word-input"
            value={input}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="characters"
            onChange={(e) => {
              setInput(normalize(e.target.value).slice(0, target.length));
              setError("");
            }}
          />
          <button className="button primary" type="submit" disabled={!input}>
            {t("Prova", "Guess")}
            <ArrowRight size={18} />
          </button>
        </div>
        <p className="word-message" role="status">
          {error ||
            (m.wordGuesses.length
              ? t(
                  "Ogni indizio ti avvicina alla risposta.",
                  "Each clue brings you closer.",
                )
              : t(
                  "Puoi provare qualsiasi sequenza della lunghezza giusta.",
                  "Any sequence of the right length is accepted.",
                ))}
        </p>
      </form>
      <div
        className="word-keyboard"
        aria-label={t("Tastiera del gioco", "Game keyboard")}
      >
        {["qwertyuiop", "asdfghjkl", "zxcvbnm2"].map((row, i) => (
          <div key={row}>
            {i === 2 && (
              <button
                className="key-wide"
                aria-label={t("Invia tentativo", "Submit guess")}
                onClick={submit}
              >
                <Check size={19} />
              </button>
            )}
            {row.split("").map((char) => (
              <button
                key={char}
                className={
                  statuses.has(char) ? `key-${statuses.get(char)}` : ""
                }
                aria-label={`${char.toUpperCase()}${statuses.has(char) ? `: ${tileLabel(statuses.get(char)!, t)}` : ""}`}
                onClick={() => {
                  setInput((v) => (v + char).slice(0, target.length));
                  setError("");
                }}
              >
                {char}
              </button>
            ))}
            {i === 2 && (
              <button
                className="key-wide"
                aria-label={t("Cancella carattere", "Delete character")}
                onClick={() => setInput((v) => v.slice(0, -1))}
              >
                <Delete size={20} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="word-legend">
        <span>
          <i className="letter-correct">✓</i>
          {t("Posto giusto", "Right place")}
        </span>
        <span>
          <i className="letter-present">•</i>
          {t("Altro posto", "Other place")}
        </span>
        <span>
          <i className="letter-absent">×</i>
          {t("Assente", "Absent")}
        </span>
      </div>
    </div>
  );
}
function tileLabel(status: TileStatus, t: (it: string, en: string) => string) {
  return status === "correct"
    ? t("posizione corretta", "correct position")
    : status === "present"
      ? t("presente in altra posizione", "present elsewhere")
      : t("assente", "absent");
}
function WordBoard({
  match: m,
  input = "",
}: {
  match: ExtraMatch;
  input?: string;
}) {
  const t = useText();
  const target = wordFor(byId.get(m.targets[0])!);
  return (
    <div
      className="word-board"
      role="group"
      aria-label={t("Tentativi Pokédle", "Pokédle guesses")}
      style={{ "--word-length": target.length } as React.CSSProperties}
    >
      {Array.from({ length: 6 }, (_, row) => {
        const guess = m.wordGuesses[row];
        const statuses = guess ? rateWord(guess, target) : null;
        return (
          <div
            role="group"
            className={`word-row ${row === m.wordGuesses.length && m.phase === "playing" ? "word-current" : ""}`}
            key={row}
            aria-label={`${t("Tentativo", "Guess")} ${row + 1}`}
          >
            {Array.from({ length: target.length }, (_, col) => {
              const char =
                guess?.[col] ??
                (row === m.wordGuesses.length ? input[col] : "") ??
                "";
              const status = statuses?.[col];
              return (
                <span
                  role="img"
                  className={`word-tile ${status ? `letter-${status}` : char ? "tile-filled" : ""}`}
                  key={col}
                  aria-label={
                    char
                      ? `${char.toUpperCase()}${status ? `: ${tileLabel(status, t)}` : ""}`
                      : t("Casella vuota", "Empty tile")
                  }
                >
                  {char}
                  <small aria-hidden="true">
                    {status === "correct"
                      ? "✓"
                      : status === "present"
                        ? "•"
                        : status === "absent"
                          ? "×"
                          : ""}
                  </small>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
function ExtraResults({
  match: m,
  onHome,
  onReplay,
}: {
  match: ExtraMatch;
  onHome: () => void;
  onReplay: () => void;
}) {
  const t = useText();
  const solo = m.config.players === 1;
  const winners = extraWinners(m);
  const word = m.config.game === "pokedle";
  const wonWord = m.scores[0] > 0;
  const ranked = m.scores
    .map((score, index) => ({ score, index }))
    .sort((a, b) =>
      m.config.game === "stat" && !solo
        ? m.results.filter(
            (r) => r.winners.length === 1 && r.winners[0] === b.index,
          ).length -
          m.results.filter(
            (r) => r.winners.length === 1 && r.winners[0] === a.index,
          ).length
        : b.score - a.score,
    );
  return (
    <section
      className={`results-page extra-results ${word ? "word-results" : ""}`}
    >
      <div className="results-medal">
        <Trophy size={48} />
        <span>✦</span>
      </div>
      <p className="results-game">{GAME_NAMES[m.config.game]}</p>
      <h1>
        {word
          ? wonWord
            ? t(
                "Nome trovato. Genio confermato!",
                "Name found. Genius confirmed!",
              )
            : t("Il prossimo lo riconosci.", "You'll get the next one.")
          : solo
            ? t("Ben giocato, allenatore!", "Well played, trainer!")
            : winners.length === 1
              ? `${playerName(m.config, winners[0], t)} ${t("vince la partita!", "wins the match!")}`
              : t("Una sfida alla pari!", "An evenly matched showdown!")}
      </h1>
      {word ? (
        <>
          <div className="word-reveal">
            <Sprite id={m.targets[0]} name={byId.get(m.targets[0])!.name} />
            <div>
              <h2>{byId.get(m.targets[0])!.name}</h2>
              <p>
                {wonWord
                  ? `${t("Trovato in", "Solved in")} ${m.wordGuesses.length} / 6 ${t("tentativi", "guesses")}`
                  : t(
                      "Sei tentativi finiti. Pronto per un altro nome?",
                      "Six guesses used. Ready for another name?",
                    )}
              </p>
            </div>
          </div>
          <WordBoard match={m} />
        </>
      ) : solo ? (
        <div className="solo-final-score">
          <strong>{m.scores[0]}</strong>
          <span>
            / {maxScore(m.config)} {t("punti", "points")}
          </span>
        </div>
      ) : (
        <div className="extra-leaderboard">
          {ranked.map(({ index, score }) => (
            <div
              className={winners.includes(index) ? "leaderboard-winner" : ""}
              key={index}
            >
              <span>
                {winners.includes(index) && <Trophy size={18} />}
                {playerName(m.config, index, t)}
              </span>
              <strong>{score} pt</strong>
              {m.config.game === "stat" && (
                <small>
                  {
                    m.results.filter(
                      (r) => r.winners.length === 1 && r.winners[0] === index,
                    ).length
                  }{" "}
                  {t("round vinti", "rounds won")}
                </small>
              )}
              {m.config.game === "dex" &&
                (() => {
                  const best = m.results.reduce((a, b) =>
                    a.scores[index] >= b.scores[index] ? a : b,
                  );
                  return (
                    <small>
                      {t("Miglior scelta:", "Best guess:")}{" "}
                      {byId.get(best.guesses[index])?.name} (+
                      {best.scores[index]} pt)
                    </small>
                  );
                })()}
            </div>
          ))}
        </div>
      )}
      {solo && !word && m.results.length > 0 && (
        <div className="best-performance">
          <Trophy size={20} />
          <div>
            <span>
              {t("La tua miglior prestazione", "Your best performance")}
            </span>
            {(() => {
              const best = m.results.reduce((a, b) =>
                a.scores[0] >= b.scores[0] ? a : b,
              );
              return (
                <strong>
                  {m.config.game === "dex"
                    ? byId.get(best.guesses[0])?.name
                    : `Round ${m.results.indexOf(best) + 1}`}{" "}
                  (+{best.scores[0]} pt)
                </strong>
              );
            })()}
          </div>
        </div>
      )}
      <div className="results-actions">
        <button className="button primary" onClick={onReplay}>
          <RotateCcw size={19} />
          {t("Giochiamo ancora", "Play again")}
        </button>
        <button className="button secondary" onClick={onHome}>
          <ArrowLeft size={18} />
          {t("Sala giochi", "Game room")}
        </button>
      </div>
      {m.results.length > 0 && (
        <div className="round-recap">
          <h2>
            {t("La partita, round per round", "Your match, round by round")}
          </h2>
          {m.results.map((round, i) => (
            <div key={i}>
              <span>Round {i + 1}</span>
              <strong>
                {solo
                  ? `${round.scores[0]} pt`
                  : round.winners.length === 1
                    ? playerName(m.config, round.winners[0], t)
                    : t("Pareggio", "Draw")}
              </strong>
              <small>
                {!solo && round.scores.join(" / ")}
                {solo && m.config.game === "stat" && "/ 100"}
              </small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
