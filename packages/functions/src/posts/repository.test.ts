import type { D1Database } from "@cloudflare/workers-types";
import { expect, test, vi } from "vitest";
import { createD1PostRepository } from "./repository";

test("lists published posts plus the current user's own drafts", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const database = createRecordingD1Database(queries, {
    allResults: [
      postRow({
        id: "post-1",
        authorId: "user-1",
        status: "draft",
        isPublic: 0,
      }),
      postRow({
        id: "post-2",
        authorId: "user-2",
        status: "published",
        isPublic: 1,
        publishedAt: "2026-06-03T09:00:00.000Z",
      }),
    ],
  });
  const repository = createD1PostRepository(database);

  const posts = await repository.listVisiblePosts({ userId: "user-1" });

  expect(queries[0].sql).toContain("posts.status = 'published'");
  expect(queries[0].sql).toContain(
    "(posts.author_id = ? AND posts.status = 'draft')",
  );
  expect(queries[0].params).toEqual(["user-1"]);
  expect(posts).toEqual([
    post({
      id: "post-1",
      authorId: "user-1",
      status: "draft",
      isPublic: false,
    }),
    post({
      id: "post-2",
      authorId: "user-2",
      status: "published",
      isPublic: true,
      publishedAt: "2026-06-03T09:00:00.000Z",
    }),
  ]);
});

test("creates draft posts as member-only content", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const database = createRecordingD1Database(queries, {
    firstResults: [postRow({ id: "post-1", status: "draft", isPublic: 0 })],
  });
  const repository = createD1PostRepository(database);

  const created = await repository.createPostDraft({
    id: "post-1",
    authorId: "user-1",
    title: "Club night results",
    bodyMarkdown: "**Round 1** starts at 19:00.",
    createdAt: "2026-06-03T09:00:00.000Z",
  });

  expect(queries[0].sql).toContain("INSERT INTO posts");
  expect(queries[0].params).toEqual([
    "post-1",
    "user-1",
    "Club night results",
    "**Round 1** starts at 19:00.",
    "draft",
    0,
    null,
    "2026-06-03T09:00:00.000Z",
    "2026-06-03T09:00:00.000Z",
    null,
    null,
  ]);
  expect(created).toEqual(post({ id: "post-1", status: "draft", isPublic: false }));
});

test("edits only the author's non-deleted posts", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const database = createRecordingD1Database(queries, {
    firstResults: [postRow({ title: "Updated title" })],
  });
  const repository = createD1PostRepository(database);

  const updated = await repository.updateOwnPost({
    postId: "post-1",
    authorId: "user-1",
    title: "Updated title",
    bodyMarkdown: "_Updated body_",
    updatedAt: "2026-06-03T10:00:00.000Z",
  });

  expect(queries[0].sql).toContain("UPDATE posts");
  expect(queries[0].sql).toContain("author_id = ?");
  expect(queries[0].sql).toContain("status <> 'deleted'");
  expect(queries[0].params).toEqual([
    "Updated title",
    "_Updated body_",
    "2026-06-03T10:00:00.000Z",
    "post-1",
    "user-1",
  ]);
  expect(updated?.title).toBe("Updated title");
});

test("publishes only the author's draft and can explicitly set public visibility", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const database = createRecordingD1Database(queries, {
    firstResults: [
      postRow({
        status: "published",
        isPublic: 1,
        publishedAt: "2026-06-03T10:00:00.000Z",
      }),
    ],
  });
  const repository = createD1PostRepository(database);

  const published = await repository.publishOwnDraft({
    postId: "post-1",
    authorId: "user-1",
    isPublic: true,
    publishedAt: "2026-06-03T10:00:00.000Z",
  });

  expect(queries[0].sql).toContain("status = 'draft'");
  expect(queries[0].params).toEqual([
    1,
    "2026-06-03T10:00:00.000Z",
    "2026-06-03T10:00:00.000Z",
    "post-1",
    "user-1",
  ]);
  expect(published).toEqual(
    post({
      status: "published",
      isPublic: true,
      publishedAt: "2026-06-03T10:00:00.000Z",
    }),
  );
});

test("updates public visibility only on published posts", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const database = createRecordingD1Database(queries, {
    firstResults: [postRow({ status: "published", isPublic: 1 })],
  });
  const repository = createD1PostRepository(database);

  const visible = await repository.updatePublicVisibility({
    postId: "post-1",
    isPublic: true,
    updatedAt: "2026-06-03T10:00:00.000Z",
  });

  expect(queries[0].sql).toContain("status = 'published'");
  expect(queries[0].params).toEqual([
    1,
    "2026-06-03T10:00:00.000Z",
    "post-1",
  ]);
  expect(visible?.isPublic).toBe(true);
});

test("soft deletes owner posts and admin-visible published posts", async () => {
  const ownerQueries: Array<{ sql: string; params: unknown[] }> = [];
  const ownerDatabase = createRecordingD1Database(ownerQueries, {
    firstResults: [postRow({ status: "deleted", deletedBy: "user-1" })],
  });
  const ownerRepository = createD1PostRepository(ownerDatabase);

  await ownerRepository.softDeleteOwnPost({
    postId: "post-1",
    userId: "user-1",
    deletedAt: "2026-06-03T10:00:00.000Z",
  });

  expect(ownerQueries[0].sql).toContain("author_id = ?");
  expect(ownerQueries[0].sql).toContain("status <> 'deleted'");
  expect(ownerQueries[0].params).toEqual([
    "2026-06-03T10:00:00.000Z",
    "user-1",
    "2026-06-03T10:00:00.000Z",
    "post-1",
    "user-1",
  ]);

  const adminQueries: Array<{ sql: string; params: unknown[] }> = [];
  const adminDatabase = createRecordingD1Database(adminQueries, {
    firstResults: [postRow({ status: "deleted", deletedBy: "admin-1" })],
  });
  const adminRepository = createD1PostRepository(adminDatabase);

  await adminRepository.softDeletePublishedPost({
    postId: "post-1",
    deletedBy: "admin-1",
    deletedAt: "2026-06-03T10:00:00.000Z",
  });

  expect(adminQueries[0].sql).toContain("status = 'published'");
  expect(adminQueries[0].params).toEqual([
    "2026-06-03T10:00:00.000Z",
    "admin-1",
    "2026-06-03T10:00:00.000Z",
    "post-1",
  ]);
});

function createRecordingD1Database(
  queries: Array<{ sql: string; params: unknown[] }> = [],
  options: {
    firstResults?: unknown[];
    allResults?: unknown[];
  } = {},
): D1Database {
  const firstResults = [...(options.firstResults ?? [])];

  return {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          queries.push({ sql, params });
          return {
            sql,
            params,
            first: vi.fn().mockImplementation(() => Promise.resolve(firstResults.shift() ?? null)),
            all: vi.fn().mockResolvedValue({
              results: options.allResults ?? [],
            }),
            run: vi.fn().mockResolvedValue(undefined),
          };
        },
      };
    },
  } as unknown as D1Database;
}

function postRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    authorId: "user-1",
    authorUsername: "RobinSrimal",
    title: "Club night results",
    bodyMarkdown: "**Round 1** starts at 19:00.",
    status: "draft",
    isPublic: 0,
    publishedAt: null,
    createdAt: "2026-06-03T09:00:00.000Z",
    updatedAt: "2026-06-03T09:00:00.000Z",
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

function post(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    authorId: "user-1",
    authorUsername: "RobinSrimal",
    title: "Club night results",
    bodyMarkdown: "**Round 1** starts at 19:00.",
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
