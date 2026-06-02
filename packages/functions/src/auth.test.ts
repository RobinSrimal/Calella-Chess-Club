import { expect, test } from "vitest";
import { handleAuthRequest } from "./auth";

test("GET /auth/health returns auth service status", async () => {
  const response = await handleAuthRequest(
    new Request("https://calella-chess-club.test/auth/health"),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  await expect(response.json()).resolves.toEqual({
    service: "auth",
    status: "ok",
  });
});

test("unsupported auth routes return a stable error code", async () => {
  const response = await handleAuthRequest(
    new Request("https://calella-chess-club.test/auth/login", {
      method: "POST",
    }),
  );

  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  await expect(response.json()).resolves.toEqual({
    error: {
      code: "AUTH_ROUTE_NOT_FOUND",
    },
  });
});
