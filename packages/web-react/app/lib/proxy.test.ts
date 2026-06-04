import { describe, expect, test } from "vitest";
import type { RequestInit as CloudflareRequestInit } from "@cloudflare/workers-types";
import { forwardToBinding } from "./proxy";

describe("same-origin proxy forwarding", () => {
  test("forwards matching prefix paths with query strings", async () => {
    let forwardedUrl: URL | undefined;
    let forwardedInit: CloudflareRequestInit | undefined;
    const binding = {
      async fetch(input: URL, init?: CloudflareRequestInit) {
        forwardedUrl = input;
        forwardedInit = init;
        return Response.json({ ok: true }, { status: 202 });
      },
    };

    const response = await forwardToBinding(
      binding,
      new Request("https://club.example/api/posts?visibility=public"),
      "/api",
    );

    expect(response.status).toBe(202);
    expect(forwardedUrl?.toString()).toBe(
      "https://binding.internal/api/posts?visibility=public",
    );
    expect(forwardedInit?.method).toBe("GET");
  });

  test("rejects requests outside the configured prefix", async () => {
    const binding = {
      async fetch() {
        return Response.json({ ok: true });
      },
    };

    const response = await forwardToBinding(
      binding,
      new Request("https://club.example/api/posts"),
      "/auth",
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "REACT_WEB_PROXY_ROUTE_NOT_FOUND" },
    });
  });

  test("preserves method headers and JSON body for unsafe requests", async () => {
    let forwardedUrl: URL | undefined;
    let forwardedInit: CloudflareRequestInit | undefined;
    const binding = {
      async fetch(input: URL, init?: CloudflareRequestInit) {
        forwardedUrl = input;
        forwardedInit = init;
        return new Response(JSON.stringify({ created: true }), {
          status: 201,
          headers: { "content-type": "application/json" },
        });
      },
    };
    const body = JSON.stringify({ title: "Torneig social" });

    const response = await forwardToBinding(
      binding,
      new Request("https://club.example/api/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "ccc_access_token=token",
        },
        body,
      }),
      "/api",
    );

    expect(response.status).toBe(201);
    expect(forwardedUrl?.toString()).toBe("https://binding.internal/api/posts");
    expect(forwardedInit?.method).toBe("POST");
    const headers = forwardedInit?.headers as Headers;
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("cookie")).toBe("ccc_access_token=token");
    expect(new TextDecoder().decode(forwardedInit?.body as ArrayBuffer)).toBe(body);
  });
});
