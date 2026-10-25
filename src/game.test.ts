import { describe, expect, it } from "vitest";
import {
  answersFor,
  byId,
  createMatch,
  findPokemon,
  generateBoard,
  GROUPS,
  lineWinner,
  matchWinner,
  poolFor,
  reducer,
  type Config,
  type Match,
} from "./game";
import { parseMatch } from "./storage";
const config: Config = { game: "shadow", players: 1, rounds: 3, groups: [0] };
const next = (m: Match) => reducer(m, { type: "next", now: 1000 });
function guess(m: Match, id: number | null, cell?: number) {
  return reducer(m, { type: "guess", pokemon: id, cell, now: 1000 });
}
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

describe("finite, generation-aware boards", () => {
  it("all 7 generation selections produce solvable, non-redundant boards, even with constant randomness", () => {
    for (let mask = 1; mask < 8; mask++) {
      const groups = GROUPS.map((_, i) => i).filter((i) => mask & (1 << i));
      const pool = poolFor({ ...config, groups });
      expect(pool.length).toBeGreaterThan(200);
      for (let seed = 0; seed < 40; seed++) {
        const board = generateBoard(
          pool,
          seed === 0 ? () => 0.5 : seeded(seed),
        );
        expect(
          new Set(
            [...board.rows, ...board.cols].map((c) => `${c.kind}:${c.value}`),
          ).size,
        ).toBe(6);
        for (let cell = 0; cell < 9; cell++) {
          const answers = answersFor(board, cell, pool);
          expect(answers.length).toBeGreaterThan(0);
          expect(
            answers.every((p) => groups.some((g) => GROUPS[g].includes(p.gen))),
          ).toBe(true);
        }
      }
    }
  });
});

describe("silhouette matches", () => {
  it.each([3, 5, 10] as const)(
    "honours %i solo silhouettes without repeats or double scoring",
    (rounds) => {
      let m = createMatch({ ...config, rounds });
      expect(new Set(m.queue).size).toBe(m.queue.length);
      for (let i = 0; i < rounds; i++) {
        m = guess(m, m.queue[m.index]);
        expect(guess(m, m.queue[m.index])).toBe(m);
        m = next(m);
      }
      expect(m.phase).toBe("finished");
      expect(m.scores[0]).toBe(rounds * 100);
      expect(m.attempts[0]).toBe(rounds);
    },
  );
  it("offers exactly one steal, hides the answer until resolved, and keeps the second player after two misses", () => {
    let m = createMatch({ ...config, players: 2 }, 0, () => 0.2);
    m = reducer(m, { type: "begin", now: 0 });
    const id = m.queue[0];
    m = guess(m, null);
    expect(m.feedback?.kind).toBe("steal");
    m = next(m);
    expect(m.player).toBe(2);
    expect(m.queue[m.index]).toBe(id);
    expect(m.stolen).toBe(true);
    m = guess(m, null);
    expect(m.feedback?.kind).toBe("wrong");
    m = next(m);
    expect(m.player).toBe(2);
    expect(m.index).toBe(1);
    expect(m.attempts).toEqual([1, 1]);
  });
  it("ends each multiplayer round at 3 points, alternates starters, and plays the selected round count", () => {
    let m = createMatch({ ...config, players: 2 });
    m = reducer(m, { type: "begin", now: 0 });
    for (let round = 1; round <= 3; round++) {
      const starter = m.player;
      for (let i = 0; i < 3; i++) m = next(guess(m, m.queue[m.index]));
      expect(m.phase).toBe("roundEnd");
      expect(m.results).toHaveLength(round);
      m = next(m);
      if (round < 3) expect(m.player).not.toBe(starter);
    }
    expect(m.phase).toBe("finished");
    expect(m.scores.reduce((a, b) => a + b)).toBe(9);
    expect(matchWinner(m)).not.toBe(0);
  });
  it("ends a no-answer round after 5 silhouettes", () => {
    let m = reducer(createMatch({ ...config, players: 2 }), {
      type: "begin",
      now: 0,
    });
    for (let i = 0; i < 5; i++) m = next(guess(next(guess(m, null)), null));
    expect(m.phase).toBe("roundEnd");
    expect(m.results[0].winner).toBe(0);
  });
});

describe("Pokédoku", () => {
  it("plays every solo board, locks errors, and scores only valid answers", () => {
    let m = createMatch({ ...config, game: "doku" });
    for (let round = 0; round < 3; round++) {
      m = next(guess(m, null, 0));
      expect(m.cells[0]?.correct).toBe(false);
      expect(guess(m, answersFor(m.board, 0, poolFor(m.config))[0].id, 0)).toBe(
        m,
      );
      for (let cell = 1; cell < 9; cell++)
        m = next(
          guess(m, answersFor(m.board, cell, poolFor(m.config))[0].id, cell),
        );
      expect(m.phase).toBe("roundEnd");
      m = next(m);
    }
    expect(m.phase).toBe("finished");
    expect(m.scores).toEqual([240, 0]);
    expect(m.attempts).toEqual([27, 0]);
  });
  it("passes errors without locking a cell, then ends a multiplayer round on a line", () => {
    let m = createMatch({ ...config, game: "doku", players: 2 }, 0);
    m = next(guess(m, null, 5));
    expect(m.cells[5]).toBeNull();
    expect(m.player).toBe(2);
    for (let i = 0; i < 5; i++) {
      const cell = [0, 3, 1, 4, 2][i];
      m = next(
        guess(m, answersFor(m.board, cell, poolFor(m.config))[0].id, cell),
      );
    }
    expect(m.phase).toBe("roundEnd");
    expect(lineWinner(m.cells)).toBe(2);
    expect(m.results[0].winner).toBe(2);
  });
  it("ends a full multiplayer board without a line as a draw", () => {
    let m = createMatch({ ...config, game: "doku", players: 2 }, 0);
    for (const cell of [0, 1, 2, 4, 3, 5, 7, 6, 8])
      m = next(
        guess(m, answersFor(m.board, cell, poolFor(m.config))[0].id, cell),
      );
    expect(m.phase).toBe("roundEnd");
    expect(m.results[0].winner).toBe(0);
  });
  it("uses absolute deadlines, rejects expired guesses, and cannot switch twice on stale timer events", () => {
    let m = createMatch({ ...config, game: "doku", players: 2 }, 100);
    const deadline = m.deadline!;
    expect(reducer(m, { type: "timeout", now: deadline - 1 })).toBe(m);
    const answer = answersFor(m.board, 0, poolFor(m.config))[0].id;
    m = reducer(m, { type: "guess", pokemon: answer, cell: 0, now: deadline });
    expect(m.feedback?.kind).toBe("timeout");
    expect(m.scores).toEqual([0, 0]);
    expect(reducer(m, { type: "timeout", now: deadline + 1 })).toBe(m);
    m = reducer(m, { type: "next", now: deadline + 2000 });
    expect(m.player).toBe(2);
    expect(m.deadline).toBe(deadline + 42000);
  });
});

describe("safe local recovery and names", () => {
  it("roundtrips real matches and rejects malformed or incompatible saved data", () => {
    const m = createMatch(config);
    expect(parseMatch(JSON.parse(JSON.stringify(m)))).toEqual(m);
    for (const raw of [
      null,
      {},
      { ...m, version: 2 },
      { ...m, config: { ...config, groups: [] } },
      { ...m, queue: [99999] },
      { ...m, cells: [] },
      { ...m, index: 9999 },
      { ...m, phase: "feedback" },
      {
        ...m,
        board: {
          rows: m.board.rows,
          cols: [{ kind: "gen", value: 9 }, ...m.board.cols.slice(1)],
        },
      },
    ])
      expect(parseMatch(raw)).toBeNull();
  });
  it("accepts human spellings, punctuation and gender suffixes without changing the species", () => {
    const all = poolFor({ ...config, groups: [0, 1, 2] });
    for (const [input, id] of [
      ["mr mime", 122],
      ["nidoran f", 29],
      ["nidoran♀", 29],
      ["farfetchd", 83],
      ["flabebe", 669],
      ["type null", 772],
    ] as const)
      expect(findPokemon(input, all)?.id).toBe(id);
    expect(byId.size).toBe(1025);
  });
});
