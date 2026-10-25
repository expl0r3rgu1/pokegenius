import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Eye,
  Flag,
  Grid2X2,
  RotateCcw,
  ScanLine,
  SkipForward,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  categoryName,
  Pokeball,
  PokemonSearch,
  Sprite,
  TypeBadge,
} from "./components";
import { useText } from "./context";
import {
  answersFor,
  byId,
  lineWinner,
  matchWinner,
  poolFor,
  type Action,
  type Match,
} from "./game";

export function GameView({
  match: m,
  dispatch,
  onHome,
  onRules,
  onReplay,
}: {
  match: Match;
  dispatch: (action: Action) => void;
  onHome: () => void;
  onRules: () => void;
  onReplay: () => void;
}) {
  const t = useText();
  const [selected, setSelected] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [showSolutions, setShowSolutions] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const [failed, setFailed] = useState(0);
  const [retry, setRetry] = useState(0);
  const [coin, setCoin] = useState<"ready" | "flipping" | "done">("ready");
  const pool = poolFor(m.config);
  const shadow = m.config.game === "shadow";
  const solo = m.config.players === 1;
  const currentPokemon = byId.get(m.queue[m.index]);
  const revealed = m.phase === "feedback" && m.feedback?.kind !== "steal";
  const roundDone = m.phase === "roundEnd";
  const progress = shadow && solo ? m.index + 1 : m.round;
  const seconds = Math.max(0, Math.ceil(((m.deadline ?? now) - now) / 1000));
  const next = () => dispatch({ type: "next", now: Date.now() });
  useEffect(() => {
    setSelected(null);
    setShowSolutions(false);
  }, [m.round, m.phase]);
  useEffect(() => {
    if (m.phase !== "playing" || !m.deadline) return;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time >= m.deadline!) dispatch({ type: "timeout", now: time });
    };
    tick();
    const id = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [m.phase, m.deadline, dispatch]);
  useEffect(() => {
    if (coin !== "flipping") return;
    const id = window.setTimeout(() => setCoin("done"), 1100);
    return () => window.clearTimeout(id);
  }, [coin]);
  useEffect(() => {
    if (
      m.phase === "feedback" ||
      m.phase === "roundEnd" ||
      m.phase === "finished"
    )
      document.getElementById("game-feedback")?.focus();
  }, [m.phase]);
  if (m.phase === "finished")
    return <Results match={m} onHome={onHome} onReplay={onReplay} />;
  return (
    <div className="play-page">
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
          {shadow ? <ScanLine size={25} /> : <Grid2X2 size={25} />}
        </span>
        <div>
          <h1>{shadow ? "Who's that Pokémon?" : "Pokédoku"}</h1>
          <p>
            {solo
              ? t(
                  "Un po’ di intuito. Molta passione.",
                  "A little intuition. A lot of Pokémon love.",
                )
              : t(
                  "Una sfida tra allenatori, sullo stesso dispositivo.",
                  "A trainer showdown, on the same device.",
                )}
          </p>
        </div>
        <span className="round-pill">
          {shadow && solo ? t("Sagoma", "Silhouette") : "Round"}{" "}
          <strong>
            {Math.min(progress, m.config.rounds)} / {m.config.rounds}
          </strong>
        </span>
      </div>
      <div className="match-progress" aria-hidden="true">
        {Array.from({ length: m.config.rounds }, (_, i) => (
          <span
            key={i}
            className={
              i < progress - 1
                ? "complete"
                : i === progress - 1
                  ? "current"
                  : ""
            }
          />
        ))}
      </div>
      {m.phase === "coin" ? (
        <div className="coin-stage">
          <span className="eyebrow">
            {t(
              "Il destino sceglie il primo turno",
              "Let fate pick the first turn",
            )}
          </span>
          <h2>
            {coin === "done"
              ? `${t("Inizia il giocatore", "Player")} ${m.starter}${t("!", " starts!")}`
              : t("Testa o croce?", "Heads or tails?")}
          </h2>
          <div
            className={`toss-coin ${coin === "flipping" ? "flipping" : ""} ${coin === "done" && m.starter === 2 ? "coin-blue" : ""}`}
          >
            <Pokeball />
          </div>
          <p role="status">
            {coin === "done"
              ? m.starter === 1
                ? t(
                    "Testa! Il campo è tuo, giocatore 1.",
                    "Heads! The field is yours, player 1.",
                  )
                : t(
                    "Croce! Il campo è tuo, giocatore 2.",
                    "Tails! The field is yours, player 2.",
                  )
              : t(
                  "Testa: giocatore 1. Croce: giocatore 2.",
                  "Heads: player 1. Tails: player 2.",
                )}
          </p>
          <button
            className="button primary"
            disabled={coin === "flipping"}
            onClick={() =>
              coin === "done"
                ? dispatch({ type: "begin", now: Date.now() })
                : setCoin("flipping")
            }
          >
            {coin === "done"
              ? t("Inizia il round", "Start round")
              : coin === "flipping"
                ? t("La moneta gira...", "Flipping...")
                : t("Lancia la moneta", "Flip the coin")}
            <ArrowRight size={19} />
          </button>
        </div>
      ) : (
        <>
          <div className="scoreboard">
            {solo ? (
              <>
                <div>
                  <span>{t("Punteggio", "Score")}</span>
                  <strong>
                    {m.scores[0]}
                    <small> pt</small>
                  </strong>
                </div>
                <div>
                  <span>
                    {shadow
                      ? t("Risposte corrette", "Correct answers")
                      : t("Caselle corrette", "Correct cells")}
                  </span>
                  <strong>
                    {shadow ? m.scores[0] / 100 : m.scores[0] / 10}
                    <small>
                      {" "}
                      / {shadow ? m.config.rounds : m.config.rounds * 9}
                    </small>
                  </strong>
                </div>
              </>
            ) : (
              <>
                <div
                  className={`player-score player-one ${m.player === 1 && !roundDone ? "active-player" : ""}`}
                >
                  <span>
                    <i />
                    {t("Giocatore 1", "Player 1")}
                  </span>
                  <strong>
                    {shadow ? m.roundScores[0] : m.scores[0]}
                    <small> {shadow ? "pt" : "pt"}</small>
                  </strong>
                  {!shadow && (
                    <small>
                      {m.results.filter((r) => r.winner === 1).length}{" "}
                      {t("round vinti", "rounds won")}
                    </small>
                  )}
                </div>
                <div className="versus">vs</div>
                <div
                  className={`player-score player-two ${m.player === 2 && !roundDone ? "active-player" : ""}`}
                >
                  <span>
                    <i />
                    {t("Giocatore 2", "Player 2")}
                  </span>
                  <strong>
                    {shadow ? m.roundScores[1] : m.scores[1]}
                    <small> pt</small>
                  </strong>
                  {!shadow && (
                    <small>
                      {m.results.filter((r) => r.winner === 2).length}{" "}
                      {t("round vinti", "rounds won")}
                    </small>
                  )}
                </div>
              </>
            )}
          </div>
          <div
            className={`game-layout ${shadow ? "shadow-layout" : "doku-layout"} ${solo ? "" : "multi-game"}`}
          >
            <div className="game-main">
              {shadow ? (
                <div
                  className={`silhouette-stage ${revealed ? "is-revealed" : ""}`}
                >
                  <div className="stage-circles" />
                  <span className="stage-number" aria-hidden="true">
                    ?
                  </span>
                  {currentPokemon && (
                    <img
                      key={`${currentPokemon.id}-${retry}`}
                      className={`mystery-sprite ${revealed ? "revealed" : ""}`}
                      src={`/sprites/${currentPokemon.id}.png`}
                      alt={
                        revealed
                          ? currentPokemon.name
                          : t(
                              "Sagoma del Pokémon da indovinare",
                              "Mystery Pokémon silhouette",
                            )
                      }
                      onLoad={() => {
                        setLoaded(currentPokemon.id);
                        setFailed(0);
                      }}
                      onError={() => setFailed(currentPokemon.id)}
                    />
                  )}
                  {failed === currentPokemon?.id ? (
                    <div className="sprite-error">
                      <p>
                        {t(
                          "La sagoma non si è caricata.",
                          "The silhouette could not load.",
                        )}
                      </p>
                      <button
                        className="button small"
                        onClick={() => {
                          setFailed(0);
                          setRetry((v) => v + 1);
                        }}
                      >
                        {t("Riprova", "Retry")}
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  ) : (
                    loaded !== currentPokemon?.id && (
                      <span className="stage-loading" role="status">
                        {t("Caricamento sagoma...", "Loading silhouette...")}
                      </span>
                    )
                  )}
                  <span className="stage-caption">
                    {revealed
                      ? currentPokemon?.name
                      : t("Ti ricorda qualcuno?", "Ring any bells?")}
                  </span>
                </div>
              ) : (
                <div className="board-wrap">
                  <div className="board-instruction">
                    {roundDone
                      ? t("Il round è concluso", "This round is over")
                      : selected !== null
                        ? `${categoryName(m.board.rows[Math.floor(selected / 3)], t)} + ${categoryName(m.board.cols[selected % 3], t)}`
                        : t(
                            "Tocca una casella per iniziare",
                            "Pick a cell to get started",
                          )}
                    <span>{m.cells.filter(Boolean).length} / 9</span>
                  </div>
                  <div
                    className="doku-board"
                    role="group"
                    aria-label={t("Griglia Pokédoku", "Pokédoku board")}
                  >
                    <div className="board-corner">
                      <Pokeball />
                    </div>
                    {m.board.cols.map((cat, i) => (
                      <div className="board-header" key={i}>
                        <TypeBadge category={cat} />
                      </div>
                    ))}
                    {m.board.rows.map((cat, row) => (
                      <div className="board-row" key={row}>
                        <div className="board-header">
                          <TypeBadge category={cat} />
                        </div>
                        {[0, 1, 2].map((col) => {
                          const index = row * 3 + col;
                          const cell = m.cells[index];
                          const solution =
                            showSolutions && !cell?.correct
                              ? answersFor(m.board, index, pool)[0]
                              : null;
                          const label = `${categoryName(cat, t)} + ${categoryName(m.board.cols[col], t)}${cell ? `: ${cell.pokemon ? byId.get(cell.pokemon)?.name : t("Passata", "Passed")}, ${cell.correct ? t("corretto", "correct") : t("errato", "incorrect")}` : ""}`;
                          return (
                            <button
                              key={index}
                              className={`board-cell ${selected === index && m.phase === "playing" ? "cell-selected" : ""} ${cell ? (cell.correct ? `cell-owned owner-${cell.owner}` : "cell-wrong") : ""} ${solution ? "cell-solution" : ""}`}
                              aria-label={label}
                              aria-pressed={selected === index}
                              disabled={!!cell || m.phase !== "playing"}
                              onClick={() => setSelected(index)}
                            >
                              {cell?.pokemon || solution ? (
                                <>
                                  <Sprite id={solution?.id ?? cell!.pokemon!} />
                                  <span className="cell-name">
                                    {solution?.name ??
                                      byId.get(cell!.pokemon!)?.name}
                                  </span>
                                  {cell && !solution && (
                                    <span className="cell-check">
                                      {cell.correct ? (
                                        <Check size={13} />
                                      ) : (
                                        <X size={13} />
                                      )}
                                    </span>
                                  )}
                                </>
                              ) : cell ? (
                                <X size={24} />
                              ) : (
                                <span className="cell-plus">+</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <p className="board-footnote">
                    {t(
                      "Tipi attuali. Forme base.",
                      "Current types. Default forms.",
                    )}{" "}
                    {t(
                      "Puoi riutilizzare lo stesso Pokémon.",
                      "You can reuse the same Pokémon.",
                    )}
                  </p>
                </div>
              )}
            </div>
            <aside className="game-controls">
              {!solo && m.phase === "playing" && (
                <div className={`turn-banner turn-${m.player}`}>
                  <span className="turn-dot" />
                  <strong>
                    {t("Tocca al giocatore", "Player")} {m.player}
                    {t("", "'s turn")}
                  </strong>
                  {!shadow && (
                    <span
                      className={`timer ${seconds <= 10 ? "timer-urgent" : ""}`}
                      role="timer"
                      aria-label={`${seconds} ${t("secondi rimasti", "seconds left")}`}
                    >
                      <Clock3 size={16} />
                      {seconds}s
                    </span>
                  )}
                </div>
              )}
              {m.phase === "playing" ? (
                <div className="answer-panel">
                  <h2>
                    {shadow
                      ? t("Chi si nasconde qui?", "Who's hiding here?")
                      : selected === null
                        ? t(
                            "Trova l’incrocio giusto.",
                            "Find the perfect match.",
                          )
                        : t("Qual è il tuo Pokémon?", "What's your Pokémon?")}
                  </h2>
                  <p>
                    {shadow
                      ? t(
                          "Un’intuizione può bastare. Scegli il nome e conferma.",
                          "Trust your trainer instinct. Choose a name and confirm.",
                        )
                      : selected === null
                        ? t(
                            "Scegli una casella, poi cerca un Pokémon che rispetti entrambe le categorie.",
                            "Pick a cell, then find a Pokémon matching both categories.",
                          )
                        : t(
                            "Deve rispettare sia la riga sia la colonna.",
                            "It needs to match both its row and column.",
                          )}
                  </p>
                  {(shadow || selected !== null) && (
                    <PokemonSearch
                      key={`${m.id}-${m.index}-${m.player}-${selected}-${m.phase}`}
                      pool={pool}
                      label={t("La tua risposta", "Your answer")}
                      disabled={
                        shadow &&
                        (loaded !== currentPokemon?.id ||
                          failed === currentPokemon?.id)
                      }
                      onGuess={(id) =>
                        dispatch({
                          type: "guess",
                          pokemon: id,
                          cell: selected ?? undefined,
                          now: Date.now(),
                        })
                      }
                      allowPass
                      onPass={() =>
                        dispatch({
                          type: "guess",
                          pokemon: null,
                          cell: selected ?? undefined,
                          now: Date.now(),
                        })
                      }
                    />
                  )}
                  {!shadow && selected === null && !solo && (
                    <button
                      className="text-button"
                      onClick={() =>
                        dispatch({ type: "pass", now: Date.now() })
                      }
                    >
                      <SkipForward size={16} />
                      {t("Passa il turno", "Pass turn")}
                    </button>
                  )}
                </div>
              ) : m.phase === "feedback" && m.feedback ? (
                <div
                  className={`feedback-panel feedback-${m.feedback.kind}`}
                  id="game-feedback"
                  tabIndex={-1}
                >
                  <span className="feedback-icon">
                    {m.feedback.kind === "correct" ? (
                      <Check size={30} />
                    ) : m.feedback.kind === "timeout" ? (
                      <Clock3 size={30} />
                    ) : (
                      <X size={30} />
                    )}
                  </span>
                  <h2>
                    {m.feedback.kind === "correct"
                      ? t("Colpo di genio!", "Genius move!")
                      : m.feedback.kind === "steal"
                        ? t("Occasione di recupero!", "A chance to steal!")
                        : m.feedback.kind === "timeout"
                          ? t("Tempo scaduto!", "Time's up!")
                          : m.feedback.kind === "pass"
                            ? t("Turno passato.", "Turn passed.")
                            : t("Ci sei andato vicino.", "One for next time.")}
                  </h2>
                  <p>
                    {m.feedback.kind === "steal" ? (
                      t(
                        `Il giocatore ${m.player === 1 ? 2 : 1} ha un tentativo con la stessa sagoma.`,
                        `Player ${m.player === 1 ? 2 : 1} gets one attempt at the same silhouette.`,
                      )
                    ) : m.feedback.kind === "timeout" ||
                      m.feedback.kind === "pass" ? (
                      t(
                        "Il turno passa all’altro giocatore.",
                        "The turn passes to the other player.",
                      )
                    ) : shadow ? (
                      <>
                        {t("Era proprio", "It was")}{" "}
                        <strong>{currentPokemon?.name}</strong>.{" "}
                        {m.feedback.kind === "correct" && (
                          <span className="points">+{solo ? 100 : 1} pt</span>
                        )}
                      </>
                    ) : m.feedback.kind === "correct" ? (
                      <>
                        <strong>
                          {m.feedback.pokemon
                            ? byId.get(m.feedback.pokemon)?.name
                            : ""}
                        </strong>{" "}
                        {t("è la risposta giusta.", "is a perfect match.")}{" "}
                        <span className="points">+10 pt</span>
                      </>
                    ) : m.feedback.pokemon ? (
                      t(
                        "Questo Pokémon non rispetta entrambe le categorie.",
                        "This Pokémon doesn't match both categories.",
                      )
                    ) : (
                      t(
                        "Casella passata. Si continua!",
                        "Cell passed. Keep going!",
                      )
                    )}
                  </p>
                  <button
                    autoFocus
                    className="button primary full"
                    onClick={next}
                  >
                    {m.feedback.kind === "steal" ||
                    (!solo &&
                      !shadow &&
                      !m.cells.every(Boolean) &&
                      !lineWinner(m.cells))
                      ? t("Passa il dispositivo", "Pass the device")
                      : t("Continua", "Continue")}
                    <ArrowRight size={19} />
                  </button>
                </div>
              ) : (
                roundDone && (
                  <div
                    className="round-result"
                    id="game-feedback"
                    tabIndex={-1}
                  >
                    <span className="feedback-icon">
                      <Trophy size={30} />
                    </span>
                    <h2>
                      {solo
                        ? t("Griglia completata!", "Board complete!")
                        : m.results.at(-1)?.winner
                          ? t(
                              `Il giocatore ${m.results.at(-1)!.winner} vince il round!`,
                              `Player ${m.results.at(-1)!.winner} wins the round!`,
                            )
                          : t("Round in parità!", "A drawn round!")}
                    </h2>
                    <p>
                      {solo
                        ? `${m.roundScores[0]} / 9 ${t("risposte corrette", "correct answers")}`
                        : shadow
                          ? `${m.roundScores[0]} - ${m.roundScores[1]}`
                          : lineWinner(m.cells)
                            ? t(
                                "Tre in fila. Ben giocato!",
                                "Three in a row. Nicely done!",
                              )
                            : t(
                                "Nessun tris. Un punto di incontro.",
                                "No line this time. Honours even.",
                              )}
                    </p>
                    {!shadow && (
                      <button
                        className="text-button solutions-button"
                        onClick={() => setShowSolutions((v) => !v)}
                      >
                        <Eye size={17} />
                        {showSolutions
                          ? t("Nascondi soluzioni", "Hide answers")
                          : t("Mostra soluzioni", "Show answers")}
                      </button>
                    )}
                    <button className="button primary full" onClick={next}>
                      {m.round >= m.config.rounds
                        ? t("Risultati finali", "Final results")
                        : t("Prossimo round", "Next round")}
                      <ArrowRight size={19} />
                    </button>
                  </div>
                )
              )}
              <div className="game-tip">
                <span>
                  {shadow ? <ScanLine size={20} /> : <Grid2X2 size={20} />}
                </span>
                <p>
                  {shadow
                    ? solo
                      ? t(
                          "Una risposta per sagoma. 100 punti se indovini. Nessuna fretta.",
                          "One answer per silhouette. 100 points for a correct guess. Take your time.",
                        )
                      : t(
                          "Indovina per tenere il turno. Primo a 3 punti o massimo 5 sagome per round.",
                          "Guess right to keep your turn. First to 3 points or up to 5 silhouettes per round.",
                        )
                    : solo
                      ? t(
                          "Un tentativo per casella, 10 punti per risposta corretta. Punta a 90!",
                          "One attempt per cell, 10 points per correct answer. Aim for 90!",
                        )
                      : t(
                          "Conquista tre caselle in fila, in colonna o in diagonale per vincere il round.",
                          "Claim three cells in a row, column, or diagonal to win the round.",
                        )}
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function Results({
  match: m,
  onHome,
  onReplay,
}: {
  match: Match;
  onHome: () => void;
  onReplay: () => void;
}) {
  const t = useText();
  const solo = m.config.players === 1;
  const winner = matchWinner(m);
  const total =
    m.config.game === "shadow" ? m.config.rounds * 100 : m.config.rounds * 90;
  return (
    <section className="results-page">
      <div className="results-medal">
        <Trophy size={48} strokeWidth={1.6} />
        <span>✦</span>
      </div>
      <p className="results-game">
        {m.config.game === "shadow" ? "Who's that Pokémon?" : "Pokédoku"}
      </p>
      <h1>
        {solo
          ? m.scores[0] === total
            ? t("Un vero PokéGenius!", "A true PokéGenius!")
            : t("Ben giocato, allenatore!", "Well played, trainer!")
          : winner
            ? t(`Vince il giocatore ${winner}!`, `Player ${winner} wins!`)
            : t("Due veri rivali. Pareggio!", "Worthy rivals. A draw!")}
      </h1>
      <p className="results-subtitle">
        {solo
          ? t(
              "Ogni partita è una nuova scoperta. Pronto per la prossima?",
              "Every game is a new discovery. Ready for another?",
            )
          : t(
              "La rivincita è sempre una buona idea.",
              "There is always time for a rematch.",
            )}
      </p>
      {solo ? (
        <div className="solo-final-score">
          <strong>{m.scores[0]}</strong>
          <span>
            / {total} {t("punti", "points")}
          </span>
        </div>
      ) : (
        <div className="final-players">
          {([1, 2] as const).map((p) => (
            <div
              key={p}
              className={`final-player ${winner === p ? "winner" : ""}`}
            >
              <span>
                {t("Giocatore", "Player")} {p}
                {winner === p && <Trophy size={17} />}
              </span>
              <strong>
                {m.scores[p - 1]} <small>pt</small>
              </strong>
              <p>
                {m.attempts[p - 1]} {t("tentativi", "attempts")}
              </p>
              {m.config.game === "doku" && (
                <p>
                  {m.results.filter((r) => r.winner === p).length}{" "}
                  {t("round vinti", "rounds won")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="result-details">
        <span>
          {t("Precisione", "Accuracy")}
          <strong>
            {m.attempts[0]
              ? Math.round(
                  (m.scores[0] /
                    (m.config.game === "shadow" ? (solo ? 100 : 1) : 10) /
                    m.attempts[0]) *
                    100,
                )
              : 0}
            %
            {!solo &&
              ` / ${m.attempts[1] ? Math.round((m.scores[1] / (m.config.game === "shadow" ? 1 : 10) / m.attempts[1]) * 100) : 0}%`}
          </strong>
        </span>
        <span>
          {t("Tentativi", "Attempts")}
          <strong>
            {m.attempts[0]}
            {!solo && ` / ${m.attempts[1]}`}
          </strong>
        </span>
      </div>
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
      {solo && m.config.game === "shadow" && m.shadowHistory.length > 0 && (
        <div className="shadow-recap">
          <h2>
            {t("I Pokémon della tua sfida", "The Pokémon in your challenge")}
          </h2>
          <div>
            {m.shadowHistory.map((answer, i) => (
              <div
                key={i}
                className={answer.correct ? "recap-correct" : "recap-missed"}
              >
                <Sprite id={answer.pokemon} />
                <span>{byId.get(answer.pokemon)?.name}</span>
                {answer.correct ? <Check size={17} /> : <X size={17} />}
              </div>
            ))}
          </div>
        </div>
      )}
      {m.results.length > 0 && (
        <div className="round-recap">
          <h2>
            <Flag size={18} />
            {t("La partita, round per round", "Your match, round by round")}
          </h2>
          {m.results.map((r, i) => (
            <div key={i}>
              <span>Round {i + 1}</span>
              <strong>
                {solo
                  ? `${r.scores[0]} / 9`
                  : m.config.game === "shadow"
                    ? `${r.scores[0]} - ${r.scores[1]}`
                    : r.winner
                      ? `${t("Giocatore", "Player")} ${r.winner}`
                      : t("Pareggio", "Draw")}
              </strong>
              {solo && <small>{r.scores[0] * 10} pt</small>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
