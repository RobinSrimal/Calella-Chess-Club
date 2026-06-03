import { expect, test } from "vitest";
import {
  signAccessJwt,
  verifyAccessJwt,
} from "./jwt";

test("signs and verifies access JWTs with a user id and expiry", async () => {
  const token = await signAccessJwt({
    secret: "jwt-secret",
    userId: "user-1",
    issuedAt: new Date("2026-06-03T08:00:00.000Z"),
    expiresAt: new Date("2026-06-03T10:00:00.000Z"),
  });

  expect(token.split(".")).toHaveLength(3);
  await expect(
    verifyAccessJwt(token, {
      secret: "jwt-secret",
      now: new Date("2026-06-03T09:00:00.000Z"),
    }),
  ).resolves.toEqual({
    ok: true,
    userId: "user-1",
  });
});

test("rejects tampered and expired access JWTs", async () => {
  const token = await signAccessJwt({
    secret: "jwt-secret",
    userId: "user-1",
    issuedAt: new Date("2026-06-03T08:00:00.000Z"),
    expiresAt: new Date("2026-06-03T10:00:00.000Z"),
  });

  const [header, payload] = token.split(".");
  const tampered = [header, payload, "wrong-signature"].join(".");

  await expect(
    verifyAccessJwt(tampered, {
      secret: "jwt-secret",
      now: new Date("2026-06-03T09:00:00.000Z"),
    }),
  ).resolves.toEqual({ ok: false });
  await expect(
    verifyAccessJwt(token, {
      secret: "jwt-secret",
      now: new Date("2026-06-03T10:00:00.000Z"),
    }),
  ).resolves.toEqual({ ok: false });
});
