import { beforeEach, describe, expect, test, vi } from "vitest";
import { emptyPostBody } from "./post-body";
import {
  createPost,
  deletePost,
  listPosts,
  publishPost,
  updatePost,
} from "./post-api";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("post API helpers", () => {
  test("lists posts through the same-origin API proxy", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ posts: [] }));

    const result = await listPosts();

    expect(result).toEqual({
      ok: true,
      data: { posts: [] },
      status: 200,
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/posts", {
      credentials: "same-origin",
    });
  });

  test("creates posts with title and body JSON", async () => {
    const bodyJson = emptyPostBody();
    fetchMock.mockResolvedValueOnce(jsonResponse({ post: { id: "post-1" } }, { status: 201 }));

    await createPost({ title: "Club news", bodyJson });

    expect(fetchMock).toHaveBeenCalledWith("/api/posts", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Club news", bodyJson }),
    });
  });

  test("updates posts with title and body JSON", async () => {
    const bodyJson = emptyPostBody();
    fetchMock.mockResolvedValueOnce(jsonResponse({ post: { id: "post/1" } }));

    await updatePost("post/1", { title: "Updated", bodyJson });

    expect(fetchMock).toHaveBeenCalledWith("/api/posts/post%2F1", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated", bodyJson }),
    });
  });

  test("publishes posts as member-only by default", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ post: { id: "post-1" } }));

    await publishPost("post-1");

    expect(fetchMock).toHaveBeenCalledWith("/api/posts/post-1/publish", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ makePublic: false }),
    });
  });

  test("supports explicit admin public publish", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ post: { id: "post-1" } }));

    await publishPost("post-1", { makePublic: true });

    expect(fetchMock).toHaveBeenCalledWith("/api/posts/post-1/publish", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ makePublic: true }),
    });
  });

  test("deletes posts with a bodyless DELETE request", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ post: { id: "post-1" } }));

    await deletePost("post-1");

    expect(fetchMock).toHaveBeenCalledWith("/api/posts/post-1", {
      method: "DELETE",
      credentials: "same-origin",
    });
  });

  test("normalizes stable API errors", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "API_VALIDATION_FAILED", fields: ["bodyJson"] } },
        { status: 400 },
      ),
    );

    const result = await createPost({ title: "", bodyJson: emptyPostBody() });

    expect(result).toEqual({
      ok: false,
      code: "API_VALIDATION_FAILED",
      fields: ["bodyJson"],
      status: 400,
    });
  });

  test("normalizes fetch failures as network errors", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));

    const result = await listPosts();

    expect(result).toEqual({
      ok: false,
      code: "NETWORK_ERROR",
      status: 0,
    });
  });
});

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" },
    ...init,
  });
}
