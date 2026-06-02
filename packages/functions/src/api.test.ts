import { expect, test } from "vitest";
import { handleApiRequest } from "./api";

test("GET /api/health returns api service status", async () => {
  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/health"),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  await expect(response.json()).resolves.toEqual({
    service: "api",
    status: "ok",
  });
});

test("unsupported api routes return a stable error code", async () => {
  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/me"),
  );

  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  await expect(response.json()).resolves.toEqual({
    error: {
      code: "API_ROUTE_NOT_FOUND",
    },
  });
});
