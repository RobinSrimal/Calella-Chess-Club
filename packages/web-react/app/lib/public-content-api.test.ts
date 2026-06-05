import { beforeEach, describe, expect, test, vi } from "vitest";
import { listPublicPosts } from "./public-content-api";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("public content API helpers", () => {
  test("lists public posts through the same-origin API proxy", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ posts: [] }));

    const result = await listPublicPosts();

    expect(result).toEqual({
      ok: true,
      data: { posts: [] },
      status: 200,
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/public/posts", {
      credentials: "same-origin",
    });
  });

  test("normalizes public post API errors", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { code: "API_ROUTE_NOT_FOUND" } }, { status: 404 }),
    );

    const result = await listPublicPosts();

    expect(result).toEqual({
      ok: false,
      code: "API_ROUTE_NOT_FOUND",
      status: 404,
    });
  });
});

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" },
    ...init,
  });
}
