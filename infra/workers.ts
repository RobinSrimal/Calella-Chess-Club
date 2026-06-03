import { database } from "./db";
import {
  jwtSigningSecret,
  passwordPepper,
  refreshTokenSecret,
  resendApiKey,
} from "./secrets";

export const authApi = new sst.cloudflare.Worker("AuthApi", {
  handler: "packages/functions/src/auth.ts",
  link: [
    database,
    passwordPepper,
    resendApiKey,
    jwtSigningSecret,
    refreshTokenSecret,
  ],
  environment: {
    EMAIL_FROM: "Calella Chess Club <onboarding@resend.dev>",
    WEB_ORIGIN:
      $app.stage === "production"
        ? "https://calellachessclub.com"
        : `https://ccc-${$app.stage}-webworkerscript.robin-srimal.workers.dev`,
  },
  url: true,
});

export const api = new sst.cloudflare.Worker("Api", {
  handler: "packages/functions/src/api.ts",
  link: [database, jwtSigningSecret],
  url: true,
});
