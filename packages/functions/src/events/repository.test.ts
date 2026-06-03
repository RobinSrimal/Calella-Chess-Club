import type { D1Database } from "@cloudflare/workers-types";
import { expect, test, vi } from "vitest";
import { createD1EventRepository } from "./repository";

test("lists published events plus the current user's own drafts", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const database = createRecordingD1Database(queries, {
    allResults: [
      eventRow({
        id: "event-1",
        authorId: "user-1",
        status: "draft",
        isPublic: 0,
      }),
      eventRow({
        id: "event-2",
        authorId: "user-2",
        status: "published",
        isPublic: 1,
        publishedAt: "2026-06-03T09:00:00.000Z",
      }),
    ],
  });
  const repository = createD1EventRepository(database);

  const events = await repository.listVisibleEvents({ userId: "user-1" });

  expect(queries[0].sql).toContain("events.status = 'published'");
  expect(queries[0].sql).toContain(
    "(events.author_id = ? AND events.status = 'draft')",
  );
  expect(queries[0].sql).toContain("ORDER BY events.starts_at ASC");
  expect(queries[0].params).toEqual(["user-1"]);
  expect(events).toEqual([
    event({
      id: "event-1",
      authorId: "user-1",
      status: "draft",
      isPublic: false,
    }),
    event({
      id: "event-2",
      authorId: "user-2",
      status: "published",
      isPublic: true,
      publishedAt: "2026-06-03T09:00:00.000Z",
    }),
  ]);
});

test("creates draft events as member-only content", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const database = createRecordingD1Database(queries, {
    firstResults: [eventRow({ id: "event-1", status: "draft", isPublic: 0 })],
  });
  const repository = createD1EventRepository(database);

  const created = await repository.createEventDraft({
    id: "event-1",
    authorId: "user-1",
    title: "Club rapid night",
    descriptionMarkdown: "**Round 1** starts at 19:00.",
    location: "Calella Chess Club",
    startsAt: "2026-06-10T17:00:00.000Z",
    endsAt: "2026-06-10T19:00:00.000Z",
    createdAt: "2026-06-03T09:00:00.000Z",
  });

  expect(queries[0].sql).toContain("INSERT INTO events");
  expect(queries[0].params).toEqual([
    "event-1",
    "user-1",
    "Club rapid night",
    "**Round 1** starts at 19:00.",
    "Calella Chess Club",
    "2026-06-10T17:00:00.000Z",
    "2026-06-10T19:00:00.000Z",
    "draft",
    0,
    null,
    "2026-06-03T09:00:00.000Z",
    "2026-06-03T09:00:00.000Z",
    null,
    null,
  ]);
  expect(created).toEqual(
    event({ id: "event-1", status: "draft", isPublic: false }),
  );
});

test("edits only the author's non-deleted events", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const database = createRecordingD1Database(queries, {
    firstResults: [eventRow({ title: "Updated title" })],
  });
  const repository = createD1EventRepository(database);

  const updated = await repository.updateOwnEvent({
    eventId: "event-1",
    authorId: "user-1",
    title: "Updated title",
    descriptionMarkdown: "_Updated body_",
    location: null,
    startsAt: "2026-06-10T18:00:00.000Z",
    endsAt: "2026-06-10T20:00:00.000Z",
    updatedAt: "2026-06-03T10:00:00.000Z",
  });

  expect(queries[0].sql).toContain("UPDATE events");
  expect(queries[0].sql).toContain("author_id = ?");
  expect(queries[0].sql).toContain("status <> 'deleted'");
  expect(queries[0].params).toEqual([
    "Updated title",
    "_Updated body_",
    null,
    "2026-06-10T18:00:00.000Z",
    "2026-06-10T20:00:00.000Z",
    "2026-06-03T10:00:00.000Z",
    "event-1",
    "user-1",
  ]);
  expect(updated?.title).toBe("Updated title");
});

test("publishes only the author's draft and can explicitly set public visibility", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const database = createRecordingD1Database(queries, {
    firstResults: [
      eventRow({
        status: "published",
        isPublic: 1,
        publishedAt: "2026-06-03T10:00:00.000Z",
      }),
    ],
  });
  const repository = createD1EventRepository(database);

  const published = await repository.publishOwnDraft({
    eventId: "event-1",
    authorId: "user-1",
    isPublic: true,
    publishedAt: "2026-06-03T10:00:00.000Z",
  });

  expect(queries[0].sql).toContain("status = 'draft'");
  expect(queries[0].params).toEqual([
    1,
    "2026-06-03T10:00:00.000Z",
    "2026-06-03T10:00:00.000Z",
    "event-1",
    "user-1",
  ]);
  expect(published).toEqual(
    event({
      status: "published",
      isPublic: true,
      publishedAt: "2026-06-03T10:00:00.000Z",
    }),
  );
});

test("updates public visibility only on published events", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const database = createRecordingD1Database(queries, {
    firstResults: [eventRow({ status: "published", isPublic: 1 })],
  });
  const repository = createD1EventRepository(database);

  const visible = await repository.updatePublicVisibility({
    eventId: "event-1",
    isPublic: true,
    updatedAt: "2026-06-03T10:00:00.000Z",
  });

  expect(queries[0].sql).toContain("status = 'published'");
  expect(queries[0].params).toEqual([
    1,
    "2026-06-03T10:00:00.000Z",
    "event-1",
  ]);
  expect(visible?.isPublic).toBe(true);
});

test("soft deletes owner events and admin-visible published events", async () => {
  const ownerQueries: Array<{ sql: string; params: unknown[] }> = [];
  const ownerDatabase = createRecordingD1Database(ownerQueries, {
    firstResults: [eventRow({ status: "deleted", deletedBy: "user-1" })],
  });
  const ownerRepository = createD1EventRepository(ownerDatabase);

  await ownerRepository.softDeleteOwnEvent({
    eventId: "event-1",
    userId: "user-1",
    deletedAt: "2026-06-03T10:00:00.000Z",
  });

  expect(ownerQueries[0].sql).toContain("author_id = ?");
  expect(ownerQueries[0].sql).toContain("status <> 'deleted'");
  expect(ownerQueries[0].params).toEqual([
    "2026-06-03T10:00:00.000Z",
    "user-1",
    "2026-06-03T10:00:00.000Z",
    "event-1",
    "user-1",
  ]);

  const adminQueries: Array<{ sql: string; params: unknown[] }> = [];
  const adminDatabase = createRecordingD1Database(adminQueries, {
    firstResults: [eventRow({ status: "deleted", deletedBy: "admin-1" })],
  });
  const adminRepository = createD1EventRepository(adminDatabase);

  await adminRepository.softDeletePublishedEvent({
    eventId: "event-1",
    deletedBy: "admin-1",
    deletedAt: "2026-06-03T10:00:00.000Z",
  });

  expect(adminQueries[0].sql).toContain("status = 'published'");
  expect(adminQueries[0].params).toEqual([
    "2026-06-03T10:00:00.000Z",
    "admin-1",
    "2026-06-03T10:00:00.000Z",
    "event-1",
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

function eventRow(overrides: Record<string, unknown> = {}) {
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
    isPublic: 0,
    publishedAt: null,
    createdAt: "2026-06-03T09:00:00.000Z",
    updatedAt: "2026-06-03T09:00:00.000Z",
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

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
