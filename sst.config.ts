/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "CCC",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: { cloudflare: "6.17.0" },
    };
  },
  async run() {
    const storage = await import("./infra/storage");
    await import("./infra/api");
    return {
      MyBucket: storage.bucket.name,
    };
  },
});
