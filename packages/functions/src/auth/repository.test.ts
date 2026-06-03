import type { D1Database } from "@cloudflare/workers-types";
import { expect, test, vi } from "vitest";
import { createD1AuthRepository } from "./repository";

test("lists admin user summaries with conservative filters", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const database = createRecordingD1Database([], queries, {
    allResults: [
      {
        id: "user-1",
        username: "RobinSrimal",
        email: "robin@example.com",
        accountStatus: "active",
        membershipStatus: "pending",
        role: "user",
        emailVerifiedAt: "2026-06-03T08:00:00.000Z",
        createdAt: "2026-06-03T08:00:00.000Z",
        updatedAt: "2026-06-03T08:00:00.000Z",
        disabledAt: null,
        disabledBy: null,
      },
    ],
  });
  const repository = createD1AuthRepository(database);

  const users = await repository.listAdminUsers({
    membershipStatus: "pending",
    role: "user",
    accountStatus: "active",
  });

  expect(queries[0].sql).toContain("WHERE membership_status = ?");
  expect(queries[0].sql).toContain("AND role = ?");
  expect(queries[0].sql).toContain("AND account_status = ?");
  expect(queries[0].params).toEqual(["pending", "user", "active"]);
  expect(users).toEqual([
    {
      id: "user-1",
      username: "RobinSrimal",
      email: "robin@example.com",
      emailVerified: true,
      membershipStatus: "pending",
      role: "user",
      accountStatus: "active",
      createdAt: "2026-06-03T08:00:00.000Z",
      updatedAt: "2026-06-03T08:00:00.000Z",
      disabledAt: null,
      disabledBy: null,
    },
  ]);
});

test("updates membership status and returns the admin user summary", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const database = createRecordingD1Database([], queries, {
    firstResult: {
      id: "user-1",
      username: "RobinSrimal",
      email: "robin@example.com",
      accountStatus: "active",
      membershipStatus: "member",
      role: "user",
      emailVerifiedAt: "2026-06-03T08:00:00.000Z",
      createdAt: "2026-06-03T08:00:00.000Z",
      updatedAt: "2026-06-04T08:00:00.000Z",
      disabledAt: null,
      disabledBy: null,
    },
  });
  const repository = createD1AuthRepository(database);

  const user = await repository.updateMembershipStatus({
    userId: "user-1",
    membershipStatus: "member",
    updatedAt: "2026-06-04T08:00:00.000Z",
  });

  expect(queries[0].sql).toContain("UPDATE users");
  expect(queries[0].params).toEqual([
    "member",
    "2026-06-04T08:00:00.000Z",
    "user-1",
  ]);
  expect(user?.membershipStatus).toBe("member");
});

test("disables users and revokes active refresh sessions in one batch", async () => {
  const batches: Array<Array<{ sql: string; params: unknown[] }>> = [];
  const database = createRecordingD1Database(batches, [], {
    firstResult: {
      id: "user-1",
      username: "RobinSrimal",
      email: "robin@example.com",
      accountStatus: "disabled",
      membershipStatus: "pending",
      role: "user",
      emailVerifiedAt: "2026-06-03T08:00:00.000Z",
      createdAt: "2026-06-03T08:00:00.000Z",
      updatedAt: "2026-06-04T08:00:00.000Z",
      disabledAt: "2026-06-04T08:00:00.000Z",
      disabledBy: "admin-1",
    },
  });
  const repository = createD1AuthRepository(database);

  const user = await repository.disableUserAndRevokeSessions({
    userId: "user-1",
    disabledBy: "admin-1",
    disabledAt: "2026-06-04T08:00:00.000Z",
  });

  expect(batches[0]).toHaveLength(2);
  expect(batches[0][0].sql).toContain("UPDATE users");
  expect(batches[0][1].sql).toContain("UPDATE refresh_sessions");
  expect(batches[0][1].params).toEqual([
    "2026-06-04T08:00:00.000Z",
    "user-1",
  ]);
  expect(user?.accountStatus).toBe("disabled");
});

test("inserts replacement refresh sessions before linking the current session", async () => {
  const batches: Array<Array<{ sql: string; params: unknown[] }>> = [];
  const database = createRecordingD1Database(batches);
  const repository = createD1AuthRepository(database);

  await repository.rotateRefreshSession({
    currentSessionId: "current-session",
    revokedAt: "2026-06-03T08:00:00.000Z",
    replacement: {
      id: "replacement-session",
      userId: "user-1",
      tokenHash: "token-hash",
      createdAt: "2026-06-03T08:00:00.000Z",
      expiresAt: "2026-06-17T08:00:00.000Z",
      revokedAt: null,
      replacedBy: null,
      userAgent: "Vitest",
    },
  });

  expect(batches[0]).toHaveLength(2);
  expect(batches[0][0].sql).toContain("INSERT INTO refresh_sessions");
  expect(batches[0][1].sql).toContain("UPDATE refresh_sessions");
});

function createRecordingD1Database(
  batches: Array<Array<{ sql: string; params: unknown[] }>>,
  queries: Array<{ sql: string; params: unknown[] }> = [],
  options: {
    firstResult?: unknown;
    allResults?: unknown[];
  } = {},
): D1Database {
  return {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          queries.push({ sql, params });
          return {
            sql,
            params,
            first: vi.fn().mockResolvedValue(options.firstResult ?? null),
            all: vi.fn().mockResolvedValue({
              results: options.allResults ?? [],
            }),
            run: vi.fn().mockResolvedValue(undefined),
          };
        },
      };
    },
    batch(statements: Array<{ sql: string; params: unknown[] }>) {
      batches.push(statements);
      return Promise.resolve([]);
    },
  } as unknown as D1Database;
}
