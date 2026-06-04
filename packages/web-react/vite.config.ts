import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    manifest: true,
  },
  environments: {
    ssr: {
      build: {
        manifest: true,
      },
      resolve: {
        external: [],
      },
    },
  },
  plugins: [
    cloudflare({
        viteEnvironment: { name: "ssr" },
        configPath: process.env.SST_WRANGLER_PATH ?? "wrangler.local.jsonc",
      }),
    tailwindcss(),
    reactRouter(),
  ],
});
