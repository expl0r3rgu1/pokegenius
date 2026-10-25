import { expect, test, type Page } from "@playwright/test";
import { byId } from "../src/game";
import { statValue, wordFor, type ExtraMatch } from "../src/extraGames";
const saved = async (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("pokegenius.match.v1")!) as ExtraMatch,
  );
async function start(page: Page, title: string, players = 1) {
  await page.goto("/");
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
    .getByRole("button", { name: "Gioca", exact: true })
    .click();
  if (title !== "Pokédle") {
    if (players > 1)
      await page
        .getByRole("button", {
          name: title === "DexCode" ? `${players} giocatori` : "Con un amico",
          exact: true,
        })
        .click();
    await page.getByRole("button", { name: "3", exact: true }).click();
  }
  if (title === "DexCode" && players > 1)
    await page
      .getByRole("textbox", { name: "Giocatore 2", exact: true })
      .fill("Misty");
  await page.getByRole("button", { name: "Si gioca!", exact: true }).click();
}
async function checkWidth(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("Pokédle preserves guesses on reload, evaluates letters, and finishes with the full correct name", async ({
  page,
}) => {
  await start(page, "Pokédle");
  const m = await saved(page);
  const target = wordFor(byId.get(m.targets[0])!);
  await page
    .getByRole("textbox", { name: "Il nome che hai in mente" })
    .fill("x".repeat(target.length));
  await page.getByRole("button", { name: "Prova", exact: true }).click();
  await expect(
    page.locator(".word-row").first().locator(".letter-absent"),
  ).toHaveCount(target.length);
  await page.reload();
  expect((await saved(page)).wordGuesses).toHaveLength(1);
  await page
    .getByRole("textbox", { name: "Il nome che hai in mente" })
    .fill(target);
  await page.getByRole("button", { name: "Prova", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nome trovato. Genio confermato!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: byId.get(m.targets[0])!.name,
      exact: true,
    }),
  ).toBeVisible();
  await checkWidth(page);
});

test("Pokédle handles all six misses and locks the finished game", async ({
  page,
}) => {
  await start(page, "Pokédle");
  const m = await saved(page);
  const length = wordFor(byId.get(m.targets[0])!).length;
  for (const letter of "bdfgjq") {
    await page
      .getByRole("textbox", { name: "Il nome che hai in mente" })
      .fill(letter.repeat(length));
    await page.getByRole("button", { name: "Prova", exact: true }).click();
  }
  await expect(
    page.getByRole("heading", { name: "Il prossimo lo riconosci." }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Il nome che hai in mente" }),
  ).toHaveCount(0);
  await expect(page.locator(".word-row")).toHaveCount(6);
  expect((await saved(page)).phase).toBe("finished");
});

test("DexCode handles four private players, names, reloads, ties and a full three-round match", async ({
  page,
}) => {
  await start(page, "DexCode", 4);
  for (let round = 0; round < 3; round++) {
    for (let p = 0; p < 4; p++) {
      if (round === 0 && p === 1) await page.reload();
      await expect(
        page.getByRole("heading", {
          name: `Tocca a te, ${p === 1 ? "Misty" : `Giocatore ${p + 1}`}.`,
        }),
      ).toBeVisible();
      const m = await saved(page);
      const target = byId.get(m.targets[round])!;
      await expect(page.getByText(target.name, { exact: true })).toHaveCount(0);
      await page.getByRole("button", { name: "Sono pronto" }).click();
      await page.getByRole("combobox").fill(target.name);
      await page.getByRole("button", { name: "Conferma risposta" }).click();
    }
    await expect(
      page.getByRole("heading", { name: "Round completato!" }),
    ).toBeVisible();
    await expect(page.getByText("+150 pt", { exact: true })).toHaveCount(4);
    await page
      .getByRole("button", {
        name: round === 2 ? "Risultati finali" : "Prossimo round",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Una sfida alla pari!" }),
  ).toBeVisible();
  await expect(page.getByText("450 pt", { exact: true })).toHaveCount(4);
  await checkWidth(page);
});

test("Higher or Lower gives both players the same ten questions and completes a round", async ({
  page,
}) => {
  await start(page, "Higher or Lower", 2);
  const questions = (await saved(page)).questions.slice(0, 10);
  for (let p = 0; p < 2; p++) {
    if (p === 1) await page.reload();
    await page.getByRole("button", { name: "Sono pronto" }).click();
    for (let i = 0; i < 10; i++) {
      const m = await saved(page);
      const q = m.questions[m.questionIndex];
      expect(q).toEqual(questions[i]);
      const higher =
        statValue(byId.get(q.b)!, q.stat) >= statValue(byId.get(q.a)!, q.stat);
      await page
        .getByRole("button", {
          name: higher ? "Più alto" : "Più basso",
          exact: true,
        })
        .click();
      await expect(
        page.getByText("Esatto! +10 punti.", { exact: false }),
      ).toBeVisible();
      await page
        .getByRole("button", {
          name: i === 9 ? "Completa il turno" : "Prossima domanda",
          exact: true,
        })
        .click();
    }
  }
  await expect(
    page.getByRole("heading", { name: "Round completato!" }),
  ).toBeVisible();
  await expect(page.getByText("+100 pt", { exact: true })).toHaveCount(2);
  await page
    .getByRole("button", { name: "Prossimo round", exact: true })
    .click();
  expect((await saved(page)).round).toBe(2);
  await checkWidth(page);
});

test("all five games fit phone, tablet and desktop widths; added games pass accessibility scans", async ({
  page,
}) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(5);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await checkWidth(page);
  }
  for (const title of ["Pokédle", "DexCode", "Higher or Lower"]) {
    await page.evaluate(() => localStorage.clear());
    await start(page, title);
    for (const width of [320, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await checkWidth(page);
    }
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      scan.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
});
