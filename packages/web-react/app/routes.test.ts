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

  test("registers explicit account utility routes without dynamic proxy collisions", () => {
    const source = readFileSync(new URL("./routes.ts", import.meta.url), "utf8");

    expect(source).toContain('route("ca/verify-email", "routes/verify-email.tsx"');
    expect(source).toContain('route("es/verify-email", "routes/verify-email.tsx"');
    expect(source).toContain('route("en/verify-email", "routes/verify-email.tsx"');
    expect(source).not.toContain('route(":locale/verify-email"');

    expect(source).toContain(
      'route("ca/forgot-password", "routes/forgot-password.tsx"',
    );
    expect(source).toContain(
      'route("es/forgot-password", "routes/forgot-password.tsx"',
    );
    expect(source).toContain(
      'route("en/forgot-password", "routes/forgot-password.tsx"',
    );
    expect(source).not.toContain('route(":locale/forgot-password"');

    expect(source).toContain(
      'route("ca/reset-password", "routes/reset-password.tsx"',
    );
    expect(source).toContain(
      'route("es/reset-password", "routes/reset-password.tsx"',
    );
    expect(source).toContain(
      'route("en/reset-password", "routes/reset-password.tsx"',
    );
    expect(source).not.toContain('route(":locale/reset-password"');
  });

  test("registers explicit admin user routes without dynamic proxy collisions", () => {
    const source = readFileSync(new URL("./routes.ts", import.meta.url), "utf8");

    expect(source).toContain('route("ca/admin/users", "routes/admin-users.tsx"');
    expect(source).toContain('route("es/admin/users", "routes/admin-users.tsx"');
    expect(source).toContain('route("en/admin/users", "routes/admin-users.tsx"');
    expect(source).not.toContain('route(":locale/admin/users"');
  });
});
