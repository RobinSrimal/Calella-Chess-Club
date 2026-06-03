import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    configPath: process.env.SST_WRANGLER_PATH,
    imageService: "compile",
  }),
  integrations: [react()],
});
