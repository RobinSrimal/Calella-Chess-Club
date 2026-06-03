import { expect, test, vi } from "vitest";
import apiWorker, { handleApiRequest } from "./api";
import { ACCESS_TOKEN_COOKIE } from "./auth/cookies";
import { signAccessJwt } from "./auth/jwt";

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

test("default API Worker fetch wraps the testable request handler", () => {
  expect(apiWorker.fetch).not.toBe(handleApiRequest);
});

test("GET /api/me returns the current user for a valid access JWT", async () => {
  const token = await signAccessJwt({
    secret: "jwt-secret",
    userId: "user-1",
    issuedAt: new Date("2026-06-03T08:00:00.000Z"),
    expiresAt: new Date("2026-06-03T10:00:00.000Z"),
  });
  const context = createApiTestContext({
    user: publicUser(),
  });

  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/me", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${token}`,
      },
    }),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    user: publicUser(),
  });
  expect(context.repository.findPublicUserById).toHaveBeenCalledWith("user-1");
});

test("GET /api/me rejects missing and invalid access JWTs", async () => {
  const missingResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/me"),
    createApiTestContext(),
  );

  expect(missingResponse.status).toBe(401);
  await expect(missingResponse.json()).resolves.toEqual({
    error: { code: "API_AUTH_REQUIRED" },
  });

  const invalidResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/me", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=not-a-jwt`,
      },
    }),
    createApiTestContext(),
  );

  expect(invalidResponse.status).toBe(401);
  await expect(invalidResponse.json()).resolves.toEqual({
    error: { code: "API_AUTH_INVALID" },
  });
});

test("GET /api/admin/users returns filtered admin user summaries for admins", async () => {
  const token = await accessTokenFor("admin-1");
  const context = createApiTestContext({
    currentUser: adminCurrentUser(),
    adminUsers: [adminUserSummary()],
  });

  const response = await handleApiRequest(
    new Request(
      "https://calella-chess-club.test/api/admin/users?membershipStatus=pending&role=user&accountStatus=active",
      {
        headers: {
          cookie: `${ACCESS_TOKEN_COOKIE}=${token}`,
        },
      },
    ),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    users: [adminUserSummary()],
  });
  expect(context.repository.listAdminUsers).toHaveBeenCalledWith({
    membershipStatus: "pending",
    role: "user",
    accountStatus: "active",
  });
});

test("GET /api/admin/users rejects invalid filters", async () => {
  const response = await handleApiRequest(
    new Request(
      "https://calella-chess-club.test/api/admin/users?membershipStatus=bad",
      {
        headers: {
          cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("admin-1")}`,
        },
      },
    ),
    createApiTestContext({
      currentUser: adminCurrentUser(),
    }),
  );

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: {
      code: "API_VALIDATION_FAILED",
      fields: ["membershipStatus"],
    },
  });
});

test("admin routes require a valid active admin user", async () => {
  const missingResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/admin/users"),
    createApiTestContext(),
  );

  expect(missingResponse.status).toBe(401);
  await expect(missingResponse.json()).resolves.toEqual({
    error: { code: "API_AUTH_REQUIRED" },
  });

  const invalidResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/admin/users", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=not-a-jwt`,
      },
    }),
    createApiTestContext(),
  );

  expect(invalidResponse.status).toBe(401);
  await expect(invalidResponse.json()).resolves.toEqual({
    error: { code: "API_AUTH_INVALID" },
  });

  const memberResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/admin/users", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
    }),
    createApiTestContext({
      currentUser: {
        ...currentUser(),
        role: "user",
      },
    }),
  );

  expect(memberResponse.status).toBe(403);
  await expect(memberResponse.json()).resolves.toEqual({
    error: { code: "API_FORBIDDEN" },
  });

  const disabledAdminResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/admin/users", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("admin-1")}`,
      },
    }),
    createApiTestContext({
      currentUser: {
        ...adminCurrentUser(),
        accountStatus: "disabled",
      },
    }),
  );

  expect(disabledAdminResponse.status).toBe(403);
  await expect(disabledAdminResponse.json()).resolves.toEqual({
    error: { code: "API_FORBIDDEN" },
  });
});

test("admin membership routes update membership states", async () => {
  const token = await accessTokenFor("admin-1");
  const transitions = [
    {
      path: "/api/admin/users/user-1/approve-membership",
      membershipStatus: "member",
    },
    {
      path: "/api/admin/users/user-1/reject-membership",
      membershipStatus: "rejected",
    },
    {
      path: "/api/admin/users/user-1/restore-membership",
      membershipStatus: "pending",
    },
  ] as const;

  for (const transition of transitions) {
    const context = createApiTestContext({
      currentUser: adminCurrentUser(),
      membershipUpdateResult: adminUserSummary({
        membershipStatus: transition.membershipStatus,
      }),
    });

    const response = await handleApiRequest(
      new Request(`https://calella-chess-club.test${transition.path}`, {
        method: "POST",
        headers: {
          cookie: `${ACCESS_TOKEN_COOKIE}=${token}`,
        },
      }),
      context,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: adminUserSummary({
        membershipStatus: transition.membershipStatus,
      }),
    });
    expect(context.repository.updateMembershipStatus).toHaveBeenCalledWith({
      userId: "user-1",
      membershipStatus: transition.membershipStatus,
      updatedAt: "2026-06-03T09:00:00.000Z",
    });
  }
});

test("admin membership routes reject unknown users", async () => {
  const response = await handleApiRequest(
    new Request(
      "https://calella-chess-club.test/api/admin/users/missing/approve-membership",
      {
        method: "POST",
        headers: {
          cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("admin-1")}`,
        },
      },
    ),
    createApiTestContext({
      currentUser: adminCurrentUser(),
      membershipUpdateResult: null,
    }),
  );

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
    error: { code: "API_USER_NOT_FOUND" },
  });
});

test("admin disable route disables accounts and revokes sessions", async () => {
  const context = createApiTestContext({
    currentUser: adminCurrentUser(),
    disableResult: adminUserSummary({
      accountStatus: "disabled",
      disabledAt: "2026-06-03T09:00:00.000Z",
      disabledBy: "admin-1",
    }),
  });

  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/admin/users/user-1/disable", {
      method: "POST",
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("admin-1")}`,
      },
    }),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    user: adminUserSummary({
      accountStatus: "disabled",
      disabledAt: "2026-06-03T09:00:00.000Z",
      disabledBy: "admin-1",
    }),
  });
  expect(context.repository.disableUserAndRevokeSessions).toHaveBeenCalledWith({
    userId: "user-1",
    disabledBy: "admin-1",
    disabledAt: "2026-06-03T09:00:00.000Z",
  });
});

test("post routes require a valid approved member or admin user", async () => {
  const missingResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/posts"),
    createApiTestContext(),
  );

  expect(missingResponse.status).toBe(401);
  await expect(missingResponse.json()).resolves.toEqual({
    error: { code: "API_AUTH_REQUIRED" },
  });

  const pendingResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/posts", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
    }),
    createApiTestContext({
      currentUser: currentUser(),
    }),
  );

  expect(pendingResponse.status).toBe(403);
  await expect(pendingResponse.json()).resolves.toEqual({
    error: { code: "API_FORBIDDEN" },
  });
});

test("GET /api/posts returns visible posts for members", async () => {
  const context = createApiTestContext({
    currentUser: memberCurrentUser(),
    posts: [post()],
  });

  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/posts", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
    }),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    posts: [post()],
  });
  expect(context.postRepository.listVisiblePosts).toHaveBeenCalledWith({
    userId: "user-1",
  });
});

test("POST /api/posts creates member-only drafts", async () => {
  const context = createApiTestContext({
    currentUser: memberCurrentUser(),
    postResult: post(),
  });

  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/posts", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
      body: JSON.stringify({
        title: "  Club night results  ",
        bodyJson: POST_BODY_JSON_INPUT,
      }),
    }),
    context,
  );

  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual({
    post: post(),
  });
  expect(context.postRepository.createPostDraft).toHaveBeenCalledWith({
    id: "post-1",
    authorId: "user-1",
    title: "Club night results",
    bodyJsonSerialized: POST_BODY_JSON_SERIALIZED,
    createdAt: "2026-06-03T09:00:00.000Z",
  });
});

test("POST /api/posts rejects invalid draft bodies", async () => {
  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/posts", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
      body: JSON.stringify({
        title: "",
        bodyJson: [],
      }),
    }),
    createApiTestContext({
      currentUser: memberCurrentUser(),
    }),
  );

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: {
      code: "API_VALIDATION_FAILED",
      fields: ["title", "bodyJson"],
    },
  });
});

test("GET /api/posts/:id returns visible posts or a stable not-found error", async () => {
  const context = createApiTestContext({
    currentUser: memberCurrentUser(),
    postResult: post(),
  });

  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/posts/post-1", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
    }),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    post: post(),
  });
  expect(context.postRepository.findVisiblePostById).toHaveBeenCalledWith({
    postId: "post-1",
    userId: "user-1",
  });

  const notFoundResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/posts/missing", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
    }),
    createApiTestContext({
      currentUser: memberCurrentUser(),
      postResult: null,
    }),
  );

  expect(notFoundResponse.status).toBe(404);
  await expect(notFoundResponse.json()).resolves.toEqual({
    error: { code: "API_POST_NOT_FOUND" },
  });
});

test("PUT /api/posts/:id edits the caller's own post", async () => {
  const context = createApiTestContext({
    currentUser: memberCurrentUser(),
    postResult: post({ title: "Updated title", bodyJson: UPDATED_POST_BODY_JSON }),
  });

  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/posts/post-1", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
      body: JSON.stringify({
        title: "Updated title",
        bodyJson: UPDATED_POST_BODY_JSON_INPUT,
      }),
    }),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    post: post({ title: "Updated title", bodyJson: UPDATED_POST_BODY_JSON }),
  });
  expect(context.postRepository.updateOwnPost).toHaveBeenCalledWith({
    postId: "post-1",
    authorId: "user-1",
    title: "Updated title",
    bodyJsonSerialized: UPDATED_POST_BODY_JSON_SERIALIZED,
    updatedAt: "2026-06-03T09:00:00.000Z",
  });
});

test("POST /api/posts/:id/publish publishes drafts but rejects member public visibility", async () => {
  const memberPublicResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/posts/post-1/publish", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
      body: JSON.stringify({ makePublic: true }),
    }),
    createApiTestContext({
      currentUser: memberCurrentUser(),
    }),
  );

  expect(memberPublicResponse.status).toBe(403);
  await expect(memberPublicResponse.json()).resolves.toEqual({
    error: { code: "API_FORBIDDEN" },
  });

  const adminContext = createApiTestContext({
    currentUser: adminCurrentUser(),
    postResult: post({
      authorId: "admin-1",
      status: "published",
      isPublic: true,
      publishedAt: "2026-06-03T09:00:00.000Z",
    }),
  });

  const adminResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/posts/post-1/publish", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("admin-1")}`,
      },
      body: JSON.stringify({ makePublic: true }),
    }),
    adminContext,
  );

  expect(adminResponse.status).toBe(200);
  await expect(adminResponse.json()).resolves.toEqual({
    post: post({
      authorId: "admin-1",
      status: "published",
      isPublic: true,
      publishedAt: "2026-06-03T09:00:00.000Z",
    }),
  });
  expect(adminContext.postRepository.publishOwnDraft).toHaveBeenCalledWith({
    postId: "post-1",
    authorId: "admin-1",
    isPublic: true,
    publishedAt: "2026-06-03T09:00:00.000Z",
  });
});

test("admin post visibility routes toggle public visibility", async () => {
  const token = await accessTokenFor("admin-1");
  const transitions = [
    {
      path: "/api/posts/post-1/public",
      isPublic: true,
    },
    {
      path: "/api/posts/post-1/member-only",
      isPublic: false,
    },
  ] as const;

  for (const transition of transitions) {
    const context = createApiTestContext({
      currentUser: adminCurrentUser(),
      postResult: post({
        status: "published",
        isPublic: transition.isPublic,
      }),
    });

    const response = await handleApiRequest(
      new Request(`https://calella-chess-club.test${transition.path}`, {
        method: "POST",
        headers: {
          cookie: `${ACCESS_TOKEN_COOKIE}=${token}`,
        },
      }),
      context,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      post: post({
        status: "published",
        isPublic: transition.isPublic,
      }),
    });
    expect(context.postRepository.updatePublicVisibility).toHaveBeenCalledWith({
      postId: "post-1",
      isPublic: transition.isPublic,
      updatedAt: "2026-06-03T09:00:00.000Z",
    });
  }
});

test("DELETE /api/posts/:id soft deletes owner posts and admin-visible published posts", async () => {
  const ownerContext = createApiTestContext({
    currentUser: memberCurrentUser(),
    postResult: post({ status: "deleted", deletedBy: "user-1" }),
  });

  const ownerResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/posts/post-1", {
      method: "DELETE",
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
    }),
    ownerContext,
  );

  expect(ownerResponse.status).toBe(200);
  await expect(ownerResponse.json()).resolves.toEqual({
    post: post({ status: "deleted", deletedBy: "user-1" }),
  });
  expect(ownerContext.postRepository.softDeleteOwnPost).toHaveBeenCalledWith({
    postId: "post-1",
    userId: "user-1",
    deletedAt: "2026-06-03T09:00:00.000Z",
  });

  const adminContext = createApiTestContext({
    currentUser: adminCurrentUser(),
    postResult: null,
    adminPostResult: post({ status: "deleted", deletedBy: "admin-1" }),
  });

  const adminResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/posts/post-1", {
      method: "DELETE",
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("admin-1")}`,
      },
    }),
    adminContext,
  );

  expect(adminResponse.status).toBe(200);
  await expect(adminResponse.json()).resolves.toEqual({
    post: post({ status: "deleted", deletedBy: "admin-1" }),
  });
  expect(adminContext.postRepository.softDeletePublishedPost).toHaveBeenCalledWith({
    postId: "post-1",
    deletedBy: "admin-1",
    deletedAt: "2026-06-03T09:00:00.000Z",
  });
});

test("event routes require a valid approved member or admin user", async () => {
  const missingResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/events"),
    createApiTestContext(),
  );

  expect(missingResponse.status).toBe(401);
  await expect(missingResponse.json()).resolves.toEqual({
    error: { code: "API_AUTH_REQUIRED" },
  });

  const pendingResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/events", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
    }),
    createApiTestContext({
      currentUser: currentUser(),
    }),
  );

  expect(pendingResponse.status).toBe(403);
  await expect(pendingResponse.json()).resolves.toEqual({
    error: { code: "API_FORBIDDEN" },
  });
});

test("GET /api/events returns visible events for members", async () => {
  const context = createApiTestContext({
    currentUser: memberCurrentUser(),
    events: [event()],
  });

  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/events", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
    }),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    events: [event()],
  });
  expect(context.eventRepository.listVisibleEvents).toHaveBeenCalledWith({
    userId: "user-1",
  });
});

test("POST /api/events creates member-only drafts", async () => {
  const context = createApiTestContext({
    currentUser: memberCurrentUser(),
    eventResult: event(),
    newId: "event-1",
  });

  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
      body: JSON.stringify({
        title: "  Club rapid night  ",
        descriptionMarkdown: "  **Round 1** starts at 19:00.  ",
        location: "  Calella Chess Club  ",
        startsAt: "2026-06-10T17:00:00.000Z",
        endsAt: "2026-06-10T19:00:00.000Z",
      }),
    }),
    context,
  );

  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual({
    event: event(),
  });
  expect(context.eventRepository.createEventDraft).toHaveBeenCalledWith({
    id: "event-1",
    authorId: "user-1",
    title: "Club rapid night",
    descriptionMarkdown: "**Round 1** starts at 19:00.",
    location: "Calella Chess Club",
    startsAt: "2026-06-10T17:00:00.000Z",
    endsAt: "2026-06-10T19:00:00.000Z",
    createdAt: "2026-06-03T09:00:00.000Z",
  });
});

test("POST /api/events rejects invalid draft bodies", async () => {
  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
      body: JSON.stringify({
        title: "",
        descriptionMarkdown: "",
        startsAt: "bad",
        endsAt: "bad",
      }),
    }),
    createApiTestContext({
      currentUser: memberCurrentUser(),
    }),
  );

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: {
      code: "API_VALIDATION_FAILED",
      fields: ["title", "descriptionMarkdown", "startsAt", "endsAt"],
    },
  });
});

test("GET /api/events/:id returns visible events or a stable not-found error", async () => {
  const context = createApiTestContext({
    currentUser: memberCurrentUser(),
    eventResult: event(),
  });

  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/events/event-1", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
    }),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    event: event(),
  });
  expect(context.eventRepository.findVisibleEventById).toHaveBeenCalledWith({
    eventId: "event-1",
    userId: "user-1",
  });

  const notFoundResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/events/missing", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
    }),
    createApiTestContext({
      currentUser: memberCurrentUser(),
      eventResult: null,
    }),
  );

  expect(notFoundResponse.status).toBe(404);
  await expect(notFoundResponse.json()).resolves.toEqual({
    error: { code: "API_EVENT_NOT_FOUND" },
  });
});

test("PUT /api/events/:id edits the caller's own event", async () => {
  const context = createApiTestContext({
    currentUser: memberCurrentUser(),
    eventResult: event({
      title: "Updated event",
      descriptionMarkdown: "_Updated body_",
    }),
  });

  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/events/event-1", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
      body: JSON.stringify({
        title: "Updated event",
        descriptionMarkdown: "_Updated body_",
        location: "",
        startsAt: "2026-06-10T18:00:00.000Z",
        endsAt: "2026-06-10T20:00:00.000Z",
      }),
    }),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    event: event({
      title: "Updated event",
      descriptionMarkdown: "_Updated body_",
    }),
  });
  expect(context.eventRepository.updateOwnEvent).toHaveBeenCalledWith({
    eventId: "event-1",
    authorId: "user-1",
    title: "Updated event",
    descriptionMarkdown: "_Updated body_",
    location: null,
    startsAt: "2026-06-10T18:00:00.000Z",
    endsAt: "2026-06-10T20:00:00.000Z",
    updatedAt: "2026-06-03T09:00:00.000Z",
  });
});

test("POST /api/events/:id/publish publishes drafts but rejects member public visibility", async () => {
  const memberPublicResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/events/event-1/publish", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
      body: JSON.stringify({ makePublic: true }),
    }),
    createApiTestContext({
      currentUser: memberCurrentUser(),
    }),
  );

  expect(memberPublicResponse.status).toBe(403);
  await expect(memberPublicResponse.json()).resolves.toEqual({
    error: { code: "API_FORBIDDEN" },
  });

  const adminContext = createApiTestContext({
    currentUser: adminCurrentUser(),
    eventResult: event({
      authorId: "admin-1",
      status: "published",
      isPublic: true,
      publishedAt: "2026-06-03T09:00:00.000Z",
    }),
  });

  const adminResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/events/event-1/publish", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("admin-1")}`,
      },
      body: JSON.stringify({ makePublic: true }),
    }),
    adminContext,
  );

  expect(adminResponse.status).toBe(200);
  await expect(adminResponse.json()).resolves.toEqual({
    event: event({
      authorId: "admin-1",
      status: "published",
      isPublic: true,
      publishedAt: "2026-06-03T09:00:00.000Z",
    }),
  });
  expect(adminContext.eventRepository.publishOwnDraft).toHaveBeenCalledWith({
    eventId: "event-1",
    authorId: "admin-1",
    isPublic: true,
    publishedAt: "2026-06-03T09:00:00.000Z",
  });
});

test("admin event visibility routes toggle public visibility", async () => {
  const token = await accessTokenFor("admin-1");
  const transitions = [
    {
      path: "/api/events/event-1/public",
      isPublic: true,
    },
    {
      path: "/api/events/event-1/member-only",
      isPublic: false,
    },
  ] as const;

  for (const transition of transitions) {
    const context = createApiTestContext({
      currentUser: adminCurrentUser(),
      eventResult: event({
        status: "published",
        isPublic: transition.isPublic,
      }),
    });

    const response = await handleApiRequest(
      new Request(`https://calella-chess-club.test${transition.path}`, {
        method: "POST",
        headers: {
          cookie: `${ACCESS_TOKEN_COOKIE}=${token}`,
        },
      }),
      context,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      event: event({
        status: "published",
        isPublic: transition.isPublic,
      }),
    });
    expect(context.eventRepository.updatePublicVisibility).toHaveBeenCalledWith({
      eventId: "event-1",
      isPublic: transition.isPublic,
      updatedAt: "2026-06-03T09:00:00.000Z",
    });
  }
});

test("DELETE /api/events/:id soft deletes owner events and admin-visible published events", async () => {
  const ownerContext = createApiTestContext({
    currentUser: memberCurrentUser(),
    eventResult: event({ status: "deleted", deletedBy: "user-1" }),
  });

  const ownerResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/events/event-1", {
      method: "DELETE",
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
    }),
    ownerContext,
  );

  expect(ownerResponse.status).toBe(200);
  await expect(ownerResponse.json()).resolves.toEqual({
    event: event({ status: "deleted", deletedBy: "user-1" }),
  });
  expect(ownerContext.eventRepository.softDeleteOwnEvent).toHaveBeenCalledWith({
    eventId: "event-1",
    userId: "user-1",
    deletedAt: "2026-06-03T09:00:00.000Z",
  });

  const adminContext = createApiTestContext({
    currentUser: adminCurrentUser(),
    eventResult: null,
    adminEventResult: event({ status: "deleted", deletedBy: "admin-1" }),
  });

  const adminResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/events/event-1", {
      method: "DELETE",
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("admin-1")}`,
      },
    }),
    adminContext,
  );

  expect(adminResponse.status).toBe(200);
  await expect(adminResponse.json()).resolves.toEqual({
    event: event({ status: "deleted", deletedBy: "admin-1" }),
  });
  expect(adminContext.eventRepository.softDeletePublishedEvent).toHaveBeenCalledWith({
    eventId: "event-1",
    deletedBy: "admin-1",
    deletedAt: "2026-06-03T09:00:00.000Z",
  });
});

test("GET /api/public/posts returns public posts without authentication", async () => {
  const context = createApiTestContext({
    publicPosts: [
      post({
        status: "published",
        isPublic: true,
        publishedAt: "2026-06-03T09:00:00.000Z",
      }),
    ],
  });

  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/public/posts"),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    posts: [
      post({
        status: "published",
        isPublic: true,
        publishedAt: "2026-06-03T09:00:00.000Z",
      }),
    ],
  });
  expect(context.postRepository.listPublicPosts).toHaveBeenCalledWith({
    limit: 6,
  });
  expect(context.repository.findCurrentUserById).not.toHaveBeenCalled();
});

test("GET /api/public/events returns upcoming public events without authentication", async () => {
  const context = createApiTestContext({
    publicEvents: [
      event({
        status: "published",
        isPublic: true,
        publishedAt: "2026-06-03T09:00:00.000Z",
      }),
    ],
  });

  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/public/events"),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    events: [
      event({
        status: "published",
        isPublic: true,
        publishedAt: "2026-06-03T09:00:00.000Z",
      }),
    ],
  });
  expect(context.eventRepository.listPublicEvents).toHaveBeenCalledWith({
    limit: 6,
    nowIso: "2026-06-03T09:00:00.000Z",
  });
  expect(context.repository.findCurrentUserById).not.toHaveBeenCalled();
});

test("unsupported api routes return a stable error code", async () => {
  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/missing"),
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

function createApiTestContext(options: {
  user?: unknown;
  currentUser?: unknown;
  adminUsers?: unknown[];
  membershipUpdateResult?: unknown;
  disableResult?: unknown;
  posts?: unknown[];
  postResult?: unknown;
  adminPostResult?: unknown;
  publicPosts?: unknown[];
  events?: unknown[];
  eventResult?: unknown;
  adminEventResult?: unknown;
  publicEvents?: unknown[];
  newId?: string;
} = {}) {
  return {
    repository: {
      findPublicUserById: vi.fn().mockResolvedValue(options.user),
      findCurrentUserById: vi.fn().mockResolvedValue(options.currentUser),
      listAdminUsers: vi.fn().mockResolvedValue(options.adminUsers ?? []),
      updateMembershipStatus: vi.fn().mockResolvedValue(options.membershipUpdateResult),
      disableUserAndRevokeSessions: vi.fn().mockResolvedValue(options.disableResult),
    },
    postRepository: {
      listVisiblePosts: vi.fn().mockResolvedValue(options.posts ?? []),
      listPublicPosts: vi.fn().mockResolvedValue(options.publicPosts ?? []),
      findVisiblePostById: vi.fn().mockResolvedValue(options.postResult),
      createPostDraft: vi.fn().mockResolvedValue(options.postResult),
      updateOwnPost: vi.fn().mockResolvedValue(options.postResult),
      publishOwnDraft: vi.fn().mockResolvedValue(options.postResult),
      updatePublicVisibility: vi.fn().mockResolvedValue(options.postResult),
      softDeleteOwnPost: vi.fn().mockResolvedValue(options.postResult),
      softDeletePublishedPost: vi.fn().mockResolvedValue(options.adminPostResult),
    },
    eventRepository: {
      listVisibleEvents: vi.fn().mockResolvedValue(options.events ?? []),
      listPublicEvents: vi.fn().mockResolvedValue(options.publicEvents ?? []),
      findVisibleEventById: vi.fn().mockResolvedValue(options.eventResult),
      createEventDraft: vi.fn().mockResolvedValue(options.eventResult),
      updateOwnEvent: vi.fn().mockResolvedValue(options.eventResult),
      publishOwnDraft: vi.fn().mockResolvedValue(options.eventResult),
      updatePublicVisibility: vi.fn().mockResolvedValue(options.eventResult),
      softDeleteOwnEvent: vi.fn().mockResolvedValue(options.eventResult),
      softDeletePublishedEvent: vi.fn().mockResolvedValue(options.adminEventResult),
    },
    jwtSigningSecret: "jwt-secret",
    now: () => new Date("2026-06-03T09:00:00.000Z"),
    newId: () => options.newId ?? "post-1",
  };
}

function accessTokenFor(userId: string) {
  return signAccessJwt({
    secret: "jwt-secret",
    userId,
    issuedAt: new Date("2026-06-03T08:00:00.000Z"),
    expiresAt: new Date("2026-06-03T10:00:00.000Z"),
  });
}

function publicUser() {
  return {
    id: "user-1",
    username: "RobinSrimal",
    email: "robin@example.com",
    emailVerified: true,
    membershipStatus: "pending",
    role: "user",
  };
}

function currentUser() {
  return {
    ...publicUser(),
    accountStatus: "active",
    emailVerifiedAt: "2026-06-03T08:00:00.000Z",
  };
}

function adminCurrentUser() {
  return {
    ...currentUser(),
    id: "admin-1",
    role: "admin",
  };
}

function memberCurrentUser() {
  return {
    ...currentUser(),
    membershipStatus: "member",
  };
}

function adminUserSummary(overrides: Record<string, unknown> = {}) {
  return {
    ...publicUser(),
    accountStatus: "active",
    createdAt: "2026-06-03T08:00:00.000Z",
    updatedAt: "2026-06-03T08:00:00.000Z",
    disabledAt: null,
    disabledBy: null,
    ...overrides,
  };
}

function post(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    authorId: "user-1",
    authorUsername: "RobinSrimal",
    title: "Club night results",
    bodyJson: POST_BODY_JSON,
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

const POST_BODY_JSON_INPUT = [
  {
    type: "paragraph",
    content: "Round 1 starts at 19:00.",
  },
];

const POST_BODY_JSON = [
  {
    type: "paragraph",
    content: [
      {
        type: "text",
        text: "Round 1 starts at 19:00.",
        styles: {},
      },
    ],
  },
];

const POST_BODY_JSON_SERIALIZED = JSON.stringify(POST_BODY_JSON);

const UPDATED_POST_BODY_JSON_INPUT = [
  {
    type: "paragraph",
    content: [
      {
        type: "text",
        text: "Updated body",
        styles: { italic: true },
      },
    ],
  },
];

const UPDATED_POST_BODY_JSON = UPDATED_POST_BODY_JSON_INPUT;
const UPDATED_POST_BODY_JSON_SERIALIZED = JSON.stringify(UPDATED_POST_BODY_JSON);

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: "event-1",
    authorId: "user-1",
    authorUsername: "RobinSrimal",
    title: "Club rapid night",
    descriptionMarkdown: "**Round 1** starts at 19:00.",
    location: "Calella Chess Club",
    startsAt: "2026-06-10T17:00:00.000Z",
    endsAt: "2026-06-10T19:00:00.000Z",
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
