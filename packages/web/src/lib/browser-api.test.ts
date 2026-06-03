import { expect, test } from "vitest";
import {
  createPost,
  deletePost,
  getCurrentUser,
  listPosts,
  loginUser,
  publishPost,
  registerUser,
  updatePost,
} from "./browser-api";

test("registerUser posts registration data with same-origin credentials", async () => {
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const fetchFn = async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });
    return Response.json(
      {
        user: {
          id: "user-1",
          username: "anna",
          email: "anna@example.com",
          emailVerified: false,
          membershipStatus: "none",
          role: "user",
        },
      },
      { status: 201 },
    );
  };

  const result = await registerUser(
    {
      username: "anna",
      email: "anna@example.com",
      password: "password123",
      locale: "ca",
    },
    fetchFn,
  );

  expect(result.ok).toBe(true);
  expect(requests).toHaveLength(1);
  expect(requests[0].input).toBe("/auth/register");
  expect(requests[0].init?.method).toBe("POST");
  expect(requests[0].init?.credentials).toBe("same-origin");
  expect(requests[0].init?.headers).toEqual({
    "content-type": "application/json",
  });
  expect(JSON.parse(String(requests[0].init?.body))).toEqual({
    username: "anna",
    email: "anna@example.com",
    password: "password123",
    locale: "ca",
  });
});

test("loginUser normalizes stable auth error responses", async () => {
  const result = await loginUser(
    { usernameOrEmail: "anna", password: "wrong-password" },
    async () =>
      Response.json(
        { error: { code: "AUTH_INVALID_CREDENTIALS" } },
        { status: 401 },
      ),
  );

  expect(result).toEqual({
    ok: false,
    status: 401,
    code: "AUTH_INVALID_CREDENTIALS",
    fields: [],
  });
});

test("loginUser posts usernameOrEmail with same-origin credentials", async () => {
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  await loginUser(
    { usernameOrEmail: "anna@example.com", password: "password123" },
    async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ input, init });
      return Response.json({
        user: {
          id: "user-1",
          username: "anna",
          email: "anna@example.com",
          emailVerified: true,
          membershipStatus: "member",
          role: "user",
        },
      });
    },
  );

  expect(requests).toHaveLength(1);
  expect(requests[0].input).toBe("/auth/login");
  expect(requests[0].init?.method).toBe("POST");
  expect(requests[0].init?.credentials).toBe("same-origin");
  expect(JSON.parse(String(requests[0].init?.body))).toEqual({
    usernameOrEmail: "anna@example.com",
    password: "password123",
  });
});

test("getCurrentUser reads /api/me with same-origin credentials", async () => {
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const fetchFn = async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });
    return Response.json({
      user: {
        id: "user-1",
        username: "admin",
        email: "admin@example.com",
        emailVerified: true,
        membershipStatus: "member",
        role: "admin",
      },
    });
  };

  const result = await getCurrentUser(fetchFn);

  expect(result.ok).toBe(true);
  expect(requests).toEqual([
    {
      input: "/api/me",
      init: {
        method: "GET",
        credentials: "same-origin",
      },
    },
  ]);
});

test("listPosts reads member-visible posts with same-origin credentials", async () => {
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  const result = await listPosts(async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });
    return Response.json({ posts: [memberPost()] });
  });

  expect(result.ok).toBe(true);
  expect(requests).toEqual([
    {
      input: "/api/posts",
      init: {
        method: "GET",
        credentials: "same-origin",
      },
    },
  ]);
});

test("createPost posts title and body JSON with same-origin credentials", async () => {
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  const result = await createPost(
    {
      title: "Club night",
      bodyJson: postBodyJson(),
    },
    async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ input, init });
      return Response.json({ post: memberPost({ title: "Club night" }) }, { status: 201 });
    },
  );

  expect(result.ok).toBe(true);
  expect(requests).toHaveLength(1);
  expect(requests[0].input).toBe("/api/posts");
  expect(requests[0].init?.method).toBe("POST");
  expect(requests[0].init?.credentials).toBe("same-origin");
  expect(requests[0].init?.headers).toEqual({
    "content-type": "application/json",
  });
  expect(JSON.parse(String(requests[0].init?.body))).toEqual({
    title: "Club night",
    bodyJson: postBodyJson(),
  });
});

test("updatePost writes an existing post draft with same-origin credentials", async () => {
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  await updatePost(
    "post-1",
    {
      title: "Updated",
      bodyJson: postBodyJson("Updated paragraph."),
    },
    async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ input, init });
      return Response.json({ post: memberPost({ title: "Updated" }) });
    },
  );

  expect(requests).toHaveLength(1);
  expect(requests[0].input).toBe("/api/posts/post-1");
  expect(requests[0].init?.method).toBe("PUT");
  expect(requests[0].init?.credentials).toBe("same-origin");
  expect(JSON.parse(String(requests[0].init?.body))).toEqual({
    title: "Updated",
    bodyJson: postBodyJson("Updated paragraph."),
  });
});

test("publishPost always keeps member posts member-only", async () => {
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  await publishPost("post-1", async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });
    return Response.json({
      post: memberPost({
        status: "published",
        publishedAt: "2026-06-03T10:00:00.000Z",
      }),
    });
  });

  expect(requests).toHaveLength(1);
  expect(requests[0].input).toBe("/api/posts/post-1/publish");
  expect(requests[0].init?.method).toBe("POST");
  expect(requests[0].init?.credentials).toBe("same-origin");
  expect(JSON.parse(String(requests[0].init?.body))).toEqual({
    makePublic: false,
  });
});

test("deletePost soft-deletes a post with same-origin credentials", async () => {
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  await deletePost("post-1", async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });
    return Response.json({
      post: memberPost({
        status: "deleted",
        deletedAt: "2026-06-03T10:00:00.000Z",
      }),
    });
  });

  expect(requests).toEqual([
    {
      input: "/api/posts/post-1",
      init: {
        method: "DELETE",
        credentials: "same-origin",
      },
    },
  ]);
});

test("returns a client error when fetch fails before a response is available", async () => {
  const result = await loginUser(
    { usernameOrEmail: "anna", password: "password123" },
    async () => {
      throw new Error("network failed");
    },
  );

  expect(result).toEqual({
    ok: false,
    status: 0,
    code: "WEB_REQUEST_FAILED",
    fields: [],
  });
});

function memberPost(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    authorId: "user-1",
    authorUsername: "anna",
    title: "Club night",
    bodyJson: postBodyJson(),
    status: "draft",
    isPublic: false,
    publishedAt: null,
    createdAt: "2026-06-03T09:00:00.000Z",
    updatedAt: "2026-06-03T09:00:00.000Z",
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

function postBodyJson(text = "First paragraph.") {
  return [
    {
      type: "paragraph",
      content: [{ type: "text", text, styles: {} }],
      children: [],
    },
  ];
}
