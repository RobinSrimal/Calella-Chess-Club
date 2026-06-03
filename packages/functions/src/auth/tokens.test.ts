import { expect, test } from "vitest";
import { createVerificationToken, hashToken } from "./tokens";

test("hashes verification tokens without exposing the raw token", async () => {
  const hash = await hashToken("raw-token-value");

  expect(hash).not.toContain("raw-token-value");
  expect(hash).toMatch(/^[A-Za-z0-9_-]{43}$/);
  await expect(hashToken("raw-token-value")).resolves.toBe(hash);
});

test("creates high entropy verification tokens and hashes", async () => {
  const created = await createVerificationToken({
    randomBytes(length) {
      return new Uint8Array(Array.from({ length }, (_, index) => index));
    },
  });

  expect(created.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(created.tokenHash).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(created.tokenHash).not.toBe(created.token);
});
