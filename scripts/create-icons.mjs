import { chromium } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
const svg = await readFile(
  new URL("../public/favicon.svg", import.meta.url),
  "utf8",
);
await mkdir(new URL("../public/icons/", import.meta.url), { recursive: true });
const browser = await chromium.launch();
try {
  for (const [size, name] of [
    [192, "icon-192"],
    [512, "icon-512"],
    [512, "maskable-512"],
    [180, "apple-touch-icon"],
  ]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<html><head><style>body{margin:0}svg{display:block;width:100vw;height:100vh}</style></head><body>${svg}</body></html>`,
    );
    await page.screenshot({
      path: new URL(`../public/icons/${name}.png`, import.meta.url).pathname,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
