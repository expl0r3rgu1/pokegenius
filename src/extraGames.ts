import {
  byId,
  normalize,
  poolFor,
  shuffle,
  type Config,
  type Pokemon,
} from "./game";
export const STAT_KEYS = [
  "weight",
  "height",
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
  "total",
] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Choice = "higher" | "lower";
export type TileStatus = "correct" | "present" | "absent";
export interface StatQuestion {
  a: number;
  b: number;
  stat: StatKey;
}
export interface ExtraRound {
  scores: number[];
  winners: number[];
  guesses: number[];
  target: number | null;
}
export interface ExtraMatch {
  extra: true;
  version: 1;
  id: string;
  config: Config;
  phase: "handoff" | "playing" | "feedback" | "roundEnd" | "finished";
  round: number;
  playerIndex: number;
  questionIndex: number;
  scores: number[];
  attempts: number[];
  roundScores: number[];
  results: ExtraRound[];
  targets: number[];
  questions: StatQuestion[];
  guesses: number[];
  wordGuesses: string[];
  feedback: {
    kind: "correct" | "wrong";
    points: number;
    choice: Choice | null;
  } | null;
}
export type ExtraAction =
  | { type: "ready" }
  | { type: "dexGuess"; pokemon: number }
  | { type: "wordGuess"; word: string }
  | { type: "statChoice"; choice: Choice }
  | { type: "advance" };
export function wordFor(p: Pokemon) {
  return normalize(p.name);
}
export function rateWord(guess: string, target: string): TileStatus[] {
  const statuses: TileStatus[] = Array.from(guess, () => "absent");
  const remaining = new Map<string, number>();
  for (let i = 0; i < target.length; i++)
    if (guess[i] === target[i]) statuses[i] = "correct";
    else remaining.set(target[i], (remaining.get(target[i]) ?? 0) + 1);
  for (let i = 0; i < guess.length; i++)
    if (statuses[i] !== "correct" && (remaining.get(guess[i]) ?? 0) > 0) {
      statuses[i] = "present";
      remaining.set(guess[i], remaining.get(guess[i])! - 1);
    }
  return statuses;
}
export function statValue(p: Pokemon, key: StatKey): number {
  if (key === "height" || key === "weight") return p[key];
  if (key === "total") return p.stats.reduce((a, b) => a + b, 0);
  return p.stats[
    {
      hp: 0,
      attack: 1,
      defense: 2,
      "special-attack": 3,
      "special-defense": 4,
      speed: 5,
    }[key]
  ];
}
export function dexPoints(guesses: number[], target: number): number[] {
  const distances = guesses.map((id) => Math.abs(id - target));
  if (guesses.length === 1) {
    const d = distances[0];
    return [d === 0 ? 150 : d <= 10 ? 100 : d <= 25 ? 70 : d <= 50 ? 35 : 0];
  }
  const sorted = [...distances].sort((a, b) => a - b);
  return distances.map((d) =>
    d === 0 ? 150 : [100, 70, 50, 20][Math.min(sorted.indexOf(d), 3)],
  );
}
export function roundWinners(scores: number[]) {
  const best = Math.max(...scores);
  return scores.flatMap((s, i) => (s === best ? [i] : []));
}
export function extraWinners(m: ExtraMatch): number[] {
  if (m.config.game === "stat" && m.config.players > 1)
    return roundWinners(
      m.scores.map(
        (_, i) =>
          m.results.filter((r) => r.winners.length === 1 && r.winners[0] === i)
            .length,
      ),
    );
  return roundWinners(m.scores);
}
export function createExtraMatch(
  config: Config,
  random = Math.random,
): ExtraMatch {
  const pool = poolFor(config);
  const zeros = () => Array.from({ length: config.players }, () => 0);
  const questions = Array.from(
    { length: config.game === "stat" ? config.rounds * 10 : 0 },
    (_, i) => {
      const [a, b] = shuffle(pool, random);
      return {
        a: a.id,
        b: b.id,
        stat: STAT_KEYS[
          (i + Math.floor(random() * STAT_KEYS.length)) % STAT_KEYS.length
        ],
      };
    },
  );
  return {
    extra: true,
    version: 1,
    id: crypto.randomUUID(),
    config,
    phase: config.players > 1 ? "handoff" : "playing",
    round: 1,
    playerIndex: 0,
    questionIndex: 0,
    scores: zeros(),
    attempts: zeros(),
    roundScores: zeros(),
    results: [],
    targets: shuffle(pool, random)
      .slice(0, config.rounds)
      .map((p) => p.id),
    questions,
    guesses: [],
    wordGuesses: [],
    feedback: null,
  };
}
export function extraReducer(
  state: ExtraMatch,
  action: ExtraAction,
): ExtraMatch {
  if (action.type === "ready")
    return state.phase === "handoff" ? { ...state, phase: "playing" } : state;
  if (action.type === "wordGuess") {
    if (state.phase !== "playing" || state.config.game !== "pokedle")
      return state;
    const word = normalize(action.word);
    const target = wordFor(byId.get(state.targets[0])!);
    if (word.length !== target.length || state.wordGuesses.includes(word))
      return state;
    const guesses = [...state.wordGuesses, word];
    const won = word === target;
    return {
      ...state,
      wordGuesses: guesses,
      attempts: [guesses.length],
      scores: [won ? 1 : 0],
      phase: won || guesses.length >= 6 ? "finished" : "playing",
    };
  }
  if (action.type === "dexGuess") {
    if (
      state.phase !== "playing" ||
      state.config.game !== "dex" ||
      !poolFor(state.config).some((p) => p.id === action.pokemon)
    )
      return state;
    const guesses = [...state.guesses, action.pokemon];
    const attempts = [...state.attempts];
    attempts[state.playerIndex]++;
    if (guesses.length < state.config.players)
      return {
        ...state,
        guesses,
        attempts,
        playerIndex: state.playerIndex + 1,
        phase: "handoff",
      };
    const target = state.targets[state.round - 1];
    const points = dexPoints(guesses, target);
    return {
      ...state,
      phase: "roundEnd",
      guesses,
      attempts,
      roundScores: points,
      scores: state.scores.map((s, i) => s + points[i]),
      results: [
        ...state.results,
        { target, guesses, scores: points, winners: roundWinners(points) },
      ],
    };
  }
  if (action.type === "statChoice") {
    if (state.phase !== "playing" || state.config.game !== "stat") return state;
    const question =
      state.questions[(state.round - 1) * 10 + state.questionIndex];
    const a = statValue(byId.get(question.a)!, question.stat);
    const b = statValue(byId.get(question.b)!, question.stat);
    const correct = action.choice === "higher" ? b >= a : b <= a;
    const points = correct ? 10 : 0;
    const scores = [...state.scores];
    scores[state.playerIndex] += points;
    const roundScores = [...state.roundScores];
    roundScores[state.playerIndex] += points;
    const attempts = [...state.attempts];
    attempts[state.playerIndex]++;
    return {
      ...state,
      scores,
      roundScores,
      attempts,
      phase: "feedback",
      feedback: {
        kind: correct ? "correct" : "wrong",
        points,
        choice: action.choice,
      },
    };
  }
  if (action.type === "advance") {
    if (state.phase === "roundEnd") {
      if (state.round >= state.config.rounds)
        return { ...state, phase: "finished" };
      return {
        ...state,
        phase: state.config.players > 1 ? "handoff" : "playing",
        round: state.round + 1,
        questionIndex: 0,
        playerIndex: 0,
        roundScores: state.roundScores.map(() => 0),
        guesses: [],
        feedback: null,
      };
    }
    if (state.phase !== "feedback" || state.config.game !== "stat")
      return state;
    const m: ExtraMatch = { ...state, feedback: null };
    if (state.questionIndex < 9)
      return { ...m, phase: "playing", questionIndex: state.questionIndex + 1 };
    if (state.playerIndex + 1 < state.config.players)
      return {
        ...m,
        phase: "handoff",
        playerIndex: state.playerIndex + 1,
        questionIndex: 0,
      };
    return {
      ...m,
      phase: "roundEnd",
      results: [
        ...m.results,
        {
          scores: [...m.roundScores],
          winners: roundWinners(m.roundScores),
          target: null,
          guesses: [],
        },
      ],
    };
  }
  return state;
}
