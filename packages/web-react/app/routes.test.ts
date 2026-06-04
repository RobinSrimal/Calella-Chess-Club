import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("route config", () => {
  test("registers root and localized login routes", () => {
    const source = readFileSync(new URL("./routes.ts", import.meta.url), "utf8");

    expect(source).toContain('route("login", "routes/login.tsx"');
    expect(source).toContain('route(":locale/login", "routes/login.tsx"');
  });
});
