import { expect, test } from "vitest";
import { PASSWORD_HASH_ALGORITHM, hashPassword, verifyPassword } from "./password";

test("hashes passwords with bcrypt and a server-side pepper", async () => {
  const result = await hashPassword("correct horse battery staple", "pepper", {
    cost: 4,
  });

  expect(result.algorithm).toBe(PASSWORD_HASH_ALGORITHM);
  expect(result.hash).toMatch(/^\$2[aby]\$/);
  expect(result.hash).not.toContain("correct horse battery staple");
  await expect(
    verifyPassword("correct horse battery staple", "pepper", result.hash),
  ).resolves.toBe(true);
  await expect(
    verifyPassword("correct horse battery staple", "wrong-pepper", result.hash),
  ).resolves.toBe(false);
});
