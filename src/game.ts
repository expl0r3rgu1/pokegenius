import dex from "./data/pokemon.json" with { type: "json" };

export type Pokemon = (typeof dex)[number];
export const pokemon = dex;
export const byId = new Map(pokemon.map((p) => [p.id, p]));
export const GROUPS = [
  [1, 2, 3, 4],
  [5, 6],
  [7, 8, 9],
];
export const REGIONS = [
  "Kanto",
  "Johto",
  "Hoenn",
  "Sinnoh",
  "Unova",
  "Kalos",
  "Alola",
  "Galar",
  "Paldea",
];
export const TYPES = [
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
];
export type Game = "shadow" | "doku" | "pokedle" | "dex" | "stat";
export type Player = 1 | 2;
export interface Config {
  game: Game;
  players: 1 | 2 | 3 | 4;
  rounds: 1 | 3 | 5 | 10;
  names?: string[];
  groups: number[];
}
export const DEFAULT_CONFIG: Config = {
  game: "shadow",
  players: 1,
  rounds: 5,
  groups: [0],
};
export const other = (p: Player): Player => (p === 1 ? 2 : 1);
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/♀/g, "f")
    .replace(/♂/g, "m")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
export function poolFor(config: Config) {
  const gens = config.groups.flatMap((g) => GROUPS[g] ?? []);
  return pokemon.filter((p) => gens.includes(p.gen));
}
export function findPokemon(text: string, pool: Pokemon[]) {
  const n = normalize(text);
  return pool.find(
    (p) =>
      normalize(p.name) === n ||
      normalize(p.slug) === n ||
      (n === "typenull" && p.id === 772),
  );
}
export function searchPokemon(text: string, pool: Pokemon[]) {
  const n = normalize(text);
  if (!n) return [];
  return pool
    .filter(
      (p) => normalize(p.name).includes(n) || normalize(p.slug).includes(n),
    )
    .sort(
      (a, b) =>
        Number(!normalize(a.name).startsWith(n)) -
          Number(!normalize(b.name).startsWith(n)) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 7);
}
export function shuffle<T>(items: T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export type Category =
  { kind: "type"; value: string } | { kind: "gen"; value: number };
export interface Board {
  rows: Category[];
  cols: Category[];
}
export const matches = (p: Pokemon, cat: Category) =>
  cat.kind === "gen" ? p.gen === cat.value : p.types.includes(cat.value);
export function answersFor(board: Board, cell: number, pool: Pokemon[]) {
  return pool.filter(
    (p) =>
      matches(p, board.rows[Math.floor(cell / 3)]) &&
      matches(p, board.cols[cell % 3]),
  );
}
export function generateBoard(pool: Pokemon[], random = Math.random): Board {
  const typeCats: Category[] = TYPES.filter((t) =>
    pool.some((p) => p.types.includes(t)),
  ).map((value) => ({ kind: "type", value }));
  const genCats: Category[] = [...new Set(pool.map((p) => p.gen))].map(
    (value) => ({ kind: "gen", value }),
  );
  // Rows are types, so a board can never ask for two incompatible generations.
  const tryRows = (rows: Category[]): Board | undefined => {
    const columns = [...typeCats, ...genCats].filter(
      (col) =>
        !rows.some((row) => row.kind === col.kind && row.value === col.value) &&
        rows.every((row) =>
          pool.some((p) => matches(p, row) && matches(p, col)),
        ),
    );
    if (columns.length >= 3)
      return { rows, cols: shuffle(columns, random).slice(0, 3) };
  };
  for (let attempt = 0; attempt < 250; attempt++) {
    const board = tryRows(shuffle(typeCats, random).slice(0, 3));
    if (board) return board;
  }
  // A finite exhaustive fallback also works when the random source is constant.
  for (let a = 0; a < typeCats.length - 2; a++)
    for (let b = a + 1; b < typeCats.length - 1; b++)
      for (let c = b + 1; c < typeCats.length; c++) {
        const board = tryRows([typeCats[a], typeCats[b], typeCats[c]]);
        if (board) return board;
      }
  throw new Error("No playable board for this selection");
}
export interface Cell {
  pokemon: number | null;
  owner: Player;
  correct: boolean;
}
export interface Feedback {
  kind: "correct" | "wrong" | "steal" | "timeout" | "pass";
  pokemon: number | null;
  player: Player;
  cell: number | null;
}
export interface RoundResult {
  scores: [number, number];
  winner: 0 | Player;
}
export interface Match {
  version: 1;
  id: string;
  config: Config;
  phase: "coin" | "playing" | "feedback" | "roundEnd" | "finished";
  round: number;
  starter: Player;
  player: Player;
  scores: [number, number];
  attempts: [number, number];
  roundScores: [number, number];
  results: RoundResult[];
  queue: number[];
  index: number;
  shadowInRound: number;
  stolen: boolean;
  board: Board;
  cells: (Cell | null)[];
  feedback: Feedback | null;
  deadline: number | null;
  shadowHistory: {
    pokemon: number;
    correct: boolean;
    player: Player;
    round: number;
  }[];
}
export type Action =
  | { type: "begin"; now: number }
  | { type: "guess"; pokemon: number | null; cell?: number; now: number }
  | { type: "next"; now: number }
  | { type: "timeout"; now: number }
  | { type: "pass"; now: number };
export function createMatch(
  config: Config,
  now = Date.now(),
  random = Math.random,
): Match {
  if (config.game === "doku" && config.players === 2)
    config = { ...config, rounds: 1 };
  const pool = poolFor(config);
  const starter: Player =
    config.players === 2 && config.game === "shadow" && random() >= 0.5 ? 2 : 1;
  return {
    version: 1,
    id: crypto.randomUUID(),
    config,
    phase:
      config.players === 2 && config.game === "shadow" ? "coin" : "playing",
    round: 1,
    starter,
    player: starter,
    scores: [0, 0],
    attempts: [0, 0],
    roundScores: [0, 0],
    results: [],
    shadowHistory: [],
    queue: shuffle(pool, random).map((p) => p.id),
    index: 0,
    shadowInRound: 0,
    stolen: false,
    board: generateBoard(pool, random),
    cells: Array.from({ length: 9 }, () => null),
    feedback: null,
    deadline:
      config.players === 2 && config.game === "doku" ? now + 40_000 : null,
  };
}
export function lineWinner(cells: Match["cells"]): 0 | Player {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines)
    if (
      cells[a]?.correct &&
      cells[b]?.correct &&
      cells[c]?.correct &&
      cells[a]?.owner === cells[b]?.owner &&
      cells[a]?.owner === cells[c]?.owner
    )
      return cells[a]!.owner;
  return 0;
}
const winnerOf = (scores: [number, number]): 0 | Player =>
  scores[0] === scores[1] ? 0 : scores[0] > scores[1] ? 1 : 2;
export function matchWinner(m: Match): 0 | Player {
  return winnerOf(
    m.config.game === "doku"
      ? [
          m.results.filter((r) => r.winner === 1).length,
          m.results.filter((r) => r.winner === 2).length,
        ]
      : m.scores,
  );
}
function finishRound(m: Match): Match {
  const winner =
    m.config.game === "doku" ? lineWinner(m.cells) : winnerOf(m.roundScores);
  return {
    ...m,
    phase: "roundEnd",
    deadline: null,
    results: [...m.results, { scores: [...m.roundScores], winner }],
  };
}
export function reducer(state: Match, action: Action): Match {
  if (action.type === "begin")
    return state.phase === "coin" ? { ...state, phase: "playing" } : state;
  if (action.type === "pass") {
    if (
      state.phase !== "playing" ||
      state.config.game !== "doku" ||
      state.config.players !== 2
    )
      return state;
    if (state.deadline && action.now >= state.deadline)
      return reducer(state, { type: "timeout", now: action.now });
    return {
      ...state,
      phase: "feedback",
      deadline: null,
      feedback: {
        kind: "pass",
        pokemon: null,
        player: state.player,
        cell: null,
      },
    };
  }
  if (action.type === "timeout") {
    if (
      state.phase !== "playing" ||
      !state.deadline ||
      action.now < state.deadline
    )
      return state;
    return {
      ...state,
      phase: "feedback",
      deadline: null,
      feedback: {
        kind: "timeout",
        pokemon: null,
        player: state.player,
        cell: null,
      },
    };
  }
  if (action.type === "guess") {
    if (state.phase !== "playing") return state;
    if (state.deadline && action.now >= state.deadline)
      return reducer(state, { type: "timeout", now: action.now });
    const m: Match = {
      ...state,
      scores: [...state.scores],
      attempts: [...state.attempts],
      roundScores: [...state.roundScores],
      cells: [...state.cells],
      deadline: null,
    };
    const p = action.pokemon ? byId.get(action.pokemon) : undefined;
    if (p && !poolFor(m.config).some((item) => item.id === p.id)) return state;
    const isShadow = m.config.game === "shadow";
    const cell = action.cell;
    if (
      !isShadow &&
      (cell === undefined ||
        !Number.isInteger(cell) ||
        cell < 0 ||
        cell > 8 ||
        m.cells[cell])
    )
      return state;
    const correct =
      !!p &&
      (isShadow
        ? p.id === m.queue[m.index]
        : matches(p, m.board.rows[Math.floor(cell! / 3)]) &&
          matches(p, m.board.cols[cell! % 3]));
    m.attempts[m.player - 1]++;
    if (correct) {
      m.scores[m.player - 1] += isShadow
        ? m.config.players === 1
          ? 100
          : 1
        : m.config.players === 1
          ? 10
          : 0;
      if (isShadow || m.config.players === 1) m.roundScores[m.player - 1]++;
    }
    if (!isShadow && (correct || m.config.players === 1))
      m.cells[cell!] = { pokemon: p?.id ?? null, owner: m.player, correct };
    m.feedback = {
      kind: correct
        ? "correct"
        : isShadow && m.config.players === 2 && !m.stolen
          ? "steal"
          : "wrong",
      pokemon: isShadow ? m.queue[m.index] : (p?.id ?? null),
      player: m.player,
      cell: cell ?? null,
    };
    if (isShadow && m.feedback.kind !== "steal")
      m.shadowHistory = [
        ...state.shadowHistory,
        {
          pokemon: m.queue[m.index],
          correct,
          player: m.player,
          round: m.round,
        },
      ];
    if (
      !isShadow &&
      m.config.players === 2 &&
      (lineWinner(m.cells) || m.cells.every(Boolean))
    ) {
      return { ...finishRound(m), phase: "finished", feedback: null };
    }
    m.phase = "feedback";
    return m;
  }
  if (action.type === "next") {
    if (state.phase === "roundEnd") {
      if (state.round >= state.config.rounds)
        return { ...state, phase: "finished" };
      const nextStarter = other(state.starter);
      return {
        ...state,
        phase: "playing",
        round: state.round + 1,
        starter: nextStarter,
        player: state.config.players === 2 ? nextStarter : 1,
        roundScores: [0, 0],
        shadowInRound: 0,
        stolen: false,
        feedback: null,
        cells: Array.from({ length: 9 }, () => null),
        board:
          state.config.game === "doku"
            ? generateBoard(poolFor(state.config))
            : state.board,
        deadline:
          state.config.players === 2 && state.config.game === "doku"
            ? action.now + 40_000
            : null,
      };
    }
    if (state.phase !== "feedback" || !state.feedback) return state;
    const m: Match = { ...state, feedback: null, phase: "playing" };
    if (m.config.game === "shadow") {
      if (state.feedback.kind === "steal")
        return { ...m, player: other(m.player), stolen: true };
      m.index++;
      m.shadowInRound++;
      m.stolen = false;
      if (m.config.players === 1)
        return m.index >= m.config.rounds ? { ...m, phase: "finished" } : m;
      if (Math.max(...m.roundScores) >= 3 || m.shadowInRound >= 5)
        return finishRound(m);
      return m;
    }
    if (
      m.cells.every(Boolean) ||
      (m.config.players === 2 && lineWinner(m.cells))
    )
      return finishRound(m);
    return {
      ...m,
      player: m.config.players === 2 ? other(m.player) : 1,
      deadline: m.config.players === 2 ? action.now + 40_000 : null,
    };
  }
  return state;
}

export function normalizeDokuDuel(m: Match): Match {
  if (m.config.game !== "doku" || m.config.players !== 2) return m;
  const winner = lineWinner(m.cells);
  const finished = !!winner || m.cells.every(Boolean);
  return {
    ...m,
    config: { ...m.config, rounds: 1 },
    round: 1,
    scores: [0, 0],
    roundScores: [0, 0],
    results: finished ? [{ scores: [0, 0], winner }] : [],
    phase: finished ? "finished" : m.phase,
    feedback: finished ? null : m.feedback,
    deadline: finished ? null : m.deadline,
  };
}
