import { expect, test } from "vitest";
import { forwardToBinding } from "./proxy";

test("forwards request method path query headers cookies and body", async () => {
  let forwardedRequest: Request | undefined;
  const binding = {
    async fetch(input: URL, init?: RequestInit) {
      forwardedRequest = new Request(input, init);
      return Response.json({ ok: true });
    },
  };
  const request = new Request("https://club.example/auth/login?next=member", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: "ccc_refresh_token=refresh-token",
      "x-forwarded-host": "club.example",
    },
    body: JSON.stringify({ username: "anna", password: "secret" }),
  });

  const response = await forwardToBinding(binding, request, "/auth");

  expect(response.status).toBe(200);
  expect(forwardedRequest).toBeDefined();
  expect(forwardedRequest?.method).toBe("POST");
  expect(forwardedRequest?.url).toBe("https://binding.internal/auth/login?next=member");
  expect(forwardedRequest?.headers.get("content-type")).toBe("application/json");
  expect(forwardedRequest?.headers.get("cookie")).toBe(
    "ccc_refresh_token=refresh-token",
  );
  expect(forwardedRequest?.headers.get("x-forwarded-host")).toBe("club.example");
  expect(await forwardedRequest?.text()).toBe(
    JSON.stringify({ username: "anna", password: "secret" }),
  );
});

test("preserves set-cookie response headers from the target binding", async () => {
  const binding = {
    async fetch() {
      const headers = new Headers();
      headers.append("set-cookie", "ccc_access_token=access; Path=/api; HttpOnly");
      headers.append(
        "set-cookie",
        "ccc_refresh_token=refresh; Path=/auth; HttpOnly",
      );
      headers.set("content-type", "application/json");
      return new Response(JSON.stringify({ user: { username: "anna" } }), {
        status: 200,
        headers,
      });
    },
  };

  const response = await forwardToBinding(
    binding,
    new Request("https://club.example/auth/login", { method: "POST" }),
    "/auth",
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/json");
  expect(response.headers.getSetCookie()).toEqual([
    "ccc_access_token=access; Path=/api; HttpOnly",
    "ccc_refresh_token=refresh; Path=/auth; HttpOnly",
  ]);
  expect(await response.json()).toEqual({ user: { username: "anna" } });
});

test("rejects requests outside the configured prefix", async () => {
  const binding = {
    async fetch() {
      return Response.json({ ok: true });
    },
  };

  const response = await forwardToBinding(
    binding,
    new Request("https://club.example/api/me"),
    "/auth",
  );

  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({
    error: { code: "WEB_PROXY_ROUTE_NOT_FOUND" },
  });
});
