import { api, authApi } from "./workers";

export const website = new sst.cloudflare.Astro("Web", {
  path: "packages/web/",
  link: [api, authApi],
});
