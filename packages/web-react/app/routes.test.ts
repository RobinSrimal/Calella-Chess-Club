import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("route config", () => {
  test("registers root and localized login routes", () => {
    const source = readFileSync(new URL("./routes.ts", import.meta.url), "utf8");

    expect(source).toContain('route("login", "routes/login.tsx"');
    expect(source).toContain('route("ca/login", "routes/login.tsx"');
    expect(source).toContain('route("es/login", "routes/login.tsx"');
    expect(source).toContain('route("en/login", "routes/login.tsx"');
    expect(source).not.toContain('route(":locale/login"');
  });

  test("registers root and localized registration routes", () => {
    const source = readFileSync(new URL("./routes.ts", import.meta.url), "utf8");

    expect(source).toContain('route("register", "routes/register.tsx"');
    expect(source).toContain('route("ca/register", "routes/register.tsx"');
    expect(source).toContain('route("es/register", "routes/register.tsx"');
    expect(source).toContain('route("en/register", "routes/register.tsx"');
    expect(source).not.toContain('route(":locale/register"');
  });
});
