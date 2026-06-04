import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { runLiveWebAuthCheck } from "./live-web-auth-check";

test("reads the ReactWeb linked resource instead of the removed Astro Web resource", () => {
  const source = readFileSync(
    new URL("./live-web-auth-check.ts", import.meta.url),
    "utf8",
  );

  expect(source).toContain("Resource.ReactWeb");
  expect(source).not.toContain("Resource.Web");
  expect(source).toContain("Missing Resource.ReactWeb.url.");
});

test("creates a verified user, logs in through Web, checks /api/me, and cleans up", async () => {
  const queries: Array<{ sql: string; params: string[] }> = [];
  const fetches: Array<{ url: string; init?: RequestInit }> = [];

  const result = await runLiveWebAuthCheck({
    webOrigin: "https://web.example",
    now: () => new Date("2026-06-03T12:00:00.000Z"),
    suffix: () => "abc123",
    hashPassword: async () => "hashed-password",
    queryD1: async (sql, params = []) => {
      queries.push({ sql, params });
      return [];
    },
    fetch: async (url, init) => {
      fetches.push({ url: String(url), init });

      if (String(url) === "https://web.example/auth/login") {
        const headers = new Headers();
        headers.append(
          "set-cookie",
          "ccc_access_token=access-token; Path=/api",
        );
        headers.append(
          "set-cookie",
          "ccc_refresh_token=refresh-token; Path=/auth",
        );
        return Response.json(
          { user: { username: "livewebabc123" } },
          { headers },
        );
      }

      return Response.json({
        user: {
          username: "livewebabc123",
        },
      });
    },
  });

  expect(result).toEqual({
    username: "livewebabc123",
    loginStatus: 200,
    meStatus: 200,
  });
  expect(fetches[0]).toMatchObject({
    url: "https://web.example/auth/login",
  });
  expect(JSON.parse(String(fetches[0].init?.body))).toEqual({
    usernameOrEmail: "livewebabc123",
    password: "correct horse battery staple",
  });
  expect(fetches[1]).toMatchObject({
    url: "https://web.example/api/me",
  });
  expect(fetches[1].init?.headers).toEqual({
    cookie: "ccc_access_token=access-token; ccc_refresh_token=refresh-token",
  });
  expect(queries.map((query) => query.sql)).toEqual([
    expect.stringContaining("INSERT INTO users"),
    "DELETE FROM login_attempts WHERE username_or_email_normalized = ?",
    "DELETE FROM refresh_sessions WHERE user_id = ?",
    "DELETE FROM users WHERE id = ?",
  ]);
});

test("cleans up the temporary user when login fails", async () => {
  const queries: Array<{ sql: string; params: string[] }> = [];

  await expect(
    runLiveWebAuthCheck({
      webOrigin: "https://web.example",
      now: () => new Date("2026-06-03T12:00:00.000Z"),
      suffix: () => "abc123",
      hashPassword: async () => "hashed-password",
      queryD1: async (sql, params = []) => {
        queries.push({ sql, params });
        return [];
      },
      fetch: async () =>
        Response.json(
          { error: { code: "AUTH_INVALID_CREDENTIALS" } },
          { status: 401 },
        ),
    }),
  ).rejects.toThrow("Login failed");

  expect(queries.map((query) => query.sql)).toEqual([
    expect.stringContaining("INSERT INTO users"),
    "DELETE FROM login_attempts WHERE username_or_email_normalized = ?",
    "DELETE FROM refresh_sessions WHERE user_id = ?",
    "DELETE FROM users WHERE id = ?",
  ]);
});
