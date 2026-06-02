import { expect, test } from "vitest";
import { migrations } from "./schema";

test("declares the initial scaffold migration", () => {
  expect(migrations).toEqual([
    {
      id: "0001_empty",
      path: "migrations/0001_empty.sql",
      description: "Scaffold migration with no schema changes.",
    },
  ]);
});
