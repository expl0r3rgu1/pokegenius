import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
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
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2,webmanifest}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/sprites\//, /^\/icons\//, /^\/assets\//],
      },
    }),
  ],
  test: { include: ["src/**/*.test.ts"] },
});
