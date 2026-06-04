import { api, authApi } from "./workers";

export const website = new sst.cloudflare.Astro("Web", {
  path: "packages/web/",
  link: [api, authApi],
});

export const reactWebsite = new sst.cloudflare.ReactRouter("ReactWeb", {
  path: "packages/web-react/",
  link: [api, authApi],
  transform: {
    server: {
      compatibility: {
        date: "2025-08-15",
        flags: ["nodejs_compat"],
      },
    },
  },
});
