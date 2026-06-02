/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "CCC",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "cloudflare",
      providers: { cloudflare: "6.17.0" },
    };
  },
  async run() {
    const db = await import("./infra/db");
    const workers = await import("./infra/workers");
    const web = await import("./infra/web");
    return {
      DatabaseId: db.database.databaseId,
      AuthApiUrl: workers.authApi.url,
      ApiUrl: workers.api.url,
      WebUrl: web.website.url,
    };
  },
});
