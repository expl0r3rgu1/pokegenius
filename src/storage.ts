import { z } from "zod";
import { STAT_KEYS, wordFor, type ExtraMatch } from "./extraGames";
import { maxScore } from "./catalog";
import { byId, matches, poolFor, type Config, type Match } from "./game";

const gameNames = z.enum(["shadow", "doku", "pokedle", "dex", "stat"]);
const playerCount = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
const player = z.union([z.literal(1), z.literal(2)]);
const category = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("type"),
    value: z.enum([
      "normal",
      "fire",
      "water",
      "electric",
      "grass",
      "ice",
      "fighting",
      "poison",
      "ground",
      "flying",
      "psychic",
      "bug",
      "rock",
      "ghost",
      "dragon",
      "dark",
      "steel",
      "fairy",
    ]),
  }),
  z.object({ kind: z.literal("gen"), value: z.number().int().min(1).max(9) }),
]);
const score = z.number().int().min(0).max(10000);
const pair = z.tuple([score, score]);
const pokeId = z.number().int().min(1).max(1025);
export const configSchema = z
  .object({
    game: gameNames,
    players: playerCount,
    rounds: z.union([z.literal(1), z.literal(3), z.literal(5), z.literal(10)]),
    names: z.array(z.string().max(24)).max(4).optional(),
    groups: z
      .array(z.number().int().min(0).max(2))
      .min(1)
      .max(3)
      .refine((v) => new Set(v).size === v.length),
  })
  .refine((c) =>
    c.game === "pokedle"
      ? c.players === 1 && c.rounds === 1
      : c.rounds !== 1 && (c.game === "dex" || c.players <= 2),
  );
const matchSchema = z.object({
  version: z.literal(1),
  id: z.string().max(100),
  config: configSchema,
  phase: z.enum(["coin", "playing", "feedback", "roundEnd", "finished"]),
  round: z.number().int().min(1).max(10),
  starter: player,
  player,
  scores: pair,
  attempts: pair,
  roundScores: pair,
  results: z
    .array(z.object({ scores: pair, winner: z.union([z.literal(0), player]) }))
    .max(10),
  queue: z.array(pokeId).min(1).max(1025),
  index: z.number().int().min(0).max(50),
  shadowInRound: z.number().int().min(0).max(5),
  stolen: z.boolean(),
  board: z.object({
    rows: z.array(category).length(3),
    cols: z.array(category).length(3),
  }),
  cells: z
    .array(
      z
        .object({
          pokemon: pokeId.nullable(),
          owner: player,
          correct: z.boolean(),
        })
        .nullable(),
    )
    .length(9),
  feedback: z
    .object({
      kind: z.enum(["correct", "wrong", "steal", "timeout", "pass"]),
      pokemon: pokeId.nullable(),
      player,
      cell: z.number().int().min(0).max(8).nullable(),
    })
    .nullable(),
  deadline: z.number().finite().min(0).max(9e15).nullable(),
  shadowHistory: z
    .array(
      z.object({
        pokemon: pokeId,
        correct: z.boolean(),
        player,
        round: z.number().int().min(1).max(10),
      }),
    )
    .max(50),
});
export function parseMatch(raw: unknown): Match | null {
  const result = matchSchema.safeParse(raw);
  if (!result.success) return null;
  const m = result.data;
  if (!["shadow", "doku"].includes(m.config.game) || m.config.players > 2)
    return null;
  const pool = poolFor(m.config);
  const ids = new Set(pool.map((p) => p.id));
  if (
    m.round > m.config.rounds ||
    m.index >= m.queue.length ||
    m.queue.length !== pool.length ||
    new Set(m.queue).size !== m.queue.length ||
    m.queue.some((id) => !ids.has(id))
  )
    return null;
  if (
    m.board.rows.some((row) =>
      m.board.cols.some(
        (col) => !pool.some((p) => matches(p, row) && matches(p, col)),
      ),
    )
  )
    return null;
  if (m.cells.some((cell) => cell?.pokemon && !byId.has(cell.pokemon)))
    return null;
  if ((m.phase === "feedback") !== !!m.feedback) return null;
  if (
    m.deadline !== null &&
    (m.phase !== "playing" ||
      m.config.game !== "doku" ||
      m.config.players !== 2)
  )
    return null;
  if (
    m.phase === "playing" &&
    m.config.game === "doku" &&
    m.config.players === 2 &&
    m.deadline === null
  )
    return null;
  return m;
}
export const KEYS = {
  match: "pokegenius.match.v1",
  config: "pokegenius.config.v1",
  history: "pokegenius.history.v1",
  lang: "pokegenius.lang",
  sound: "pokegenius.sound",
  music: "pokegenius.music",
};
export function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}
export function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function savedMatch() {
  const raw = read(KEYS.match);
  return raw && typeof raw === "object" && "extra" in raw
    ? parseExtraMatch(raw)
    : parseMatch(raw);
}
export function savedConfig(): Config | null {
  const result = configSchema.safeParse(read(KEYS.config));
  return result.success ? result.data : null;
}
export interface HistoryEntry {
  id: string;
  game: Config["game"];
  players: Config["players"];
  score: number;
  total: number;
  date: number;
}
const historySchema = z
  .array(
    z.object({
      id: z.string(),
      game: gameNames,
      players: playerCount,
      score,
      total: score,
      date: z.number().finite(),
    }),
  )
  .max(30);
export function history(): HistoryEntry[] {
  const result = historySchema.safeParse(read(KEYS.history));
  return result.success ? result.data : [];
}
export function recordMatch(m: Match | ExtraMatch) {
  const entries = history();
  if (entries.some((e) => e.id === m.id)) return;
  write(
    KEYS.history,
    [
      {
        id: m.id,
        game: m.config.game,
        players: m.config.players,
        score: m.scores[0],
        total: maxScore(m.config),
        date: Date.now(),
      },
      ...entries,
    ].slice(0, 30),
  );
}

const scores = z.array(score).min(1).max(4);
const extraSchema = z.object({
  extra: z.literal(true),
  version: z.literal(1),
  id: z.string().max(100),
  config: configSchema,
  phase: z.enum(["handoff", "playing", "feedback", "roundEnd", "finished"]),
  round: z.number().int().min(1).max(10),
  playerIndex: z.number().int().min(0).max(3),
  questionIndex: z.number().int().min(0).max(9),
  scores,
  attempts: scores,
  roundScores: scores,
  results: z
    .array(
      z.object({
        scores,
        winners: z.array(z.number().int().min(0).max(3)).max(4),
        guesses: z.array(pokeId).max(4),
        target: pokeId.nullable(),
      }),
    )
    .max(10),
  targets: z.array(pokeId).min(1).max(10),
  questions: z
    .array(z.object({ a: pokeId, b: pokeId, stat: z.enum(STAT_KEYS) }))
    .max(100),
  guesses: z.array(pokeId).max(4),
  wordGuesses: z.array(z.string().regex(/^[a-z0-9]{1,20}$/)).max(6),
  feedback: z
    .object({
      kind: z.enum(["correct", "wrong"]),
      points: z.union([z.literal(0), z.literal(10)]),
      choice: z.enum(["higher", "lower"]).nullable(),
    })
    .nullable(),
});
export function parseExtraMatch(raw: unknown): ExtraMatch | null {
  const result = extraSchema.safeParse(raw);
  if (!result.success) return null;
  const m = result.data;
  if (
    !["pokedle", "dex", "stat"].includes(m.config.game) ||
    m.round > m.config.rounds ||
    m.playerIndex >= m.config.players
  )
    return null;
  if (
    [m.scores, m.attempts, m.roundScores].some(
      (s) => s.length !== m.config.players,
    )
  )
    return null;
  if (
    m.targets.length !== m.config.rounds ||
    new Set(m.targets).size !== m.targets.length
  )
    return null;
  const pool = new Set(poolFor(m.config).map((p) => p.id));
  if (
    m.targets.some((id) => !pool.has(id)) ||
    m.guesses.some((id) => !pool.has(id))
  )
    return null;
  if ((m.phase === "feedback") !== !!m.feedback) return null;
  if (m.config.game === "stat") {
    if (
      m.questions.length !== m.config.rounds * 10 ||
      m.questions.some((q) => !pool.has(q.a) || !pool.has(q.b) || q.a === q.b)
    )
      return null;
  } else if (m.questions.length) return null;
  if (
    m.config.game === "dex" &&
    m.phase === "playing" &&
    m.guesses.length !== m.playerIndex
  )
    return null;
  if (m.config.game !== "pokedle") {
    const expectedResults =
      m.phase === "finished" || m.phase === "roundEnd" ? m.round : m.round - 1;
    if (
      m.results.length !== expectedResults ||
      m.results.some(
        (r) =>
          r.scores.length !== m.config.players ||
          r.winners.some((i) => i >= m.config.players),
      )
    )
      return null;
    if (
      m.config.game === "dex" &&
      m.results.some(
        (r, i) =>
          r.target !== m.targets[i] ||
          r.guesses.length !== m.config.players ||
          r.guesses.some((id) => !pool.has(id)),
      )
    )
      return null;
  }
  if (m.config.game === "pokedle") {
    const target = wordFor(byId.get(m.targets[0])!);
    if (
      m.wordGuesses.some((w) => w.length !== target.length) ||
      new Set(m.wordGuesses).size !== m.wordGuesses.length
    )
      return null;
    const ended = m.wordGuesses.includes(target) || m.wordGuesses.length === 6;
    if (
      (m.phase === "finished") !== ended ||
      !["playing", "finished"].includes(m.phase)
    )
      return null;
  }
  return m;
}
