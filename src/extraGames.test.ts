import { describe, expect, it } from "vitest";
import { byId, type Config } from "./game";
import {
  createExtraMatch,
  dexPoints,
  extraReducer,
  extraWinners,
  rateWord,
  statValue,
  wordFor,
  type ExtraMatch,
} from "./extraGames";
import { parseExtraMatch } from "./storage";
const config: Config = { game: "dex", players: 1, rounds: 3, groups: [0] };
const ready = (m: ExtraMatch) => extraReducer(m, { type: "ready" });
const advance = (m: ExtraMatch) => extraReducer(m, { type: "advance" });

describe("DexCode scoring and private turns", () => {
  it("matches every solo distance boundary and treats tied multiplayer ranks consistently", () => {
    for (const [distance, points] of [
      [0, 150],
      [1, 100],
      [10, 100],
      [11, 70],
      [25, 70],
      [26, 35],
      [50, 35],
      [51, 0],
    ])
      expect(dexPoints([100 + distance], 100)).toEqual([points]);
    expect(dexPoints([101, 99, 104, 95], 100)).toEqual([100, 100, 50, 20]);
    expect(dexPoints([100, 100, 101, 102], 100)).toEqual([150, 150, 50, 20]);
    expect(dexPoints([100, 105], 100)).toEqual([150, 70]);
  });
  it.each([1, 2, 3, 4] as const)(
    "completes a %i-player match without early reveals, double scoring, or lost guesses",
    (players) => {
      let m = createExtraMatch({ ...config, players });
      for (let round = 1; round <= 3; round++) {
        for (let p = 0; p < players; p++) {
          m = ready(m);
          const before = m.scores.reduce((a, b) => a + b, 0);
          m = extraReducer(m, {
            type: "dexGuess",
            pokemon: m.targets[round - 1],
          });
          expect(
            extraReducer(m, {
              type: "dexGuess",
              pokemon: m.targets[round - 1],
            }),
          ).toBe(m);
          if (p + 1 < players) {
            expect(m.phase).toBe("handoff");
            expect(m.scores.reduce((a, b) => a + b, 0)).toBe(before);
          } else expect(m.phase).toBe("roundEnd");
          expect(parseExtraMatch(JSON.parse(JSON.stringify(m)))).toEqual(m);
        }
        expect(m.roundScores).toEqual(Array(players).fill(150));
        m = advance(m);
      }
      expect(m.phase).toBe("finished");
      expect(m.scores).toEqual(Array(players).fill(450));
      expect(extraWinners(m)).toHaveLength(players);
    },
  );
});

describe("Higher or Lower", () => {
  it.each([3, 5, 10] as const)(
    "plays %i rounds with the same 10 questions for both players and stable round winners",
    (rounds) => {
      let m = createExtraMatch({ ...config, game: "stat", players: 2, rounds });
      for (let r = 1; r <= rounds; r++) {
        const original = m.questions.slice((r - 1) * 10, r * 10);
        for (let p = 0; p < 2; p++) {
          m = ready(m);
          for (let i = 0; i < 10; i++) {
            const q = m.questions[(r - 1) * 10 + m.questionIndex];
            expect(q).toEqual(original[i]);
            const higher =
              statValue(byId.get(q.b)!, q.stat) >=
              statValue(byId.get(q.a)!, q.stat);
            m = extraReducer(m, {
              type: "statChoice",
              choice: higher ? "higher" : "lower",
            });
            expect(
              extraReducer(m, { type: "statChoice", choice: "higher" }),
            ).toBe(m);
            expect(m.feedback?.kind).toBe("correct");
            expect(parseExtraMatch(m)).toEqual(m);
            m = advance(m);
          }
        }
        expect(m.phase).toBe("roundEnd");
        expect(m.results.at(-1)?.scores).toEqual([100, 100]);
        m = advance(m);
      }
      expect(m.phase).toBe("finished");
      expect(m.scores).toEqual([rounds * 100, rounds * 100]);
      expect(extraWinners(m)).toEqual([0, 1]);
    },
  );
  it("uses actual base values, accepts either choice on ties, and awards the match by rounds instead of cumulative points", () => {
    expect(statValue(byId.get(25)!, "speed")).toBe(90);
    expect(statValue(byId.get(25)!, "weight")).toBe(6);
    expect(statValue(byId.get(25)!, "total")).toBe(320);
    const initial = createExtraMatch({ ...config, game: "stat", players: 2 });
    const m = {
      ...initial,
      phase: "playing" as const,
      questions: initial.questions.map(() => ({
        a: 10,
        b: 13,
        stat: "height" as const,
      })),
    };
    expect(statValue(byId.get(10)!, "height")).toBe(
      statValue(byId.get(13)!, "height"),
    );
    for (const choice of ["higher", "lower"] as const)
      expect(
        extraReducer(m, { type: "statChoice", choice }).feedback?.kind,
      ).toBe("correct");
    expect(
      extraWinners({
        ...initial,
        scores: [200, 220],
        results: [
          { scores: [60, 50], winners: [0], guesses: [], target: null },
          { scores: [60, 50], winners: [0], guesses: [], target: null },
          { scores: [80, 120], winners: [1], guesses: [], target: null },
        ],
      }),
    ).toEqual([0]);
  });
});

describe("Pokédle", () => {
  it("preserves compound names and handles repeated letters in two passes", () => {
    expect(wordFor(byId.get(122)!)).toBe("mrmime");
    expect(wordFor(byId.get(29)!)).toBe("nidoranf");
    expect(wordFor(byId.get(250)!)).toBe("hooh");
    expect(rateWord("eeeee", "eevee")).toEqual([
      "correct",
      "correct",
      "absent",
      "correct",
      "correct",
    ]);
    expect(
      rateWord("aaaaaaa", "pikachu").filter((s) => s !== "absent"),
    ).toHaveLength(1);
    expect(rateWord("apple", "pappa")).toEqual([
      "present",
      "present",
      "correct",
      "absent",
      "absent",
    ]);
  });
  it("ends on a correct full name, refuses repeat or wrong-length guesses, and survives reload", () => {
    let m = createExtraMatch({
      ...config,
      game: "pokedle",
      players: 1,
      rounds: 1,
    });
    m = { ...m, targets: [122] };
    expect(extraReducer(m, { type: "wordGuess", word: "mr" })).toBe(m);
    m = extraReducer(m, { type: "wordGuess", word: "aaaaaa" });
    expect(m.phase).toBe("playing");
    expect(parseExtraMatch(m)).toEqual(m);
    expect(extraReducer(m, { type: "wordGuess", word: "aaaaaa" })).toBe(m);
    m = extraReducer(m, { type: "wordGuess", word: "Mr. Mime" });
    expect(m.phase).toBe("finished");
    expect(m.scores).toEqual([1]);
    expect(m.attempts).toEqual([2]);
    expect(extraReducer(m, { type: "wordGuess", word: "mrmime" })).toBe(m);
    expect(parseExtraMatch(m)).toEqual(m);
  });
  it("ends after exactly six misses and rejects corrupted or incompatible recovery data", () => {
    let m = createExtraMatch({
      ...config,
      game: "pokedle",
      players: 1,
      rounds: 1,
    });
    m = { ...m, targets: [25] };
    for (const char of "bcdefg")
      m = extraReducer(m, { type: "wordGuess", word: char.repeat(7) });
    expect(m.phase).toBe("finished");
    expect(m.scores).toEqual([0]);
    expect(m.wordGuesses).toHaveLength(6);
    expect(parseExtraMatch(m)).toEqual(m);
    for (const invalid of [
      { ...m, wordGuesses: ["a"] },
      { ...m, playerIndex: 3 },
      { ...m, targets: [] },
      { ...m, config: { ...m.config, players: 2 } },
      { ...m, phase: "playing" },
    ])
      expect(parseExtraMatch(invalid)).toBeNull();
  });
});
