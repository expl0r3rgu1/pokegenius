import { expect, test, type Page } from "@playwright/test";
import { answersFor, type Match } from "../src/game";
import dex from "../src/data/pokemon.json" with { type: "json" };
const saved = (page: Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("pokegenius.match.v1")!) as Match,
  );
async function openSetup(page: Page, game: string) {
  await page.goto("/");
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: game, exact: true }) })
    .getByRole("button", { name: "Gioca", exact: true })
    .click();
}
async function visibleWithoutScroll(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(
    await page.evaluate(() => innerHeight),
  );
}

test("DexCode suggestions contain names only and keep every Pokédex number out of the answer list", async ({
  page,
}) => {
  await openSetup(page, "DexCode");
  await page.getByRole("button", { name: "Si gioca!", exact: true }).click();
  await page.getByRole("combobox").fill("char");
  const options = page.getByRole("option");
  await expect(options).toHaveCount(4);
  expect(await options.allTextContents()).toEqual([
    "Charizard",
    "Charmander",
    "Charmeleon",
    "Chimchar",
  ]);
  await expect(page.getByRole("listbox")).not.toContainText("#");
  await expect(page.getByRole("listbox").getByRole("img")).toHaveCount(0);
});

test("two-player Pokédoku has no points or round selection and a tris wins immediately", async ({
  page,
}) => {
  await openSetup(page, "Pokédoku");
  await page.getByRole("button", { name: "Con un amico", exact: true }).click();
  await expect(page.getByText("Quanti round?", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Si gioca!", exact: true }).click();
  for (const cell of [0, 3, 1, 4, 2]) {
    await page.locator(".board-cell").nth(cell).click();
    const m = await saved(page);
    const p = answersFor(
      m.board,
      cell,
      dex.filter((p) => p.gen <= 4),
    )[0];
    await page.getByRole("combobox").fill(p.name);
    await page
      .getByRole("button", { name: "Conferma risposta", exact: true })
      .click();
    if (cell !== 2) {
      await expect(page.locator("#game-feedback")).not.toContainText("+10");
      await page
        .getByRole("button", { name: "Passa il dispositivo", exact: true })
        .click();
    }
  }
  await expect(
    page.getByRole("heading", { name: "Vince il giocatore 1!", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".cell-winning")).toHaveCount(3);
  await expect(
    page.locator(".scoreboard, .final-players, .round-recap"),
  ).toHaveCount(0);
  expect((await saved(page)).scores).toEqual([0, 0]);
  expect((await saved(page)).phase).toBe("finished");
  await page.reload();
  // A completed game returns to the room instead of opening a second board.
  await expect(page.getByRole("article")).toHaveCount(5);
});

test("compact phone layouts keep the game menu, grid and primary answer action within reach", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await visibleWithoutScroll(page, ".game-card:last-child");
  for (const game of [
    "Who's that Pokémon?",
    "Pokédoku",
    "DexCode",
    "Higher or Lower",
  ]) {
    await page.evaluate(() => localStorage.clear());
    await openSetup(page, game);
    await page.getByRole("button", { name: "Si gioca!", exact: true }).click();
    if (game === "Pokédoku") await page.locator(".board-cell").first().click();
    if (game === "Higher or Lower")
      await visibleWithoutScroll(page, ".stat-choices");
    else {
      await expect(page.getByRole("combobox")).toBeVisible();
      await visibleWithoutScroll(page, '.guess-form > button[type="submit"]');
    }
  }
});

test("WebHaptics is used for taps and can be disabled in settings", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    navigator.vibrate = () => {
      document.documentElement.dataset.hapticCalls = String(
        Number(document.documentElement.dataset.hapticCalls ?? "0") + 1,
      );
      return true;
    };
  });
  await page.getByRole("button", { name: "Impostazioni", exact: true }).click();
  await expect
    .poll(() => page.locator("html").getAttribute("data-haptic-calls"))
    .not.toBeNull();
  const vibration = page.getByRole("button", {
    name: "Vibrazione ON",
    exact: true,
  });
  await expect(vibration).toHaveAttribute("aria-pressed", "true");
  await vibration.click();
  await expect(
    page.getByRole("button", { name: "Vibrazione OFF", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Chiudi", exact: true }).click();
  const count = await page.locator("html").getAttribute("data-haptic-calls");
  await page.getByRole("button", { name: "Impostazioni", exact: true }).click();
  expect(await page.locator("html").getAttribute("data-haptic-calls")).toBe(
    count,
  );
});

test.describe("installed app and offline play", () => {
  test.use({ serviceWorkers: "allow" });
  test("manifest, app icons and all game assets support a fresh offline launch", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    const manifest = await page.evaluate(async () => {
      const link = document.querySelector<HTMLLinkElement>(
        'link[rel="manifest"]',
      );
      if (!link) throw new Error("No manifest");
      return (await fetch(link.href)).json();
    });
    expect(manifest.name).toBe("PokéGenius");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ]),
    );
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller)
        await new Promise<void>((resolve) =>
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => resolve(),
            { once: true },
          ),
        );
    });
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("article")).toHaveCount(5);
    await expect(page.locator(".room-mascot")).toBeVisible();
    expect(
      await page.evaluate(async () => (await fetch("/sprites/1025.png")).ok),
    ).toBe(true);
    await page
      .getByRole("article")
      .filter({
        has: page.getByRole("heading", { name: "DexCode", exact: true }),
      })
      .getByRole("button", { name: "Gioca", exact: true })
      .click();
    await page.getByRole("button", { name: "Si gioca!", exact: true }).click();
    await page.getByRole("combobox").fill("Pikachu");
    await page
      .getByRole("button", { name: "Conferma risposta", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Round completato!", exact: true }),
    ).toBeVisible();
  });
});

test("opening the phone keyboard keeps the selected categories and answer controls in the usable area", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openSetup(page, "Pokédoku");
  await page.getByRole("button", { name: "Si gioca!", exact: true }).click();
  await page.locator(".board-cell").first().click();
  await page.getByRole("combobox").focus();
  await page.evaluate(() => {
    if (!window.visualViewport) throw new Error("Visual viewport unavailable");
    Object.defineProperty(window.visualViewport, "height", {
      configurable: true,
      get: () => 360,
    });
    window.visualViewport.dispatchEvent(new Event("resize"));
  });
  await expect(page.locator("html")).toHaveClass(/keyboard-open/);
  await expect(
    page.getByRole("group", { name: "Griglia Pokédoku" }),
  ).toBeHidden();
  await expect(page.locator(".board-instruction")).toContainText("+");
  const button = await page
    .locator('.guess-form > button[type="submit"]')
    .boundingBox();
  expect(button!.y + button!.height).toBeLessThanOrEqual(360);
});

test("install action uses the browser prompt when available and recognizes installation", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        document.documentElement.dataset.installPrompt = "opened";
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
  });
  await page
    .getByRole("button", { name: "Installa il gioco", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-install-prompt",
    "opened",
  );
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(
    page.getByRole("button", { name: "Installa il gioco", exact: true }),
  ).toHaveCount(0);
});
