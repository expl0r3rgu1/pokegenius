import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
const spriteHash = createHash("sha256");
for (let id = 1; id <= 1025; id++)
  spriteHash.update(
    readFileSync(new URL(`./public/sprites/${id}.png`, import.meta.url)),
  );
export default defineConfig({
  define: {
    __SPRITE_HASH__: JSON.stringify(spriteHash.digest("hex").slice(0, 16)),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        id: "/",
        name: "PokéGenius",
        short_name: "PokéGenius",
        description:
          "Cinque giochi Pokémon, da solo o con gli amici. Anche offline.",
        lang: "it",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#171323",
        theme_color: "#171323",
        categories: ["games", "entertainment"],
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2,webmanifest}"],
        globIgnores: ["sprites/**"],
      },
    }),
  ],
  test: { include: ["src/**/*.test.ts"] },
});
