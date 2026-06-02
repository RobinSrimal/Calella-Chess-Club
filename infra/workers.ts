import { database } from "./db";

export const authApi = new sst.cloudflare.Worker("AuthApi", {
  handler: "packages/functions/src/auth.ts",
  link: [database],
  url: true,
});

export const api = new sst.cloudflare.Worker("Api", {
  handler: "packages/functions/src/api.ts",
  link: [database],
  url: true,
});
