import { expect, test, type Page } from "@playwright/test";
import dex from "../src/data/pokemon.json" with { type: "json" };
import { answersFor, type Match } from "../src/game";
const saved = async (page: Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("pokegenius.match.v1")!) as Match,
  );
async function setup(page: Page, game: "shadow" | "doku", players = 1) {
  await page.goto("/");
  await page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", {
        name: game === "shadow" ? "Who's that Pokémon?" : "Pokédoku",
        exact: true,
      }),
    })
    .getByRole("button", { name: "Gioca", exact: true })
    .click();
  if (players === 2)
    await page
      .getByRole("button", { name: "Con un amico", exact: true })
      .click();
  await page.getByRole("button", { name: "3", exact: true }).click();
  await page.getByRole("button", { name: "Si gioca!", exact: true }).click();
}
async function answer(page: Page, name: string) {
  await page.getByRole("combobox").fill(name);
  await page
    .getByRole("button", { name: "Conferma risposta", exact: true })
    .click();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("solo silhouettes: local-only assets, keyboard answers, refresh recovery, selected length and results", async ({
  page,
}) => {
  const external: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (
      new URL(request.url()).origin !==
      new URL(process.env.TEST_BASE_URL ?? "http://127.0.0.1:4175").origin
    )
      external.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await setup(page, "shadow");
  await noOverflow(page);
  for (let i = 0; i < 3; i++) {
    const match = await saved(page);
    const p = dex.find((p) => p.id === match.queue[match.index])!;
    expect(
      await page
        .getByRole("img", { name: "Sagoma del Pokémon da indovinare" })
        .getAttribute("alt"),
    ).not.toContain(p.name);
    await page.getByRole("combobox").fill(p.name);
    await page.getByRole("combobox").press("Enter");
    await expect(
      page.getByRole("heading", { name: "Colpo di genio!" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Continua", exact: true }).click();
    if (i === 0) {
      await page.reload();
      await expect(page.getByText("200", { exact: true })).toHaveCount(0);
    }
  }
  await expect(
    page.getByRole("heading", { name: "Un vero PokéGenius!" }),
  ).toBeVisible();
  await expect(page.locator(".solo-final-score")).toContainText("300");
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  await noOverflow(page);
  await page
    .getByRole("button", { name: "Sala giochi", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "I tuoi ultimi risultati" }),
  ).toBeVisible();
});

test("solo Pokédoku: selected cell, correct fill, locked miss, board end and next round", async ({
  page,
}) => {
  await setup(page, "doku");
  await noOverflow(page);
  for (let cell = 0; cell < 9; cell++) {
    await page.locator(".board-cell").nth(cell).click();
    if (cell === 0) {
      await page.getByRole("button", { name: "Non lo so, passo" }).click();
    } else {
      const match = await saved(page);
      const p = answersFor(
        match.board,
        cell,
        dex.filter((p) => p.gen <= 4),
      )[0];
      await answer(page, p.name);
    }
    await page.getByRole("button", { name: "Continua", exact: true }).click();
  }
  await expect(
    page.getByRole("heading", { name: "Griglia completata!" }),
  ).toBeVisible();
  await expect(page.locator(".board-cell").first()).toBeDisabled();
  await page.getByRole("button", { name: "Mostra soluzioni" }).click();
  await expect(page.locator(".cell-solution")).toHaveCount(1);
  await page.getByRole("button", { name: "Prossimo round" }).click();
  expect((await saved(page)).round).toBe(2);
  await noOverflow(page);
});

test("two-player Pokédoku: deadline persists across reload and starts the next turn once", async ({
  page,
}) => {
  await page.clock.install();
  await setup(page, "doku", 2);
  await expect(page.getByRole("timer")).toContainText("40s");
  await page.clock.fastForward(41000);
  await expect(
    page.getByRole("heading", { name: "Tempo scaduto!" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Tempo scaduto!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Passa il dispositivo" }).click();
  await expect(page.locator(".turn-banner")).toContainText("giocatore 2");
  await expect(page.getByRole("timer")).toContainText("40s");
});

test("two-player silhouettes: coin, steal, reveal, and generation settings", async ({
  page,
}) => {
  await page.clock.install();
  await setup(page, "shadow", 2);
  await page.getByRole("button", { name: "Lancia la moneta" }).click();
  await page.clock.fastForward(1200);
  await page.getByRole("button", { name: "Inizia il round" }).click();
  const initial = await saved(page);
  await page.getByRole("button", { name: "Non lo so, passo" }).click();
  await expect(
    page.getByRole("heading", { name: "Occasione di recupero!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Sagoma del Pokémon da indovinare" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Passa il dispositivo" }).click();
  const m = await saved(page);
  expect(m.player).not.toBe(initial.player);
  await answer(page, dex.find((p) => p.id === m.queue[m.index])!.name);
  await expect(
    page.getByRole("heading", { name: "Colpo di genio!" }),
  ).toBeVisible();
  await noOverflow(page);
});

test("setup prevents empty generation selection, rules dialog is keyboard accessible, language persists", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Come si gioca", exact: true })
    .last()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("article")
    .first()
    .getByRole("button", { name: "Gioca", exact: true })
    .click();
  await page.getByRole("button", { name: /I classici/ }).click();
  await expect(page.getByRole("button", { name: "Si gioca!" })).toBeDisabled();
  await page.getByRole("button", { name: "La nuova era" }).click();
  await expect(page.getByRole("button", { name: "Si gioca!" })).toBeEnabled();
  await noOverflow(page);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Switch to English" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("game room, setup and game controls meet automated accessibility checks", async ({
  page,
}) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const check = async () => {
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      scan.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  };
  await page.goto("/");
  await check();
  await page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "Pokédoku", exact: true }),
    })
    .getByRole("button", { name: "Gioca", exact: true })
    .click();
  await check();
  await page.getByRole("button", { name: "Si gioca!", exact: true }).click();
  await check();
  await page.locator(".board-cell").first().click();
  await check();
});

test("unavailable storage and a failed sprite have usable recovery paths", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  await page.route("**/sprites/*.png", (route) => route.abort());
  await setup(page, "shadow");
  await expect(
    page.getByText("Il browser non consente il salvataggio.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("La sagoma non si è caricata.")).toBeVisible();
  await expect(page.getByRole("combobox")).toBeDisabled();
  await page.unroute("**/sprites/*.png");
  await page.getByRole("button", { name: "Riprova", exact: true }).click();
  await expect(page.getByRole("combobox")).toBeEnabled();
  await page.getByRole("combobox").fill("pika");
  await page.getByRole("combobox").press("ArrowDown");
  await page.getByRole("combobox").press("Enter");
  await expect(page.getByRole("combobox")).toHaveValue("Pikachu");
  await page.getByRole("button", { name: "Conferma risposta" }).click();
  await expect(page.locator("#game-feedback")).toBeVisible();
});
